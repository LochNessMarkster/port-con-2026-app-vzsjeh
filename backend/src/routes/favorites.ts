import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/favorites/exhibitors - Get favorited exhibitor IDs for authenticated user
  fastify.get(
    '/api/favorites/exhibitors',
    {
      schema: {
        description: 'Get list of favorited exhibitor IDs for the current user',
        tags: ['favorites'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                exhibitorId: { type: 'string' },
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

      app.logger.info({ userId }, 'Fetching favorite exhibitors');

      try {
        const favorites = await app.db.query.favoriteExhibitors.findMany({
          where: eq(schema.favoriteExhibitors.userId, userId),
        });

        const result = favorites.map((fav) => ({
          exhibitorId: fav.exhibitorId,
        }));

        app.logger.info({ userId, count: result.length }, 'Favorite exhibitors retrieved');
        return result;
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch favorite exhibitors');
        throw error;
      }
    }
  );

  // POST /api/favorites/exhibitors/:exhibitorId - Add exhibitor to favorites
  fastify.post(
    '/api/favorites/exhibitors/:exhibitorId',
    {
      schema: {
        description: 'Add an exhibitor to the current user favorites',
        tags: ['favorites'],
        params: {
          type: 'object',
          properties: {
            exhibitorId: { type: 'string' },
          },
          required: ['exhibitorId'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              exhibitorId: { type: 'string' },
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

      const { exhibitorId } = request.params as { exhibitorId: string };
      const userId = session.user.id;

      app.logger.info({ userId, exhibitorId }, 'Adding exhibitor to favorites');

      try {
        // Verify exhibitor exists
        const exhibitor = await app.db.query.exhibitors.findFirst({
          where: eq(schema.exhibitors.id, exhibitorId),
        });

        if (!exhibitor) {
          app.logger.warn({ exhibitorId }, 'Exhibitor not found');
          return reply.status(404).send({ error: 'Exhibitor not found' });
        }

        // Check if already favorited
        const existing = await app.db.query.favoriteExhibitors.findFirst({
          where: and(
            eq(schema.favoriteExhibitors.userId, userId),
            eq(schema.favoriteExhibitors.exhibitorId, exhibitorId)
          ),
        });

        if (existing) {
          app.logger.warn({ userId, exhibitorId }, 'Exhibitor already in favorites');
          return reply.status(409).send({ error: 'Exhibitor already in favorites' });
        }

        await app.db
          .insert(schema.favoriteExhibitors)
          .values({
            userId,
            exhibitorId,
          });

        app.logger.info({ userId, exhibitorId }, 'Exhibitor added to favorites');
        return reply.status(201).send({
          success: true,
          exhibitorId,
        });
      } catch (error) {
        app.logger.error({ err: error, userId, exhibitorId }, 'Failed to add exhibitor to favorites');
        throw error;
      }
    }
  );

  // DELETE /api/favorites/exhibitors/:exhibitorId - Remove exhibitor from favorites
  fastify.delete(
    '/api/favorites/exhibitors/:exhibitorId',
    {
      schema: {
        description: 'Remove an exhibitor from the current user favorites',
        tags: ['favorites'],
        params: {
          type: 'object',
          properties: {
            exhibitorId: { type: 'string' },
          },
          required: ['exhibitorId'],
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

      const { exhibitorId } = request.params as { exhibitorId: string };
      const userId = session.user.id;

      app.logger.info({ userId, exhibitorId }, 'Removing exhibitor from favorites');

      try {
        const deleted = await app.db
          .delete(schema.favoriteExhibitors)
          .where(
            and(
              eq(schema.favoriteExhibitors.userId, userId),
              eq(schema.favoriteExhibitors.exhibitorId, exhibitorId)
            )
          )
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ userId, exhibitorId }, 'Favorite not found');
          return reply.status(404).send({ error: 'Exhibitor not in favorites' });
        }

        app.logger.info({ userId, exhibitorId }, 'Exhibitor removed from favorites');
        return {
          success: true,
        };
      } catch (error) {
        app.logger.error({ err: error, userId, exhibitorId }, 'Failed to remove exhibitor from favorites');
        throw error;
      }
    }
  );
}
