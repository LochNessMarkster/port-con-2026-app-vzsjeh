# Port of the Future Conference 2026

A React Native + Expo 54 mobile and web app for the Port of the Future Conference 2026 in Houston, TX (March 24-25, 2026).

## Features

### Attendee App
- **Home Screen**: Conference overview, navigation, stats, upcoming sessions, featured sponsors/exhibitors
- **Schedule**: Full conference program with filtering by session type (Keynote, Panel, Networking)
- **Speakers**: Browse speaker profiles with photos, bios, and session information
- **Exhibitors**: View exhibitor listings with booth numbers and contact information
- **Sponsors**: Organized by tiers (Platinum, Gold, Silver, Bronze)
- **My Schedule**: Bookmark and manage your personal conference schedule

### Admin Panel (Web Only)
- **Dashboard**: Central management hub with Airtable sync functionality
- **Sponsors Management**: CRUD operations for conference sponsors
- **Exhibitors Management**: Manage exhibitor listings and booth assignments
- **Speakers Management**: Manage speaker profiles and information
- **Sessions Management**: Create and manage conference sessions
- **Rooms Management**: Manage venue rooms and locations

## Airtable Integration

The app integrates with Airtable to sync conference data (speakers, sessions, etc.).

### Airtable Configuration
- **Base ID**: `appkKjciinTlnsbkd`
- **Speakers View**: `shrDhhVoXnWHC0oWj`

### How to Sync Data from Airtable

1. **Access Admin Panel**: Navigate to `/admin` (web only)
2. **Login**: Use admin credentials
3. **Sync Data**: Click "Sync Now" button in the Airtable Integration section
4. **View Results**: The system will fetch the latest data from Airtable and update the database

### Backend API Endpoints

#### Public Endpoints (No Auth Required)
- `GET /api/speakers` - Get all speakers
- `GET /api/speakers/:id` - Get speaker details with sessions
- `GET /api/sessions` - Get all sessions with speakers and rooms
- `GET /api/exhibitors` - Get all exhibitors
- `GET /api/sponsors` - Get all sponsors (sorted by tier)
- `GET /api/rooms` - Get all rooms

#### Admin Endpoints (Auth Required)
- `POST /api/admin/sync-airtable` - Sync data from Airtable
  - Body: `{ table: 'speakers' | 'sessions' | 'all' }`
- CRUD endpoints for speakers, sessions, exhibitors, sponsors, and rooms

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on specific platform
npm run ios
npm run android
npm run web
```

## Environment Variables

The backend requires the following environment variables:
- `AIRTABLE_API_KEY` - Your Airtable API key
- `AIRTABLE_BASE_ID` - Set to `appkKjciinTlnsbkd`

## Tech Stack

- **Frontend**: React Native, Expo 54, TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Auto-generated API with database
- **Authentication**: Better Auth (email + OAuth)
- **Styling**: Port of Houston branding (#AE2B35)

## Platform Support

- ✅ iOS
- ✅ Android
- ✅ Web (Admin panel is web-only)

---

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.
