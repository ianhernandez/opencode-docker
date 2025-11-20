# OpenCode AI Chat - Quick Start

A simple AI chat interface integrated with OpenCode, built with React Router 7.

## 🚀 Features

- **💬 Real-time Chat**: Stream AI responses as they're generated
- **📝 Session Management**: Create and switch between multiple conversations
- **🔧 Tool Display**: See when AI uses tools (file operations, searches, etc.)
- **⏹️ Stop Control**: Abort ongoing AI generations
- **📱 Responsive**: Works on desktop and mobile

## 🎯 Quick Start

### 1. Start the Application

```bash
# From project root
docker-compose up --build
```

This starts:
- OpenCode AI server (port 4096)
- React Router web app (port 3000)
- Hono API backend (port 9999)
- PostgreSQL database (port 5432)
- Preview server (port 8080)

### 2. Access the Chat

Open http://localhost:3000 and click "AI Chat" or go directly to:
http://localhost:3000/chat

### 3. Start Chatting

1. Click **"+ New Chat"** to create a session
2. Type your message in the input box
3. Click **"Send"**
4. Watch the AI response stream in real-time

## 📂 Files Added

```
www/apps/web/app/
├── lib/
│   ├── opencode-types.ts          # TypeScript types
│   └── opencode-api.server.ts     # API client
└── routes/
    └── chat.tsx                   # Chat UI component

www/docs/
└── AI_CHAT_GUIDE.md               # Detailed documentation
```

## 🔧 How It Works

```
User types message
    ↓
React Router form submission
    ↓
Server action calls OpenCode API
    ↓
OpenCode processes with AI
    ↓
SSE streams updates back
    ↓
UI updates in real-time
```

## 💡 Example Prompts

Try these to see the AI in action:

- "What can you help me with?"
- "Create a TypeScript function to validate email addresses"
- "Explain the difference between props and state in React"
- "Write a SQL query to find duplicate records"
- "Help me debug this error: [paste error]"

## 🎨 UI Layout

```
┌─────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────────┐ │
│  │         │  │    Session       │ │
│  │Sessions │  │    Title         │ │
│  │Sidebar  │  ├──────────────────┤ │
│  │         │  │                  │ │
│  │• Chat 1 │  │   Messages       │ │
│  │• Chat 2 │  │   Area           │ │
│  │• Chat 3 │  │                  │ │
│  │         │  │                  │ │
│  │         │  ├──────────────────┤ │
│  │[+ New]  │  │  [Type message]  │ │
│  └─────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

## 🛠️ Configuration

The chat connects to OpenCode via environment variables set in `docker-compose.yml`:

```yaml
environment:
  - OPENCODE_URL=http://opencode:4096
```

## 📊 AI Configuration

**Model**: Anthropic Claude Sonnet 4
- Uses your existing `ANTHROPIC_API_KEY` from `.env`
- No additional setup required

**Agent**: Build
- Specialized for code implementation and file operations
- Other agents: `plan` (architecture), `general` (conversation)

> **Note**: To use other providers like OpenAI, you need to add their API keys to OpenCode using `opencode auth login` or environment variables. See [OpenCode Providers Documentation](https://docs.opencode.ai/config/providers).

## 🔍 Debugging

### Check OpenCode is running
```bash
docker-compose ps opencode
docker-compose logs opencode
```

### Test API directly
```bash
curl http://localhost:4096/session
```

### View SSE stream
```bash
curl -N -H "Accept: text/event-stream" \
  "http://localhost:4096/event?directory=/workspace"
```

## 📚 Learn More

- [Detailed Chat Guide](../docs/AI_CHAT_GUIDE.md)
- [OpenCode API Documentation](http://localhost:4096/docs)
- [React Router Docs](https://reactrouter.com)

## 🚧 Known Limitations

- Model and agent selection not yet exposed in UI
- No message editing or deletion
- Session titles auto-generated (not editable yet)
- No file upload support yet
- Basic styling (room for improvement)

## 🔜 Potential Enhancements

- [ ] Model selector dropdown
- [ ] Agent switcher
- [ ] Session rename
- [ ] Session delete
- [ ] Message edit/regenerate
- [ ] File attachments
- [ ] Code syntax highlighting
- [ ] Markdown rendering
- [ ] Export conversations
- [ ] Dark mode
