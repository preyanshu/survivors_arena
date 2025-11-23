import { Achievement } from '../types/game';

// Placeholder image URL - in a real app, these would be IPFS hashes or local assets
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/5a0000/ffffff?text=Achievement';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'survivor_1',
    title: 'Novice Survivor',
    description: 'Survive Wave 1',
    waveRequirement: 1,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763848164/Screenshot_from_2025-11-23_03-18-04_ro60as.png",
  },
  {
    id: 'survivor_5',
    title: 'Apprentice Survivor',
    description: 'Survive Wave 5',
    waveRequirement: 5,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763848604/Screenshot_from_2025-11-23_03-26-31_h43jwv.png",
  },
  {
    id: 'survivor_10',
    title: 'Adept Survivor',
    description: 'Survive Wave 10',
    waveRequirement: 10,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763888495/Screenshot_from_2025-11-23_14-30-33_qu24cx.png",
  },
  {
    id: 'survivor_20',
    title: 'Expert Survivor',
    description: 'Survive Wave 20',
    waveRequirement: 20,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763888678/Screenshot_from_2025-11-23_14-33-53_nr8g7r.png",
  },
  {
    id: 'survivor_50',
    title: 'Legendary Survivor',
    description: 'Survive Wave 50',
    waveRequirement: 50,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763888895/Screenshot_from_2025-11-23_14-38-02_saivg1.png",
  },
  {
    id: 'survivor_100',
    title: 'God of Survival',
    description: 'Survive Wave 100',
    waveRequirement: 100,
    unlocked: false,
    image: "https://res.cloudinary.com/dbo7hzofg/image/upload/v1763889014/Screenshot_from_2025-11-23_14-39-50_tgshbz.png",
  },
];
