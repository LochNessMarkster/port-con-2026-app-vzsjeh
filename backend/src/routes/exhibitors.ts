import type { FastifyInstance } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/exhibitors - Returns all exhibitors
  fastify.get(
    '/api/exhibitors',
    {
      schema: {
        description: 'Get all exhibitors',
        tags: ['exhibitors'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                logo: { type: 'string' },
                boothNumber: { type: 'string' },
                category: { type: 'string' },
                website: { type: 'string' },
                mapX: { type: 'integer' },
                mapY: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all exhibitors');
      try {
        const allExhibitors = await app.db.select().from(schema.exhibitors);
        app.logger.info({ count: allExhibitors.length }, 'Exhibitors retrieved successfully');
        return allExhibitors;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch exhibitors');
        throw error;
      }
    }
  );
}
