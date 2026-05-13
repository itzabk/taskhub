import { ConflictError, NotFoundError } from '../../helpers/errors/AppError.js';

import { LOGGER_FILES } from '../../constants/logger.js';

const { MAIN_THREAD } = LOGGER_FILES;

export default class UserService {
  constructor({ userModel, logger }) {
    this.userModel = userModel;
    this.logger = logger;
  }

  /**
   * Create a new user after checking for duplicates
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User full name
   * @param {string} userData.email - User email (must be unique)
   * @param {string} userData.password - User password (will be hashed)
   * @returns {Promise<Object>} Created user object
   * @throws {ConflictError} If email already exists
   */
  async createUser({ name, email, password }) {
    try {
      const existingUser = await this.userModel.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const user = await this.userModel.create({ name, email, password });
      return user.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'createUser',
          error: err.message,
        },
        'Failed to create user'
      );
      throw err;
    }
  }

  /**
   * Retrieve a specific user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   * @throws {NotFoundError} If user not found
   */
  async getUserById(userId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'getUserById',
          userId,
          error: err.message,
        },
        'Failed to get user'
      );
      throw err;
    }
  }

  /**
   * Retrieve a user by email address
   * @param {string} email - User email
   * @returns {Promise<Object>} User object
   * @throws {NotFoundError} If user not found
   */
  async getUserByEmail(email) {
    try {
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user;
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'getUserByEmail',
          email,
          error: err.message,
        },
        'Failed to get user by email'
      );
      throw err;
    }
  }

  /**
   * Update specific user fields (name, mobileNumber, details only)
   * @param {string} userId - User ID to update
   * @param {Object} updates - Fields to update (filtered for security)
   * @returns {Promise<Object>} Updated user object
   * @throws {NotFoundError} If user not found
   */
  async updateUser(userId, updates) {
    try {
      const allowedFields = ['name', 'mobileNumber', 'details'];
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (field in updates) {
          filteredUpdates[field] = updates[field];
        }
      });

      const user = await this.userModel.findByIdAndUpdate(userId, filteredUpdates);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user.toJSON();
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'updateUser',
          userId,
          error: err.message,
        },
        'Failed to update user'
      );
      throw err;
    }
  }

  /**
   * Soft delete a user (mark as deleted without removing from DB)
   * @param {string} userId - User ID to delete
   * @returns {Promise<Object>} Success confirmation
   * @throws {NotFoundError} If user not found
   */
  async deleteUser(userId) {
    try {
      const user = await this.userModel.softDelete(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      return { success: true };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'deleteUser',
          userId,
          error: err.message,
        },
        'Failed to delete user'
      );
      throw err;
    }
  }

  /**
   * List all users with pagination
   * @param {number} skip - Number of records to skip (default: 0)
   * @param {number} limit - Number of records to return (default: 10)
   * @returns {Promise<Object>} Paginated user list with total count
   */
  async listUsers(skip = 0, limit = 10) {
    try {
      const { users, total } = await this.userModel.findAll(skip, limit);

      return {
        data: users,
        total,
        skip,
        limit,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'UserService',
          method: 'listUsers',
          error: err.message,
        },
        'Failed to list users'
      );
      throw err;
    }
  }
}
