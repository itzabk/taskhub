export default class SubTaskController {
  constructor({ subTaskService }) {
    this.subTaskService = subTaskService;
  }

  async createSubTask(req, res, next) {
    try {
      const { title, taskId } = req.body;

      if (!title || !taskId) {
        const error = new Error('SubTask title and taskId are required');
        error.statusCode = 400;
        throw error;
      }

      const subTask = await this.subTaskService.createSubTask({
        title,
        taskId,
      });

      res.status(201).json({
        success: true,
        message: 'SubTask created successfully',
        data: subTask,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSubTaskById(req, res, next) {
    try {
      const { id } = req.params;

      const subTask = await this.subTaskService.getSubTaskById(id);
      res.status(200).json({
        success: true,
        message: 'SubTask retrieved successfully',
        data: subTask,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSubTask(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const subTask = await this.subTaskService.updateSubTask(id, updates);
      res.status(200).json({
        success: true,
        message: 'SubTask updated successfully',
        data: subTask,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSubTask(req, res, next) {
    try {
      const { id } = req.params;

      await this.subTaskService.deleteSubTask(id);
      res.status(200).json({
        success: true,
        message: 'SubTask deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async listTaskSubTasks(req, res, next) {
    try {
      const { taskId } = req.params;
      const { skip = 0, limit = 10 } = req.query;

      const result = await this.subTaskService.listTaskSubTasks(
        taskId,
        parseInt(skip),
        parseInt(limit)
      );
      res.status(200).json({
        success: true,
        message: 'SubTasks retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
