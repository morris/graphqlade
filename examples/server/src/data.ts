import { BossData, LocationData, ReviewData } from './types';

export const bosses: BossData[] = [
  { id: 1, name: 'Asylum Demon', required: true, locationId: 11 },
  { id: 2, name: 'Taurus Demon', required: false, locationId: 12 },
  { id: 3, name: 'Bell Gargoyles', required: true, locationId: 13 },
];

export const locations: LocationData[] = [
  { id: 11, name: 'Northern Undead Asylum' },
  { id: 12, name: 'Undead Burg' },
  { id: 13, name: 'Undead Parish' },
];

export const reviews: ReviewData[] = [
  {
    id: 'b237b0b4-e514-4aad-ad9a-322aea966e79',
    subjectId: 1,
    subjectType: 1,
    time: new Date(),
    author: 'undead42',
    difficulty: 'okayish',
    theme: 5,
  },
  {
    id: 'b237b0b4-e514-4aad-ad9a-322aea966e74',
    subjectId: 13,
    subjectType: 2,
    time: new Date(),
    author: 'undead42',
    difficulty: 'hard',
    design: 4,
  },
];
