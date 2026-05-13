import SubTaskDbModel from './schema.js';

export default class SubTaskModel {
  constructor({ mongooseConnection }) {
    this.mongooseModel = SubTaskDbModel(mongooseConnection);
  }

  /**
   * Create a new subtask under a parent task
   * @param {Object} subTaskData - SubTask creation data
   * @param {string} subTaskData.title - SubTask title
   * @param {string} subTaskData.taskId - Parent task ID
   * @returns {Promise<Object>} Created subtask document
   */
  async create({ title, taskId }) {
    return this.mongooseModel.create({
      title,
      taskId,
    });
  }

  /**
   * Find a subtask by ID (non-deleted records only)
   * @param {string} subTaskId - SubTask ID
   * @returns {Promise<Object>} SubTask document or null
   */
  async findById(subTaskId) {
    return this.mongooseModel.findOne({ _id: subTaskId, isDeleted: false });
  }

  /**
   * Update subtask by ID with validation
   * @param {string} subTaskId - SubTask ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated subtask document or null
   */
  async findByIdAndUpdate(subTaskId, updates) {
    return this.mongooseModel.findOneAndUpdate({ _id: subTaskId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Soft delete a subtask (mark as deleted without removing)
   * @param {string} subTaskId - SubTask ID
   * @returns {Promise<Object>} Updated subtask document or null
   */
  async softDelete(subTaskId) {
    return this.mongooseModel.findOneAndUpdate(
      { _id: subTaskId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  /**
   * Retrieve paginated subtasks for a specific task, sorted by creation date (newest first)
   * @param {string} taskId - Parent task ID
   * @param {number} skip - Number of records to skip (default: 0)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} Object with subTasks array and total count
   */
  async findByTaskId(taskId, skip = 0, limit = 10) {
    const subTasks = await this.mongooseModel
      .find({ taskId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.mongooseModel.countDocuments({ taskId, isDeleted: false });

    return { subTasks, total };
  }
}
