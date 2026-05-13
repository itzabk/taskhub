import express from 'express';

import SubTaskController from './subtasks.js';

import { subTaskService } from '../../../services/index.js';

const subTaskRoutes = express.Router({ mergeParams: true });

const subTaskController = new SubTaskController({ subTaskService });

subTaskRoutes.post('/', (req, res, next) => subTaskController.createSubTask(req, res, next));

subTaskRoutes.get('/', (req, res, next) => subTaskController.listTaskSubTasks(req, res, next));

subTaskRoutes.get('/:id', (req, res, next) => subTaskController.getSubTaskById(req, res, next));

subTaskRoutes.put('/:id', (req, res, next) => subTaskController.updateSubTask(req, res, next));

subTaskRoutes.delete('/:id', (req, res, next) => subTaskController.deleteSubTask(req, res, next));

export { subTaskRoutes };
