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

    const response = await sendMessage(sessionId, {
      model: {
        providerID: 'openai',
        modelID: 'gpt-4.1',
      },
      agent: 'build',
      parts: [{ type: 'text', text: message }],
    });

    return { type: 'message-sent', message: response };
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
    if (actionData?.type === 'session-created') {
      window.location.href = `/chat?session=${actionData.session.id}`;
    }
  }, [actionData]);

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">OpenCode Chat</h1>
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
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{currentSession.title}</h2>
              {isStreaming && (
                <Form method="post">
                  <input type="hidden" name="intent" value="abort" />
                  <input type="hidden" name="sessionId" value={currentSession.id} />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Stop Generating
                  </button>
                </Form>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.info.id}
                  className={`flex ${msg.info.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${msg.info.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
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
                          <details key={idx} className="mt-2 text-sm opacity-75">
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
                  <div className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-lg">
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
            <div className="bg-white border-t border-gray-200 p-6">
              <Form method="post" className="flex space-x-4">
                <input type="hidden" name="intent" value="send-message" />
                <input type="hidden" name="sessionId" value={currentSession.id} />
                <input
                  type="text"
                  name="message"
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isSubmitting || isStreaming}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || isStreaming}
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </button>
              </Form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to OpenCode Chat</h2>
              <p>Create a new chat or select one from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
