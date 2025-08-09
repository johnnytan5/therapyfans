'use client'

import { useState, useEffect } from 'react'
import { JaaSMeeting } from '@jitsi/react-sdk'

// Icons (you can replace these with actual icon components if available)
const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const RoomIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const LoadingIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto p-4">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <VideoIcon />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Meeting Room</h1>
                <p className="text-gray-300 text-sm">{roomName}</p>
              </div>
            </div>
            <button
              onClick={handleLeaveMeeting}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Leave Meeting
            </button>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50">
            <JaaSMeeting
              appId={APP_ID}
              roomName={roomName}
              jwt={jwt}
              getIFrameRef={(node) => {
                if (node) {
                  node.style.height = '70vh'
                  node.style.width = '100%'
                  node.style.borderRadius = '1rem'
                }
              }}
              configOverwrite={{
                disableThirdPartyRequests: true,
                disableLocalVideoFlip: true,
                backgroundAlpha: 0.5,
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                defaultLanguage: 'en'
              }}
              interfaceConfigOverwrite={{
                VIDEO_LAYOUT_FIT: 'nocrop',
                MOBILE_APP_PROMO: false,
                TILE_VIEW_MAX_COLUMNS: 4,
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_ALWAYS_VISIBLE: true
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4">
            <VideoIcon />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Meeting</h1>
          <p className="text-gray-400">Enter your details to start video conferencing</p>
        </div>
        
        <div className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label htmlFor="userName" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              <UserIcon />
              <span className="ml-2">Your Name</span>
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your display name"
              disabled={isLoading}
            />
          </div>
          
          {/* Room Name Input */}
          <div className="space-y-2">
            <label htmlFor="roomName" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              <RoomIcon />
              <span className="ml-2">Room Name</span>
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter meeting room name"
              disabled={isLoading}
            />
          </div>
          
          {/* Start Meeting Button */}
          <button
            onClick={handleStartMeeting}
            disabled={isLoading || !userName.trim() || !roomName.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingIcon />
                <span>Generating Token...</span>
              </>
            ) : (
              <>
                <VideoIcon />
                <span>Start Meeting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}