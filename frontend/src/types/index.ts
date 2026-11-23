export type UserRole = 'CLIENT' | 'ADMIN';
export type LoyaltyTier = 'STANDARD' | 'PREMIUM' | 'CORPORATE';
export type MembershipType = 'SINGLE' | 'MONTHLY' | 'CORPORATE';
export type MembershipStatus = 'ACTIVE' | 'USED' | 'CANCELLED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type AddonType = 'equipment' | 'pool' | 'trainer';
export type PromotionTarget = 'ALL_SECTIONS' | 'SPORT_TYPE' | 'MEMBERSHIPS';

export interface ActiveMembershipSummary {
  id: string;
  type: MembershipType;
  visitsLeft?: number;
  expiresAt?: string;
  coversBaseSession: boolean;
  coversEquipment: boolean;
  coversPool: boolean;
  benefits: string[];
}

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
  activeMembership?: ActiveMembershipSummary | null;
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
  section?: { id: string; title: string };
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
  targetScope: PromotionTarget;
  targetSportType?: string | null;
  validUntil: string;
}

export interface BookingRecord {
  id: string;
  totalPrice: number;
  promoDiscountPercent?: number;
  usedMembershipType?: MembershipType | null;
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