
# Testing Guide - Conference Management System

## Quick Start

### 1. Start the Development Server

```bash
npm start
```

Then press `w` to open in web browser (recommended for admin features).

### 2. Test Public Features (No Login Required)

#### View Conference Data
1. Open the app in your browser
2. Navigate through the tabs:
   - **Speakers** - View all speakers with photos and bios
   - **Schedule** - Browse sessions by day, filter by type
   - **Exhibitors** - See exhibitor booths and categories
   - **Sponsors** - View sponsors by tier (Platinum, Gold, Silver, Bronze)
   - **Ports** - View participating ports with logos and links (NEW!)

#### Fetch Speakers from Airtable (NEW!)
1. Go to **Speakers** tab
2. Click "Fetch from Airtable" button in the header
3. Wait for loading indicator
4. Should see success message with count
5. Speakers list updates with fresh Airtable data
6. **Note:** This fetches data directly from Airtable without admin access

#### View Speaker Details
1. Go to **Speakers** tab
2. Click on any speaker
3. Should show:
   - Speaker photo, name, title, company
   - Biography
   - LinkedIn link (if available)
   - Sessions they're speaking at

#### Search and Filter
1. **Speakers:** Use search bar to find speakers by name, company, or title
2. **Schedule:** Filter by session type (Keynote, Panel, Networking)
3. **Exhibitors:** Filter by category
4. **Schedule:** Switch between Day 1 and Day 2

### 3. Test Admin Features (Login Required)

#### Access Admin Panel
1. Navigate to `/admin/login` in your browser
2. You'll see the admin login screen

#### Create Admin Account
Since this is a new deployment, create an account:

**Option A: Email/Password**
1. Enter email: `admin@portcon.com`
2. Enter password: `PortCon2026!`
3. Click "Sign In"
4. If account doesn't exist, it will be created automatically

**Option B: OAuth (if configured)**
1. Click "Sign in with Google"
2. Complete OAuth flow
3. You'll be redirected to the dashboard

#### Test Airtable Integration

**Option 1: Direct Fetch (Public - No Admin Required)**
1. Go to Speakers page in the public app
2. Click "Fetch from Airtable" button
3. Wait for loading indicator
4. Should see success message: "✓ Loaded X speakers from Airtable"
5. Speakers list updates immediately
6. Check console logs for API call details
7. **Note:** Data is displayed but NOT saved to database

**Option 2: Sync to Database (Admin Only)**
1. Login to Admin Dashboard
2. Find the "Airtable Integration" card
3. Note the configuration details:
   - Base ID: appkKjciinTlnsbkd
   - Table ID: tblxn3Yie523MallN
4. Click "Sync to Database" button
5. Watch for sync progress message
6. Should see: "Sync completed successfully! (Created: X, Updated: Y)"
7. Check console for detailed sync results
8. Verify data appears in Speakers management page
9. **Note:** Data is permanently saved to database

**Verify Airtable Configuration:**
1. Click "Learn more about Airtable integration" link
2. Review the Airtable Info page
3. Check field mapping documentation
4. Verify Base ID and Table ID match your Airtable setup

#### Test Speakers Management

**Create Speaker:**
1. Click "Speakers" card on dashboard
2. Click "Add Speaker" button
3. Fill in the form:
   - Name: `John Doe`
   - Title: `Chief Technology Officer`
   - Company: `Tech Innovations Inc.`
   - Bio: `Leading technology expert with 20 years of experience...`
   - Photo URL: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400`
   - LinkedIn URL: `https://linkedin.com/in/johndoe`
4. Click "Save"
5. Verify speaker appears in the list

**Edit Speaker:**
1. Click the edit icon (pencil) next to a speaker
2. Modify any field
3. Click "Save"
4. Verify changes are reflected

**Delete Speaker:**
1. Click the delete icon (trash) next to a speaker
2. Confirm deletion in the modal
3. Verify speaker is removed from the list

#### Test Sessions Management

**Create Session:**
1. Click "Sessions" card on dashboard
2. Click "Add Session" button
3. Fill in the form:
   - Title: `The Future of Maritime Technology`
   - Description: `Exploring cutting-edge innovations...`
   - Start Time: `2026-03-24T09:00`
   - End Time: `2026-03-24T10:00`
   - Room: Select from dropdown
   - Type: Select `keynote`, `panel`, or `networking`
   - Track: `Technology`
   - Speakers: Click to select multiple speakers
4. Click "Save"
5. Verify session appears in the list

**Edit Session:**
1. Click the edit icon next to a session
2. Modify fields (e.g., change time, add/remove speakers)
3. Click "Save"
4. Verify changes are reflected

