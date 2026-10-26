import { EarningsActivity } from '@/types';

export const earningsSummary = {
  today: 450,
  week: 1250,
  month: 2450,
  available: 850,
  pending: 450,
};

export const recentEarnings: EarningsActivity[] = [
  {
    id: 'earning-001',
    title: 'Leaking Kitchen Tap',
    jobTitle: 'Leaking Kitchen Tap',
    dateLabel: 'Today',
    status: 'available',
    amount: 405,
    grossAmount: 450,
    commissionAmount: 45,
    paymentMethod: 'cash',
  },
  {
    id: 'earning-002',
    title: 'Garden Cleanup',
    jobTitle: 'Garden Cleanup',
    dateLabel: 'Yesterday',
    status: 'available',
    amount: 315,
    grossAmount: 350,
    commissionAmount: 35,
    paymentMethod: 'card',
  },
  {
    id: 'earning-003',
    title: 'Move Furniture',
    jobTitle: 'Move Furniture',
    dateLabel: '28 Sep',
    status: 'withdrawn',
    amount: 540,
    grossAmount: 600,
    commissionAmount: 60,
    paymentMethod: 'eft',
  },
  {
    id: 'earning-004',
    title: 'Paint Two Bedroom Walls',
    jobTitle: 'Paint Two Bedroom Walls',
    dateLabel: 'Pending review',
    status: 'pending',
    amount: 765,
    grossAmount: 850,
    commissionAmount: 85,
    paymentMethod: null,
  },
];
