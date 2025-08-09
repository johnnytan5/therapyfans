'use client'

import { useState, useEffect } from 'react'
import { JaaSMeeting } from '@jitsi/react-sdk'

export default function JitsiPage() {
  const [jwt, setJwt] = useState<string>('')
  const [roomName, setRoomName] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [meetingStarted, setMeetingStarted] = useState<boolean>(false)

  // Replace with your actual Jitsi App ID from https://jaas.8x8.vc/#/apikeys
  const APP_ID = process.env.NEXT_PUBLIC_JITSI_APP_ID || 'your-app-id-here'

  const generateJWT = async (username: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jitsi/token?username=${encodeURIComponent(username)}`)
      if (!response.ok) {
        throw new Error('Failed to generate JWT token')
      }
      const data = await response.json()
      setJwt(data.token)
    } catch (error) {
      console.error('Error generating JWT:', error)
      alert('Failed to generate JWT token. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartMeeting = async () => {
    if (!userName.trim() || !roomName.trim()) {
      alert('Please enter both username and room name')
      return
    }

    await generateJWT(userName)
    setMeetingStarted(true)
  }

  const handleLeaveMeeting = () => {
    setMeetingStarted(false)
    setJwt('')
  }

  if (meetingStarted && jwt) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-4">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Jitsi Meeting: {roomName}</h1>
            <button
              onClick={handleLeaveMeeting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Leave Meeting
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <JaaSMeeting
              appId={APP_ID}
              roomName={roomName}
              jwt={jwt}
              getIFrameRef={(node) => {
                if (node) {
                  node.style.height = '600px'
                  node.style.width = '100%'
                }
              }}
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
              onApiReady={(externalApi) => {
                console.log('Jitsi Meet API is ready')
                
                // Add event listeners
                externalApi.addEventListeners({
                  readyToClose: handleLeaveMeeting,
                  participantLeft: (participant: any) => {
                    console.log('Participant left:', participant)
                  },
                  participantJoined: (participant: any) => {
                    console.log('Participant joined:', participant)
                  }
                })
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Join Jitsi Meeting</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room name"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleStartMeeting}
            disabled={isLoading || !userName.trim() || !roomName.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating Token...' : 'Start Meeting'}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Setup Required:</h3>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Set your NEXT_PUBLIC_JITSI_APP_ID in environment variables</li>
            <li>• Configure your Jitsi API keys at jaas.8x8.vc</li>
            <li>• Make sure the backend JWT service is running</li>
          </ul>
        </div>
      </div>
    </div>
  )
}