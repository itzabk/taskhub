# API Quick Reference & Testing Guide

## Setup & Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Ensure MongoDB and Redis are running before starting
```

---

## Authentication Flow

### 1. Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 2. Login User
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Note:** Tokens are also set in httpOnly cookies

---

### 3. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGc..."
  }'
```

---

### 4. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json"
```

---

## Task Management (Protected Routes)

**All task endpoints require JWT authentication:**
```bash
-H "Authorization: Bearer {accessToken}"
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design database schema",
    "description": "Create MongoDB models",
    "priority": "high",
    "dueDate": "2026-06-15"
  }'
```

---

### Get User's Tasks
```bash
curl -X GET "http://localhost:3000/api/v1/tasks?skip=0&limit=10" \
  -H "Authorization: Bearer {accessToken}"
```

---

### Get Single Task
```bash
curl -X GET http://localhost:3000/api/v1/tasks/{taskId} \
  -H "Authorization: Bearer {accessToken}"
```

---

### Update Task
```bash
curl -X PUT http://localhost:3000/api/v1/tasks/{taskId} \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "priority": "medium",
    "dueDate": "2026-06-20"
  }'
```

**Updatable fields:**
- title
- description
- status (pending | in_progress | completed)
- priority (low | medium | high)
- dueDate

---

### Delete Task
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/{taskId} \
  -H "Authorization: Bearer {accessToken}"
```

---

## SubTask Management (Protected Routes)

### Create SubTask
```bash
curl -X POST http://localhost:3000/api/v1/tasks/{taskId}/subtasks \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Create user schema",
    "taskId": "{taskId}"
  }'
```

---

### Get SubTasks for Task
```bash
curl -X GET "http://localhost:3000/api/v1/tasks/{taskId}/subtasks?skip=0&limit=10" \
  -H "Authorization: Bearer {accessToken}"
```

---

### Get Single SubTask
```bash
curl -X GET http://localhost:3000/api/v1/subtasks/{subTaskId} \
  -H "Authorization: Bearer {accessToken}"
```

---

### Update SubTask
```bash
curl -X PUT http://localhost:3000/api/v1/subtasks/{subTaskId} \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Design user model",
    "completed": true
  }'
```

---

### Delete SubTask
```bash
curl -X DELETE http://localhost:3000/api/v1/subtasks/{subTaskId} \
  -H "Authorization: Bearer {accessToken}"
```

---

## User Management

### Create User (Public)
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'
```

---

### Get All Users
```bash
curl -X GET "http://localhost:3000/api/v1/users?skip=0&limit=10"
```

---

### Get User by ID
```bash
curl -X GET http://localhost:3000/api/v1/users/{userId}
```

---

### Update User
```bash
curl -X PUT http://localhost:3000/api/v1/users/{userId} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "mobileNumber": "+1234567890"
  }'
```

---

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/v1/users/{userId}
```

---

## Testing in Postman

1. **Create Environment Variable:**
   - `baseUrl`: http://localhost:3000
   - `accessToken`: (will be set from login response)

2. **Pre-request Script for Protected Routes:**
```javascript
// Automatically use accessToken from previous login response
if (pm.response.code === 200 && pm.response.json().data.accessToken) {
  pm.environment.set("accessToken", pm.response.json().data.accessToken);
}
```

3. **Set Authorization Header:**
   - Type: Bearer Token
   - Token: {{accessToken}}

---

## Error Response Examples

### Bad Request (400)
```json
{
  "success": false,
  "message": "Task title is required",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid email or password",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Task not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Conflict (409)
```json
{
  "success": false,
  "message": "User with this email already exists",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Important Headers

### Required for Protected Endpoints
```
Authorization: Bearer {accessToken}
```

### Optional
```
X-Request-ID: custom-request-id  # Tracked in response
Content-Type: application/json
```

---

## Testing Workflow

```
1. Register user → Get user data
2. Login → Get accessToken & refreshToken
3. Use accessToken to create task
4. List tasks to verify
5. Create subtasks for the task
6. Update task status
7. Update subtask completion
8. Delete subtask
9. Delete task
10. Logout
```

---

## Common Issues & Solutions

### 401 Unauthorized
- Ensure accessToken is included in Authorization header
- Token may have expired (use refresh endpoint)
- Check token format: `Bearer {token}`

### 404 Not Found
- Verify resource ID is correct
- Check if resource was soft-deleted
- Ensure you're using correct API path

### 409 Conflict
- Email already exists when registering
- Use unique email for new registrations

### Connection Refused
- Ensure server is running (npm run dev)
- Check MongoDB and Redis are running
- Verify port 3000 is available

---

## Performance Tips

- Use pagination (skip/limit) for large datasets
- Cache accessToken client-side
- Implement request debouncing for updates
- Use conditional requests with ETag (future enhancement)

---

**Last Updated:** 2026-05-12
**Status:** Ready for testing and deployment
