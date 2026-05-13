import { awilixContainer } from '../singletons/awilix.js';

export const authService = awilixContainer.resolve('authService');
export const taskService = awilixContainer.resolve('taskService');
export const subTaskService = awilixContainer.resolve('subTaskService');
export const userService = awilixContainer.resolve('userService');
