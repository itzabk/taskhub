import express from 'express';

import { v1Routes } from './v1/routes.js';

export function router(app) {
  const apiRoutes = express.Router();

  apiRoutes.use('v1', v1Routes);

  apiRoutes.use((req, res, next) => {
    if (!req.route) {
      const error = new Error('No route matched');
      error.status = 404;
      return next(error);
    }

    return next();
  });
}
