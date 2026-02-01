import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import Airtable from 'airtable';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const AIRTABLE_BASE_ID = 'appkKjciinTlnsbkd';
const AIRTABLE_PORTS_TABLE_ID = 'tblrXosiVXKhJHYLu';
const AIRTABLE_TOKEN_FALLBACK = 'patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c';

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/ports - Returns all ports
  fastify.get(
    '/api/ports',
    {
      schema: {
        description: 'Get all ports',
        tags: ['ports'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                link: { type: ['string', 'null'] },
                logo: { type: ['string', 'null'] },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching all ports');
      try {
        const allPorts = await app.db.select().from(schema.ports);
        app.logger.info({ count: allPorts.length }, 'Ports retrieved successfully');
        return allPorts;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ports');
        throw error;
      }
    }
  );

  // GET /api/ports/airtable - Fetch ports directly from Airtable
  fastify.get(
    '/api/ports/airtable',
    {
      schema: {
        description: 'Fetch ports directly from Airtable',
        tags: ['ports'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                link: { type: ['string', 'null'] },
                logo: { type: ['string', 'null'] },
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
      app.logger.info('Fetching ports from Airtable');

      try {
        const airtableToken = process.env.AIRTABLE_TOKEN || AIRTABLE_TOKEN_FALLBACK;

        const base = new Airtable({ apiKey: airtableToken }).base(AIRTABLE_BASE_ID);

        const records: any[] = [];
        await new Promise<void>((resolve, reject) => {
          base.table(AIRTABLE_PORTS_TABLE_ID)
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

        app.logger.info(
          { tableId: AIRTABLE_PORTS_TABLE_ID },
          'Fetching ports from Airtable table'
        );

        // Log the field names from the first record for debugging
        if (records.length > 0) {
          const firstRecord = records[0].fields as any;
          const fieldKeys = Object.keys(firstRecord);
          app.logger.info(
            { fieldKeys, firstRecordId: records[0].id },
            'Airtable record field names found'
          );
        }

        const ports = records.map((record, index) => {
          const fields = record.fields as any;

          // Use exact Airtable field names for port data
          const name = fields['Port Name'] || '';
          const link = fields['Port Link'] || null;
          const logoUrl = fields['Logo Graphic']?.[0]?.url || null;

          // Log first few records to show what fields are being extracted
          if (index < 2) {
            app.logger.debug(
              {
                recordId: record.id,
                extractedData: {
                  name,
                  link,
                  logoUrl,
                },
              },
              `Extracted port data for record ${index + 1}`
            );
          }

          return {
            id: record.id,
            name,
            link,
            logo: logoUrl,
          };
        });

        app.logger.info(
          { count: ports.length, tableId: AIRTABLE_PORTS_TABLE_ID },
          'Ports fetched from Airtable successfully'
        );
        return ports;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ports from Airtable');
        return reply.status(500).send({ error: 'Failed to fetch ports from Airtable' });
      }
    }
  );
}
