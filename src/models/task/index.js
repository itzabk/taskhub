import TaskDbModel from './schema.js';

export default class TaskModel {
  constructor({ mongooseConnection }) {
    this.mongooseModel = TaskDbModel(mongooseConnection);
  }

  /**
   * Create a new task with default values for optional fields
   * @param {Object} taskData - Task creation data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description (defaults to empty string)
   * @param {string} taskData.priority - Task priority (defaults to 'medium')
   * @param {Date} taskData.dueDate - Task due date
   * @param {string} taskData.userId - Owner user ID
   * @returns {Promise<Object>} Created task document
   */
  async create({ title, description = '', priority = 'medium', dueDate, userId }) {
    return this.mongooseModel.create({
      title,
      description,
      priority,
      dueDate,
      userId,
    });
  }

  /**
   * Find a task by ID (non-deleted records only)
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task document or null
   */
  async findById(taskId) {
    return this.mongooseModel.findOne({ _id: taskId, isDeleted: false });
  }

  /**
   * Update task by ID with validation
   * @param {string} taskId - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated task document or null
   */
  async findByIdAndUpdate(taskId, updates) {
    return this.mongooseModel.findOneAndUpdate({ _id: taskId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Soft delete a task (mark as deleted without removing)
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Updated task document or null
   */
  async softDelete(taskId) {
    return this.mongooseModel.findOneAndUpdate(
      { _id: taskId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }

  /**
   * Retrieve paginated tasks for a specific user, sorted by creation date (newest first)
   * @param {string} userId - User ID
   * @param {number} skip - Number of records to skip (default: 0)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} Object with tasks array and total count
   */
  async findByUserId(userId, skip = 0, limit = 10) {
    const tasks = await this.mongooseModel
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.mongooseModel.countDocuments({ userId, isDeleted: false });

    return { tasks, total };
  }

  /**
   * Find all tasks with optional filters and pagination
   * @param {Object} filters - Query filters (status, priority, userId, etc.)
   * @param {number} skip - Number of records to skip (default: 0)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} Object with tasks array and total count, sorted newest first
   */
  async findAll(filters = {}, skip = 0, limit = 10) {
    const query = { isDeleted: false, ...filters };
    const tasks = await this.mongooseModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.Task.countDocuments(query);

    return { tasks, total };
  }
}
