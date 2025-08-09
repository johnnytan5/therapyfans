// Test current configuration
require('dotenv').config({ path: '.env.local' })

console.log('🔍 Current Configuration Check:')
console.log('NEXT_PUBLIC_JITSI_APP_ID:', process.env.NEXT_PUBLIC_JITSI_APP_ID)
console.log('JITSI_APP_ID:', process.env.JITSI_APP_ID)
console.log('JITSI_KID:', process.env.JITSI_KID)
console.log('JITSI_PRIVATE_KEY:', process.env.JITSI_PRIVATE_KEY ? 'SET ✅' : 'MISSING ❌')

// Test API endpoint
async function testCurrentConfig() {
  try {
    console.log('\n🧪 Testing API endpoint...')
    const response = await fetch('http://localhost:3000/api/jitsi/token?username=testuser')
    const data = await response.json()
    
    if (data.error) {
      console.log('❌ API Error:', data.error)
      return
    }
    
    console.log('✅ Token generated successfully!')
    
    // Decode and analyze JWT
    const token = data.token
    const parts = token.split('.')
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    
    console.log('\n📋 JWT Analysis:')
    console.log('Header KID:', header.kid)
    console.log('Payload SUB:', payload.sub)
    
    console.log('\n✅ Validation Results:')
    console.log('KID matches JITSI_KID:', header.kid === process.env.JITSI_KID ? '✅ YES' : '❌ NO')
    console.log('SUB matches JITSI_APP_ID:', payload.sub === process.env.JITSI_APP_ID ? '✅ YES' : '❌ NO')
    console.log('KID === SUB (should be FALSE):', header.kid === payload.sub ? '❌ SAME (problem)' : '✅ DIFFERENT (good)')
    
    if (header.kid === process.env.JITSI_KID && payload.sub === process.env.JITSI_APP_ID && header.kid !== payload.sub) {
      console.log('\n🎉 CONFIGURATION IS CORRECT! Your Jitsi meeting should work now!')
    } else {
      console.log('\n⚠️  Configuration still needs adjustment.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testCurrentConfig()