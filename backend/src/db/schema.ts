import { pgTable, uuid, text, timestamp, integer, varchar, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Rooms table
export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Speakers table
export const speakers = pgTable('speakers', {
  id: uuid('id').primaryKey().defaultRandom(),
  airtableId: text('airtable_id'),
  name: text('name').notNull(),
  title: text('title'),
  company: text('company'),
  bio: text('bio'),
  photo: text('photo'),
  speakingTopic: text('speaking_topic'),
  synopsis: text('synopsis'),
  isMasterOfCeremony: boolean('is_master_of_ceremony').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 50 }),
  track: varchar('track', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Junction table for sessions and speakers (many-to-many)
export const sessionSpeakers = pgTable('session_speakers', {
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  speakerId: uuid('speaker_id').notNull().references(() => speakers.id, { onDelete: 'cascade' }),
});

// Exhibitors table
export const exhibitors = pgTable('exhibitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  logo: text('logo'),
  boothNumber: varchar('booth_number', { length: 50 }),
  category: varchar('category', { length: 100 }),
  website: text('website'),
  mapX: integer('map_x'),
  mapY: integer('map_y'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sponsors table
export const sponsors = pgTable('sponsors', {
  id: uuid('id').primaryKey().defaultRandom(),
  airtableId: text('airtable_id'),
  name: text('name').notNull(),
  description: text('description'),
  tier: varchar('tier', { length: 50 }).notNull(),
  logo: text('logo'),
  website: text('website'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ports table
export const ports = pgTable('ports', {
  id: uuid('id').primaryKey().defaultRandom(),
  airtableId: text('airtable_id').unique(),
  name: text('name').notNull(),
  link: text('link'),
  logo: text('logo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Push Tokens table
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  token: text('token').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scheduled Notifications table
export const scheduledNotifications = pgTable('scheduled_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for').notNull(),
  sent: boolean('sent').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Favorite Exhibitors table
export const favoriteExhibitors = pgTable(
  'favorite_exhibitors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    exhibitorId: uuid('exhibitor_id').notNull().references(() => exhibitors.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userExhibitorIdx: uniqueIndex('user_exhibitor_idx').on(table.userId, table.exhibitorId),
  })
);

// Session Changes table
export const sessionChanges = pgTable('session_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  changeType: varchar('change_type', { length: 50 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bookmarked Sessions table (for users to bookmark sessions they want to attend)
export const bookmarkedSessions = pgTable(
  'bookmarked_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userSessionIdx: uniqueIndex('user_session_idx').on(table.userId, table.sessionId),
  })
);

// Relations
export const roomsRelations = relations(rooms, ({ many }) => ({
  sessions: many(sessions),
}));

export const speakersRelations = relations(speakers, ({ many }) => ({
  sessions: many(sessionSpeakers),
}));

export const sessionsRelations = relations(sessions, ({ many, one }) => ({
  speakers: many(sessionSpeakers),
  room: one(rooms, {
    fields: [sessions.roomId],
    references: [rooms.id],
  }),
}));

export const sessionSpeakersRelations = relations(sessionSpeakers, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionSpeakers.sessionId],
    references: [sessions.id],
  }),
  speaker: one(speakers, {
    fields: [sessionSpeakers.speakerId],
    references: [speakers.id],
  }),
}));
