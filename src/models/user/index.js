import UserDbModel from './schema.js';

export default class UserModel {
  constructor({ mongooseConnection }) {
    this.mongooseModel = UserDbModel(mongooseConnection);
  }

  /**
   * Find a user by ID (non-deleted records only)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User document or null
   */
  async findById(userId) {
    return this.mongooseModel.findOne({ _id: userId, isDeleted: false });
  }

  /**
   * Find a user by email address (non-deleted records only)
   * @param {string} email - User email
   * @returns {Promise<Object>} User document or null
   */
  async findByEmail(email) {
    return this.mongooseModel.findOne({ email, isDeleted: false });
  }

  /**
   * Find a user by email with password field included (non-deleted records only)
   * @param {string} email - User email
   * @returns {Promise<Object>} User document with password field or null
   */
  async findByEmailWithPassword(email) {
    return this.mongooseModel.findOne({ email, isDeleted: false }).select('+password');
  }

  /**
   * Create a new user (password hashed automatically by pre-save middleware)
   * @param {Object} userData - User data
   * @param {string} userData.name - User name
   * @param {string} userData.email - User email
   * @param {string} userData.password - Plain password (hashed by schema middleware)
   * @returns {Promise<Object>} Created user document
   */
  async create({ name, email, password }) {
    return this.mongooseModel.create({
      name,
      email,
      password,
    });
  }

  /**
   * Update user by ID with validation
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user document or null
   */
  async findByIdAndUpdate(userId, updates) {
    return this.mongooseModel.findOneAndUpdate({ _id: userId, isDeleted: false }, updates, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Soft delete user (marks as deleted without removing from DB)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated user document or null
   */
  async softDelete(userId) {
    return this.mongooseModel.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Retrieve paginated list of all non-deleted users
   * @param {number} skip - Number of records to skip
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} Object with users array and total count
   */
  async findAll(skip = 0, limit = 10) {
    const users = await this.mongooseModel
      .find({ isDeleted: false })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.mongooseModel.countDocuments({ isDeleted: false });

    return { users, total };
  }
}
