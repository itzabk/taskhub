import { ConflictError, NotFoundError } from '../../helpers/errors/AppError.js';

export default class UserService {
  constructor({ userModel, logger }) {
    this.userModel = userModel;
    this.logger = logger;
  }

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
          service: 'UserService',
          method: 'createUser',
          error: err.message,
        },
        'Failed to create user'
      );
      throw err;
    }
  }

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
