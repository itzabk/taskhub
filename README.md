# TaskHub - Task Management Platform

![Node.js](https://img.shields.io/badge/Node.js-%3E=20.0.0-green)
![Express](https://img.shields.io/badge/Express-5.2.1-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-9.5.0-green)
![Redis](https://img.shields.io/badge/Redis-5.10.1-red)
![License](https://img.shields.io/badge/License-ISC-blue)

TaskHub is an enterprise-grade task management and collaboration platform designed to streamline workflow automation, enhance team productivity, and provide comprehensive task tracking with advanced features including real-time updates, role-based access control, and detailed analytics.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Error Handling](#error-handling)
- [Logging & Monitoring](#logging--monitoring)
- [Performance Optimization](#performance-optimization)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [Support](#support)

## Features

### Core Capabilities

- **Task Management**: Create, update, delete, and organize tasks with full lifecycle management
- **Subtask Support**: Break down complex tasks into manageable subtasks with dependency tracking
- **User Management**: Comprehensive user administration with role-based permissions
- **Authentication**: JWT-based authentication with OAuth2 support (Google, LinkedIn)
- **Real-time Updates**: WebSocket support for real-time task synchronization
- **Caching Layer**: Redis-powered caching for optimized performance

### Advanced Features

- **Rate Limiting**: Distributed rate limiting to prevent abuse
- **Data Migration**: Built-in migration system using migrate-mongo
- **OpenTelemetry Integration**: Comprehensive observability and tracing
- **Compression**: Gzip compression for API responses
- **CORS Support**: Secure cross-origin resource sharing
- **Helmet Security**: Industry-standard security headers
- **Structured Logging**: Pino-based JSON logging with context

## Tech Stack

### Backend

- **Runtime**: Node.js (≥20.0.0)
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB 9.5.0
- **Cache**: Redis 5.10.1
- **Authentication**: Passport.js with JWT & OAuth2
- **Logging**: Pino 10.3.1
- **API Documentation**: Swagger/OpenAPI 3.0.0
- **Containerization**: Docker & Docker Compose

### DevOps & Monitoring

- **Observability**: OpenTelemetry (Traces, Metrics, Logs)
- **Version Control**: Git with Husky pre-commit hooks
- **Code Quality**: ESLint
- **Commit Linting**: Commitlint
- **Development**: Nodemon for hot-reloading

### Dependencies Summary

- **Express**: Web framework
- **Mongoose**: MongoDB ODM
- **IORedis**: Redis client
- **Awilix**: IoC container
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **Axios**: HTTP client
- **Nodemailer**: Email service
- **Swagger JSDoc**: API documentation generation

## Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **MongoDB**: 5.0+ (local or cloud instance)
- **Redis**: 6.0+ (local or cloud instance)
- **Docker & Docker Compose**: For containerized deployment
- **Git**: For version control

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/itzabk/taskhub.git
cd taskhub
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

Copy .env from .env.example and set your fields.

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start with hot-reloading on `http://localhost:3000`.

### Production Mode

```bash
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

#### Starting the Application with Docker Scripts

**Windows:**

```bash
.\scripts\docker-startup.bat
```

**Linux/macOS:**

```bash
bash scripts/docker-startup.sh
```

## API Documentation

### Swagger UI

Once the application is running, access the interactive Swagger documentation:

```
http://localhost:3000/api-docs
```

### Base URL

```
http://localhost:3000/api/v1
```

### API Endpoints Overview

#### Authentication Routes

- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login with email and password
- `POST /auth/oauth/google` - Google OAuth2 authentication
- `POST /auth/oauth/linkedin` - LinkedIn OAuth2 authentication
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - User logout

#### User Management Routes

- `POST /users` - Create a new user (admin only)
- `GET /users` - List all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user account (soft delete)

#### Task Management Routes

- `POST /tasks` - Create a new task
- `GET /tasks` - List user's tasks with pagination
- `GET /tasks/admin/all` - List all tasks (admin only)
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (soft delete)

#### Subtask Management Routes

- `POST /tasks/:taskId/subtasks` - Create subtask
- `GET /tasks/:taskId/subtasks` - List task's subtasks
- `GET /tasks/:taskId/subtasks/:id` - Get subtask details
- `PUT /tasks/:taskId/subtasks/:id` - Update subtask
- `DELETE /tasks/:taskId/subtasks/:id` - Delete subtask

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  password: String (hashed with bcrypt),
  mobileNumber: String,
  details: {
    profile: String,
    avatar: String,
    department: String
  },
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  userId: ObjectId (reference to User),
  status: String (enum: 'pending', 'in_progress', 'completed'),
  priority: String (enum: 'low', 'medium', 'high'),
  dueDate: Date,
  tags: [String],
  assignedTo: ObjectId (reference to User),
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### SubTask Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  taskId: ObjectId (reference to Task),
  status: String (enum: 'pending', 'in_progress', 'completed'),
  priority: String (enum: 'low', 'medium', 'high'),
  estimatedHours: Number,
  actualHours: Number,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Project Structure

```
taskhub/
├── src/
│   ├── api/
│   │   ├── routes.js              # Main API router
│   │   └── v1/
│   │       ├── routes.js          # V1 routes aggregator
│   │       ├── auth/              # Authentication routes
│   │       ├── users/             # User management routes
│   │       ├── tasks/             # Task management routes
│   │       └── subtasks/          # Subtask management routes
│   ├── configs/
│   │   ├── serverConfigs.js       # Server configuration
│   │   ├── swagger-api-docs.js             # Swagger/OpenAPI config
│   │   └── migrate-mongo-config.js
│   ├── constants/
│   │   ├── index.js               # Application constants
│   │   ├── logger.js              # Logger constants
│   │   ├── migration.js           # Migration constants
│   │   └── redis.js               # Redis constants
│   ├── events/
│   │   ├── redisPublisher.js      # Redis pub/sub publisher
│   │   └── redisSubscriber.js     # Redis pub/sub subscriber
│   ├── helpers/
│   │   ├── auth/                  # Authentication utilities
│   │   ├── errors/                # Custom error classes
│   │   ├── mongoPlugins/          # MongoDB plugins
│   │   ├── pino/                  # Logging utilities
│   │   └── utils/                 # General utilities
│   ├── middlewares/
│   │   └── authentication.js      # JWT authentication middleware
│   ├── migrations/                # Database migration files
│   ├── models/
│   │   ├── user/                  # User model and schema
│   │   ├── task/                  # Task model and schema
│   │   └── subTask/               # Subtask model and schema
│   ├── orchestrators/
│   │   ├── migrationOrchestrator.js
│   │   └── shutdownOrchestrator.js
│   ├── scripts/
│   │   ├── luaScripts/            # Redis Lua scripts
│   │   └── index.js
│   ├── services/
│   │   ├── auth/                  # Authentication service
│   │   ├── user/                  # User service
│   │   ├── task/                  # Task service
│   │   └── subTask/               # Subtask service
│   ├── singletons/
│   │   ├── awilix.js              # IoC container
│   │   ├── mongoDb.js             # MongoDB connection
│   │   └── redis.js               # Redis connection
│   ├── app.js                     # Express app setup
│   ├── express.js                 # Express configuration
│   ├── index.js                   # Application entry point
│   └── migration.js               # Migration runner
├── scripts/
│   ├── docker-startup.bat
│   └── docker-startup.sh
├── logs/                          # Application logs
├── .env                           # Environment variables
├── docker-compose.yml             # Docker Compose config
├── Dockerfile                     # Docker image config
├── package.json
├── README.md
└── tracer.js                      # OpenTelemetry tracer setup
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2026-05-14T10:30:00Z"
}
```

### HTTP Status Codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 200  | Success                          |
| 201  | Created                          |
| 400  | Bad Request                      |
| 401  | Unauthorized                     |
| 403  | Forbidden                        |
| 404  | Not Found                        |
| 409  | Conflict                         |
| 429  | Too Many Requests (Rate Limited) |
| 500  | Internal Server Error            |
| 503  | Service Unavailable              |

## Logging & Monitoring

### Structured Logging with Pino

The application uses Pino for structured JSON logging with full context tracking.

**Log Levels:**

- `trace` - tracing functionalities in app
- `debug` - Detailed information for debugging
- `info` - General informational messages
- `warn` - Warning messages for potentially problematic situations
- `error` - Error messages for error events

**View Logs:**

```bash
# Development logs
docker-compose logs -f app

# Production logs
tail -f logs/app1/v1/application.log | jq
```

### OpenTelemetry Integration

Comprehensive observability with automatic instrumentation:

- **Traces**: Distributed tracing of request flows
- **Metrics**: Performance metrics collection
- **Logs**: Structured log collection

**Configuration:** `otel-taskhub-logs-config.yaml`

## Performance Optimization

### Caching Strategy

- **Redis Caching**: In-memory cache for frequently accessed data
- **Cache TTL**: Configurable time-to-live for cached items
- **Cache Invalidation**: Smart invalidation on data updates

### Database Optimization

- **Indexing**: Optimized MongoDB indexes on frequently queried fields
- **Pagination**: Cursor-based pagination for large datasets
- **Query Optimization**: Lean queries to return only required fields

### Response Compression

- **Gzip Compression**: Automatic compression of responses > 1KB
- **Reduced Bandwidth**: Typically 60-80% reduction in response size

### Rate Limiting

- **Request Throttling**: Distributed rate limiting to prevent abuse
- **Window-Based**: Configurable time windows and request limits
- **Per-IP Limiting**: Individual client rate limits

## Security Features

### Input Validation & Sanitization

- Request body validation using custom validators
- XSS protection and input sanitization
- SQL injection prevention (NoSQL injection protection)

### Password Security

- Bcrypt hashing with configurable salt rounds
- Secure password reset flow
- Password strength requirements

### CORS Configuration

- Whitelist-based origin validation
- Credential-based request handling

### Security Headers

- **Helmet Integration**: Industry-standard security headers
- CSP (Content Security Policy)
- X-Frame-Options protection
- X-XSS-Protection
- Strict-Transport-Security (HSTS)

### Data Protection

- Soft deletes for data retention
- Audit logging for sensitive operations
- Encrypted sensitive fields

## Contributing

### Development Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes and Commit**

   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

   **Commit Format:** Follow [Conventional Commits](https://www.conventionalcommits.org/)
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `perf:` Performance improvements
   - `test:` Test additions/updates

3. **Push Changes**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Provide clear description of changes
   - Link related issues
   - Request review from maintainers

### Code Quality

The project uses:

- **ESLint**: Code linting and style enforcement
- **Husky**: Git hooks for pre-commit checks
- **Commitlint**: Commit message validation

### Running Tests

```bash
npm test
```

## Deployment

### Production Checklist

- [ ] Environment variables configured for production
- [ ] Database backups enabled
- [ ] Redis persistence configured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting thresholds adjusted
- [ ] Monitoring and alerting configured
- [ ] Log aggregation setup
- [ ] Database migrations executed

### Scaling Considerations

- **Horizontal Scaling**: Stateless API design enables load balancing
- **Caching Strategy**: Redis cluster for distributed cache
- **Database**: MongoDB sharding for horizontal data partition
- **CDN**: Use CDN for static assets
- **Queue System**: Consider job queue for long-running tasks

## Support

### Documentation

- [API Documentation](http://localhost:3000/api-docs) - Swagger UI

### Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Start a discussion for questions
- **Email**: support@taskhub.com
- **Slack**: Join our community Slack channel

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Authors

- **itz_abk** - Project development

## Acknowledgments

- Express.js community
- MongoDB ecosystem
- Redis team
- OpenTelemetry contributors
