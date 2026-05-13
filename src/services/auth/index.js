import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import { serverConfigs } from '../../configs/serverConfigs.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../helpers/errors/AppError.js';

const { JWT } = serverConfigs;

export default class AuthService {
  constructor({ userModel, logger }) {
    this.userModel = userModel;
    this.logger = logger;
    this.privateKey = fs.readFileSync(JWT.PRIVATE_KEY_PATH, { encoding: 'utf-8' });
    this.publicKey = fs.readFileSync(JWT.PUBLIC_KEY_PATH, { encoding: 'utf-8' });
  }

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

  async loginUser({ email, password }) {
    try {
      const user = await this.userModel.findByEmailWithPassword(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isPasswordValid = await this.userModel.comparePassword(password, user.password);
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

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [JWT.ALGORITHM],
      });
      return decoded;
    } catch (err) {
      this.logger.warn(
        {
          service: 'AuthService',
          method: 'verifyToken',
          error: err.message,
        },
        'Token verification failed'
      );
      throw new UnauthorizedError('Invalid token');
    }
  }

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
