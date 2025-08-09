# Meeting IDs Implementation

## Overview
This implementation adds automatic generation of unique meeting IDs when therapists select their availability. Each available session now gets a unique meeting ID stored in the `meeting_link` column of the `available_sessions` table.

## Changes Made

### 1. Updated `therapistService.ts`
- **Import**: Added import for `generateMeetingId` from `meetingLinks.ts`
- **Interface**: Updated `AvailableSession` interface to include `meeting_link?: string | null`
- **Function**: Modified `createAvailableSession` to generate and store meeting IDs
- **Normalization**: Updated `normalizeAvailable` function to include meeting IDs in returned data

### 2. Updated `sessionService.ts`
- **Interface**: Updated `AvailableSession` interface to include `meeting_link: string | null`
- **Mapping**: Updated session mapping functions to include meeting IDs in returned data

### 3. Updated `therapist-booking/page.tsx`
- **Security**: Added "Reveal" button to show/hide meeting IDs for better security
- **Display**: Meeting IDs are hidden by default and only shown when "Reveal" is clicked
- **Format**: Display meeting IDs in monospace font for better readability
- **Icons**: Added Eye/EyeOff icons for better UX

### 4. Created Test Page
- **File**: `src/app/test-meeting-links/page.tsx`
- **Purpose**: Test meeting ID generation functionality
- **Features**: 
  - Test creating available sessions
  - Test meeting ID generation
  - Display generated meeting IDs with reveal functionality

## How It Works

### Meeting ID Generation
When a therapist sets their availability:

1. The `createAvailableSession` function is called
2. A unique slot ID is generated using date, time, and wallet address
3. The `generateMeetingId` function creates a unique meeting ID using:
   - Slot ID
   - Therapist wallet address
   - Session date
   - Session start time
   - Timestamp for additional uniqueness
4. The meeting ID is stored in the `meeting_link` column
5. The meeting ID is returned with the session data

### Meeting ID Format
The current implementation generates 24-character alphanumeric meeting IDs:
```
A1B2C3D4E5F6G7H8I9J0K1L2
```

The ID is generated using:
- Multiple hash functions for better uniqueness
- Timestamp for additional randomness
- Uppercase alphanumeric characters

### Database Schema
The `available_sessions` table should have a `meeting_link` column (stores meeting IDs):
```sql
meeting_link TEXT NULL
```

## Usage

### For Therapists
1. Go to `/therapist-booking` page
2. Set availability using the calendar interface
3. Meeting IDs are automatically generated but hidden by default
4. Click "Reveal" button to show the meeting ID for each session
5. Click "Hide" to conceal the meeting ID again

### For Testing
1. Go to `/test-meeting-links` page
2. Enter test parameters (therapist wallet, date, time, price)
3. Click "Create Available Session" to test the full flow
4. Click "Test Meeting ID Generation" to test just the ID generation
5. Use "Reveal" button to show generated meeting IDs

## Files Modified
- `src/lib/therapistService.ts`
- `src/lib/sessionService.ts`
- `src/app/therapist-booking/page.tsx`
- `src/app/test-meeting-links/page.tsx` (new)

## Files Referenced
- `src/lib/meetingLinks.ts` (existing - contains `generateMeetingId` function)

## Next Steps
1. Test the implementation using the test page
2. Verify meeting IDs are generated correctly in the database
3. Consider implementing meeting ID validation/security
4. Consider adding meeting ID expiration logic
5. Consider integrating with actual video conferencing platforms
6. Consider adding copy-to-clipboard functionality for revealed meeting IDs
