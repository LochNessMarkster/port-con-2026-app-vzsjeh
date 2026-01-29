import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/speakers - Returns all speakers
  fastify.get(
    '/api/speakers',
    {
      schema: {
        description: 'Get all speakers',
        tags: ['speakers'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                title: { type: 'string' },
                company: { type: 'string' },
                bio: { type: 'string' },
                photo: { type: 'string' },
                linkedinUrl: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all speakers');
      try {
        const allSpeakers = await app.db.select().from(schema.speakers);
        app.logger.info({ count: allSpeakers.length }, 'Speakers retrieved successfully');
        return allSpeakers;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch speakers');
        throw error;
      }
    }
  );

  // GET /api/speakers/:id - Returns speaker with sessions
  fastify.get(
    '/api/speakers/:id',
    {
      schema: {
        description: 'Get speaker by ID with sessions',
        tags: ['speakers'],
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
              id: { type: 'string' },
              name: { type: 'string' },
              title: { type: 'string' },
              company: { type: 'string' },
              bio: { type: 'string' },
              photo: { type: 'string' },
              linkedinUrl: { type: 'string' },
              sessions: { type: 'array' },
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
    async (request, reply) => {
      const { id } = request.params as { id: string };
      app.logger.info({ speakerId: id }, 'Fetching speaker with sessions');

      try {
        const speaker = await app.db.query.speakers.findFirst({
          where: eq(schema.speakers.id, id),
          with: {
            sessions: {
              with: {
                session: true,
              },
            },
          },
        });

        if (!speaker) {
          app.logger.warn({ speakerId: id }, 'Speaker not found');
          return reply.status(404).send({ error: 'Speaker not found' });
        }

        app.logger.info({ speakerId: id }, 'Speaker retrieved successfully');
        return speaker;
      } catch (error) {
        app.logger.error({ err: error, speakerId: id }, 'Failed to fetch speaker');
        throw error;
      }
    }
  );
}
