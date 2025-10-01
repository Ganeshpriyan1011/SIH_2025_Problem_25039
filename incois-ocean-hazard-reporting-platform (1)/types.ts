import React from 'react';

// FIX: Added global type definitions for JSX elements and custom elements.
// This augmentation of the JSX namespace resolves TypeScript errors across the application.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Custom elements
      'ion-icon': React.HTMLAttributes<HTMLElement> & {
        name: string;
        className?: string;
      };
      
      // Standard HTML elements (ensuring they're properly recognized)
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
    }
  }
}


export enum HazardType {
  Tsunami = 'Tsunami',
  StormSurge = 'Storm Surge',
  HighWaves = 'High Waves',
  CoastalCurrents = 'Coastal Currents',
  SwellSurge = 'Swell Surge',
  CoastalFlooding = 'Coastal Flooding',
  Other = 'Other',
}

export enum Role {
  Citizen = 'Citizen',
  Official = 'Official',
  Analyst = 'Analyst',
  SuperAdmin = 'SuperAdmin',
}

export enum ApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isVerified: boolean;
  approvalStatus?: ApprovalStatus; // For officials/analysts awaiting approval
  employeeId?: string; // For officials/analysts
  approvedBy?: string; // Super admin who approved
  approvedAt?: string; // Approval timestamp
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  author: string;
  role: Role;
  hazard: HazardType;
  description: string;
  location: {
    lat: number;
    lng: number;
    name:string;
  };
  timestamp: string;
  image?: string;
  verified: boolean;
  summary: string;
  confidence: number; // Value from 0 to 100
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string; // Official who verified/rejected
  verifiedAt?: string; // Timestamp of verification
  rejectionReason?: string; // Reason for rejection
}

export enum SocialSource {
  Twitter = 'X',
  Reddit = 'Reddit',
  Facebook = 'Facebook',
  YouTube = 'YouTube',
}

export enum Sentiment {
    Positive = 'Positive',
    Negative = 'Negative',
    Neutral = 'Neutral'
}

export interface SocialMediaPost {
  id: string;
  source: SocialSource;
  author: string;
  content: string;
  timestamp: string;
  location: string;
  sentiment: Sentiment;
  keywords: string[];
}

export interface Notification {
  message: string;
  type: 'success' | 'error';
}
