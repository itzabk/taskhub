import { BadRequestError, UnauthorizedError } from '../../../helpers/errors/AppError.js';

export default class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  /**
   * Register a new user account
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.name - User full name
   * @param {string} req.body.email - User email
   * @param {string} req.body.password - User password
   * @param {string} req.body.confirmPassword - Password confirmation
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 201 on success or error via next()
   */
  async register(req, res, next) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (!name || !email || !password || !confirmPassword) {
        throw new BadRequestError('Name, email, password, and confirmPassword are required');
      }

      if (password !== confirmPassword) {
        throw new BadRequestError('Passwords do not match');
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestError('Invalid email format');
      }

      const user = await this.authService.registerUser({ email, password, name });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticate user and issue JWT tokens
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body
   * @param {string} req.body.email - User email
   * @param {string} req.body.password - User password
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 with tokens and user data on success or error via next()
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const { user, accessToken, refreshToken } = await this.authService.loginUser({
        email,
        password,
      });

      res.cookie('access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
        signed: true,
      });

      res.cookie('refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        signed: true,
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Refresh expired access token using valid refresh token
   * @param {Object} req - Express request object
   * @param {Object} req.body - Request body (alternative to cookie)
   * @param {string} req.body.refreshToken - Refresh token (optional, can come from cookie)
   * @param {Object} req.signedCookies - Signed cookies from request
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 with new tokens on success or error via next()
   */
  async refresh(req, res, next) {
    try {
      const refreshToken = req.signedCookies['refresh-token'] || req.body.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshTokens(refreshToken);

      res.cookie('access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
        signed: true,
      });

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out user by clearing authentication cookies
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void} Sends 200 logout confirmation or error via next()
   */
  async logout(req, res, next) {
    try {
      res.clearCookie('access-token');
      res.clearCookie('refresh-token');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (err) {
      next(err);
    }
  }
}
