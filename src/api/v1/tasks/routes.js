import express from 'express';
import { awilixContainer } from '../../../singletons/awilix.js';
import { authenticateWithJwt } from '../../../middlewares/authentication.js';
import TaskController from './tasks.js';

const taskRoutes = express.Router();

const taskService = awilixContainer.resolve('taskTask');
const taskController = new TaskController({ taskService });

taskRoutes.post('/', authenticateWithJwt, (req, res, next) =>
  taskController.createTask(req, res, next)
);
taskRoutes.get('/', authenticateWithJwt, (req, res, next) =>
  taskController.listUserTasks(req, res, next)
);
taskRoutes.get('/admin/all', authenticateWithJwt, (req, res, next) =>
  taskController.listAllTasks(req, res, next)
);
taskRoutes.get('/:id', authenticateWithJwt, (req, res, next) =>
  taskController.getTaskById(req, res, next)
);
taskRoutes.put('/:id', authenticateWithJwt, (req, res, next) =>
  taskController.updateTask(req, res, next)
);
taskRoutes.delete('/:id', authenticateWithJwt, (req, res, next) =>
  taskController.deleteTask(req, res, next)
);

export { taskRoutes };
