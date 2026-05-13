import { NotFoundError } from '../../helpers/errors/AppError.js';

export default class SubTaskService {
  constructor({ subTaskModel, logger }) {
    this.subTaskModel = subTaskModel;
    this.logger = logger;
  }

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
