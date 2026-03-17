/**
 * Wonderlore AI membership tier definitions.
 *
 * These are the source of truth for plan display on the client.
 * Stripe Price IDs are configured server-side via environment variables.
 */
export const PLANS = [
  {
    id: 'free',
    name: 'Adventurer',
    price: 0,
    description: 'Begin your journey',
    features: [
      '1 active campaign',
      'Local saves only',
      'Standard AI models',
      'Community access',
    ],
  },
  {
    id: 'premium',
    name: 'Hero',
    price: 9.99,
    description: 'Unlock the full experience',
    features: [
      'Unlimited campaigns',
      'Cloud saves & sync',
      'AI portrait generation',
      'Priority AI models',
      'Campaign sharing',
      'Story recaps',
    ],
  },
];
