export interface IPricingStrategy {
  calculateFinalPrice(rawPrice: number): number;
  calculateBonusPoints(finalPrice: number): number;
}

export class StandardPricingStrategy implements IPricingStrategy {
  private readonly bonusRate = 0.05;

  calculateFinalPrice(rawPrice: number): number {
    return Number(rawPrice.toFixed(2));
  }

  calculateBonusPoints(finalPrice: number): number {
    return Math.floor(finalPrice * this.bonusRate);
  }
}

export class PremiumPricingStrategy implements IPricingStrategy {
  private readonly discountRate = 0.15;
  private readonly bonusRate = 0.10;

  calculateFinalPrice(rawPrice: number): number {
    return Number((rawPrice * (1 - this.discountRate)).toFixed(2));
  }

  calculateBonusPoints(finalPrice: number): number {
    return Math.floor(finalPrice * this.bonusRate);
  }
}

export class CorporatePricingStrategy implements IPricingStrategy {
  private readonly discountRate = 0.20;
  private readonly bonusRate = 0.07;

  calculateFinalPrice(rawPrice: number): number {
    return Number((rawPrice * (1 - this.discountRate)).toFixed(2));
  }

  calculateBonusPoints(finalPrice: number): number {
    return Math.floor(finalPrice * this.bonusRate);
  }
}