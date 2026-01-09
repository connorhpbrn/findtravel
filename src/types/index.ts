export interface TripAnswers {
  origin: string;
  duration: string;
  timing: string;
  specificDates?: { start: string; end: string };
  travelers: string;
  groupSize?: number;
  budget: number | 'flexible';
  budgetPriority: string;
  accommodation: string[];
  pace: string;
  perfectMorning: string;
  lovedTrips: string;
  dislikedTrips: string;
  interests: string[];
  foodStyle?: string[];
  travelStyle: string[];
  travelVibe: string;
  personality: {
    plannedVsSpontaneous: number;
    comfortVsAuthenticity: number;
    famousVsHidden: number;
  };
  avoidances: string[];
  tripRuiners: string[];
  dietaryNeeds: string;
  mustIncludes: string;
  intention: string;
}

export interface Destination {
  id: string;
  name: string;
  tagline: string;
  whyItFits: string;
  bestTimeToVisit: string;
  estimatedDailySpend: string;
  flightTime: string;
  imageUrl: string;
}

export interface TripPlan {
  overview: string;
  dayByDay: { day: number; title: string; description: string }[];
  foodHighlights: string[];
  thingsToDo: string[];
  whereToStay: { neighborhood: string; description: string }[];
  gettingAround: string;
  whatToPack: string[];
  budgetOverview: {
    accommodation: string;
    food: string;
    activities: string;
    transport: string;
    total: string;
  };
}

export interface SavedTrip {
  id: string;
  destination: Destination;
  travelStyle: string;
  plan: TripPlan;
  answers: TripAnswers;
  createdAt: string;
}

export interface ImageOption {
  id: string;
  label: string;
  images: string[];
}

export interface BinaryToggle {
  id: string;
  leftLabel: string;
  rightLabel: string;
}

export interface Question {
  id: string;
  category: string;
  question: string;
  type: 'text' | 'single' | 'multi' | 'slider' | 'date' | 'budget' | 'image-select' | 'binary-toggles';
  options?: string[];
  imageOptions?: ImageOption[];
  binaryToggles?: BinaryToggle[];
  optional?: boolean;
  placeholder?: string;
  conditionalOn?: { field: keyof TripAnswers; value: string | string[] };
  min?: number;
  max?: number;
  step?: number;
}
