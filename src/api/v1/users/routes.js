import express from 'express';
import { awilixContainer } from '../../../singletons/awilix.js';
import UserController from './users.js';

const userRoutes = express.Router();

const userService = awilixContainer.resolve('userUser');
const userController = new UserController({ userService });

userRoutes.post('/', (req, res, next) => userController.createUser(req, res, next));
userRoutes.get('/', (req, res, next) => userController.listUsers(req, res, next));
userRoutes.get('/:id', (req, res, next) => userController.getUserById(req, res, next));
userRoutes.put('/:id', (req, res, next) => userController.updateUser(req, res, next));
userRoutes.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export { userRoutes };
