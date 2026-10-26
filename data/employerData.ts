import { Candidate, EmployerJob, EmployerProfile } from '@/types';

export const initialEmployerProfile: EmployerProfile = {
  id: 'e-001',
  name: 'Thandi Mthembu',
  accountType: 'Household',
  phone: '083 222 1045',
  email: 'thandi.m@example.co.za',
  location: 'Newcastle CBD',
  jobsPosted: 6,
  jobsCompleted: 4,
};

export const initialEmployerJobs: EmployerJob[] = [
  {
    id: 'employer-job-001',
    title: 'Fix leaking kitchen tap',
    description: 'The kitchen mixer tap keeps dripping from the spout. Please inspect and repair the faulty part.',
    category: 'Plumbing',
    location: 'Newcastle CBD',
    budget: 450,
    scheduledDate: 'Today',
    scheduledTime: '14:00',
    status: 'Open',
    rawStatus: 'open',
    fulfillmentMode: 'instant_accept',
    preferredPaymentMethod: 'cash',
    applications: 3,
    createdAt: '2026-10-10T06:00:00Z',
  },
  {
    id: 'employer-job-002',
    title: 'Garden cleanup',
    description: 'Weeding, hedge trimming and removal of garden refuse from the front and back garden.',
    category: 'Gardening',
    location: 'Hutten Heights',
    budget: 350,
    scheduledDate: 'Tomorrow',
    scheduledTime: '09:00',
    status: 'Worker selected',
    rawStatus: 'assigned',
    fulfillmentMode: 'application',
    preferredPaymentMethod: 'card',
    applications: 5,
    createdAt: '2026-10-09T07:30:00Z',
  },
];

export const candidates: Candidate[] = [
  { id: 'candidate-001', name: 'Sanele Buthelezi', services: ['Plumbing', 'Painting', 'General Labour'], experience: '3–5 years', location: 'Newcastle CBD', rating: 4.9, completedJobs: 28, verificationCount: 1, isAvailable: true, rate: 450, photo: '' },
  { id: 'candidate-002', name: 'Nokuthula Dlamini', services: ['Cleaning', 'Gardening'], experience: '1–2 years', location: 'Madadeni', rating: 4.8, completedJobs: 19, verificationCount: 2, isAvailable: true, rate: 320, photo: '' },
  { id: 'candidate-003', name: 'Mandla Khumalo', services: ['Plumbing', 'Electrical', 'Solar Installation'], experience: '5+ years', location: 'Arbor Park', rating: 4.7, completedJobs: 41, verificationCount: 3, isAvailable: false, rate: 650, photo: '' },
];
