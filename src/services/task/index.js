import { NotFoundError } from '../../helpers/errors/AppError.js';

import { LOGGER_FILES } from '../../constants/logger.js';

const { MAIN_THREAD } = LOGGER_FILES;

export default class TaskService {
  constructor({ taskModel, logger }) {
    this.taskModel = taskModel;
    this.logger = logger;
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task creation data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description
   * @param {string} taskData.priority - Task priority (low/medium/high)
   * @param {Date} taskData.dueDate - Task due date
   * @param {string} taskData.userId - Owner user ID
   * @returns {Promise<Object>} Created task object
   */
  async createTask({ title, description, priority, dueDate, userId }) {
    try {
      const task = await this.taskModel.create({
        title,
        description,
        priority,
        dueDate,
        userId,
      });

      return task.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'createTask',
          userId,
          error: err.message,
        },
        'Failed to create task'
      );
      throw err;
    }
  }

  /**
   * Get a specific task by ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task object
   * @throws {NotFoundError} If task not found
   */
  async getTaskById(taskId) {
    try {
      const task = await this.taskModel.findById(taskId);
      if (!task) {
        throw new NotFoundError('Task not found');
      }
      return task.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'getTaskById',
          taskId,
          error: err.message,
        },
        'Failed to get task'
      );
      throw err;
    }
  }

  /**
   * Update specific task fields (title, description, status, priority, dueDate)
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated task object
   * @throws {NotFoundError} If task not found
   */
  async updateTask(taskId, updates) {
    try {
      const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate'];
      const filteredUpdates = {};
      allowedUpdates.forEach(key => {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      });

      const task = await this.taskModel.findByIdAndUpdate(taskId, filteredUpdates);
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      return task.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'updateTask',
          taskId,
          error: err.message,
        },
        'Failed to update task'
      );
      throw err;
    }
  }

  /**
   * Soft delete a task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Success confirmation
   * @throws {NotFoundError} If task not found
   */
  async deleteTask(taskId) {
    try {
      const task = await this.taskModel.softDelete(taskId);
      if (!task) {
        throw new NotFoundError('Task not found');
      }

      return { success: true };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'deleteTask',
          taskId,
          error: err.message,
        },
        'Failed to delete task'
      );
      throw err;
    }
  }

  /**
   * List all tasks for a specific user with pagination
   * @param {string} userId - User ID
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} Paginated task list
   */
  async listUserTasks(userId, skip = 0, limit = 10) {
    try {
      const { tasks, total } = await this.taskModel.findByUserId(userId, skip, limit);

      return {
        data: tasks,
        total,
        skip,
        limit,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'listUserTasks',
          userId,
          error: err.message,
        },
        'Failed to list user tasks'
      );
      throw err;
    }
  }

  /**
   * List all tasks with optional filters and pagination
   * @param {Object} filters - Query filters (status, priority, etc.)
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} Paginated task list
   */
  async listTasks(filters = {}, skip = 0, limit = 10) {
    try {
      const { tasks, total } = await this.taskModel.findAll(filters, skip, limit);

      return {
        data: tasks,
        total,
        skip,
        limit,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'TaskService',
          method: 'listTasks',
          error: err.message,
        },
        'Failed to list tasks'
      );
      throw err;
    }
  }
}
