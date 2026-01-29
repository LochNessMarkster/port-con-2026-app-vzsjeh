import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/sessions - Returns sessions with speakers and room
  fastify.get(
    '/api/sessions',
    {
      schema: {
        description: 'Get all sessions with speakers and room information',
        tags: ['sessions'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                type: { type: 'string' },
                track: { type: 'string' },
                room: { type: 'object' },
                speakers: { type: 'array' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all sessions');
      try {
        const allSessions = await app.db.query.sessions.findMany({
          with: {
            room: true,
            speakers: {
              with: {
                speaker: true,
              },
            },
          },
        });

        app.logger.info({ count: allSessions.length }, 'Sessions retrieved successfully');
        return allSessions;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch sessions');
        throw error;
      }
    }
  );
}
