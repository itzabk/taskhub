import { taskSchema } from './schema.js';

export default class TaskModel {
  constructor({ mongooseConnection }) {
    this.Task = mongooseConnection.model('Task', taskSchema);
  }

  async create({ title, description, priority, dueDate, userId }) {
    return this.Task.create({
      title,
      description: description || '',
      priority: priority || 'medium',
      dueDate,
      userId,
    });
  }

  async findById(taskId) {
    return this.Task.findOne({ _id: taskId, isDeleted: false });
  }

  async findByIdAndUpdate(taskId, updates) {
    return this.Task.findOneAndUpdate({ _id: taskId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  async softDelete(taskId) {
    return this.Task.findOneAndUpdate(
      { _id: taskId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  async findByUserId(userId, skip = 0, limit = 10) {
    const tasks = await this.Task.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Task.countDocuments({ userId, isDeleted: false });

    return { tasks, total };
  }

  async findAll(filters = {}, skip = 0, limit = 10) {
    const query = { isDeleted: false, ...filters };
    const tasks = await this.Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Task.countDocuments(query);

    return { tasks, total };
  }
}
