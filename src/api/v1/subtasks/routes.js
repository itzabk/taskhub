import express from 'express';
import { awilixContainer } from '../../../singletons/awilix.js';
import { authenticateWithJwt } from '../../../middlewares/authentication.js';
import SubTaskController from './subtasks.js';

const subTaskRoutes = express.Router({ mergeParams: true });

const subTaskService = awilixContainer.resolve('subTaskSubTask');
const subTaskController = new SubTaskController({ subTaskService });

subTaskRoutes.post('/', authenticateWithJwt, (req, res, next) =>
  subTaskController.createSubTask(req, res, next)
);
subTaskRoutes.get('/', authenticateWithJwt, (req, res, next) =>
  subTaskController.listTaskSubTasks(req, res, next)
);
subTaskRoutes.get('/:id', authenticateWithJwt, (req, res, next) =>
  subTaskController.getSubTaskById(req, res, next)
);
subTaskRoutes.put('/:id', authenticateWithJwt, (req, res, next) =>
  subTaskController.updateSubTask(req, res, next)
);
subTaskRoutes.delete('/:id', authenticateWithJwt, (req, res, next) =>
  subTaskController.deleteSubTask(req, res, next)
);

export { subTaskRoutes };
