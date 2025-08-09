import { TherapistWithRating } from './therapistService';

// Types for AI matchmaking
export interface ClientPreferences {
  vibeTags: string[];
  preferredLanguages: string[];
  therapyGoals: string[];
  mood?: string; // emoji or sentiment
  sessionLength?: number; // in minutes
  budget?: number; // max price per session
  previousRatings?: Record<string, number>; // therapist_id -> rating
}

export interface TherapistMatch {
  therapist_id: string;
  match_score: number; // 1-100
  reason: string;
  compatibility_factors: {
    vibe_match: number;
    language_match: number;
    specialty_match: number;
    price_match: number;
  };
}

export interface MatchmakingRequest {
  clientPreferences: ClientPreferences;
  therapists: TherapistWithRating[];
  maxResults?: number;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Enhanced system prompt for Gemini 2.5 Flash
const SYSTEM_PROMPT = `You are an expert AI matching assistant for TherapyFans, a mental health therapy platform. You use Gemini 2.5 Flash's advanced reasoning capabilities to provide highly accurate therapist-client matches.

Your expertise includes:
- Deep understanding of therapy modalities and their effectiveness for different conditions
- Cultural sensitivity and language barrier considerations
- Emotional intelligence in matching client needs with therapist approaches
- Budget and practical constraints analysis
- Safety-first approach to mental health recommendations

MATCHING CRITERIA (in order of importance):
1. **Safety & Appropriateness**: Ensure the therapist can safely address the client's needs
2. **Language Compatibility**: Perfect language match is crucial for effective therapy
3. **Specialty Alignment**: Match therapy goals with appropriate specialties
4. **Vibe/Temperament Fit**: Consider client's preferred communication style
5. **Budget Constraints**: Respect financial limitations while maintaining quality
6. **Experience Level**: Consider years of experience for complex cases

ANALYSIS PROCESS:
1. Analyze client's emotional state and therapy goals
2. Evaluate each therapist's qualifications and approach
3. Calculate compatibility scores across all factors
4. Provide detailed reasoning for each match
5. Ensure diversity in recommendations (different approaches/styles)

Return results in this EXACT JSON format:
{
  "matches": [
    {
      "therapist_id": "uuid",
      "match_score": 85,
      "reason": "Excellent match for anxiety treatment. Dr. Chen's CBT expertise combined with Mandarin language support creates an ideal therapeutic environment. Her warm, structured approach aligns perfectly with your preference for empathetic yet practical therapy.",
      "compatibility_factors": {
        "vibe_match": 90,
        "language_match": 100,
        "specialty_match": 95,
        "price_match": 80
      }
    }
  ]
}

SCORING GUIDELINES:
- 95-100: Perfect match (rare, exceptional alignment)
- 90-94: Excellent match (very strong compatibility)
- 85-89: Very good match (strong compatibility)
- 80-84: Good match (solid compatibility)
- 75-79: Fair match (adequate compatibility)
- Below 75: Poor match (don't include)

Always prioritize client safety and well-being above all other factors.`;

export async function matchClientWithTherapists(
  request: MatchmakingRequest
): Promise<TherapistMatch[]> {
  try {
    // Prepare therapist data for AI
    const therapistSummaries = request.therapists.map(therapist => ({
      id: therapist.id,
      name: therapist.full_name,
      bio: therapist.bio,
      therapy_styles: therapist.therapy_styles,
      languages: therapist.languages_spoken,
      price: therapist.price_per_session,
      rating: therapist.rating,
      years_experience: therapist.years_of_experience,
      qualifications: therapist.qualifications
    }));

    // Enhanced prompt for Gemini 2.5 Flash
    const userPrompt = `
CLIENT PROFILE:
- Vibe Preferences: ${request.clientPreferences.vibeTags.join(', ')}
- Language Requirements: ${request.clientPreferences.preferredLanguages.join(', ')}
- Therapy Goals: ${request.clientPreferences.therapyGoals.join(', ')}
- Current Emotional State: ${request.clientPreferences.mood || 'Not specified'}
- Preferred Session Length: ${request.clientPreferences.sessionLength || 'Not specified'} minutes
- Budget Range: ${request.clientPreferences.budget || 'Not specified'} SUI
- Previous Therapist Ratings: ${JSON.stringify(request.clientPreferences.previousRatings || {})}

AVAILABLE THERAPISTS (${therapistSummaries.length}):
${therapistSummaries.map(t => `
THERAPIST ID: ${t.id}
Name: ${t.name}
Bio: ${t.bio || 'No bio available'}
Therapy Approaches: ${t.therapy_styles.join(', ')}
Languages Spoken: ${t.languages.join(', ')}
Session Price: ${t.price} SUI
Client Rating: ${t.rating}/5 stars
Years of Experience: ${t.years_experience} years
Qualifications: ${t.qualifications || 'Not specified'}
`).join('\n')}

TASK: Analyze the client's needs and therapist profiles to recommend the top ${request.maxResults || 3} matches. Consider:
1. How well each therapist's approach aligns with the client's therapy goals
2. Language compatibility and cultural sensitivity
3. Vibe/temperament fit based on client preferences
4. Budget constraints and value for money
5. Experience level appropriateness for the client's needs

Provide detailed, empathetic reasoning for each match that explains why this therapist would be a good fit for this specific client.`;

    // Call Gemini 2.5 Flash API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: userPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent results
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // Increased for more detailed responses
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle potential errors in the response
    if (data.error) {
      console.error('Gemini API returned error:', data.error);
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates returned from Gemini API');
      throw new Error('No response from Gemini API');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini 2.5 Flash response:', aiResponse);

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      if (!parsedResponse.matches) {
        console.error('No matches found in AI response');
        return fallbackMatching(request.clientPreferences, request.therapists, request.maxResults || 3);
      }
      
      console.log('Successfully parsed AI matches:', parsedResponse.matches);
      return parsedResponse.matches;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      try {
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[1] || jsonMatch[0];
          const parsedResponse = JSON.parse(extractedJson);
          if (parsedResponse.matches) {
            console.log('Successfully extracted and parsed JSON from response');
            return parsedResponse.matches;
          }
        }
      } catch (extractError) {
        console.error('Failed to extract JSON from response:', extractError);
      }
      
      // Fallback to simple matching if AI fails
      return fallbackMatching(request.clientPreferences, request.therapists, request.maxResults || 3);
    }

  } catch (error) {
    console.error('AI matchmaking error:', error);
    // Fallback to simple matching
    return fallbackMatching(request.clientPreferences, request.therapists, request.maxResults || 3);
  }
}

