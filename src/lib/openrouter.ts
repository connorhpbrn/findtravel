import { TripAnswers, Destination, TripPlan } from '@/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3-flash-preview';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

function buildSystemPrompt(): string {
  return `You are Fara, an expert travel advisor with deep knowledge of destinations worldwide. You design thoughtful, personalized travel experiences that match each traveler's unique personality, preferences, and practical needs.

## Your Approach

You are calm, considered, and genuinely helpful. You don't overwhelm travelers with options — instead, you curate a small selection of destinations that truly fit who they are. You understand that the best trips aren't just about places, but about how those places make people feel.

## Your Expertise

- **Destination Knowledge**: You have comprehensive knowledge of cities, regions, and hidden gems across the globe. You understand seasonal variations, local events, cultural nuances, and practical considerations.
- **Travel Logistics**: You know flight times, visa requirements, best times to visit, typical costs, and transportation options.
- **Cultural Sensitivity**: You respect and understand diverse cultures, dietary requirements, accessibility needs, and travel styles.
- **Current Awareness**: You can search the web for current information about destinations, events, weather patterns, and travel advisories.

## Response Guidelines

1. **Be Specific**: Don't give generic advice. Reference actual neighborhoods, restaurants, experiences, and local insights.
2. **Be Honest**: If a destination might not be ideal for someone's needs, say so. Suggest alternatives.
3. **Be Practical**: Consider budget, travel time, physical requirements, and logistics.
4. **Be Inspiring**: Help travelers see why a destination would resonate with them emotionally.
5. **No Emojis**: Keep the tone calm and editorial. No emojis in your responses.
6. **Current Information**: When relevant, search for current travel conditions, events, or advisories.

## Output Format

Always respond with valid JSON matching the exact structure requested. Do not include markdown code blocks or any text outside the JSON object.`;
}

function formatPersonality(personality: TripAnswers['personality']): string {
  if (!personality) return 'Balanced preferences';
  const traits = [];
  if (personality.plannedVsSpontaneous < 40) traits.push('prefers planned itineraries');
  else if (personality.plannedVsSpontaneous > 60) traits.push('loves spontaneous discovery');
  if (personality.comfortVsAuthenticity < 40) traits.push('prioritizes comfort');
  else if (personality.comfortVsAuthenticity > 60) traits.push('seeks authentic experiences');
  if (personality.famousVsHidden < 40) traits.push('wants to see famous landmarks');
  else if (personality.famousVsHidden > 60) traits.push('prefers hidden gems');
  return traits.length > 0 ? traits.join(', ') : 'balanced preferences';
}

function buildTravelStylePrompt(answers: TripAnswers): string {
  return `Based on the traveler's responses, create a personalized travel style description.

## Traveler Profile

**Origin**: ${answers.origin}
**Trip Duration**: ${answers.duration}
**Timing**: ${answers.timing}
**Travelers**: ${answers.travelers}${answers.groupSize ? ` (${answers.groupSize} people)` : ''}
**Budget**: ${answers.budget === 'flexible' ? 'Flexible budget' : `$${answers.budget} total budget`}
**Budget Priority**: ${answers.budgetPriority || 'No specific priority'}
**Accommodation Preferences**: ${answers.accommodation?.join(', ') || 'No preference'}
**Travel Vibe**: ${answers.travelVibe || 'Not specified'}
**Perfect Morning**: ${answers.perfectMorning || 'Not specified'}
**Pace**: ${answers.pace}
**Personality Traits**: ${formatPersonality(answers.personality)}
**Past Trips Loved**: ${answers.lovedTrips || 'Not specified'}
**Past Trips Disliked**: ${answers.dislikedTrips || 'Not specified'}
**Interests**: ${answers.interests?.join(', ') || 'Not specified'}
**Food Preferences**: ${answers.foodStyle?.join(', ') || 'Not specified'}
**Travel Style**: ${answers.travelStyle?.join(', ') || 'Not specified'}
**Things to Avoid**: ${answers.avoidances?.join(', ') || 'None specified'}
**Trip Ruiners**: ${answers.tripRuiners?.join(', ') || 'None specified'}
**Dietary/Accessibility Needs**: ${answers.dietaryNeeds || 'None specified'}
**Must-Includes**: ${answers.mustIncludes || 'None specified'}
**Desired Feeling**: ${answers.intention}

## Task

Create a one-sentence travel style description that captures who this traveler is. Start with "You're a [Type] —" and describe their travel personality in a warm, insightful way. Reference their vibe preference, personality traits, and what they're seeking.

Respond with JSON:
{
  "travelStyle": "You're a [Type] — [description of their travel personality]"
}`;
}

