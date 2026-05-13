import { BadRequestError } from '../../../helpers/errors/AppError.js';

export default class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body with user data
   * @param {string} req.body.name - User full name
   * @param {string} req.body.email - User email (must be unique)
   * @param {string} req.body.password - User password
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 201 on success or error via next()
   */
  async createUser(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        throw new BadRequestError('Name, email, and password are required');
      }

      const user = await this.userService.createUser({ name, email, password });
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve a specific user by ID
   * @param {Object} req - Express request object
   * @param {string} req.params.id - User ID
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 with user data or error via next()
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update user profile information
   * @param {Object} req - Express request object
   * @param {string} req.params.id - User ID
   * @param {Object} req.body - Fields to update (name, mobileNumber, details)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 with updated user or error via next()
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const allowedFields = ['name', 'mobileNumber', 'details'];
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (field in updates) {
          filteredUpdates[field] = updates[field];
        }
      });

      const user = await this.userService.updateUser(id, filteredUpdates);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a user (soft delete)
   * @param {Object} req - Express request object
   * @param {string} req.params.id - User ID
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 success or error via next()
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      await this.userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all users with pagination
   * @param {Object} req - Express request object
   * @param {number} req.query.skip - Number of users to skip (default: 0)
   * @param {number} req.query.limit - Number of users to return (default: 10)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 with paginated user list or error via next()
   */
  async listUsers(req, res, next) {
    try {
      const { skip = 0, limit = 10 } = req.query;

      const result = await this.userService.listUsers(parseInt(skip), parseInt(limit));
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
