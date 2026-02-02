import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/bookmarks/sessions - Get bookmarked session IDs for authenticated user
  fastify.get(
    '/api/bookmarks/sessions',
    {
      schema: {
        description: 'Get list of bookmarked session IDs for the current user',
        tags: ['bookmarks'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                sessionId: { type: 'string' },
              },
            },
          },
          401: {
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

      const userId = session.user.id;

      app.logger.info({ userId }, 'Fetching bookmarked sessions');

      try {
        const bookmarks = await app.db.query.bookmarkedSessions.findMany({
          where: eq(schema.bookmarkedSessions.userId, userId),
        });

        const result = bookmarks.map((bookmark) => ({
          sessionId: bookmark.sessionId,
        }));

        app.logger.info({ userId, count: result.length }, 'Bookmarked sessions retrieved');
        return result;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch bookmarked sessions');
        throw error;
      }
    }
  );

  // POST /api/bookmarks/sessions/:sessionId - Add session to bookmarks
  fastify.post(
    '/api/bookmarks/sessions/:sessionId',
    {
      schema: {
        description: 'Add a session to the current user bookmarks',
        tags: ['bookmarks'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              sessionId: { type: 'string' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          409: {
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

      const { sessionId } = request.params as { sessionId: string };
      const userId = session.user.id;

      app.logger.info({ userId, sessionId }, 'Adding session to bookmarks');

      try {
        // Verify session exists
        const sessionRecord = await app.db.query.sessions.findFirst({
          where: eq(schema.sessions.id, sessionId),
        });

        if (!sessionRecord) {
          app.logger.warn({ sessionId }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        // Check if already bookmarked
        const existing = await app.db.query.bookmarkedSessions.findFirst({
          where: and(
            eq(schema.bookmarkedSessions.userId, userId),
            eq(schema.bookmarkedSessions.sessionId, sessionId)
          ),
        });

        if (existing) {
          app.logger.warn({ userId, sessionId }, 'Session already bookmarked');
          return reply.status(409).send({ error: 'Session already bookmarked' });
        }

        await app.db
          .insert(schema.bookmarkedSessions)
          .values({
            userId,
            sessionId,
          });

        app.logger.info({ userId, sessionId }, 'Session added to bookmarks');
        return reply.status(201).send({
          success: true,
          sessionId,
        });
      } catch (error) {
        app.logger.error({ err: error, userId, sessionId }, 'Failed to add session to bookmarks');
        throw error;
      }
    }
  );

  // DELETE /api/bookmarks/sessions/:sessionId - Remove session from bookmarks
  fastify.delete(
    '/api/bookmarks/sessions/:sessionId',
    {
      schema: {
        description: 'Remove a session from the current user bookmarks',
        tags: ['bookmarks'],
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
          required: ['sessionId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' },
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

      const { sessionId } = request.params as { sessionId: string };
      const userId = session.user.id;

      app.logger.info({ userId, sessionId }, 'Removing session from bookmarks');

      try {
        const deleted = await app.db
          .delete(schema.bookmarkedSessions)
          .where(
            and(
              eq(schema.bookmarkedSessions.userId, userId),
              eq(schema.bookmarkedSessions.sessionId, sessionId)
            )
          )
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ userId, sessionId }, 'Bookmark not found');
          return reply.status(404).send({ error: 'Session not in bookmarks' });
        }

        app.logger.info({ userId, sessionId }, 'Session removed from bookmarks');
        return {
          success: true,
        };
      } catch (error) {
        app.logger.error({ err: error, userId, sessionId }, 'Failed to remove session from bookmarks');
        throw error;
      }
    }
  );
}
