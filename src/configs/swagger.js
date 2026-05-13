import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskHub API',
      version: '1.0.0',
      description: 'A comprehensive task management API with user authentication, task tracking, and subtask management',
      contact: {
        name: 'API Support',
        email: 'support@taskhub.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access-token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'name'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            mobileNumber: {
              type: 'string',
              description: 'User mobile number',
            },
            details: {
              type: 'object',
              description: 'Additional user details',
            },
            isDeleted: {
              type: 'boolean',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Task: {
          type: 'object',
          required: ['title', 'userId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Task ID',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            description: {
              type: 'string',
              description: 'Detailed task description',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              default: 'pending',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              default: 'medium',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
            },
            isDeleted: {
              type: 'boolean',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        SubTask: {
          type: 'object',
          required: ['title', 'taskId'],
          properties: {
            _id: {
              type: 'string',
              description: 'SubTask ID',
            },
            title: {
              type: 'string',
              description: 'SubTask title',
            },
            completed: {
              type: 'boolean',
              default: false,
            },
            taskId: {
              type: 'string',
              description: 'Parent task ID',
            },
            isDeleted: {
              type: 'boolean',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/api/v1/**/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
