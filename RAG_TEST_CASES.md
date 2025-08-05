# 🧪 RAG System Test Cases

## 📚 **Loaded Documents Analysis**

Based on the server logs, the RAG system has loaded 31 chunks from 5 documents:
- `daext-blogging-with-markdown-complete-guide.md` (10 chunks)
- `john-apostol-custom-markdown-blog.md` (11 chunks) 
- `just-files-nextjs-blog-with-react-markdown.md` (1 chunk)
- `webex-boosting-ai-performance-llm-friendly-markdown.md` (1 chunk)
- `wikipedia-lightweight-markup-language.md` (8 chunks)

## 🎯 **Test Cases by Category**

### **1. Markdown Basics & Fundamentals**

#### **Basic Syntax Questions:**
```bash
# Test basic markdown syntax
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create headers in markdown?",
    "sessionId": "test-rag-1"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the syntax for creating lists in markdown?",
    "sessionId": "test-rag-2"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I add links and images in markdown?",
    "sessionId": "test-rag-3"
  }'
```

#### **Code and Formatting:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create code blocks in markdown?",
    "sessionId": "test-rag-4"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the difference between inline and block code in markdown?",
    "sessionId": "test-rag-5"
  }'
```

### **2. Blogging with Markdown**

#### **Blog Creation:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a blog using markdown?",
    "sessionId": "test-rag-6"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best practices for markdown blogging?",
    "sessionId": "test-rag-7"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I structure a markdown blog post?",
    "sessionId": "test-rag-8"
  }'
```

#### **Advanced Blogging Features:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I add metadata to markdown blog posts?",
    "sessionId": "test-rag-9"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are frontmatter and how do I use them in markdown?",
    "sessionId": "test-rag-10"
  }'
```

### **3. Next.js and React Markdown**

#### **Next.js Integration:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I create a Next.js blog with React Markdown?",
    "sessionId": "test-rag-11"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is React Markdown and how do I use it?",
    "sessionId": "test-rag-12"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I set up a markdown blog with Next.js?",
    "sessionId": "test-rag-13"
  }'
```

### **4. AI Performance and LLM-Friendly Markdown**

#### **AI Optimization:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How can I make markdown more AI-friendly?",
    "sessionId": "test-rag-14"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are LLM-friendly markdown practices?",
    "sessionId": "test-rag-15"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I boost AI performance with markdown formatting?",
    "sessionId": "test-rag-16"
  }'
```

### **5. Markdown Language Fundamentals**

#### **Language Definition:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is a lightweight markup language?",
    "sessionId": "test-rag-17"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How does markdown compare to other markup languages?",
    "sessionId": "test-rag-18"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the advantages of using markdown?",
    "sessionId": "test-rag-19"
  }'
```

## 🔍 **Advanced RAG Testing**

### **Cross-Document Queries:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Compare markdown blogging approaches across different platforms",
    "sessionId": "test-rag-20"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the different ways to implement markdown in web applications?",
    "sessionId": "test-rag-21"
  }'
```

### **Specific Document References:**
```bash
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What does the Daext guide say about markdown blogging?",
    "sessionId": "test-rag-22"
  }'

curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are John Apostol's recommendations for custom markdown blogs?",
    "sessionId": "test-rag-23"
  }'
```

## 🧪 **Test Execution Script**

Create a file called `test_rag.sh`:

```bash
#!/bin/bash

echo "🧪 Testing RAG System..."
echo "========================"

# Test basic markdown
echo "1. Testing basic markdown syntax..."
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create headers in markdown?", "sessionId": "test-1"}' \
  | jq '.response'

echo -e "\n2. Testing blogging with markdown..."
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a blog using markdown?", "sessionId": "test-2"}' \
  | jq '.response'

echo -e "\n3. Testing Next.js integration..."
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I create a Next.js blog with React Markdown?", "sessionId": "test-3"}' \
  | jq '.response'

echo -e "\n4. Testing AI-friendly markdown..."
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I make markdown more AI-friendly?", "sessionId": "test-4"}' \
  | jq '.response'

echo -e "\n✅ RAG Testing Complete!"
```

## 📊 **Expected Results**

### **What to Look For:**
1. **Relevant Responses**: Answers should reference specific content from the loaded documents
2. **Document Citations**: Responses should mention specific sources or guides
3. **Comprehensive Answers**: Should combine information from multiple chunks when relevant
4. **Context Awareness**: Should understand the relationship between different markdown topics

### **Success Indicators:**
- ✅ Agent references specific documents (Daext, John Apostol, etc.)
- ✅ Agent provides practical, actionable advice
- ✅ Agent combines information from multiple sources
- ✅ Agent maintains conversation context across questions
- ✅ Agent can handle both basic and advanced markdown topics

## 🚀 **Quick Test Commands**

```bash
# Quick health check
curl http://localhost:3000/health

# Test basic RAG
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What is markdown?", "sessionId": "quick-test"}'

# Check RAG system info
curl http://localhost:3000/agent/rag
```

**Run these test cases to verify your RAG system is working correctly!** 🎯 