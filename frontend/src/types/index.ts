export type UserRole = 'CLIENT' | 'ADMIN';
export type LoyaltyTier = 'STANDARD' | 'PREMIUM' | 'CORPORATE';
export type MembershipType = 'SINGLE' | 'MONTHLY' | 'CORPORATE';
export type MembershipStatus = 'ACTIVE' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type AddonType = 'equipment' | 'pool' | 'trainer';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  preferences?: string[];
  bonusPoints: number;
  role: UserRole;
  loyaltyTier: LoyaltyTier;
  loyaltyBenefits?: {
    tierName: LoyaltyTier;
    freePoolAccess: boolean;
  };
}

export interface Facility {
  id: string;
  name: string;
  address: string;
  sportType: string;
  capacity: number;
  baseHourlyRate: number;
}

export interface Trainer {
  id: string;
  fullName: string;
  specialization: string;
  rating: number;
}

export interface ScheduleSlot {
  id: string;
  sectionId: string;
  startTime: string;
  endTime: string;
  availableSpots: number;
}

export interface SportSection {
  id: string;
  title: string;
  sportType: string;
  skillLevel: string;
  ageCategory: string;
  basePrice: number;
  facility: Facility;
  trainer: Trainer;
  slots: ScheduleSlot[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  validUntil: string;
}

export interface BookingRecord {
  id: string;
  totalPrice: number;
  bonusPointsUsed?: number;
  appliedAddons: string[];
  status: BookingStatus;
  createdAt: string;
  section: SportSection;
  slot: ScheduleSlot;
  user?: { id: string; fullName: string; email: string; loyaltyTier: LoyaltyTier };
}

export interface MembershipRecord {
  id: string;
  type: MembershipType;
  status: MembershipStatus;
  price: number;
  visitsLeft?: number;
  expiresAt?: string;
  companyName?: string;
  maxEmployees?: number;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  eventType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}