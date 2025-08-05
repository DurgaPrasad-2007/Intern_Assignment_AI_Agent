# 🤖 AI Agent Server with RAG & Plugin System

A production-ready TypeScript AI Agent Server featuring Retrieval-Augmented Generation (RAG), intelligent plugin execution, and conversation memory.

## 🎯 Requirements

### Prerequisites
- **Node.js 18+**
- **TypeScript 5+**
- **OpenAI API Key**

### Environment Variables
Create a `.env` file:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-large

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker-compose up -d
```

## 📡 API Endpoints

### Main Agent Endpoint
```bash
# Send a message to the AI agent
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather in New York?",
    "sessionId": "user-123"
  }'
```

### Health & Monitoring
```bash
# Check system health
curl http://localhost:3000/health

# Get performance metrics
curl http://localhost:3000/metrics
```

### Session Management
```bash
# List active sessions
curl http://localhost:3000/agent/sessions

# Clear a session
curl -X DELETE http://localhost:3000/agent/sessions/user-123
```

### Plugin Information
```bash
# List available plugins
curl http://localhost:3000/agent/plugins
```

## 🔌 Built-in Plugins

### Weather Plugin
```bash
curl -X POST http://localhost:3000/agent/message \
  -d '{"message": "What is the weather in London?", "sessionId": "test"}'
```

### Math Plugin
```bash
curl -X POST http://localhost:3000/agent/message \
  -d '{"message": "Calculate 15 * 23 + 7", "sessionId": "test"}'
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- --testNamePattern="DocumentChunker"

# Lint and type check
npm run quality
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -f Dockerfile.production -t ai-agent-server .
docker run -p 3000:3000 ai-agent-server
```

## 📁 Project Structure

```
src/
├── agent/           # Core AI agent logic
├── utils/           # Utility functions
├── middleware/      # Express middleware
├── config/          # Configuration
├── types/           # TypeScript types
├── data/            # Static data
├── __tests__/       # Test files
└── server.ts        # Express server
```

## 🎯 Features

- ✅ **Agent Core**: OpenAI GPT-4 integration with conversation memory
- ✅ **RAG System**: 5+ documents with intelligent retrieval
- ✅ **Plugin System**: Weather and Math plugins with extensibility
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Express.js**: Production-ready web framework
- ✅ **Docker**: Ready for deployment

---

**Built with TypeScript, Node.js, and OpenAI**
