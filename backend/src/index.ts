import { createApplication } from "@specific-dev/framework";
import * as appSchema from './db/schema.js';
import * as authSchema from './db/auth-schema.js';

// Import route registration functions
import { register as registerSpeakers } from './routes/speakers.js';
import { register as registerSessions } from './routes/sessions.js';
import { register as registerRooms } from './routes/rooms.js';
import { register as registerExhibitors } from './routes/exhibitors.js';
import { register as registerSponsors } from './routes/sponsors.js';
import { register as registerPorts } from './routes/ports.js';
import { register as registerNotifications } from './routes/notifications.js';
import { register as registerFavorites } from './routes/favorites.js';
import { register as registerBookmarks } from './routes/bookmarks.js';
import { register as registerAdminSetup } from './routes/admin-setup.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthDebug } from './routes/auth-debug.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Add logging hooks for authentication flow debugging
app.fastify.addHook('onRequest', async (request, reply) => {
  const isAuthEndpoint = request.url.startsWith('/api/auth/');

  if (isAuthEndpoint) {
    const { method, url } = request;
    const body = method !== 'GET' ? (request.body as any) : null;

    app.logger.info(
      {
        method,
        path: url,
        email: body?.email,
        body: method === 'POST' && url.includes('/sign-in') ? { email: body?.email } : undefined,
      },
      'Authentication request received'
    );
  }
});

app.fastify.addHook('onResponse', async (request, reply) => {
  const isAuthEndpoint = request.url.startsWith('/api/auth/');

  if (isAuthEndpoint) {
    const { method, url } = request;
    const statusCode = reply.statusCode;
    const body = method !== 'GET' ? (request.body as any) : null;

    app.logger.info(
      {
        method,
        path: url,
        statusCode,
        email: body?.email,
      },
      'Authentication response sent'
    );

    // Log session-related endpoints more verbosely
    if (url.includes('/get-session')) {
      app.logger.debug(
        {
          statusCode,
          hasSession: statusCode === 200,
        },
        'Session retrieval response'
      );
    }
  }
});

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
registerSpeakers(app, app.fastify);
registerSessions(app, app.fastify);
registerRooms(app, app.fastify);
registerExhibitors(app, app.fastify);
registerSponsors(app, app.fastify);
registerPorts(app, app.fastify);
registerNotifications(app, app.fastify);
registerFavorites(app, app.fastify);
registerBookmarks(app, app.fastify);
registerAdminSetup(app, app.fastify);
registerAdminRoutes(app);
registerAuthDebug(app, app.fastify);

await app.run();
app.logger.info('Application running');
app.logger.info(
  {
    airtableBase: 'appkKjciinTlnsbkd',
    airtableSpeakersTableId: 'tblNp1JZk4ARZZZlT',
    airtableSponsorsTableId: 'tblgWrwRvpdcVG8sB',
    airtablePortsTableId: 'tblrXosiVXKhJHYLu',
  },
  'Airtable configuration - verify table IDs are correct'
);

// Check if initial setup is needed
try {
  const users = await app.db.query.user.findMany();
  if (users.length === 0) {
    app.logger.warn(
      {
        setupUrl: 'POST /api/admin/setup/create-admin',
        statusUrl: 'GET /api/admin/setup/status',
      },
      '⚠️  NO ADMIN USERS FOUND - System needs initial setup!'
    );
    app.logger.info(
      {
        instructions: [
          '1. Send POST request to /api/admin/setup/create-admin with body:',
          '   { "email": "admin@conference.com", "password": "SecurePassword123", "name": "Admin User" }',
          '2. Or check /api/admin/setup/status for setup status',
          '3. For debugging, use /api/admin/debug/auth (development only)',
        ],
      },
      'Setup instructions'
    );
  } else {
    app.logger.info({ userCount: users.length }, 'Admin users are configured');
  }
} catch (error) {
  app.logger.error({ err: error }, 'Could not check setup status');
}
