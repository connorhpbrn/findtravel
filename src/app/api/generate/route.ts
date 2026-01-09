import { NextRequest, NextResponse } from 'next/server';
import { TripAnswers, Destination } from '@/types';
import {
  generateTravelStyle,
  generateDestinations,
  generateTripPlan,
} from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, answers, destination } = body;

    switch (action) {
      case 'travelStyle': {
        const travelStyle = await generateTravelStyle(answers as TripAnswers);
        return NextResponse.json({ travelStyle });
      }

      case 'destinations': {
        const destinations = await generateDestinations(answers as TripAnswers);
        return NextResponse.json({ destinations });
      }

      case 'tripPlan': {
        const plan = await generateTripPlan(
          answers as TripAnswers,
          destination as Destination
        );
        return NextResponse.json({ plan });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
