# Bookmetender Integration Guide

## Overview
The XESS system integrates with Bookmetender.com to automatically sync guest data between platforms. This allows venues to manage their guestlists across multiple systems seamlessly.

## How It Works

### 1. Connection Process
1. **Create a Guestlist** in XESS for your event
2. **Connect to Bookmetender** by providing:
   - Your Bookmetender API Key
   - The Event ID from Bookmetender
3. **Enable Sync** to allow automatic data synchronization

### 2. API Integration Workflow
```
XESS Guestlist ←→ Bookmetender API ←→ Bookmetender Event
```

### 3. Data Synchronization
- **Manual Sync**: Use the "Sync from Bookmetender" button
- **Automatic Sync**: Configure periodic syncing (coming soon)
- **Bi-directional**: Updates flow both ways between systems

## Setup Instructions

### Step 1: Get Bookmetender API Access
1. Log into your Bookmetender account
2. Navigate to Developer Settings or API section
3. Generate an API key
4. Note your Event ID for the specific event

### Step 2: Connect in XESS
1. Create or edit a guestlist in XESS
2. Click "Connect to Bookmetender"
3. Enter your API key and Event ID
4. Click "Connect"

### Step 3: Sync Data
1. Click "Sync from Bookmetender" to pull guest data
2. Review and approve synced guests
3. Use "Sync to Bookmetender" to push XESS data

## API Endpoints

### Connect to Bookmetender
```
POST /api/guestlists/{id}/bookmetender/connect
Body: {
  "apiKey": "your-bookmetender-api-key",
  "eventId": "your-event-id"
}
```

### Sync from Bookmetender
```
POST /api/guestlists/{id}/bookmetender/sync
```

### Disconnect from Bookmetender
```
DELETE /api/guestlists/{id}/bookmetender/disconnect
```

## Features

### ✅ Currently Available
- Manual connection to Bookmetender events
- One-way sync from Bookmetender to XESS
- Guest status mapping between systems
- Activity logging for all sync operations
- Visual indicators for connected guestlists

### 🚧 Coming Soon
- Automatic periodic syncing
- Bi-directional synchronization
- Real-time webhook integration
- Conflict resolution for duplicate guests
- Bulk guest management across platforms

## Data Mapping

| XESS Field | Bookmetender Field | Notes |
|------------|-------------------|-------|
| firstName | first_name | Required |
| lastName | last_name | Required |
| email | email | Optional |
| phone | phone_number | Optional |
| guestCount | party_size | Defaults to 1 |
| status | rsvp_status | mapped: confirmed→approved |

## Troubleshooting

### Connection Issues
- **Invalid API Key**: Verify your Bookmetender API key is active
- **Event Not Found**: Check the Event ID matches your Bookmetender event
- **Permission Denied**: Ensure your API key has access to the event

### Sync Issues
- **Duplicate Guests**: XESS prevents duplicate entries by name+email
- **Missing Data**: Some Bookmetender fields may not map to XESS
- **Rate Limiting**: Bookmetender may limit API requests per hour

### Support
For integration support:
1. Check the Activity Logs in XESS for detailed error messages
2. Verify your Bookmetender account permissions
3. Contact support with specific error messages

## Security Notes
- API keys are encrypted in the database
- All API communications use HTTPS
- Sync operations are logged for audit purposes
- Only authorized users can configure integrations