function buildDestinationsPrompt(answers: TripAnswers): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return `Based on the traveler's profile, recommend 4 destinations that would be perfect for them. Search the web for current travel conditions, events, and any relevant advisories for potential destinations.

## Current Date: ${currentDate}

## Traveler Profile

**Origin**: ${answers.origin}
**Trip Duration**: ${answers.duration}
**Timing**: ${answers.timing}
**Travelers**: ${answers.travelers}${answers.groupSize ? ` (${answers.groupSize} people)` : ''}
**Budget**: ${answers.budget === 'flexible' ? 'Flexible budget' : `$${answers.budget} total budget`}
**Budget Priority**: ${answers.budgetPriority || 'No specific priority'} (where they want to splurge)
**Accommodation Preferences**: ${answers.accommodation?.join(', ') || 'No preference'}
**Travel Vibe**: ${answers.travelVibe || 'Not specified'} (the feeling/atmosphere they're drawn to)
**Perfect Morning**: ${answers.perfectMorning || 'Not specified'} (what they'd do at 10 AM on day 2)
**Pace**: ${answers.pace}
**Personality Traits**: ${formatPersonality(answers.personality)}
**Past Trips Loved**: ${answers.lovedTrips || 'Not specified'}
**Past Trips Disliked**: ${answers.dislikedTrips || 'Not specified'}
**Interests**: ${answers.interests?.join(', ') || 'Not specified'}
**Food Preferences**: ${answers.foodStyle?.join(', ') || 'Not specified'}
**Travel Style**: ${answers.travelStyle?.join(', ') || 'Not specified'}
**Things to Avoid**: ${answers.avoidances?.join(', ') || 'None specified'}
**Trip Ruiners**: ${answers.tripRuiners?.join(', ') || 'None specified'} (things that would ruin the trip)
**Dietary/Accessibility Needs**: ${answers.dietaryNeeds || 'None specified'}
**Must-Includes**: ${answers.mustIncludes || 'None specified'}
**Desired Feeling**: ${answers.intention}

## Selection Criteria

1. **Match the Vibe**: The destination should match their selected vibe (${answers.travelVibe || 'general'}).
2. **Match the Feeling**: The destination should help them feel ${answers.intention.toLowerCase()}.
3. **Respect Avoidances**: Do not suggest destinations that conflict with their avoidances or trip ruiners.
4. **Consider Logistics**: Factor in flight time from ${answers.origin}, visa requirements, and practical considerations.
5. **Seasonal Appropriateness**: Consider the timing (${answers.timing}) and current/upcoming weather.
6. **Budget Alignment**: Ensure destinations fit their budget and prioritize spending on ${answers.budgetPriority || 'balanced allocation'}.
7. **Pace Match**: ${answers.pace} pace should be achievable at the destination.
8. **Personality Match**: Consider their personality traits (${formatPersonality(answers.personality)}).
9. **Interest Alignment**: Prioritize destinations strong in: ${answers.interests?.join(', ') || 'general appeal'}.

## Task

Recommend exactly 4 destinations. For each, provide:
- A compelling one-line emotional hook (tagline)
- A detailed paragraph explaining why this destination fits THIS specific traveler, referencing their vibe, personality, and specific preferences
- Practical information (best time, daily spend, flight time from their origin)

Respond with JSON:
{
  "destinations": [
    {
      "id": "lowercase-hyphenated-id",
      "name": "City, Country",
      "tagline": "One-line emotional hook",
      "whyItFits": "2-3 sentence paragraph explaining why this destination is perfect for this specific traveler, referencing their vibe preference, personality traits, and interests",
      "bestTimeToVisit": "Month range",
      "estimatedDailySpend": "$X-Y",
      "flightTime": "X-Y hours from [origin]"
    }
  ]
}`;
}

