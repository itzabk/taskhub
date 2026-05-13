import subTaskSchema from './schema.js';

export default class SubTaskModel {
  constructor({ mongooseConnection }) {
    this.SubTask = mongooseConnection.model('SubTask', subTaskSchema(mongooseConnection).schema);
  }

  async create({ title, taskId }) {
    return this.SubTask.create({
      title,
      taskId,
    });
  }

  async findById(subTaskId) {
    return this.SubTask.findOne({ _id: subTaskId, isDeleted: false });
  }

  async findByIdAndUpdate(subTaskId, updates) {
    return this.SubTask.findOneAndUpdate({ _id: subTaskId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  async softDelete(subTaskId) {
    return this.SubTask.findOneAndUpdate(
      { _id: subTaskId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  async findByTaskId(taskId, skip = 0, limit = 10) {
    const subTasks = await this.SubTask.find({ taskId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.SubTask.countDocuments({ taskId, isDeleted: false });

    return { subTasks, total };
  }
}
