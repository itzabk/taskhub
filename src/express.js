import compression from 'compression';

import cors from 'cors';

import express from 'express';

import rateLimit from 'express-rate-limit';

import helmet from 'helmet';

import crypto from 'node:crypto';

import pinoHttp from 'pino-http';

import qs from 'qs';

import { router } from './api/routes.js';

import { apiResponse, logger, loggerStorage } from './helpers/index.js';

import { shutdownOrchestrator } from './orchestrators/index.js';

import { serverConfigs } from './configs/serverConfigs.js';

import passport from 'passport';

import cookieParser from 'cookie-parser';

import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './configs/swagger-api-docs.js';

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

function createExpressApp() {
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
      logger: apiResponse,
      genReqId: req => req.id,
      customProps: () => ({
        pid: process.pid,
        ppid: process.ppid,
      }),
      customLogLevel(req, res, error) {
        if (error || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.confirmPassword',
          'req.body.token',
          'res.headers["set-cookie"]',
        ],
        censor: '[CONFIDENTIAL]',
        remove: false,
      },
    })
  );

  app.use((req, res, next) => {
    loggerStorage.run(req.log, () => next());
  });

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
        'X-Csrf-Token',
      ],
    })
  );

  app.options('/*splat', cors());

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

  app.use(cookieParser(COOKIE_SECRET));

  app.use(passport.initialize());

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      pid: process.pid,
      uptime: process.uptime(),
    });
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
      .swagger-ui {
        max-width: 1400px;
        margin: 0 auto;
      }
    `,
      customSiteTitle: 'TaskHub API Documentation',
      swaggerOptions: {
        defaultModelsExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
        withCredentials: true,
      },
    })
  );

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

function startServer() {
  const app = createExpressApp();

  const server = app.listen(Number(NODE_PORT), () => {
    logger.info?.(
      {
        file: 'expressWorker',
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

startServer();
