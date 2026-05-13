import { serverConfigs } from '../../../configs/serverConfigs.js';
import { BadRequestError, UnauthorizedError } from '../../../helpers/errors/AppError.js';

export default class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

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
