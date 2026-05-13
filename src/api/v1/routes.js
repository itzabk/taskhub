import express from 'express';

import { authRoutes } from './auth/routes.js';

import { userRoutes } from './users/routes.js';

import { taskRoutes } from './tasks/routes.js';

import { subTaskRoutes } from './subtasks/routes.js';

import { authenticateWithJwt } from '../../middlewares/authentication.js';

export const v1Routes = express.Router();

v1Routes.use('/auth', authRoutes);

v1Routes.use('/users', authenticateWithJwt, userRoutes);

v1Routes.use('/tasks', authenticateWithJwt, taskRoutes);

v1Routes.use('/tasks/:taskId/subtasks', authenticateWithJwt, subTaskRoutes);
