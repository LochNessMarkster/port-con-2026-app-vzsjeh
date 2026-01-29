import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import Airtable from 'airtable';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

const AIRTABLE_BASE_ID = 'appkKjciinTlnsbkd';
const AIRTABLE_VIEW_ID = 'shrDhhVoXnWHC0oWj';

export function registerAdminRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/admin/sync-airtable - Sync from Airtable
  app.fastify.post(
    '/api/admin/sync-airtable',
    {
      schema: {
        description: 'Sync conference data from Airtable',
        tags: ['admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              speakersCreated: { type: 'integer' },
              speakersUpdated: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Starting Airtable sync');

      try {
        const airtableToken = process.env.AIRTABLE_TOKEN;
        if (!airtableToken) {
          app.logger.error('AIRTABLE_TOKEN environment variable not set');
          return reply.status(500).send({ error: 'Airtable token not configured' });
        }

        const base = new Airtable({ apiKey: airtableToken }).base(AIRTABLE_BASE_ID);

        const records: any[] = [];
        await new Promise((resolve, reject) => {
          base.table(AIRTABLE_VIEW_ID)
            .select({
              view: AIRTABLE_VIEW_ID,
            })
            .eachPage(
              (pageRecords, fetchNextPage) => {
                records.push(...pageRecords);
                fetchNextPage();
              },
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(records);
                }
              }
            );
        });

        app.logger.info({ recordCount: records.length }, 'Retrieved records from Airtable');

        let speakersCreated = 0;
        let speakersUpdated = 0;

        for (const record of records) {
          const fields = record.fields as any;
          const airtableId = record.id;

          const existingSpeaker = await app.db.query.speakers.findFirst({
            where: eq(schema.speakers.airtableId, airtableId),
          });

          const speakerData = {
            airtableId,
            name: fields.Name || '',
            title: fields.Title || null,
            company: fields.Company || null,
            bio: fields.Bio || null,
            photo: fields.Photo?.[0]?.url || null,
            linkedinUrl: fields.LinkedIn || null,
          };

          if (existingSpeaker) {
            await app.db
              .update(schema.speakers)
              .set(speakerData)
              .where(eq(schema.speakers.id, existingSpeaker.id));
            speakersUpdated++;
            app.logger.debug({ speakerId: existingSpeaker.id }, 'Speaker updated');
          } else {
            const newSpeaker = await app.db
              .insert(schema.speakers)
              .values(speakerData)
              .returning();
            speakersCreated++;
            app.logger.debug({ speakerId: newSpeaker[0].id }, 'Speaker created');
          }
        }

        app.logger.info(
          { speakersCreated, speakersUpdated },
          'Airtable sync completed successfully'
        );

        return {
          message: 'Airtable sync completed successfully',
          speakersCreated,
          speakersUpdated,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to sync Airtable');
        return reply.status(500).send({ error: 'Failed to sync Airtable' });
      }
    }
  );

  // POST /api/admin/speakers - Create speaker
  app.fastify.post(
    '/api/admin/speakers',
    {
      schema: {
        description: 'Create a new speaker',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            bio: { type: 'string' },
            photo: { type: 'string' },
            linkedinUrl: { type: 'string' },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as any;
      app.logger.info({ name: body.name }, 'Creating speaker');

      try {
        const newSpeaker = await app.db
          .insert(schema.speakers)
          .values({
            name: body.name,
            title: body.title || null,
            company: body.company || null,
            bio: body.bio || null,
            photo: body.photo || null,
            linkedinUrl: body.linkedinUrl || null,
          })
          .returning();

        app.logger.info({ speakerId: newSpeaker[0].id }, 'Speaker created successfully');
        return reply.status(201).send(newSpeaker[0]);
      } catch (error) {
        app.logger.error({ err: error, name: body.name }, 'Failed to create speaker');
        throw error;
      }
    }
  );

  // PUT /api/admin/speakers/:id - Update speaker
  app.fastify.put(
    '/api/admin/speakers/:id',
    {
      schema: {
        description: 'Update a speaker',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            bio: { type: 'string' },
            photo: { type: 'string' },
            linkedinUrl: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as any;
      app.logger.info({ speakerId: id }, 'Updating speaker');

      try {
        const updated = await app.db
          .update(schema.speakers)
          .set(body)
          .where(eq(schema.speakers.id, id))
          .returning();

        if (updated.length === 0) {
          app.logger.warn({ speakerId: id }, 'Speaker not found');
          return reply.status(404).send({ error: 'Speaker not found' });
        }

        app.logger.info({ speakerId: id }, 'Speaker updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, speakerId: id }, 'Failed to update speaker');
        throw error;
      }
    }
  );

  // DELETE /api/admin/speakers/:id - Delete speaker
  app.fastify.delete(
    '/api/admin/speakers/:id',
    {
      schema: {
        description: 'Delete a speaker',
        tags: ['admin'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ speakerId: id }, 'Deleting speaker');

      try {
        const deleted = await app.db
          .delete(schema.speakers)
          .where(eq(schema.speakers.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ speakerId: id }, 'Speaker not found');
          return reply.status(404).send({ error: 'Speaker not found' });
        }

        app.logger.info({ speakerId: id }, 'Speaker deleted successfully');
        return { message: 'Speaker deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, speakerId: id }, 'Failed to delete speaker');
        throw error;
      }
    }
  );

  // POST /api/admin/sessions - Create session
  app.fastify.post(
    '/api/admin/sessions',
    {
      schema: {
        description: 'Create a new session',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            roomId: { type: 'string' },
            type: { type: 'string' },
            track: { type: 'string' },
            speakerIds: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'startTime', 'endTime'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as any;
      app.logger.info({ title: body.title }, 'Creating session');

      try {
        const newSession = await app.db
          .insert(schema.sessions)
          .values({
            title: body.title,
            description: body.description || null,
            startTime: new Date(body.startTime),
            endTime: new Date(body.endTime),
            roomId: body.roomId || null,
            type: body.type || null,
            track: body.track || null,
          })
          .returning();

        // Add speakers to session if provided
        if (body.speakerIds && body.speakerIds.length > 0) {
          for (const speakerId of body.speakerIds) {
            await app.db.insert(schema.sessionSpeakers).values({
              sessionId: newSession[0].id,
              speakerId,
            });
          }
          app.logger.info(
            { sessionId: newSession[0].id, count: body.speakerIds.length },
            'Added speakers to session'
          );
        }

        app.logger.info({ sessionId: newSession[0].id }, 'Session created successfully');
        return reply.status(201).send(newSession[0]);
      } catch (error) {
        app.logger.error({ err: error, title: body.title }, 'Failed to create session');
        throw error;
      }
    }
  );

  // PUT /api/admin/sessions/:id - Update session
  app.fastify.put(
    '/api/admin/sessions/:id',
    {
      schema: {
        description: 'Update a session',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            roomId: { type: 'string' },
            type: { type: 'string' },
            track: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as any;
      app.logger.info({ sessionId: id }, 'Updating session');

      try {
        const updateData: any = {};
        if (body.title) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.startTime) updateData.startTime = new Date(body.startTime);
        if (body.endTime) updateData.endTime = new Date(body.endTime);
        if (body.roomId !== undefined) updateData.roomId = body.roomId;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.track !== undefined) updateData.track = body.track;

        const updated = await app.db
          .update(schema.sessions)
          .set(updateData)
          .where(eq(schema.sessions.id, id))
          .returning();

        if (updated.length === 0) {
          app.logger.warn({ sessionId: id }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        app.logger.info({ sessionId: id }, 'Session updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, sessionId: id }, 'Failed to update session');
        throw error;
      }
    }
  );

  // DELETE /api/admin/sessions/:id - Delete session
  app.fastify.delete(
    '/api/admin/sessions/:id',
    {
      schema: {
        description: 'Delete a session',
        tags: ['admin'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ sessionId: id }, 'Deleting session');

      try {
        const deleted = await app.db
          .delete(schema.sessions)
          .where(eq(schema.sessions.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ sessionId: id }, 'Session not found');
          return reply.status(404).send({ error: 'Session not found' });
        }

        app.logger.info({ sessionId: id }, 'Session deleted successfully');
        return { message: 'Session deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, sessionId: id }, 'Failed to delete session');
        throw error;
      }
    }
  );

  // POST /api/admin/rooms - Create room
  app.fastify.post(
    '/api/admin/rooms',
    {
      schema: {
        description: 'Create a new room',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string' },
            capacity: { type: 'integer' },
          },
          required: ['name', 'location', 'capacity'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as any;
      app.logger.info({ name: body.name }, 'Creating room');

      try {
        const newRoom = await app.db
          .insert(schema.rooms)
          .values({
            name: body.name,
            location: body.location,
            capacity: body.capacity,
          })
          .returning();

        app.logger.info({ roomId: newRoom[0].id }, 'Room created successfully');
        return reply.status(201).send(newRoom[0]);
      } catch (error) {
        app.logger.error({ err: error, name: body.name }, 'Failed to create room');
        throw error;
      }
    }
  );

  // PUT /api/admin/rooms/:id - Update room
  app.fastify.put(
    '/api/admin/rooms/:id',
    {
      schema: {
        description: 'Update a room',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            location: { type: 'string' },
            capacity: { type: 'integer' },
          },
        },
        response: {
          200: {
            type: 'object',
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as any;
      app.logger.info({ roomId: id }, 'Updating room');

      try {
        const updated = await app.db
          .update(schema.rooms)
          .set(body)
          .where(eq(schema.rooms.id, id))
          .returning();

        if (updated.length === 0) {
          app.logger.warn({ roomId: id }, 'Room not found');
          return reply.status(404).send({ error: 'Room not found' });
        }

        app.logger.info({ roomId: id }, 'Room updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, roomId: id }, 'Failed to update room');
        throw error;
      }
    }
  );

  // DELETE /api/admin/rooms/:id - Delete room
  app.fastify.delete(
    '/api/admin/rooms/:id',
    {
      schema: {
        description: 'Delete a room',
        tags: ['admin'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ roomId: id }, 'Deleting room');

      try {
        const deleted = await app.db
          .delete(schema.rooms)
          .where(eq(schema.rooms.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ roomId: id }, 'Room not found');
          return reply.status(404).send({ error: 'Room not found' });
        }

        app.logger.info({ roomId: id }, 'Room deleted successfully');
        return { message: 'Room deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, roomId: id }, 'Failed to delete room');
        throw error;
      }
    }
  );

  // POST /api/admin/exhibitors - Create exhibitor
  app.fastify.post(
    '/api/admin/exhibitors',
    {
      schema: {
        description: 'Create a new exhibitor',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            logo: { type: 'string' },
            boothNumber: { type: 'string' },
            category: { type: 'string' },
            website: { type: 'string' },
            mapX: { type: 'integer' },
            mapY: { type: 'integer' },
          },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as any;
      app.logger.info({ name: body.name }, 'Creating exhibitor');

      try {
        const newExhibitor = await app.db
          .insert(schema.exhibitors)
          .values({
            name: body.name,
            description: body.description || null,
            logo: body.logo || null,
            boothNumber: body.boothNumber || null,
            category: body.category || null,
            website: body.website || null,
            mapX: body.mapX || null,
            mapY: body.mapY || null,
          })
          .returning();

        app.logger.info({ exhibitorId: newExhibitor[0].id }, 'Exhibitor created successfully');
        return reply.status(201).send(newExhibitor[0]);
      } catch (error) {
        app.logger.error({ err: error, name: body.name }, 'Failed to create exhibitor');
        throw error;
      }
    }
  );

  // PUT /api/admin/exhibitors/:id - Update exhibitor
  app.fastify.put(
    '/api/admin/exhibitors/:id',
    {
      schema: {
        description: 'Update an exhibitor',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
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
        response: {
          200: {
            type: 'object',
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as any;
      app.logger.info({ exhibitorId: id }, 'Updating exhibitor');

      try {
        const updated = await app.db
          .update(schema.exhibitors)
          .set(body)
          .where(eq(schema.exhibitors.id, id))
          .returning();

        if (updated.length === 0) {
          app.logger.warn({ exhibitorId: id }, 'Exhibitor not found');
          return reply.status(404).send({ error: 'Exhibitor not found' });
        }

        app.logger.info({ exhibitorId: id }, 'Exhibitor updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, exhibitorId: id }, 'Failed to update exhibitor');
        throw error;
      }
    }
  );

  // DELETE /api/admin/exhibitors/:id - Delete exhibitor
  app.fastify.delete(
    '/api/admin/exhibitors/:id',
    {
      schema: {
        description: 'Delete an exhibitor',
        tags: ['admin'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ exhibitorId: id }, 'Deleting exhibitor');

      try {
        const deleted = await app.db
          .delete(schema.exhibitors)
          .where(eq(schema.exhibitors.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ exhibitorId: id }, 'Exhibitor not found');
          return reply.status(404).send({ error: 'Exhibitor not found' });
        }

        app.logger.info({ exhibitorId: id }, 'Exhibitor deleted successfully');
        return { message: 'Exhibitor deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, exhibitorId: id }, 'Failed to delete exhibitor');
        throw error;
      }
    }
  );

  // POST /api/admin/sponsors - Create sponsor
  app.fastify.post(
    '/api/admin/sponsors',
    {
      schema: {
        description: 'Create a new sponsor',
        tags: ['admin'],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            tier: { type: 'string' },
            logo: { type: 'string' },
            website: { type: 'string' },
            displayOrder: { type: 'integer' },
          },
          required: ['name', 'tier'],
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const body = request.body as any;
      app.logger.info({ name: body.name }, 'Creating sponsor');

      try {
        const newSponsor = await app.db
          .insert(schema.sponsors)
          .values({
            name: body.name,
            description: body.description || null,
            tier: body.tier,
            logo: body.logo || null,
            website: body.website || null,
            displayOrder: body.displayOrder || 0,
          })
          .returning();

        app.logger.info({ sponsorId: newSponsor[0].id }, 'Sponsor created successfully');
        return reply.status(201).send(newSponsor[0]);
      } catch (error) {
        app.logger.error({ err: error, name: body.name }, 'Failed to create sponsor');
        throw error;
      }
    }
  );

  // PUT /api/admin/sponsors/:id - Update sponsor
  app.fastify.put(
    '/api/admin/sponsors/:id',
    {
      schema: {
        description: 'Update a sponsor',
        tags: ['admin'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            tier: { type: 'string' },
            logo: { type: 'string' },
            website: { type: 'string' },
            displayOrder: { type: 'integer' },
          },
        },
        response: {
          200: {
            type: 'object',
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      const body = request.body as any;
      app.logger.info({ sponsorId: id }, 'Updating sponsor');

      try {
        const updated = await app.db
          .update(schema.sponsors)
          .set(body)
          .where(eq(schema.sponsors.id, id))
          .returning();

        if (updated.length === 0) {
          app.logger.warn({ sponsorId: id }, 'Sponsor not found');
          return reply.status(404).send({ error: 'Sponsor not found' });
        }

        app.logger.info({ sponsorId: id }, 'Sponsor updated successfully');
        return updated[0];
      } catch (error) {
        app.logger.error({ err: error, sponsorId: id }, 'Failed to update sponsor');
        throw error;
      }
    }
  );

  // DELETE /api/admin/sponsors/:id - Delete sponsor
  app.fastify.delete(
    '/api/admin/sponsors/:id',
    {
      schema: {
        description: 'Delete a sponsor',
        tags: ['admin'],
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
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params as { id: string };
      app.logger.info({ sponsorId: id }, 'Deleting sponsor');

      try {
        const deleted = await app.db
          .delete(schema.sponsors)
          .where(eq(schema.sponsors.id, id))
          .returning();

        if (deleted.length === 0) {
          app.logger.warn({ sponsorId: id }, 'Sponsor not found');
          return reply.status(404).send({ error: 'Sponsor not found' });
        }

        app.logger.info({ sponsorId: id }, 'Sponsor deleted successfully');
        return { message: 'Sponsor deleted successfully' };
      } catch (error) {
        app.logger.error({ err: error, sponsorId: id }, 'Failed to delete sponsor');
        throw error;
      }
    }
  );
}
