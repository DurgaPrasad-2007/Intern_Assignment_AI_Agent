import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { Agent } from './agent/agent.js';
import { validateMessageRequest, validateSessionId } from './middleware/validation.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import type { MessageRequest, MessageResponse, HealthStatus } from './types/index.js';

const app = express();
const agent = new Agent();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.env === 'production' 
    ? ['https://yourdomain.com'] // Replace with your domain
    : true,
  credentials: true,
}));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/agent', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  const health = await agent.healthCheck();
  const performanceReport = (await import('./utils/performanceMonitor.js')).performanceMonitor.getDetailedReport();
  
  const healthStatus: HealthStatus = {
    status: health.status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: health.services,
    metrics: {
      totalRequests: performanceReport.metrics.requestCount,
      averageResponseTime: performanceReport.metrics.averageResponseTime,
      errorRate: performanceReport.additional.errorRate,
      memoryUsage: performanceReport.metrics.memoryUsage.heapUsed,
    },
  };

  const responseTime = Date.now() - startTime;
  res.set('X-Response-Time', `${responseTime}ms`);
  res.set('X-Health-Score', performanceReport.additional.healthScore.toString());
  
  res.status(health.status === 'healthy' ? 200 : 503).json(healthStatus);
}));

// Performance metrics endpoint
app.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const performanceMonitor = (await import('./utils/performanceMonitor.js')).performanceMonitor;
  const report = performanceMonitor.getDetailedReport();
  const alerts = performanceMonitor.getAlerts();
  
  res.json({
    ...report,
    alerts,
    timestamp: new Date().toISOString(),
  });
}));

// Main agent endpoint
app.post('/agent/message', 
  validateMessageRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const request: MessageRequest = req.body;
    const startTime = Date.now();

    logger.info('Processing agent message', {
      sessionId: request.session_id,
      messageLength: request.message.length,
    });

    const response: MessageResponse = await agent.handleMessage(request);
    
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
    
    logger.info('Agent message processed', {
      sessionId: request.session_id,
      responseTime,
    });

    res.json(response);
  })
);

// Session management endpoints
app.get('/agent/sessions/:session_id', 
  validateSessionId,
  asyncHandler(async (req: Request, res: Response) => {
    const { session_id } = req.params;
    if (!session_id) {
      res.status(400).json({
        error: 'Session ID is required',
        code: 'INVALID_SESSION_ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const session = agent.memory.getSession(session_id);
    
    if (!session) {
      res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      session_id,
      message_count: session.messages.length,
      last_accessed: session.lastAccessed.toISOString(),
    });
  })
);

app.delete('/agent/sessions/:session_id',
  validateSessionId,
  asyncHandler(async (req: Request, res: Response) => {
    const { session_id } = req.params;
    if (!session_id) {
      res.status(400).json({
        error: 'Session ID is required',
        code: 'INVALID_SESSION_ID',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    const deleted = agent.memory.deleteSession(session_id);
    
    if (!deleted) {
      res.status(404).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      message: 'Session deleted successfully',
      session_id,
      timestamp: new Date().toISOString(),
    });
  })
);

// Plugin information endpoint
app.get('/agent/plugins', (req: Request, res: Response) => {
  const plugins = agent.plugins.listWithDescriptions();
  res.json({
    plugins,
    count: plugins.length,
    timestamp: new Date().toISOString(),
  });
});

// RAG information endpoint
app.get('/agent/rag', asyncHandler(async (req: Request, res: Response) => {
  const stats = agent.rag.getStats();
  
  // Get sample documents for debugging
  const sampleDocs = await agent.rag.query({ 
    query: 'markdown', 
    maxResults: 3 
  });
  
  res.json({
    document_count: stats.documentCount,
    keyword_count: stats.keywordCount,
    category_count: stats.categoryCount,
    categories: stats.categories,
    sample_query: {
      query: 'markdown',
      results_count: sampleDocs.length,
      top_score: sampleDocs[0]?.score,
      sample_documents: sampleDocs.map(doc => ({
        id: doc.id,
        text_preview: doc.text.slice(0, 200) + '...',
        score: doc.score,
        metadata: doc.metadata
      }))
    },
    timestamp: new Date().toISOString(),
  });
}));

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info('AI Agent Server started', {
    port: config.port,
    environment: config.env,
    nodeVersion: process.version,
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

export default server;
