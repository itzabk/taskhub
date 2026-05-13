import express from 'express';

import TaskController from './tasks.js';

import { taskService } from '../../../services/index.js';

const taskRoutes = express.Router();

const taskController = new TaskController({ taskService });

taskRoutes.post('/', (req, res, next) => taskController.createTask(req, res, next));

taskRoutes.get('/', (req, res, next) => taskController.listUserTasks(req, res, next));

taskRoutes.get('/admin/all', (req, res, next) => taskController.listAllTasks(req, res, next));

taskRoutes.get('/:id', (req, res, next) => taskController.getTaskById(req, res, next));

taskRoutes.put('/:id', (req, res, next) => taskController.updateTask(req, res, next));

taskRoutes.delete('/:id', (req, res, next) => taskController.deleteTask(req, res, next));

export { taskRoutes };
