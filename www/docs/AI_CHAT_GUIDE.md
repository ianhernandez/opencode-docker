# AI Chat Integration Guide

This document explains the OpenCode AI Chat integration in the React Router web application.

## Overview

The chat interface provides a real-time AI assistant powered by OpenCode, allowing users to:
- Create and manage chat sessions
- Send messages to AI agents (plan, build, general)
- Receive streaming responses via Server-Sent Events (SSE)
- View conversation history
- Stop ongoing generations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  React Router Chat UI (/chat)                  │    │
│  │  - Session list sidebar                        │    │
│  │  - Message display                             │    │
│  │  - Message input                               │    │
│  └────────┬───────────────────────────┬───────────┘    │
│           │                           │                 │
└───────────┼───────────────────────────┼─────────────────┘
            │ HTTP (Loaders/Actions)    │ SSE (Real-time)
            ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│              React Router Server (SSR)                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  OpenCode API Client                           │    │
│  │  - listSessions()                              │    │
│  │  - createSession()                             │    │
│  │  - listMessages()                              │    │
│  │  - sendMessage()                               │    │
│  │  - getEventStreamUrl()                         │    │
│  └────────┬───────────────────────────────────────┘    │
└───────────┼─────────────────────────────────────────────┘
            │ HTTP + SSE
            ▼
