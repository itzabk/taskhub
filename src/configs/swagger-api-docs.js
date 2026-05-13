import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'TaskHub - Task Management API',
      version: '1.0.0',
      description: `
# TaskHub API Documentation

TaskHub is a production-ready task management API built with Node.js, Express, MongoDB, Redis, Passport, and secure cookie-based JWT authentication.

## Key Features
- User registration and login
- Secure cookie-based JWT authentication
- Access token and refresh token stored in HTTP-only cookies
- Task management
- Subtask management
- Soft delete support
- Pagination support
- Production-ready API structure

## Authentication

TaskHub uses secure cookie-based JWT authentication.

After successful login, the server sends:

\`\`\`

- \`accessToken\` cookie
- \`refreshToken\` cookie

These cookies should be configured as:

- \`httpOnly: true\`
- \`secure: true\` in production

- \`sameSite\` based on frontend/backend domain setup

\`\`\`

Protected APIs automatically read the JWT from cookies.

You do not need to manually pass:

\`\`\`
Authorization: Bearer <token>
\`\`\`

For Swagger UI testing, first call the login API so the browser receives cookies. Then protected APIs can use those cookies automatically.
`,
      contact: {
        name: 'TaskHub Support',
        email: 'support@taskhub.com',
      },
      license: {
        name: 'ISC',
      },
    },

    servers: [
      {
        url: process.env.SWAGGER_SERVER_URL || 'http://localhost:3000/api/v1',
        description:
          process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],

    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT access token stored in a secure HTTP-only cookie',
        },
        refreshCookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'JWT refresh token stored in a secure HTTP-only cookie',
        },
      },

      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              example: 'ABK',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'abk@example.com',
            },
            mobileNumber: {
              type: 'string',
              example: '+91-9876543210',
            },
            details: {
              type: 'object',
              example: {
                profile: 'Backend Developer',
                department: 'Engineering',
              },
            },
            isDeleted: {
              type: 'boolean',
              example: false,
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

        RegisterUserRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'ABK',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'abk@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'StrongPass@123',
            },
            mobileNumber: {
              type: 'string',
              example: '+91-9876543210',
            },
            details: {
              type: 'object',
              example: {
                profile: 'Backend Developer',
              },
            },
          },
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'abk@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'StrongPass@123',
            },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example:
                'Login successful. Access token and refresh token have been set in secure HTTP-only cookies.',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },

        LogoutResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Logout successful. Authentication cookies cleared.',
            },
          },
        },

        Task: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012',
            },
            title: {
              type: 'string',
              example: 'Implement JWT Authentication',
            },
            description: {
              type: 'string',
              example: 'Add login, register, access token and refresh token flow',
            },
            userId: {
              type: 'string',
              example: '507f1f77bcf86cd799439011',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'pending',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'high',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-14T23:59:59Z',
            },
            assignedTo: {
              type: 'string',
              example: '507f1f77bcf86cd799439013',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['backend', 'auth'],
            },
            isDeleted: {
              type: 'boolean',
              example: false,
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

        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Implement JWT Authentication',
            },
            description: {
              type: 'string',
              example: 'Add login, register and token verification',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-14T23:59:59Z',
            },
            assignedTo: {
              type: 'string',
              example: '507f1f77bcf86cd799439013',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['nodejs', 'api'],
            },
          },
        },

        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Update JWT Authentication Flow',
            },
            description: {
              type: 'string',
              example: 'Improve refresh token rotation',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'in_progress',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'high',
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
            },
            assignedTo: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },

        SubTask: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014',
            },
            title: {
              type: 'string',
              example: 'Create JWT signing service',
            },
            description: {
              type: 'string',
              example: 'Create reusable token generation service',
            },
            taskId: {
              type: 'string',
              example: '507f1f77bcf86cd799439012',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              example: 'pending',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium',
            },
            estimatedHours: {
              type: 'number',
              example: 4,
            },
            actualHours: {
              type: 'number',
              example: 3.5,
            },
            isDeleted: {
              type: 'boolean',
              example: false,
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

        CreateSubTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Create JWT signing service',
            },
            description: {
              type: 'string',
              example: 'Create reusable token generation helper',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium',
            },
            estimatedHours: {
              type: 'number',
              example: 4,
            },
          },
        },

        UpdateSubTaskRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
            estimatedHours: {
              type: 'number',
            },
            actualHours: {
              type: 'number',
            },
          },
        },

        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Request completed successfully',
            },
            data: {
              type: 'object',
            },
          },
        },

        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            statusCode: {
              type: 'integer',
              example: 200,
            },
            message: {
              type: 'string',
              example: 'Records fetched successfully',
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 10,
                },
              },
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
            statusCode: {
              type: 'integer',
              example: 400,
            },
            message: {
              type: 'string',
              example: 'Something went wrong',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required',
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
            message: {
              type: 'string',
              example: 'Something went wrong',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required',
                  },
                },
              },
            },
          },
        },
      },

      responses: {
        BadRequest: {
          description: 'Bad request / validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },

        Unauthorized: {
          description: 'Unauthorized / invalid or missing authentication cookie',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                statusCode: 401,
                message: 'Unauthorized',
              },
            },
          },
        },

        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'Forbidden',
              },
            },
          },
        },

        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Resource not found',
              },
            },
          },
        },

        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                statusCode: 500,
                message: 'Internal server error',
              },
            },
          },
        },
      },
    },

    security: [
      {
        cookieAuth: [],
      },
    ],
  },

  apis: ['./src/api/v1/**/*.js'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
