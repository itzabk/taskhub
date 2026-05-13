export default class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  async createUser(req, res, next) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        const error = new Error('Name, email, and password are required');
        error.statusCode = 400;
        throw error;
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