// Enhanced fallback matching algorithm
function fallbackMatching(
  preferences: ClientPreferences,
  therapists: TherapistWithRating[],
  maxResults: number
): TherapistMatch[] {
  console.log('Using fallback matching algorithm');
  
  const matches = therapists.map(therapist => {
    let factors = {
      vibe_match: 0,
      language_match: 0,
      specialty_match: 0,
      price_match: 0
    };

    // Enhanced language matching
    const languageOverlap = preferences.preferredLanguages.filter(lang => 
      therapist.languages_spoken.includes(lang)
    );
    factors.language_match = preferences.preferredLanguages.length > 0 
      ? (languageOverlap.length / preferences.preferredLanguages.length) * 100 
      : 70; // Default score if no language preference

    // Enhanced specialty matching
    const goalKeywords = preferences.therapyGoals.join(' ').toLowerCase();
    const specialtyMatches = therapist.therapy_styles.filter(style => 
      goalKeywords.includes(style.toLowerCase())
    );
    factors.specialty_match = specialtyMatches.length > 0 
      ? Math.min(95, 70 + (specialtyMatches.length * 10)) 
      : 30;

    // Enhanced price matching
    if (preferences.budget && therapist.price_per_session) {
      const price = parseFloat(therapist.price_per_session);
      if (price <= preferences.budget) {
        factors.price_match = 100;
      } else {
        const priceDifference = ((price - preferences.budget) / preferences.budget) * 100;
        factors.price_match = Math.max(0, 100 - priceDifference);
      }
    } else {
      factors.price_match = 70; // Default score
    }

    // Enhanced vibe matching based on therapy styles
    const vibeKeywords = preferences.vibeTags.join(' ').toLowerCase();
    const styleKeywords = therapist.therapy_styles.join(' ').toLowerCase();
    
    // Simple keyword matching for vibe
    if (vibeKeywords.includes('calm') && styleKeywords.includes('mindfulness')) factors.vibe_match += 20;
    if (vibeKeywords.includes('direct') && styleKeywords.includes('cbt')) factors.vibe_match += 20;
    if (vibeKeywords.includes('empathetic') && styleKeywords.includes('person-centered')) factors.vibe_match += 20;
    if (vibeKeywords.includes('structured') && styleKeywords.includes('cbt')) factors.vibe_match += 20;
    if (vibeKeywords.includes('spiritual') && styleKeywords.includes('mindfulness')) factors.vibe_match += 20;
    
    factors.vibe_match = Math.min(95, factors.vibe_match + 50); // Base score + matches

    // Calculate weighted total score
    const totalScore = (
      factors.language_match * 0.35 +    // Language is most important
      factors.specialty_match * 0.35 +   // Specialty is equally important
      factors.price_match * 0.20 +       // Price matters but less so
      factors.vibe_match * 0.10          // Vibe is nice to have
    );

    return {
      therapist_id: therapist.id,
      match_score: Math.round(totalScore),
      reason: `Language compatibility: ${factors.language_match}%, Specialty alignment: ${factors.specialty_match}%, Price fit: ${factors.price_match}%, Vibe match: ${factors.vibe_match}%`,
      compatibility_factors: factors
    };
  });

  // Sort by score and return top matches
  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, maxResults)
    .filter(match => match.match_score >= 60);
}

// Helper function to get therapist by ID from matches
export function getTherapistFromMatch(
  match: TherapistMatch,
  therapists: TherapistWithRating[]
): TherapistWithRating | undefined {
  return therapists.find(t => t.id === match.therapist_id);
}
