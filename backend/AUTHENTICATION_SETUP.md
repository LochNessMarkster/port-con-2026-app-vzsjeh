# Authentication Setup Guide

This guide explains how to set up authentication and create admin users for the Conference Management System.

## Overview

The system uses **Better Auth** for authentication, which supports:
- Email/password authentication
- Session management
- OAuth providers (Google, GitHub, Apple)
- Password reset functionality

## Initial Setup

When the system starts for the first time with no users, you'll see a warning in the logs:

```
⚠️  NO ADMIN USERS FOUND - System needs initial setup!
```

### Option 1: Create Admin User via API (Recommended)

#### Check Setup Status

First, check if the system needs setup:

```bash
curl -X GET http://localhost:3000/api/admin/setup/status
```

Response:
```json
{
  "needsSetup": true,
  "userCount": 0,
  "message": "System needs initial admin setup. Use POST /api/admin/setup/create-admin to create the first user."
}
```

#### Create First Admin User

Send a POST request to create the first admin user:

```bash
curl -X POST http://localhost:3000/api/admin/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@conference.com",
    "password": "MySecurePassword123",
    "name": "Admin User"
  }'
```

**Password Requirements:**
- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, and special characters

Response:
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "user_123xyz",
    "email": "admin@conference.com",
    "name": "Admin User"
  }
}
```

### Option 2: Sign Up via Auth Endpoint

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@conference.com",
    "password": "MySecurePassword123",
    "name": "Admin User"
  }'
```

## Admin Sign In

### Sign In with Email/Password

Once an admin user is created, sign in using:

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@conference.com",
    "password": "MySecurePassword123"
  }'
```

Response:
```json
{
  "user": {
    "id": "user_123xyz",
    "email": "admin@conference.com",
    "name": "Admin User",
    "emailVerified": false,
    "image": null,
    "createdAt": "2026-03-24T10:00:00Z",
    "updatedAt": "2026-03-24T10:00:00Z"
  },
  "session": {
    "id": "session_abc123",
    "expiresAt": "2026-04-07T10:00:00Z",
    "token": "auth_token_here",
    "createdAt": "2026-03-24T10:00:00Z",
    "updatedAt": "2026-03-24T10:00:00Z",
    "ipAddress": "127.0.0.1",
    "userAgent": "curl/7.68.0"
  }
}
```

## Authentication Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register new user |
| POST | `/api/auth/sign-in/email` | Sign in with email/password |
| POST | `/api/auth/request-password-reset` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/admin/setup/status` | Check if setup is needed |
| POST | `/api/admin/setup/create-admin` | Create first admin user (only if no users exist) |

### Protected Endpoints (Auth Required)

These endpoints require a valid session token sent in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/protected-endpoint \
  -H "Authorization: Bearer <session-token>"
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/get-session` | Get current user session |
| POST | `/api/auth/sign-out` | Sign out user |
| POST | `/api/auth/change-password` | Change user password |
| POST | `/api/auth/send-verification-email` | Send email verification |
| GET | `/api/speakers` | Get all speakers |
| GET | `/api/sessions` | Get all sessions |
| POST | `/api/admin/*` | All admin endpoints |

## Troubleshooting

### 400 Bad Request on Sign Up

**Possible causes:**
- Email already registered
- Password too short (must be 8+ characters)
- Missing required fields

**Solution:** Check the error message and verify your input.

### 401 Unauthorized on Sign In

**Possible causes:**
- Incorrect email or password
- User account doesn't exist
- Session expired

**Solution:**
1. Verify email is correct
2. Verify password is correct
3. Create the user if it doesn't exist via sign-up endpoint

### Cannot Create Admin User

**Possible causes:**
- Users already exist (can only create first admin via setup endpoint)
- Application not running
- Database not connected

**Solution:**
1. Check `/api/admin/setup/status` to see current user count
2. Verify application is running
3. Check database connection in logs

## Development Debugging

In development mode, you can access debug information:

```bash
curl -X GET http://localhost:3000/api/admin/debug/auth
```

Response (development only):
```json
{
  "authEnabled": true,
  "userCount": 1,
  "sampleUsers": [
    {
      "id": "user_123xyz",
      "email": "admin@conference.com",
      "name": "Admin User",
      "createdAt": "2026-03-24T10:00:00Z"
    }
  ],
  "authEndpointsAvailable": [
    "/api/auth/sign-up/email",
    "/api/auth/sign-in/email",
    "/api/auth/sign-out",
    "/api/auth/get-session",
    "/api/auth/change-password",
    "/api/auth/reset-password"
  ]
}
```

## Session Management

### Get Current Session

```bash
curl -X GET http://localhost:3000/api/auth/get-session \
  -H "Authorization: Bearer <session-token>"
```

### Sign Out

```bash
curl -X POST http://localhost:3000/api/auth/sign-out \
  -H "Authorization: Bearer <session-token>"
```

## Password Reset Flow

### 1. Request Reset

```bash
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@conference.com"}'
```

### 2. Reset Password

After receiving the reset token (via email or callback):

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_from_email",
    "password": "NewSecurePassword123"
  }'
```

## Best Practices

1. **Strong Passwords**: Use 12+ character passwords with mixed case, numbers, and special characters
2. **Email Verification**: Enable email verification for additional security
3. **Session Timeout**: Sessions expire after a set period (check Better Auth docs)
4. **HTTPS Only**: Always use HTTPS in production for authentication
5. **Secure Storage**: Store session tokens securely on the client side
6. **Regular Audits**: Check `/api/admin/debug/auth` periodically to review users

## Additional Resources

- Better Auth Documentation: https://better-auth.com/docs
- API Reference: Check `/api/auth/open-api/generate-schema` for OpenAPI specification
- Interactive Docs: Visit `/api/auth/reference` for interactive API documentation
