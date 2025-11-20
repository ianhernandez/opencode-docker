import { useLoaderData, useActionData, Form, useNavigation } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import type { Route } from './+types/chat';
import {
  listSessions,
  createSession,
  listMessages,
  sendMessage,
  getEventStreamUrl,
  abortSession,
} from '../lib/opencode-api.server';
import type { Session, MessageWithParts } from '../lib/opencode-types';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'AI Chat - OpenCode' },
    { name: 'description', content: 'Chat with OpenCode AI Assistant' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session');

  // Load sessions list
  const sessions = await listSessions();

  // If no session selected, return just sessions
  if (!sessionId) {
    return {
      sessions,
      currentSession: null,
      messages: [],
      eventStreamUrl: getEventStreamUrl(),
    };
  }

  // Load messages for selected session
  const messages = await listMessages(sessionId);

  return {
    sessions,
    currentSession: sessions.find((s) => s.id === sessionId) || null,
    messages,
    eventStreamUrl: getEventStreamUrl(),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create-session') {
    const title = formData.get('title') as string;
    const session = await createSession({ title: title || 'New Chat' });
    return { type: 'session-created', session };
  }

  if (intent === 'send-message') {
    const sessionId = formData.get('sessionId') as string;
    const message = formData.get('message') as string;

    try {
      const response = await sendMessage(sessionId, {
        model: {
          providerID: 'anthropic',
          modelID: 'claude-haiku-4-5-20251001',
        },
        agent: 'build',
        parts: [{ type: 'text', text: message }],
      });

      return { type: 'message-sent', message: response };
    } catch (error) {
      console.error('Failed to send message:', error);
      return {
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  if (intent === 'abort') {
    const sessionId = formData.get('sessionId') as string;
    await abortSession(sessionId);
    return { type: 'aborted' };
  }

  return { type: 'unknown' };
}

export default function Chat() {
  const { sessions, currentSession, messages: initialMessages, eventStreamUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<MessageWithParts[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update messages when loader data changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle SSE events for real-time updates
  useEffect(() => {
    if (!currentSession) return;

    const eventSource = new EventSource(eventStreamUrl);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Filter events for current session
      if (data.payload?.properties?.info?.sessionID !== currentSession.id) {
        return;
      }

      // Handle different event types
      if (data.payload?.type === 'message.updated') {
        const { info, parts } = data.payload.properties;
        setMessages((prev) => {
          const existing = prev.find((m) => m.info.id === info.id);
          if (existing) {
            // Update existing message
            return prev.map((m) =>
              m.info.id === info.id ? { info, parts: parts || m.parts } : m
            );
          } else {
            // Add new message
            return [...prev, { info, parts: parts || [] }];
          }
        });
      }

      if (data.payload?.type === 'message.part.updated') {
        const { messageID, part, delta } = data.payload.properties;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.info.id === messageID) {
              const partIndex = m.parts.findIndex((p) => p.type === part.type);
              if (partIndex >= 0) {
                // Update existing part with delta
                const updatedParts = [...m.parts];
                if (delta && updatedParts[partIndex].type === 'text') {
                  updatedParts[partIndex] = {
                    ...updatedParts[partIndex],
                    text: updatedParts[partIndex].text + delta,
                  };
                }
                return { ...m, parts: updatedParts };
              } else {
                // Add new part
                return { ...m, parts: [...m.parts, part] };
              }
            }
            return m;
          })
        );
      }

      if (data.payload?.type === 'session.status') {
        const { status } = data.payload.properties;
        setIsStreaming(status.type === 'busy');
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [currentSession, eventStreamUrl]);

  // Handle session creation redirect
  useEffect(() => {
    if (actionData?.type === 'session-created' && actionData.session) {
      window.location.href = `/chat?session=${actionData.session.id}`;
    }
  }, [actionData]);

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Full-screen iframe preview */}
      <iframe
        src="http://opencode-service-ajylkr-622128-208-113-131-145.traefik.me/"
        className="absolute inset-0 w-full h-full border-0"
        title="Preview"
      />

      {/* Collapsible Sidebar */}
      <div
        className={`absolute top-0 left-0 h-full bg-white border-r border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out z-20 ${
          isSidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: '256px' }}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">OpenCode Chat</h1>
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Collapse sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <Form method="post">
            <input type="hidden" name="intent" value="create-session" />
            <input type="hidden" name="title" value="New Chat" />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSubmitting}
            >
              + New Chat
            </button>
          </Form>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <a
              key={session.id}
              href={`/chat?session=${session.id}`}
              className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${currentSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
            >
              <div className="font-medium text-gray-900 truncate">{session.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {(() => {
                  try {
                    // OpenCode might return Unix timestamp (number) or ISO string
                    const date = typeof session.createdAt === 'number'
                      ? new Date(session.createdAt)
                      : new Date(session.createdAt);

                    return !isNaN(date.getTime())
                      ? date.toLocaleDateString()
                      : 'Recently';
                  } catch {
                    return 'Recently';
                  }
                })()}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Sidebar toggle button (when collapsed) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="absolute top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Open sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Floating Chat Window */}
      <div
        className={`absolute z-10 bg-white rounded-lg shadow-2xl transition-all duration-300 ${
          isChatMinimized ? 'bottom-4 right-4 w-80' : 'bottom-8 right-8 w-[600px] h-[700px]'
        }`}
        style={{
          maxWidth: 'calc(100vw - 64px)',
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">
              {currentSession ? currentSession.title : 'OpenCode Chat'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {currentSession && isStreaming && (
              <Form method="post">
                <input type="hidden" name="intent" value="abort" />
                <input type="hidden" name="sessionId" value={currentSession.id} />
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                >
                  Stop
                </button>
              </Form>
            )}
            <button
              onClick={() => setIsChatMinimized(!isChatMinimized)}
              className="p-1 hover:bg-blue-800 rounded"
              title={isChatMinimized ? 'Maximize' : 'Minimize'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isChatMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {!isChatMinimized && (
          <>
            {currentSession ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100% - 140px)' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.info.id}
                      className={`flex ${msg.info.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-3 py-2 rounded-lg text-sm ${
                          msg.info.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 border border-gray-200 text-gray-900'
                        }`}
                      >
                        {msg.parts.map((part, idx) => {
                          if (part.type === 'text') {
                            return (
                              <div key={idx} className="whitespace-pre-wrap">
                                {part.text}
                              </div>
                            );
                          }
                          if (part.type === 'tool') {
                            return (
                              <details key={idx} className="mt-2 text-xs opacity-75">
                                <summary className="cursor-pointer">Used tool: {part.name}</summary>
                                <pre className="mt-2 text-xs overflow-auto">
                                  {JSON.stringify(part.input, null, 2)}
                                </pre>
                              </details>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 border border-gray-200 text-gray-900 px-3 py-2 rounded-lg">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
                  <Form method="post" className="flex space-x-2">
                    <input type="hidden" name="intent" value="send-message" />
                    <input type="hidden" name="sessionId" value={currentSession.id} />
                    <input
                      type="text"
                      name="message"
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                      disabled={isSubmitting || isStreaming}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || isStreaming}
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                  </Form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold mb-2">Welcome to OpenCode Chat</h3>
                  <p className="text-sm">Create a new chat or select one from the sidebar</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