**Delete Session:**
1. Click the delete icon next to a session
2. Confirm deletion
3. Verify session is removed

#### Test Rooms Management

**Create Room:**
1. Click "Rooms" card on dashboard
2. Click "Add Room" button
3. Fill in:
   - Room Name: `Innovation Lab`
   - Location: `Level 3`
   - Capacity: `100`
4. Click "Save"

**Edit/Delete Room:**
- Follow same pattern as speakers

#### Test Exhibitors Management

**Create Exhibitor:**
1. Click "Exhibitors" card on dashboard
2. Click "Add Exhibitor" button
3. Fill in:
   - Name: `Maritime Tech Solutions`
   - Description: `Leading provider of port automation...`
   - Logo URL: `https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200`
   - Booth Number: `A101`
   - Category: `Technology`
   - Website: `https://maritimetech.example.com`
   - Map X: `100`
   - Map Y: `150`
4. Click "Save"

**Edit/Delete Exhibitor:**
- Follow same pattern as speakers

#### Test Sponsors Management

**Create Sponsor:**
1. Click "Sponsors" card on dashboard
2. Click "Add Sponsor" button
3. Fill in:
   - Name: `Port of Houston Authority`
   - Description: `Proud host of the conference...`
   - Tier: Select `platinum`, `gold`, `silver`, or `bronze`
   - Logo URL: `https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=300`
   - Website: `https://portofhouston.com`
   - Display Order: `1`
4. Click "Save"

**Edit/Delete Sponsor:**
- Follow same pattern as speakers

#### Test Ports Management (NEW!)

**Create Port:**
1. Click "Ports" card on dashboard
2. Click "Add Port" button
3. Fill in:
   - Name: `Port of Houston`
   - Link: `https://portofhouston.com`
   - Logo URL: `https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300`
4. Click "Save"
5. Verify port appears in the list

**Edit Port:**
1. Click the edit icon (pencil) next to a port
2. Modify any field (e.g., change link or logo)
3. Click "Save"
4. Verify changes are reflected

**Delete Port:**
1. Click the delete icon (trash) next to a port
2. Confirm deletion in the modal
3. Verify port is removed from the list

**View Ports in Public App:**
1. Navigate to the **Ports** tab in the public app
2. Verify ports display with:
   - Port name
   - Port logo (if provided)
   - "Visit Website" button (if link provided)
3. Click "Visit Website" to test external links

#### Test Airtable Sync with Ports (NEW!)

**Sync All Data from Airtable:**
1. Login to Admin Dashboard
2. Click "View Integration Guide" in the Airtable Integration card
3. Review the updated configuration:
   - Speakers Table: tblNp1JZk4ARZZZlT
   - Sponsors Table: tblgWrwRvpdcVG8sB
   - Ports Table: tblrXosiVXKhJHYLu
4. Click "Sync from Airtable" button at the top
5. Wait for sync to complete
6. Should see success modal with counts:
   - Speakers: X created, Y updated
   - Sponsors: X created, Y updated
   - Ports: X created, Y updated
7. Verify data appears in respective management pages

**Check Field Mapping:**
1. Click "Check Field Mapping" button
2. Click "Check Airtable Fields"
3. Review results for:
   - Speakers table fields
   - Ports table fields
4. Verify field names match expected mapping
5. Review sample records

### 4. Test Data Persistence

1. Create some data (speakers, sessions, etc.)
2. Refresh the browser
3. Verify data persists
4. Navigate to the public app tabs
5. Verify new data appears in the conference app

### 5. Test Error Handling

#### Network Error Simulation
1. Disconnect from internet
2. Try to create/edit/delete an item
3. Should see error message
4. Reconnect to internet
5. Try again - should work

#### Invalid Data
1. Try to create a speaker without a name
2. Try to create a session without required fields
3. Should see validation errors

### 6. Test Authentication Flow

#### Logout
1. Click "Sign Out" button on dashboard
2. Should redirect to login screen
3. Try to access `/admin/dashboard` directly
4. Should redirect back to login

#### Session Persistence
1. Login to admin panel
2. Refresh the browser
3. Should remain logged in
4. Should not redirect to login

### 7. Test Mobile Responsiveness

#### Admin Panel (Web Only)
1. Try to access admin panel on mobile
2. Should see message: "Admin panel is only available on web"

#### Public App (Mobile Friendly)
1. Open app on mobile device or resize browser
2. All tabs should work properly
3. Cards should stack vertically
4. Touch interactions should work

## Expected Results