function buildTripPlanPrompt(answers: TripAnswers, destination: Destination): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  let numDays = 4;
  if (answers.duration === 'A weekend') numDays = 3;
  else if (answers.duration === 'Five to seven days') numDays = 6;
  else if (answers.duration === 'One to two weeks') numDays = 10;
  else if (answers.duration === 'Longer') numDays = 14;

  return `Create a detailed trip plan for ${destination.name}. Search the web for current information about restaurants, attractions, neighborhoods, and any upcoming events or considerations.

## Current Date: ${currentDate}

## Destination: ${destination.name}
${destination.tagline}

## Traveler Profile

**Origin**: ${answers.origin}
**Trip Duration**: ${answers.duration} (plan for ${numDays} days)
**Travelers**: ${answers.travelers}${answers.groupSize ? ` (${answers.groupSize} people)` : ''}
**Budget**: ${answers.budget === 'flexible' ? 'Flexible budget' : `$${answers.budget} total budget`}
**Budget Priority**: ${answers.budgetPriority || 'Balanced'} (where to allocate more budget)
**Accommodation Preferences**: ${answers.accommodation?.join(', ') || 'No preference'}
**Travel Vibe**: ${answers.travelVibe || 'Not specified'}
**Perfect Morning**: ${answers.perfectMorning || 'Not specified'}
**Pace**: ${answers.pace}
**Personality Traits**: ${formatPersonality(answers.personality)}
**Interests**: ${answers.interests?.join(', ') || 'Not specified'}
**Food Preferences**: ${answers.foodStyle?.join(', ') || 'General food experiences'}
**Travel Style**: ${answers.travelStyle?.join(', ') || 'Not specified'}
**Trip Ruiners**: ${answers.tripRuiners?.join(', ') || 'None specified'}
**Dietary/Accessibility Needs**: ${answers.dietaryNeeds || 'None specified'}
**Must-Includes**: ${answers.mustIncludes || 'None specified'}
**Desired Feeling**: ${answers.intention}

## Planning Guidelines

1. **Pace**: Plan for a ${answers.pace.toLowerCase()} pace. ${
    answers.pace === 'Slow and relaxed' 
      ? 'Include plenty of downtime, leisurely meals, and unstructured exploration time.'
      : answers.pace === 'Full and energetic'
      ? 'Pack in experiences but ensure logical routing to minimize wasted time.'
      : 'Balance activities with rest. Morning adventures, relaxed afternoons.'
  }
2. **Morning Style**: Their perfect morning is "${answers.perfectMorning || 'flexible'}" — plan day starts accordingly.
3. **Budget Priority**: Allocate more budget toward ${answers.budgetPriority || 'balanced spending'}.
4. **Personality**: ${formatPersonality(answers.personality)} — tailor recommendations to match.
5. **Food**: ${answers.foodStyle?.length ? `Focus on: ${answers.foodStyle.join(', ')}` : 'Include varied dining experiences'}.
6. **Avoid Trip Ruiners**: ${answers.tripRuiners?.length ? `Actively avoid: ${answers.tripRuiners.join(', ')}` : 'No specific concerns'}.
7. **Interests**: Emphasize ${answers.interests?.join(', ') || 'varied experiences'}.
8. **Accommodation**: Recommend neighborhoods that suit ${answers.accommodation?.join(' or ') || 'various'} stays.
9. **Dietary Needs**: ${answers.dietaryNeeds ? `Account for: ${answers.dietaryNeeds}` : 'No specific requirements.'}
10. **Must-Includes**: ${answers.mustIncludes ? `Ensure the plan includes: ${answers.mustIncludes}` : 'No specific requirements.'}

## Task

Create a comprehensive trip plan with specific, real recommendations. Use actual restaurant names, real neighborhoods, genuine local experiences. Search for current information to ensure accuracy.

Respond with JSON:
{
  "overview": "2-3 sentence calm summary of what this trip will feel like",
  "dayByDay": [
    {
      "day": 1,
      "title": "Arrival theme or focus",
      "description": "2-3 sentences describing the day's flow with specific places and experiences"
    }
  ],
  "foodHighlights": [
    "Specific dish at Specific Restaurant Name",
    "Another specific recommendation"
  ],
  "thingsToDo": [
    "Specific activity or experience",
    "Another specific recommendation"
  ],
  "whereToStay": [
    {
      "neighborhood": "Neighborhood Name",
      "description": "Why this area suits them and what to expect"
    }
  ],
  "gettingAround": "Practical transportation advice specific to this destination",
  "whatToPack": [
    "Specific item relevant to destination and activities",
    "Another practical suggestion"
  ],
  "budgetOverview": {
    "accommodation": "$X-Y/night",
    "food": "$X-Y/day",
    "activities": "$X-Y/day",
    "transport": "$X-Y/day",
    "total": "$X-Y/day"
  }
}`;
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  enableWebSearch: boolean = false
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const plugins = enableWebSearch ? [{ id: 'web' }] : undefined;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://fara.travel',
      'X-Title': 'Fara Travel Planner',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      plugins,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

function parseJsonResponse<T>(response: string): T {
  let cleaned = response.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  cleaned = cleaned.trim();
  
  return JSON.parse(cleaned) as T;
}

export async function generateTravelStyle(answers: TripAnswers): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildTravelStylePrompt(answers);
  
  const response = await callOpenRouter(systemPrompt, userPrompt, false);
  const parsed = parseJsonResponse<{ travelStyle: string }>(response);
  
  return parsed.travelStyle;
}

