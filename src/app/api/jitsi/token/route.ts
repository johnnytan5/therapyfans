import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

// JWT Token Generator for Jitsi
function generateJitsiJWT(privateKey: string, options: {
  id: string
  name: string
  email: string
  appId: string
  kid: string
}) {
  const { id, name, email, appId, kid } = options
  const now = new Date()

  try {
    const token = jwt.sign(
      {
        aud: 'jitsi',
        context: {
          user: {
            id,
            name,
            avatar: '',
            email: email,
            // moderator: 'true' // Uncomment if you want to make user a moderator
          },
          features: {
            livestreaming: 'true',
            recording: 'true',
            transcription: 'true',
            'outbound-call': 'true'
          }
        },
        iss: 'chat',
        room: '*',
        sub: appId,
        exp: Math.round(now.setHours(now.getHours() + 3) / 1000),
        nbf: Math.round(new Date().getTime() / 1000) - 10
      },
      privateKey,
      {
        algorithm: 'RS256',
        header: { kid }
      }
    )
    return token
  } catch (error) {
    console.error('Error generating JWT token:', error)
    console.error('JWT Generation Error Details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      privateKeyFormat: privateKey.substring(0, 30) + '...'
    })
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Environment variables - these should be set in your .env.local file
    const appId = process.env.JITSI_APP_ID
    const kid = process.env.JITSI_KID
    const privateKey = process.env.JITSI_PRIVATE_KEY

    if (!appId || !kid || !privateKey) {
      console.error('Missing Jitsi configuration:', {
        hasAppId: !!appId,
        hasKid: !!kid,
        hasPrivateKey: !!privateKey
      })
      return NextResponse.json(
        { 
          error: 'Jitsi configuration missing. Please set JITSI_APP_ID, JITSI_KID, and JITSI_PRIVATE_KEY environment variables.' 
        },
        { status: 500 }
      )
    }

    // Debug logging (remove in production)
    // console.log('JWT Generation Debug:', {
    //   appId: appId.substring(0, 10) + '...', // Only show first 10 chars for security
    //   kid: kid.substring(0, 10) + '...',
    //   privateKeyStart: privateKey.substring(0, 50) + '...',
    //   username
    // })

    // Format the private key properly (add newlines if they're missing)
    let formattedPrivateKey = privateKey
      .replace(/\\n/g, '\n')
      .trim()
    
    // Ensure proper line breaks around BEGIN/END markers
    if (!formattedPrivateKey.includes('\n')) {
      // If it's all on one line, add line breaks
      formattedPrivateKey = formattedPrivateKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n')
        .replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
    }
    
    // Clean up any double line breaks
    formattedPrivateKey = formattedPrivateKey
      .replace(/-----BEGIN PRIVATE KEY-----\s*\n/g, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/\n\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
    
    // console.log('Private key first 100 chars after formatting:', formattedPrivateKey.substring(0, 100))

    const token = generateJitsiJWT(formattedPrivateKey, {
      id: randomUUID(),
      name: username,
      email: `${username}@example.com`, // You can customize this
      appId: appId,
      kid: kid
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate JWT token' },
        { status: 500 }
      )
    }

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error in JWT token generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}