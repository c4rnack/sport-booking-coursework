import { Injectable } from '@nestjs/common';
import { LoyaltyTier } from '@prisma/client';
import {
  CorporatePricingStrategy,
  IPricingStrategy,
  PremiumPricingStrategy,
  StandardPricingStrategy,
} from '../strategy/pricing.strategy';

export interface ILoyaltyCard {
  getTierName(): LoyaltyTier;
  hasFreePoolAccess(): boolean;
  getPricingStrategy(): IPricingStrategy;
}

export class StandardCard implements ILoyaltyCard {
  getTierName() { return LoyaltyTier.STANDARD; }
  hasFreePoolAccess() { return false; }
  getPricingStrategy() { return new StandardPricingStrategy(); }
}

export class PremiumCard implements ILoyaltyCard {
  getTierName() { return LoyaltyTier.PREMIUM; }
  hasFreePoolAccess() { return true; }
  getPricingStrategy() { return new PremiumPricingStrategy(); }
}

export class CorporateCard implements ILoyaltyCard {
  getTierName() { return LoyaltyTier.CORPORATE; }
  hasFreePoolAccess() { return false; }
  getPricingStrategy() { return new CorporatePricingStrategy(); }
}

@Injectable()
export class LoyaltyCardFactory {
  createCard(tier: LoyaltyTier): ILoyaltyCard {
    switch (tier) {
      case LoyaltyTier.PREMIUM:
        return new PremiumCard();
      case LoyaltyTier.CORPORATE:
        return new CorporateCard();
      default:
        return new StandardCard();
    }
  }
}