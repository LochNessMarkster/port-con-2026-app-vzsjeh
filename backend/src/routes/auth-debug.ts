/**
 * Authentication debugging routes
 * Helps diagnose authentication issues in development
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as authSchema from '../db/auth-schema.js';
import type { App } from '../index.js';

export function registerAuthDebug(app: App, fastify: FastifyInstance) {
  // GET /api/admin/debug/check-user - Check if user exists
  fastify.get(
    '/api/admin/debug/check-user',
    {
      schema: {
        description: 'Debug endpoint: Check if a user exists by email (development only)',
        tags: ['admin-debug'],
        querystring: {
          type: 'object',
          properties: {
            email: { type: 'string' },
          },
          required: ['email'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              found: { type: 'boolean' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  emailVerified: { type: 'boolean' },
                  createdAt: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Only available in development
      if (process.env.NODE_ENV === 'production') {
        app.logger.warn('Attempted to access debug endpoint in production');
        return reply.status(403).send({ error: 'Not available in production' });
      }

      const query = request.query as any;
      const { email } = query;

      app.logger.info({ email }, 'Debug: Checking if user exists');

      try {
        const user = await app.db.query.user.findFirst({
          where: eq(authSchema.user.email, email),
        });

        if (!user) {
          app.logger.info({ email }, 'Debug: User not found');
          return {
            found: false,
            user: null,
            message: `No user found with email: ${email}`,
          };
        }

        app.logger.info(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt?.toISOString(),
          },
          'Debug: User found'
        );

        return {
          found: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt?.toISOString(),
          },
          message: `User found: ${user.email}`,
        };
      } catch (error) {
        app.logger.error({ err: error, email }, 'Debug: Error checking user');
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to check user',
        });
      }
    }
  );

  // GET /api/admin/debug/auth-flow - Check authentication flow status
  fastify.get(
    '/api/admin/debug/auth-flow',
    {
      schema: {
        description: 'Debug endpoint: Check authentication flow configuration (development only)',
        tags: ['admin-debug'],
        response: {
          200: {
            type: 'object',
            properties: {
              authEnabled: { type: 'boolean' },
              totalUsers: { type: 'integer' },
              authEndpoints: {
                type: 'array',
                items: { type: 'string' },
              },
              debugInfo: { type: 'object' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Only available in development
      if (process.env.NODE_ENV === 'production') {
        app.logger.warn('Attempted to access debug endpoint in production');
        return reply.status(403).send({ error: 'Not available in production' });
      }

      app.logger.info('Debug: Checking auth flow configuration');

      try {
        const users = await app.db.query.user.findMany();

        app.logger.info(
          { totalUsers: users.length },
          'Debug: Auth flow status'
        );

        return {
          authEnabled: true,
          totalUsers: users.length,
          authEndpoints: [
            'POST /api/auth/sign-up/email - Register with email/password',
            'POST /api/auth/sign-in/email - Sign in with email/password',
            'POST /api/auth/sign-out - Sign out',
            'GET /api/auth/get-session - Get current session',
            'POST /api/auth/change-password - Change password',
            'POST /api/auth/reset-password - Request password reset',
          ],
          debugInfo: {
            usersInDatabase: users.length,
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Debug: Error checking auth flow');
        return reply.status(500).send({
          error: error instanceof Error ? error.message : 'Failed to check auth flow',
        });
      }
    }
  );
}
