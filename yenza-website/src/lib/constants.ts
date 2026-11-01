export const GENERAL_SERVICES = [
  'Cleaning',
  'Gardening',
  'Moving Assistance',
  'Painting',
  'Car Washing',
  'Event Assistance',
  'General Labour',
] as const;

export const SKILLED_SERVICES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Welding',
  'Tiling',
  'Mechanics',
  'Solar Installation',
] as const;

export const ALL_SERVICES = [...GENERAL_SERVICES, ...SKILLED_SERVICES];

export const SERVICE_AREAS = [
  'Newcastle CBD',
  'Madadeni',
  'Osizweni',
  'Hutten Heights',
  'Arbor Park',
  'Charlestown',
  'Fernwood',
];

export const EXPERIENCE_LEVELS = [
  'New to the trade',
  '1–2 years',
  '3–5 years',
  '5+ years',
] as const;

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const EMPLOYER_TYPES = [
  { value: 'Household', desc: 'Hiring for your home' },
  { value: 'Landlord', desc: 'Managing rental properties' },
  { value: 'Small business', desc: 'A local business or shop' },
  { value: 'Organisation', desc: 'NGO, church, or institution' },
] as const;
