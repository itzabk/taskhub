import jwt from 'jsonwebtoken';

import fs from 'node:fs';

import { serverConfigs } from '../../configs/serverConfigs.js';

import { ConflictError, NotFoundError, UnauthorizedError } from '../../helpers/errors/AppError.js';

import { LOGGER_FILES } from '../../constants/logger.js';

const { MAIN_THREAD } = LOGGER_FILES;

const { JWT } = serverConfigs;

export default class AuthService {
  constructor({ userModel, logger }) {
    this.userModel = userModel;
    this.logger = logger;
    this.privateKey = fs.readFileSync(JWT.PRIVATE_KEY_PATH, { encoding: 'utf-8' });
    this.publicKey = fs.readFileSync(JWT.PUBLIC_KEY_PATH, { encoding: 'utf-8' });
  }

  /**
   * Register a new user account
   * @param {Object} userData - Registration data
   * @param {string} userData.email - User email (must be unique)
   * @param {string} userData.password - User password (will be hashed)
   * @param {string} userData.name - User full name
   * @returns {Promise<Object>} Registered user object
   * @throws {ConflictError} If email already exists
   */
  async registerUser({ email, password, name }) {
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
          service: 'AuthService',
          method: 'registerUser',
          email,
          error: err.message,
        },
        'Failed to register user'
      );
      throw err;
    }
  }

  /**
   * Authenticate user and generate JWT tokens
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} User object with accessToken and refreshToken
   * @throws {UnauthorizedError} If credentials invalid
   */
  async loginUser({ email, password }) {
    try {
      const user = await this.userModel.findByEmailWithPassword(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await user.comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const accessToken = jwt.sign({ userId: user._id, email: user.email }, this.privateKey, {
        expiresIn: '15m',
        algorithm: JWT.ALGORITHM,
      });

      const refreshToken = jwt.sign({ userId: user._id, email: user.email }, this.privateKey, {
        expiresIn: '7d',
        algorithm: JWT.ALGORITHM,
      });

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'AuthService',
          method: 'loginUser',
          email,
          error: err.message,
        },
        'Failed to login user'
      );
      throw err;
    }
  }

  /**
   * Verify and decode JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload (userId, email)
   * @throws {UnauthorizedError} If token invalid or expired
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [JWT.ALGORITHM],
      });
      return decoded;
    } catch (err) {
      this.logger.warn(
        {
          file: MAIN_THREAD,
          service: 'AuthService',
          method: 'verifyToken',
          error: err.message,
        },
        'Token verification failed'
      );
      throw new UnauthorizedError('Invalid token');
    }
  }

  /**
   * Generate new access token using refresh token
   * @param {string} refreshToken - Valid refresh token
   * @returns {Promise<Object>} New accessToken and refreshToken
   * @throws {UnauthorizedError} If refresh token invalid or user not found
   */
  async refreshTokens(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);

      const user = await this.userModel.findById(decoded.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const newAccessToken = jwt.sign({ userId: user._id, email: user.email }, this.privateKey, {
        expiresIn: '15m',
        algorithm: JWT.ALGORITHM,
      });

      return {
        accessToken: newAccessToken,
        refreshToken,
      };
    } catch (err) {
      this.logger.error(
        {
          file: MAIN_THREAD,
          service: 'AuthService',
          method: 'refreshTokens',
          error: err.message,
        },
        'Failed to refresh tokens'
      );
      throw err;
    }
  }
}
