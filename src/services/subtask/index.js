import { NotFoundError } from '../../helpers/errors/AppError.js';

import { LOGGER_FILES } from '../../constants/logger.js';

const { MAIN_THREAD } = LOGGER_FILES;

export default class SubTaskService {
  constructor({ subTaskModel, logger }) {
    this.subTaskModel = subTaskModel;
    this.logger = logger;
  }

  /**
   * Create a new subtask under a task
   * @param {Object} subTaskData - SubTask creation data
   * @param {string} subTaskData.title - SubTask title
   * @param {string} subTaskData.taskId - Parent task ID
   * @returns {Promise<Object>} Created subtask object
   */
  async createSubTask({ title, taskId }) {
    try {
      const subTask = await this.subTaskModel.create({
        title,
        taskId,
      });

      return subTask.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'SubTaskService',
          method: 'createSubTask',
          taskId,
          error: err.message,
        },
        'Failed to create subtask'
      );
      throw err;
    }
  }

  /**
   * Get a specific subtask by ID
   * @param {string} subTaskId - SubTask ID
   * @returns {Promise<Object>} SubTask object
   * @throws {NotFoundError} If subtask not found
   */
  async getSubTaskById(subTaskId) {
    try {
      const subTask = await this.subTaskModel.findById(subTaskId);
      if (!subTask) {
        throw new NotFoundError('SubTask not found');
      }
      return subTask.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'SubTaskService',
          method: 'getSubTaskById',
          subTaskId,
          error: err.message,
        },
        'Failed to get subtask'
      );
      throw err;
    }
  }

  /**
   * Update specific subtask fields (title, completed status)
   * @param {string} subTaskId - SubTask ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subtask object
   * @throws {NotFoundError} If subtask not found
   */
  async updateSubTask(subTaskId, updates) {
    try {
      const allowedUpdates = ['title', 'completed'];
      const filteredUpdates = {};
      allowedUpdates.forEach(key => {
        if (key in updates) {
          filteredUpdates[key] = updates[key];
        }
      });

      const subTask = await this.subTaskModel.findByIdAndUpdate(subTaskId, filteredUpdates);
      if (!subTask) {
        throw new NotFoundError('SubTask not found');
      }

      return subTask.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'SubTaskService',
          method: 'updateSubTask',
          subTaskId,
          error: err.message,
        },
        'Failed to update subtask'
      );
      throw err;
    }
  }

  /**
   * Soft delete a subtask
   * @param {string} subTaskId - SubTask ID
   * @returns {Promise<Object>} Success confirmation
   * @throws {NotFoundError} If subtask not found
   */
  async deleteSubTask(subTaskId) {
    try {
      const subTask = await this.subTaskModel.softDelete(subTaskId);
      if (!subTask) {
        throw new NotFoundError('SubTask not found');
      }

      return { success: true };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'SubTaskService',
          method: 'deleteSubTask',
          subTaskId,
          error: err.message,
        },
        'Failed to delete subtask'
      );
      throw err;
    }
  }

  /**
   * List all subtasks for a specific task with pagination
   * @param {string} taskId - Parent task ID
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} Paginated subtask list
   */
  async listTaskSubTasks(taskId, skip = 0, limit = 10) {
    try {
      const { subTasks, total } = await this.subTaskModel.findByTaskId(taskId, skip, limit);

      return {
        data: subTasks,
        total,
        skip,
        limit,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'SubTaskService',
          method: 'listTaskSubTasks',
          taskId,
          error: err.message,
        },
        'Failed to list subtasks'
      );
      throw err;
    }
  }
}
