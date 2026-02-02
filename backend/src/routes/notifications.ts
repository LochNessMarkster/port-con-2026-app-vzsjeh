import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/notifications/register - Register push token
  fastify.post(
    '/api/notifications/register',
    {
      schema: {
        description: 'Register a push notification token',
        tags: ['notifications'],
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            platform: { type: 'string' },
          },
          required: ['token', 'platform'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              token: { type: 'string' },
              platform: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get user from session/auth
      const session = await app.requireAuth()(request, reply);
      if (!session) return;

      const body = request.body as any;
      const userId = session.user.id;

      app.logger.info({ userId, platform: body.platform }, 'Registering push token');

      try {
        // Upsert push token
        const existing = await app.db.query.pushTokens.findFirst({
          where: eq(schema.pushTokens.userId, userId),
        });

        if (existing) {
          const updated = await app.db
            .update(schema.pushTokens)
            .set({
              token: body.token,
              platform: body.platform,
              updatedAt: new Date(),
            })
            .where(eq(schema.pushTokens.userId, userId))
            .returning();

          app.logger.info({ userId }, 'Push token updated');
          return reply.status(201).send(updated[0]);
        } else {
          const newToken = await app.db
            .insert(schema.pushTokens)
            .values({
              userId,
              token: body.token,
              platform: body.platform,
            })
            .returning();

          app.logger.info({ userId }, 'Push token registered');
          return reply.status(201).send(newToken[0]);
        }
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to register push token');
        throw error;
      }
    }
  );

  // POST /api/notifications/schedule - Schedule notification
  fastify.post(
    '/api/notifications/schedule',
    {
      schema: {
        description: 'Schedule a push notification for a session',
        tags: ['notifications'],
        body: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
            minutesBefore: { type: 'integer' },
          },
          required: ['sessionId', 'minutesBefore'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              sessionId: { type: 'string' },
              scheduledFor: { type: 'string' },
              sent: { type: 'boolean' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await app.requireAuth()(request, reply);
      if (!session) return;

      const body = request.body as any;
      const userId = session.user.id;

      app.logger.info({ userId, sessionId: body.sessionId }, 'Scheduling notification');

      try {
        // Verify session exists
        const sessionRecord = await app.db.query.sessions.findFirst({
          where: eq(schema.sessions.id, body.sessionId),
        });

        if (!sessionRecord) {
          app.logger.warn({ sessionId: body.sessionId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        // Calculate scheduled time
        const scheduledFor = new Date(
          sessionRecord.startTime.getTime() - body.minutesBefore * 60 * 1000
        );

        const newNotification = await app.db
          .insert(schema.scheduledNotifications)
          .values({
            userId,
            sessionId: body.sessionId,
            scheduledFor,
          })
          .returning();

        app.logger.info(
          { userId, sessionId: body.sessionId },
          'Notification scheduled successfully'
        );
        return reply.status(201).send(newNotification[0]);
      } catch (error) {
        app.logger.error({ err: error, userId, sessionId: body.sessionId }, 'Failed to schedule notification');
        throw error;
      }
    }
  );

  // GET /api/notifications/scheduled - Get scheduled notifications for user
  fastify.get(
    '/api/notifications/scheduled',
    {
      schema: {
        description: 'Get scheduled notifications for current user',
        tags: ['notifications'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                sessionId: { type: 'string' },
                scheduledFor: { type: 'string' },
                sent: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await app.requireAuth()(request, reply);
      if (!session) return;

      const userId = session.user.id;

      app.logger.info({ userId }, 'Fetching scheduled notifications');

      try {
        const notifications = await app.db.query.scheduledNotifications.findMany({
          where: eq(schema.scheduledNotifications.userId, userId),
        });

        app.logger.info({ userId, count: notifications.length }, 'Scheduled notifications retrieved');
        return notifications;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch scheduled notifications');
        throw error;
      }
    }
  );

  // DELETE /api/notifications/scheduled/:id - Delete scheduled notification
  fastify.delete(
    '/api/notifications/scheduled/:id',
    {
      schema: {
        description: 'Delete a scheduled notification',
        tags: ['notifications'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await app.requireAuth()(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const userId = session.user.id;

      app.logger.info({ userId, notificationId: id }, 'Deleting scheduled notification');

      try {
        // Verify ownership
        const notification = await app.db.query.scheduledNotifications.findFirst({
          where: and(
            eq(schema.scheduledNotifications.id, id),
            eq(schema.scheduledNotifications.userId, userId)
          ),
        });

        if (!notification) {
          app.logger.warn({ userId, notificationId: id }, 'Notification not found');
          return reply.status(404).send({ error: 'Notification not found' });
        }

        await app.db
          .delete(schema.scheduledNotifications)
          .where(eq(schema.scheduledNotifications.id, id));

        app.logger.info({ userId, notificationId: id }, 'Notification deleted successfully');
        return { message: 'Notification deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, userId, notificationId: id }, 'Failed to delete notification');
        throw error;
      }
    }
  );
}
