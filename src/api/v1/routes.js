import express from 'express';
import { authRoutes } from './auth/routes.js';
import { userRoutes } from './users/routes.js';
import { taskRoutes } from './tasks/routes.js';
import { subTaskRoutes } from './subtasks/routes.js';

export const v1Routes = express.Router();

v1Routes.use('/auth', authRoutes);
v1Routes.use('/users', userRoutes);
v1Routes.use('/tasks', taskRoutes);
v1Routes.use('/tasks/:taskId/subtasks', subTaskRoutes);
