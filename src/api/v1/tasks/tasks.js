export default class TaskController {
  constructor({ taskService }) {
    this.taskService = taskService;
  }

  async createTask(req, res, next) {
    try {
      const { title, description, priority, dueDate } = req.body;
      const userId = req.user.userId;

      if (!title) {
        const error = new Error('Task title is required');
        error.statusCode = 400;
        throw error;
      }

      const task = await this.taskService.createTask({
        title,
        description,
        priority,
        dueDate,
        userId,
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;

      const task = await this.taskService.getTaskById(id);
      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const task = await this.taskService.updateTask(id, updates);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;

      await this.taskService.deleteTask(id);
      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async listUserTasks(req, res, next) {
    try {
      const { skip = 0, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await this.taskService.listUserTasks(userId, parseInt(skip), parseInt(limit));
      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        result,
      });
    } catch (err) {
      next(err);
    }
  }

  async listAllTasks(req, res, next) {
    try {
      const { skip = 0, limit = 10, status, priority } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const result = await this.taskService.listTasks(filters, parseInt(skip), parseInt(limit));
      res.status(200).json({
        success: true,
        message: 'All tasks retrieved successfully',
        result,
      });
    } catch (err) {
      next(err);
    }
  }
}
