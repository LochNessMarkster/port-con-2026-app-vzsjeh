import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

/**
 * Admin setup routes - only available when no users exist
 * Used to bootstrap the first admin user
 */
export function register(app: App, fastify: FastifyInstance) {
  // GET /api/admin/setup/status - Check if system needs initial setup
  fastify.get(
    '/api/admin/setup/status',
    {
      schema: {
        description: 'Check if the system needs initial admin setup',
        tags: ['admin-setup'],
        response: {
          200: {
            type: 'object',
            properties: {
              needsSetup: { type: 'boolean' },
              userCount: { type: 'integer' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await app.db.query.user.findMany();
        const needsSetup = users.length === 0;

        app.logger.info(
          { userCount: users.length, needsSetup },
          'Checked admin setup status'
        );

        return {
          needsSetup,
          userCount: users.length,
          message: needsSetup
            ? 'System needs initial admin setup. Use POST /api/admin/setup/create-admin to create the first user.'
            : 'System is already set up.',
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to check setup status');
        throw error;
      }
    }
  );

  // POST /api/admin/setup/create-admin - Create the first admin user (only when no users exist)
  fastify.post(
    '/api/admin/setup/create-admin',
    {
      schema: {
        description: 'Create the first admin user (only available when no users exist)',
        tags: ['admin-setup'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['email', 'password', 'name'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
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
      const body = request.body as any;

      app.logger.info({ email: body.email }, 'Attempting to create first admin user');

      try {
        // Check if users already exist
        const existingUsers = await app.db.query.user.findMany();

        if (existingUsers.length > 0) {
          app.logger.warn(
            { userCount: existingUsers.length, email: body.email },
            'Attempted to create admin user but users already exist'
          );
          return reply.status(403).send({
            error: 'System is already set up. Contact your administrator to create additional users.',
          });
        }

        // Validate input
        if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
          return reply.status(400).send({
            error: 'Valid email is required',
          });
        }

        if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
          return reply.status(400).send({
            error: 'Password must be at least 8 characters',
          });
        }

        if (!body.name || typeof body.name !== 'string' || body.name.length === 0) {
          return reply.status(400).send({
            error: 'Name is required',
          });
        }

        // Use Better Auth API directly to create the admin user
        // Call the auth endpoint through the fastify server
        const signUpResponse = await fastify.inject({
          method: 'POST',
          url: '/api/auth/sign-up/email',
          payload: {
            email: body.email,
            password: body.password,
            name: body.name,
          },
        });

        if (signUpResponse.statusCode !== 200 && signUpResponse.statusCode !== 201) {
          let errorMessage = 'Failed to create user';
          try {
            const errorData = JSON.parse(signUpResponse.body);
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          } catch {
            // Could not parse error response, use default message
          }

          app.logger.error(
            { email: body.email, statusCode: signUpResponse.statusCode, body: signUpResponse.body },
            'Failed to create admin user via Better Auth'
          );

          return reply.status(400).send({
            error: errorMessage,
          });
        }

        let result: any;
        try {
          result = JSON.parse(signUpResponse.body);
        } catch {
          app.logger.error(
            { email: body.email, body: signUpResponse.body },
            'Could not parse Better Auth response'
          );

          return reply.status(400).send({
            error: 'Failed to parse auth response',
          });
        }

        if (!result.user) {
          app.logger.error(
            { email: body.email, response: result },
            'Better Auth did not return user after signup'
          );

          return reply.status(400).send({
            error: 'Failed to create user: no user returned',
          });
        }

        app.logger.info(
          { userId: result.user.id, email: body.email },
          'First admin user created successfully'
        );

        return reply.status(201).send({
          success: true,
          message: 'Admin user created successfully',
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
        });
      } catch (error) {
        app.logger.error(
          { err: error, email: body.email },
          'Error creating admin user'
        );

        return reply.status(400).send({
          error: error instanceof Error ? error.message : 'Failed to create admin user',
        });
      }
    }
  );

  // GET /api/admin/debug/auth - Debug authentication issues (development only)
  fastify.get(
    '/api/admin/debug/auth',
    {
      schema: {
        description: 'Debug authentication configuration (development only)',
        tags: ['admin-setup'],
        response: {
          200: {
            type: 'object',
            properties: {
              authEnabled: { type: 'boolean' },
              userCount: { type: 'integer' },
              sampleUsers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    createdAt: { type: 'string' },
                  },
                },
              },
              authEndpointsAvailable: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Only available in development
      if (process.env.NODE_ENV === 'production') {
        return reply.status(403).send({ error: 'Not available in production' });
      }

      try {
        const users = await app.db.query.user.findMany();
        const sampleUsers = users.slice(0, 3).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
        }));

        app.logger.info(
          { userCount: users.length },
          'Retrieved auth debug information'
        );

        return {
          authEnabled: true,
          userCount: users.length,
          sampleUsers,
          authEndpointsAvailable: [
            '/api/auth/sign-up/email',
            '/api/auth/sign-in/email',
            '/api/auth/sign-out',
            '/api/auth/get-session',
            '/api/auth/change-password',
            '/api/auth/reset-password',
          ],
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to get auth debug info');
        throw error;
      }
    }
  );
}
