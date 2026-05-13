import express from 'express';

import SubTaskController from './subtasks.js';

import { subTaskService } from '../../../services/index.js';

const subTaskRoutes = express.Router({ mergeParams: true });

const subTaskController = new SubTaskController({ subTaskService });

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks:
 *   post:
 *     summary: Create a new subtask
 *     description: Creates a new subtask within a parent task
 *     tags:
 *       - Subtasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubTaskCreate'
 *     responses:
 *       201:
 *         description: Subtask created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Parent task not found
 */
subTaskRoutes.post('/', (req, res, next) => subTaskController.createSubTask(req, res, next));

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks:
 *   get:
 *     summary: List task's subtasks
 *     description: Retrieves all subtasks for a specific task with pagination
 *     tags:
 *       - Subtasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent task ID
 *       - name: skip
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed]
 *         description: Filter by subtask status
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by subtask priority
 *     responses:
 *       200:
 *         description: Subtasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Parent task not found
 */
subTaskRoutes.get('/', (req, res, next) => subTaskController.listTaskSubTasks(req, res, next));

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{id}:
 *   get:
 *     summary: Get subtask details
 *     description: Retrieves detailed information about a specific subtask
 *     tags:
 *       - Subtasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     responses:
 *       200:
 *         description: Subtask retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
subTaskRoutes.get('/:id', (req, res, next) => subTaskController.getSubTaskById(req, res, next));

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{id}:
 *   put:
 *     summary: Update a subtask
 *     description: Updates subtask details including status and time tracking
 *     tags:
 *       - Subtasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubTaskUpdate'
 *     responses:
 *       200:
 *         description: Subtask updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
subTaskRoutes.put('/:id', (req, res, next) => subTaskController.updateSubTask(req, res, next));

/**
 * @swagger
 * /api/v1/tasks/{taskId}/subtasks/{id}:
 *   delete:
 *     summary: Delete a subtask
 *     description: Soft deletes a subtask
 *     tags:
 *       - Subtasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: taskId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Subtask ID
 *     responses:
 *       200:
 *         description: Subtask deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
subTaskRoutes.delete('/:id', (req, res, next) => subTaskController.deleteSubTask(req, res, next));

export { subTaskRoutes };
