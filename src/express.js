import compression from 'compression';

import cors from 'cors';

import express from 'express';

import rateLimit from 'express-rate-limit';

import helmet from 'helmet';

import crypto from 'node:crypto';

import pinoHttp from 'pino-http';

import qs from 'qs';

import router from './api/routes/index.js';

import { logger } from './helpers/pino/index.js';

import { shutdownOrchestrator } from './shutdownOrchestrator.js';

import { serverConfigs } from './configs/serverConfigs.js';

const {
  NODE_PORT = 3000,
  CLIENT_URL,
  ALLOWED_EXTERNAL_ORIGINS = '',
  COOKIE_SECRET = '',
  NODE_ENV = 'development',
} = serverConfigs;

const isProd = NODE_ENV === 'production';

function getAllowedOrigins() {
  return [
    CLIENT_URL,
    ...ALLOWED_EXTERNAL_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  ].filter(Boolean);
}

export function createExpressApp() {
  const app = express();

  app.disable('x-powered-by');

  app.set('trust proxy', isProd ? 1 : false);

  app.set('query parser', str =>
    qs.parse(str, {
      depth: 5,
      parameterLimit: 100,
      allowPrototypes: false,
      plainObjects: true,
    })
  );

  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use(
    pinoHttp({
      logger: logger.apiResponse ?? logger,
      genReqId: req => req.id,
      customProps: () => ({
        pid: process.pid,
      }),
      customLogLevel(req, res, error) {
        if (error || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(compression({ threshold: 4096 }));

  app.use(
    cors({
      origin(origin, callback) {
        const allowedOrigins = getAllowedOrigins();

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Api-Key',
        'X-Request-Id',
      ],
    })
  );

  app.options('*', cors());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // app.use(cookieParser(COOKIE_SECRET));

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      pid: process.pid,
      uptime: process.uptime(),
    });
  });

  router(app);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      requestId: req.id,
    });
  });

  app.use((error, req, res, next) => {
    req.log?.error({ error }, 'HTTP request processing error encountered');

    const statusCode = error.statusCode || error.status || 500;

    res.status(statusCode).json({
      success: false,
      message: isProd ? 'Something went wrong' : error.message,
      requestId: req.id,
    });
  });

  return app;
}

export function startServer() {
  const app = createExpressApp();

  const server = app.listen(Number(NODE_PORT), () => {
    logger.info?.(
      {
        file: 'expressApp',
        service: 'server',
        method: 'startServer',
        meta: {
          port: NODE_PORT,
          pid: process.pid,
        },
      },
      `Express server started successfully and listening on port ${NODE_PORT}`
    );
  });

  return server;
}

process.on('message', async message => {
  if (message.action === 'shutdown') {
    await shutdownOrchestrator(1);
  }
});

process.on('uncaughtException', async err => {
  logger.fatal(
    {
      file: 'expressWorker',
      service: 'index',
      method: 'uncaughtException',
      meta: {
        err,
      },
    },
    'Uncaught exception encountered in express worker process, initiating graceful shutdown'
  );
  await shutdownOrchestrator(1);
});

process.on('unhandledRejection', async err => {
  logger.fatal(
    {
      file: 'expressWorker',
      service: 'index',
      method: 'Unhandled Rejection',
      meta: { err },
    },
    'Unhandled promise rejection in express worker process, initiating graceful shutdown'
  );
  await shutdownOrchestrator(1);
});