┌─────────────────────────────────────────────────────────┐
│              OpenCode Server (Port 4096)                 │
│  - Session management                                    │
│  - Message handling                                      │
│  - Agent execution (plan/build/general)                  │
│  - Real-time event streaming                             │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
www/apps/web/app/
├── routes/
│   └── chat.tsx                    # Main chat route component
├── lib/
│   ├── opencode-types.ts           # TypeScript types for OpenCode API
│   └── opencode-api.server.ts      # Server-side API client
└── routes.ts                       # Route configuration
```

## Key Components

### 1. Types (`opencode-types.ts`)

Defines all TypeScript interfaces for OpenCode API:

```typescript
interface Session {
  id: string;
  title: string;
  parentID?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageWithParts {
  info: Message;
  parts: Part[];  // TextPart | ToolPart | etc.
}

interface SendMessageRequest {
  model: Model;
  agent: string;
  parts: TextPart[];
}
```

### 2. API Client (`opencode-api.server.ts`)

Server-side functions to interact with OpenCode:

```typescript
// Session management
listSessions(directory?)
createSession(data, directory?)
deleteSession(sessionId, directory?)

// Message management
listMessages(sessionId, limit, directory?)
sendMessage(sessionId, data, directory?)

// Control
abortSession(sessionId, directory?)
getEventStreamUrl(directory)
```

### 3. Chat Route (`chat.tsx`)

React Router route with:
- **Loader**: Fetches sessions and messages
- **Action**: Handles form submissions (create session, send message, abort)
- **Component**: Renders the chat UI with SSE integration

## Data Flow

### 1. Page Load
```
User visits /chat?session=abc123
    ↓
Loader runs on server:
  - listSessions() → Get all sessions
  - listMessages(abc123) → Get messages for session
    ↓
Returns data to component
    ↓
Component renders with initial data
```

### 2. Creating a Session
```
User clicks "New Chat"
    ↓
Form submits with intent=create-session
    ↓
Action runs on server:
  - createSession({ title: "New Chat" })
    ↓
Returns new session
    ↓
Client redirects to /chat?session=new-id
```

### 3. Sending a Message
```
User types message and clicks "Send"
    ↓
Form submits with intent=send-message
    ↓
Action runs on server:
  - sendMessage(sessionId, { message, model, agent })
    ↓
OpenCode starts processing
    ↓
SSE events stream back updates
    ↓
Component updates messages in real-time
```

### 4. Real-time Updates (SSE)

```typescript
useEffect(() => {
  const eventSource = new EventSource(eventStreamUrl);
  
  eventSource.onmessage = (event) => {
    const { payload } = JSON.parse(event.data);
    
    if (payload.type === 'message.updated') {
      // Update or add message
      setMessages(/* ... */);
    }
    
    if (payload.type === 'message.part.updated') {
      // Stream text delta
      setMessages(/* append delta to text */);
    }
    
    if (payload.type === 'session.status') {
      // Update loading state
      setIsStreaming(status.type === 'busy');
    }
  };
}, [currentSession]);
```

## Environment Configuration

Required environment variables:

```bash
# In docker-compose.yml for web service:
environment:
  - OPENCODE_URL=http://opencode:4096
  - API_URL=http://api:9999
```

## Features

### ✅ Implemented

- **Session Management**: Create, list, and select chat sessions
- **Message Display**: Show user and assistant messages with parts
- **Real-time Streaming**: SSE for live updates
- **Tool Calls**: Display tool usage (collapsible)
- **Stop Generation**: Abort button when AI is generating
- **Responsive UI**: Mobile-friendly layout
- **Loading States**: Visual feedback during operations

### 🔄 Potential Enhancements

- **Model Selection**: Dropdown to choose AI model
- **Agent Selection**: Switch between plan/build/general agents
- **Message Editing**: Edit and resend messages
- **Session Forking**: Branch conversations
- **Diff Viewer**: Show file changes inline
- **Todo Integration**: Display session todos
- **Session Renaming**: Edit session titles
- **Session Deletion**: Remove old conversations
- **File Attachments**: Upload files to context
- **Export Chat**: Download conversation history

## OpenCode API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/session` | GET | List all sessions |
| `/session` | POST | Create new session |
| `/session/{id}` | GET | Get session details |
| `/session/{id}/message` | GET | List messages |
| `/session/{id}/message` | POST | Send message |
| `/session/{id}/abort` | POST | Stop generation |
| `/event` | GET | SSE event stream |

## Testing the Chat

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Access the chat**:
   - Navigate to http://localhost:3000
   - Click "AI Chat" card
   - Or go directly to http://localhost:3000/chat

3. **Create a session**:
   - Click "+ New Chat"
   - A new session will be created and opened

4. **Send a message**:
   - Type: "What can you help me with?"
   - Click "Send"
   - Watch the AI response stream in real-time

5. **Use tools**:
   - Try: "Create a function to calculate fibonacci numbers"
   - The AI will use tools to write code
   - Tool calls appear as collapsible details

## Troubleshooting

### ProviderModelNotFoundError

**Error**: `ProviderModelNotFoundError: providerID: "openai", modelID: "gpt-4.1"`

**Cause**: OpenCode doesn't have the specified AI provider configured.

**Solution**: The chat is configured to use **Anthropic Claude Sonnet 4** (already set up in your `.env`). If you want to use other providers:

1. Add the provider's API key:
   ```bash
   # For OpenAI
   opencode auth login
   # Select OpenAI and enter your key
   
   # Or add to docker-compose.yml:
   environment:
     - OPENAI_API_KEY=${OPENAI_API_KEY}
   ```

2. Update the model in [`chat.tsx`](../apps/web/app/routes/chat.tsx:65):
   ```typescript
   model: {
     providerID: 'openai',  // or 'anthropic', 'google', etc.
     modelID: 'gpt-4o',     // check available models
   }
   ```

See [OpenCode Providers Documentation](https://docs.opencode.ai/config/providers) for all supported providers.

### OpenCode not responding

Check OpenCode is running:
```bash
docker-compose ps opencode
curl http://localhost:4096
```

### SSE connection fails

Verify event stream URL:
```bash
# Should return text/event-stream
curl -H "Accept: text/event-stream" \
  "http://localhost:4096/event?directory=/workspace"
```

### JSON Parse Error

**Error**: `SyntaxError: Unexpected end of JSON input`

**Cause**: OpenCode returned an error instead of valid JSON.

**Solution**: This is now handled with try-catch blocks. Check OpenCode logs to see the actual error:
```bash
docker-compose logs opencode
```

### Messages not appearing

1. Check browser console for errors
2. Verify SSE connection is active
3. Check OpenCode logs:
   ```bash
   docker-compose logs opencode
   ```

### TypeScript errors in IDE

The project uses React Router v7 types that may not be available in your IDE until you install dependencies:
```bash
cd www/apps/web
pnpm install
```

## API Reference

For full OpenCode API documentation, see the detailed guide provided in the task context, which includes:
- All available endpoints
- Request/response schemas
- Event types and payloads
- Agent configurations
- Model provider options

## Related Documentation

- [OpenCode API Documentation](http://localhost:4096/docs)
- [React Router SSR Guide](https://reactrouter.com/en/main/start/overview)
- [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
