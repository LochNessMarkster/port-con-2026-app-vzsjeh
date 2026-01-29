import type { FastifyInstance } from 'fastify';
import { asc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/sponsors - Returns sponsors sorted by display_order
  fastify.get(
    '/api/sponsors',
    {
      schema: {
        description: 'Get all sponsors sorted by display order',
        tags: ['sponsors'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                tier: { type: 'string' },
                logo: { type: 'string' },
                website: { type: 'string' },
                displayOrder: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all sponsors');
      try {
        const allSponsors = await app.db
          .select()
          .from(schema.sponsors)
          .orderBy(asc(schema.sponsors.displayOrder));

        app.logger.info({ count: allSponsors.length }, 'Sponsors retrieved successfully');
        return allSponsors;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch sponsors');
        throw error;
      }
    }
  );
}
