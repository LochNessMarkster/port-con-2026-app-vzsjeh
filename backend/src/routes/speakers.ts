import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import Airtable from 'airtable';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const AIRTABLE_BASE_ID = 'appkKjciinTlnsbkd';
const AIRTABLE_TABLE_ID = 'tblxn3Yie523MallN';
const AIRTABLE_TOKEN_FALLBACK = 'patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c';

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

  // GET /api/speakers/airtable - Fetch speakers directly from Airtable
  fastify.get(
    '/api/speakers/airtable',
    {
      schema: {
        description: 'Fetch speakers directly from Airtable',
        tags: ['speakers'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                title: { type: ['string', 'null'] },
                company: { type: ['string', 'null'] },
                bio: { type: ['string', 'null'] },
                photo: { type: ['string', 'null'] },
                linkedinUrl: { type: ['string', 'null'] },
              },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching speakers from Airtable');

      try {
        const airtableToken = process.env.AIRTABLE_TOKEN || AIRTABLE_TOKEN_FALLBACK;

        const base = new Airtable({ apiKey: airtableToken }).base(AIRTABLE_BASE_ID);

        const records: any[] = [];
        await new Promise<void>((resolve, reject) => {
          base.table(AIRTABLE_TABLE_ID)
            .select()
            .eachPage(
              (pageRecords, fetchNextPage) => {
                records.push(...pageRecords);
                fetchNextPage();
              },
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
        });

        const speakers = records.map((record) => {
          const fields = record.fields as any;
          return {
            id: record.id,
            name: fields.Name || '',
            title: fields.Title || null,
            company: fields.Company || null,
            bio: fields.Bio || null,
            photo: fields.Photo?.[0]?.url || null,
            linkedinUrl: fields.LinkedIn || null,
          };
        });

        app.logger.info({ count: speakers.length }, 'Speakers fetched from Airtable successfully');
        return speakers;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch speakers from Airtable');
        return reply.status(500).send({ error: 'Failed to fetch speakers from Airtable' });
      }
    }
  );
}