### Public Features
- ✅ All data loads from backend
- ✅ **NEW!** Fetch speakers directly from Airtable
- ✅ **NEW!** Ports display with logos and links
- ✅ Search and filters work
- ✅ Speaker details show correctly
- ✅ Sessions display with speakers and rooms
- ✅ Exhibitors show booth numbers and categories
- ✅ Sponsors display by tier

### Admin Features
- ✅ Login works with email/password
- ✅ Protected routes redirect to login
- ✅ CRUD operations work for all entities
- ✅ **NEW!** Ports management (create, edit, delete)
- ✅ Confirmation modals appear before delete
- ✅ Forms validate required fields
- ✅ Data persists after refresh
- ✅ **NEW!** Airtable sync includes speakers, sponsors, and ports
- ✅ **NEW!** Airtable direct fetch works (no auth required)
- ✅ **NEW!** Field mapping checker for speakers and ports

### Error Handling
- ✅ Network errors show user-friendly messages
- ✅ Invalid data shows validation errors
- ✅ Failed requests don't crash the app
- ✅ Console logs help with debugging

## Troubleshooting

### "Backend URL not configured"
- Check `app.json` has `extra.backendUrl` set
- Restart the dev server after changing `app.json`

### "Authentication token not found"
- Login again
- Check browser console for auth errors
- Clear browser storage and login again

### "Failed to fetch data"
- Check backend URL is accessible
- Check network connection
- Check browser console for CORS errors

### Data not updating
- Refresh the page
- Check console for API errors
- Verify backend is running

### Airtable Fetch/Sync Issues
- **"Error fetching from Airtable"**
  - Check backend logs for Airtable API errors
  - Verify Airtable token is configured in backend environment
  - Confirm Base ID and Table ID are correct
  - Try the "Fetch from Airtable" button on Speakers page to test connection
  
- **"No speakers found in Airtable"**
  - Verify the Airtable table has records
  - Check that table ID is correct (tblxn3Yie523MallN)
  - Ensure Airtable fields match expected names (Name, Title, Company, Bio, Photo, LinkedIn)
  
- **Sync vs. Direct Fetch Confusion**
  - **Direct Fetch:** Public endpoint, no auth, data NOT saved to database
  - **Sync to Database:** Admin only, requires auth, data saved permanently
  - Use Direct Fetch for testing, Sync for production data

## Sample Test Data

Use these values for quick testing:

### Speaker
```
Name: Sarah Johnson
Title: Director of Operations
Company: Global Shipping Alliance
Bio: Expert in maritime logistics with 15 years of experience
Photo: https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400
LinkedIn: https://linkedin.com/in/sarahjohnson
```

### Session
```
Title: Sustainable Shipping Practices
Description: Exploring eco-friendly solutions for modern ports
Start: 2026-03-24T14:00
End: 2026-03-24T15:30
Type: Panel
Track: Sustainability
```

### Exhibitor
```
Name: Green Shipping Co.
Description: Sustainable shipping solutions and carbon-neutral logistics
Logo: https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200
Booth: B205
Category: Sustainability
Website: https://greenshipping.example.com
```

### Sponsor
```
Name: Maritime Innovation Fund
Description: Supporting the future of maritime technology
Tier: Gold
Logo: https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300
Website: https://maritimeinnovation.com
Display Order: 2
```

### Port (NEW!)
```
Name: Port of Long Beach
Link: https://polb.com
Logo: https://images.unsplash.com/photo-1605648916319-cf082f7524a1?w=300
```

## Success Criteria

You've successfully tested the integration when:

1. ✅ You can view all conference data in the public app
2. ✅ **NEW!** You can view ports with logos and links
3. ✅ **NEW!** You can fetch speakers from Airtable without admin access
4. ✅ You can login to the admin panel
5. ✅ **NEW!** You can sync speakers, sponsors, and ports from Airtable
6. ✅ You can create, edit, and delete speakers
7. ✅ You can create, edit, and delete sessions
8. ✅ You can create, edit, and delete rooms
9. ✅ You can create, edit, and delete exhibitors
10. ✅ You can create, edit, and delete sponsors
11. ✅ **NEW!** You can create, edit, and delete ports
12. ✅ Changes in admin panel appear in the public app
13. ✅ Data persists after browser refresh
14. ✅ Error messages appear for invalid operations
15. ✅ Airtable integration works (both direct fetch and sync)
16. ✅ **NEW!** Field mapping checker shows correct Airtable fields

## Next Steps

After successful testing:
1. Deploy to production
2. Configure Airtable API key for sync
3. Set up OAuth providers (Google, Apple, GitHub)
4. Add real conference data
5. Share admin credentials with conference organizers

Happy testing! 🎉
