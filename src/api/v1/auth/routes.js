import express from 'express';
import { awilixContainer } from '../../../singletons/awilix.js';
import AuthController from './auth.js';

const authRoutes = express.Router();

const authService = awilixContainer.resolve('authAuth');
const authController = new AuthController({ authService });

authRoutes.post('/register', (req, res, next) => authController.register(req, res, next));
authRoutes.post('/login', (req, res, next) => authController.login(req, res, next));
authRoutes.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
authRoutes.post('/logout', (req, res, next) => authController.logout(req, res, next));

export { authRoutes };
