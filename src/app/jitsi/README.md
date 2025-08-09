# Jitsi Video Conferencing Setup

This implementation provides a complete Jitsi video conferencing solution using Jitsi as a Service (JaaS).

## Prerequisites

1. **Register at Jitsi**: Go to https://jaas.8x8.vc/ and create an account
2. **Get API Keys**: Navigate to https://jaas.8x8.vc/#/apikeys and generate an API key pair

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Jitsi Configuration
NEXT_PUBLIC_JITSI_APP_ID=your-app-id-here
JITSI_APP_ID=your-app-id-here
JITSI_KID=your-api-key-id-here
JITSI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----"
```

## How to Get Your Configuration Values

### 1. App ID
- Go to https://jaas.8x8.vc/#/apikeys
- Your App ID is displayed at the top of the page

### 2. API Key ID (KID)
- In the API Keys section, click "Add API Key"
- Generate an API key pair
- Copy the "API Key ID" - this is your KID

### 3. Private Key
- When you generate the API key pair, download the private key file
- Copy the entire content of the private key file
- Paste it into the JITSI_PRIVATE_KEY environment variable
- Make sure to keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines

## Features

- **JWT Authentication**: Secure token-based authentication
- **Room Management**: Create and join custom rooms
- **User Management**: Set display names for participants
- **Recording**: Built-in recording capabilities
- **Screen Sharing**: Share screen functionality
- **Mobile Responsive**: Works on desktop and mobile devices

## API Endpoints

### GET `/api/jitsi/token`
Generates a JWT token for Jitsi authentication.

**Parameters:**
- `username` (required): The display name for the user

**Response:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Usage

1. Navigate to `/jitsi` in your application
2. Enter your name and a room name
3. Click "Start Meeting" to join the video conference

## Troubleshooting

### Common Issues

1. **"Failed to generate JWT token"**
   - Check that all environment variables are set correctly
   - Verify your private key format (should include newlines)
   - Ensure your App ID and KID are correct

2. **Meeting won't load**
   - Check browser console for errors
   - Verify your App ID in the frontend matches the backend
   - Ensure you have a stable internet connection

3. **Camera/Microphone not working**
   - Grant browser permissions for camera and microphone
   - Check that no other applications are using the devices

### Testing Your Setup

You can test your JWT token generation by visiting:
```
http://localhost:3000/api/jitsi/token?username=testuser
```

This should return a valid JWT token if your configuration is correct.

## Security Notes

- JWT tokens expire after 3 hours for security
- Private keys should never be exposed in client-side code
- Consider implementing user authentication before allowing access to meetings
- Room names should be unique and not easily guessable for private meetings

## Customization

You can customize the Jitsi meeting experience by modifying the `configOverwrite` and `interfaceConfigOverwrite` props in the `JaaSMeeting` component:

```typescript
configOverwrite={{
  disableThirdPartyRequests: true,
  disableLocalVideoFlip: true,
  backgroundAlpha: 0.5,
  startWithAudioMuted: false,
  startWithVideoMuted: false
}}

interfaceConfigOverwrite={{
  VIDEO_LAYOUT_FIT: 'nocrop',
  MOBILE_APP_PROMO: false,
  TILE_VIEW_MAX_COLUMNS: 4,
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false
}}
```

For more configuration options, refer to the [Jitsi Meet API documentation](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe).