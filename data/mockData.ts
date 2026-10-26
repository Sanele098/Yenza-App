import { Job, JobCategory, Worker } from '@/types';

export const ALL_GENERAL_SERVICES: JobCategory[] = [
  'Cleaning',
  'Gardening',
  'Moving Assistance',
  'Painting',
  'Car Washing',
  'Event Assistance',
  'General Labour',
];

export const ALL_SKILLED_SERVICES: JobCategory[] = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Welding',
  'Tiling',
  'Mechanics',
  'Solar Installation',
];

export const ALL_SERVICE_AREAS = [
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

export const DEMO_CREDENTIALS = {
  worker: { phone: '082 555 0147', password: 'yenza123' },
  employer: { phone: '083 222 1045', password: 'yenza123' },
};

export const initialWorker: Worker = {
  id: 'w-001',
  name: 'Sanele Buthelezi',
  phone: '082 555 0147',
  email: 'sanele.b@example.co.za',
  bio: 'I provide plumbing and general maintenance services around Newcastle. I focus on household repairs, installations and maintenance work.',
  photo: '',
  services: ['Plumbing', 'General Labour', 'Painting'],
  experience: '3–5 years',
  experienceDetail:
    'Started as a plumber apprentice in 2020. Worked on residential installations and repairs, water systems and geysers. Also take on general maintenance and painting jobs around the Newcastle area.',
  location: 'Newcastle, KwaZulu-Natal',
  serviceAreas: ['Newcastle CBD', 'Arbor Park', 'Hutten Heights'],
  isAvailable: true,
  preferredLanguage: 'English',
  availabilityDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  qualifications: [
    {
      label: 'Identity verification',
      status: 'not_verified',
      description: 'Confirm your identity so customers know who they are hiring.',
    },
    {
      label: 'Qualification',
      status: 'not_provided',
      description: 'Add certificates or proof of training for skilled services.',
    },
    {
      label: 'Professional registration',
      status: 'not_provided',
      description: 'Add registration numbers for regulated trades (e.g. plumbing, electrical).',
    },
  ],
  profilePhotoSet: false,
};

export const initialJobs: Job[] = [
  {
    id: 'job-001',
    title: 'Leaking Kitchen Tap',
    description:
      'The kitchen tap has been leaking continuously. Please inspect the tap and repair or replace the faulty part.',
    category: 'Plumbing',
    price: 450,
    location: 'Newcastle CBD',
    latitude: -27.759,
    longitude: 29.932,
    distanceKm: 3.2,
    scheduledDate: 'Today',
    scheduledTime: '14:00',
    estimatedDuration: '1–2 hours',
    status: 'open',
    fulfillmentMode: 'instant_accept',
    pricingType: 'fixed',
    preferredPaymentMethod: 'cash',
    isRemote: false,
    createdAt: '2025-10-07T06:00:00Z',
  },
  {
    id: 'job-002',
    title: 'Garden Cleanup',
    description:
      'Front and back garden needs a general clean-up — hedge trimming, weeding, and removing garden refuse.',
    category: 'Gardening',
    price: 350,
    location: 'Hutten Heights',
    latitude: -27.715,
    longitude: 29.948,
    distanceKm: 5.1,
    scheduledDate: 'Today',
    scheduledTime: '15:30',
    estimatedDuration: '2–3 hours',
    status: 'open',
    fulfillmentMode: 'instant_accept',
    pricingType: 'fixed',
    preferredPaymentMethod: 'card',
    isRemote: false,
    createdAt: '2025-10-07T05:30:00Z',
  },
  {
    id: 'job-003',
    title: 'Paint Two Bedroom Walls',
    description:
      'Two bedroom walls need to be painted. Customer will provide paint. Surfaces need light preparation first.',
    category: 'Painting',
    price: 850,
    location: 'Madadeni',
    latitude: -27.731,
    longitude: 29.985,
    distanceKm: 8.4,
    scheduledDate: 'Tomorrow',
    scheduledTime: '09:00',
    estimatedDuration: '3–4 hours',
    status: 'open',
    fulfillmentMode: 'application',
    pricingType: 'quote',
    preferredPaymentMethod: 'cash',
    isRemote: false,
    createdAt: '2025-10-07T05:00:00Z',
  },
  {
    id: 'job-004',
    title: 'Move Furniture',
    description:
      'Need help moving furniture from one room to another and loading a few pieces onto a bakkie.',
    category: 'Moving Assistance',
    price: 600,
    location: 'Arbor Park',
    latitude: -27.771,
    longitude: 29.921,
    distanceKm: 4.7,
    scheduledDate: 'Tomorrow',
    scheduledTime: '11:00',
    estimatedDuration: '2 hours',
    status: 'open',
    fulfillmentMode: 'instant_accept',
    pricingType: 'fixed',
    preferredPaymentMethod: 'card',
    isRemote: false,
    createdAt: '2025-10-07T04:30:00Z',
  },
  {
    id: 'job-005',
    title: 'Data Capture & Spreadsheet Formatting',
    description:
      'I have rough notes from a stock count that need to be captured into an Excel spreadsheet and formatted neatly. Can be done from anywhere — I will send photos of the notes.',
    category: 'General Labour',
    price: 300,
    location: 'Remote',
    isRemote: true,
    latitude: 0,
    longitude: 0,
    distanceKm: 0,
    scheduledDate: 'Today',
    scheduledTime: 'Anytime',
    estimatedDuration: '2–3 hours',
    status: 'open',
    fulfillmentMode: 'application',
    pricingType: 'fixed',
    preferredPaymentMethod: 'card',
    createdAt: '2025-10-07T04:00:00Z',
  },
];

export const SERVICE_ICONS: Record<JobCategory, string> = {
  Cleaning: 'Sparkles',
  Gardening: 'Trees',
  'Moving Assistance': 'Package',
  Painting: 'PaintRoller',
  'Car Washing': 'Car',
  'Event Assistance': 'PartyPopper',
  'General Labour': 'HardHat',
  Plumbing: 'Wrench',
  Electrical: 'Zap',
  Carpentry: 'Hammer',
  Welding: 'Flame',
  Tiling: 'Grid3x3',
  Mechanics: 'Cog',
  'Solar Installation': 'SunMedium',
  Digital: 'Laptop',
  Remote: 'Globe',
  Other: 'MoreHorizontal',
};