const DESTINATION_IMAGES: Record<string, string> = {
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  'italy': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
  'venice': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
  'florence': 'https://images.unsplash.com/photo-1543429258-c5ca3e1c94b0?w=800&q=80',
  'amalfi': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80',
  'como': 'https://images.unsplash.com/photo-1553452118-621e1f860f43?w=800&q=80',
  'lake como': 'https://images.unsplash.com/photo-1553452118-621e1f860f43?w=800&q=80',
  'cinque terre': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',
  'tuscany': 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=800&q=80',
  'positano': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  'england': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  'spain': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
  'lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80',
  'portugal': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80',
  'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
  'netherlands': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'nyc': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'thailand': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80',
  'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
  'phuket': 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80',
  'vietnam': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&q=80',
  'hanoi': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&q=80',
  'morocco': 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&q=80',
  'marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80',
  'greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
  'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80',
  'athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80',
  'mykonos': 'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800&q=80',
  'croatia': 'https://images.unsplash.com/photo-1555990538-1e6c89d76b91?w=800&q=80',
  'dubrovnik': 'https://images.unsplash.com/photo-1555990538-1e6c89d76b91?w=800&q=80',
  'iceland': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80',
  'reykjavik': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80',
  'norway': 'https://images.unsplash.com/photo-1520769669658-f07657f5a307?w=800&q=80',
  'sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&q=80',
  'stockholm': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&q=80',
  'copenhagen': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80',
  'denmark': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&q=80',
  'australia': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  'melbourne': 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80',
  'new zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
  'queenstown': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80',
  'canada': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80',
  'vancouver': 'https://images.unsplash.com/photo-1559511260-66a68e7e7e8c?w=800&q=80',
  'toronto': 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&q=80',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80',
  'seoul': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
  'korea': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80',
  'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
  'germany': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80',
  'munich': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&q=80',
  'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
  'austria': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80',
  'prague': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80',
  'czech': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80',
  'budapest': 'https://images.unsplash.com/photo-1541343672885-9be56236302a?w=800&q=80',
  'hungary': 'https://images.unsplash.com/photo-1541343672885-9be56236302a?w=800&q=80',
  'switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&q=80',
  'zurich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=800&q=80',
  'scotland': 'https://images.unsplash.com/photo-1506377585622-bedcbb5f7c1e?w=800&q=80',
  'edinburgh': 'https://images.unsplash.com/photo-1506377585622-bedcbb5f7c1e?w=800&q=80',
  'ireland': 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=800&q=80',
  'dublin': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80',
  'peru': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  'machu picchu': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80',
  'argentina': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80',
  'buenos aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80',
  'brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  'rio': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80',
  'mexico': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
  'mexico city': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=80',
  'cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&q=80',
  'tulum': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&q=80',
  'costa rica': 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?w=800&q=80',
  'colombia': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
  'cartagena': 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80',
  'cuba': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=800&q=80',
  'havana': 'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=800&q=80',
  'south africa': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
  'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
  'egypt': 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
  'cairo': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80',
  'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'rajasthan': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'jaipur': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  'sri lanka': 'https://images.unsplash.com/photo-1586613835341-b9a2d5c0e6e0?w=800&q=80',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80',
  'hawaii': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800&q=80',
  'maui': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800&q=80',
  'caribbean': 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80',
  'fiji': 'https://images.unsplash.com/photo-1530053969600-caed2596d242?w=800&q=80',
  'tahiti': 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&q=80',
  'bora bora': 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&q=80',
  'seychelles': 'https://images.unsplash.com/photo-1589979481223-deb893043163?w=800&q=80',
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80',
];

function generateImageUrl(destinationName: string, index: number = 0): string {
  const nameLower = destinationName.toLowerCase();
  const sortedKeys = Object.keys(DESTINATION_IMAGES).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (nameLower.includes(key)) {
      return DESTINATION_IMAGES[key];
    }
  }
  
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export async function generateDestinations(answers: TripAnswers): Promise<Destination[]> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildDestinationsPrompt(answers);
  
  const response = await callOpenRouter(systemPrompt, userPrompt, true);
  const parsed = parseJsonResponse<{ destinations: Omit<Destination, 'imageUrl'>[] }>(response);
  
  const destinationsWithImages = parsed.destinations.map((dest, index) => ({
    ...dest,
    imageUrl: generateImageUrl(dest.name, index),
  }));
  
  return destinationsWithImages;
}

export async function generateTripPlan(
  answers: TripAnswers,
  destination: Destination
): Promise<TripPlan> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildTripPlanPrompt(answers, destination);
  
  const response = await callOpenRouter(systemPrompt, userPrompt, true);
  const parsed = parseJsonResponse<TripPlan>(response);
  
  return parsed;
}
