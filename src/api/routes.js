import express from 'express';

import { v1Routes } from './v1/routes.js';

export function router(app) {
  const apiRoutes = express.Router();

  apiRoutes.use('/api/v1', v1Routes);

  app.use(apiRoutes);

  app.use((req, res, next) => {
    const error = new Error('No route matched');
    error.status = 404;
    next(error);
  });
}
