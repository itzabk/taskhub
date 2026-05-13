import { NotFoundError } from '../../helpers/errors/AppError.js';

export default class TaskService {
  constructor({ taskModel, logger }) {
    this.taskModel = taskModel;
    this.logger = logger;
  }

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
