import { BadRequestException, Injectable } from '@nestjs/common';
import { MembershipType } from '@prisma/client';

export interface IMembership {
  getType(): MembershipType;
  getPrice(): number;
  getDurationDays(): number;
  isValid(): boolean;
  getMetadata(): { visitsLeft?: number; expiresAt?: Date; companyName?: string; maxEmployees?: number };
}

export class SinglePass implements IMembership {
  private visitsLeft = 1;
  getType() { return MembershipType.SINGLE; }
  getPrice() { return 400; }
  getDurationDays() { return 7; }
  isValid() { return this.visitsLeft > 0; }
  getMetadata() {
    const expiresAt = new Date(Date.now() + this.getDurationDays() * 86400000);
    return { visitsLeft: this.visitsLeft, expiresAt };
  }
}

export class MonthlyPass implements IMembership {
  private expiresAt = new Date(Date.now() + 30 * 86400000);
  getType() { return MembershipType.MONTHLY; }
  getPrice() { return 2200; }
  getDurationDays() { return 30; }
  isValid() { return this.expiresAt > new Date(); }
  getMetadata() { return { expiresAt: this.expiresAt }; }
}

export class CorporatePass implements IMembership {
  constructor(private readonly companyName = 'Partner Corp', private readonly maxEmployees = 10) {}
  getType() { return MembershipType.CORPORATE; }
  getPrice() { return 12000; }
  getDurationDays() { return 90; }
  isValid() { return true; }
  getMetadata() {
    const expiresAt = new Date(Date.now() + this.getDurationDays() * 86400000);
    return { expiresAt, companyName: this.companyName, maxEmployees: this.maxEmployees };
  }
}

@Injectable()
export class MembershipFactory {
  createMembership(type: MembershipType, companyName?: string): IMembership {
    switch (type) {
      case MembershipType.SINGLE:
        return new SinglePass();
      case MembershipType.MONTHLY:
        return new MonthlyPass();
      case MembershipType.CORPORATE:
        return new CorporatePass(companyName);
      default:
        throw new BadRequestException(`Unsupported membership type: ${type}`);
    }
  }
}