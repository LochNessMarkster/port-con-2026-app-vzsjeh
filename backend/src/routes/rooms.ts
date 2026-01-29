import type { FastifyInstance } from 'fastify';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/rooms - Returns all rooms
  fastify.get(
    '/api/rooms',
    {
      schema: {
        description: 'Get all conference rooms',
        tags: ['rooms'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                location: { type: 'string' },
                capacity: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all rooms');
      try {
        const allRooms = await app.db.select().from(schema.rooms);
        app.logger.info({ count: allRooms.length }, 'Rooms retrieved successfully');
        return allRooms;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch rooms');
        throw error;
      }
    }
  );
}
