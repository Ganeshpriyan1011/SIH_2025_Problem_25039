import React from 'react';
import { HazardType } from './types';

export const HAZARD_TYPES: HazardType[] = [
  HazardType.Tsunami,
  HazardType.StormSurge,
  HazardType.HighWaves,
  HazardType.CoastalCurrents,
  HazardType.SwellSurge,
  HazardType.CoastalFlooding,
  HazardType.Other,
];

export const HAZARD_COLORS: { [key in HazardType]: string } = {
  [HazardType.Tsunami]: 'bg-red-500',
  [HazardType.StormSurge]: 'bg-orange-500',
  [HazardType.HighWaves]: 'bg-yellow-500',
  [HazardType.CoastalCurrents]: 'bg-cyan-500',
  [HazardType.SwellSurge]: 'bg-blue-500',
  [HazardType.CoastalFlooding]: 'bg-purple-500',
  [HazardType.Other]: 'bg-gray-500',
};

export const HAZARD_HEX_COLORS: { [key in HazardType]: string } = {
  [HazardType.Tsunami]: '#ef4444',       // red-500
  [HazardType.StormSurge]: '#f97316',    // orange-500
  [HazardType.HighWaves]: '#eab308',     // yellow-500
  [HazardType.CoastalCurrents]: '#06b6d4', // cyan-500
  [HazardType.SwellSurge]: '#3b82f6',     // blue-500
  [HazardType.CoastalFlooding]: '#a855f7',// purple-500
  [HazardType.Other]: '#6b7280',         // gray-500
};

export const SENTIMENT_COLORS: { [key: string]: string } = {
    Positive: 'text-green-400',
    Negative: 'text-red-400',
    Neutral: 'text-gray-400'
};

// FIX: Replaced JSX with React.createElement because .ts files do not support JSX syntax.
// This resolves parsing errors and type mismatches.
export const SOCIAL_ICONS: { [key: string]: React.ReactElement } = {
    X: React.createElement('ion-icon', {name: "logo-twitter", style:{color: '#1DA1F2'}}),
    Reddit: React.createElement('ion-icon', {name: "logo-reddit", style:{color: '#FF4500'}}),
    Facebook: React.createElement('ion-icon', {name: "logo-facebook", style:{color: '#1877F2'}})
};

// Bounding box for India's coastline for random report generation
export const INDIA_COASTLINE_BOUNDS = {
  minLat: 8.0,
  maxLat: 23.0,
  minLng: 68.0,
  maxLng: 90.0,
};