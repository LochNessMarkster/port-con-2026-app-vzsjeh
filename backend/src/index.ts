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
import { registerAdminRoutes } from './routes/admin.js';

// Combine schemas
const schema = { ...appSchema, ...authSchema };

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

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
registerAdminRoutes(app);

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
