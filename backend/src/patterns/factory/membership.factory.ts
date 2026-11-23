import { BadRequestException, Injectable } from '@nestjs/common';
import { MembershipType } from '@prisma/client';

export interface IMembership {
  getType(): MembershipType;
  getPrice(): number;
  getDurationDays(): number;
  isValid(): boolean;
  coversBaseSession(): boolean;
  coversEquipment(): boolean;
  coversPool(): boolean;
  getBenefits(): string[];
  getMetadata(): { visitsLeft?: number; expiresAt?: Date; companyName?: string; maxEmployees?: number };
}

export class SinglePass implements IMembership {
  private visitsLeft = 1;
  getType() { return MembershipType.SINGLE; }
  getPrice() { return 400; }
  getDurationDays() { return 7; }
  isValid() { return this.visitsLeft > 0; }
  coversBaseSession() { return true; }
  coversEquipment() { return true; }
  coversPool() { return false; }
  getBenefits() {
    return [
      '1 безкоштовний візит у будь-який зал або секцію',
      'Безкоштовна оренда спортивного інвентарю на заняття',
      'Діє протягом 7 днів з моменту активації',
    ];
  }
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
  coversBaseSession() { return true; }
  coversEquipment() { return true; }
  coversPool() { return true; }
  getBenefits() {
    return [
      'Безлімітний вхід до всіх спортивних залів і секцій на 30 днів',
      'Безкоштовна оренда інвентарю на кожне тренування',
      'Безкоштовний доступ до басейну на секціях плавання',
    ];
  }
  getMetadata() { return { expiresAt: this.expiresAt }; }
}

export class CorporatePass implements IMembership {
  constructor(private readonly companyName = 'Partner Corp', private readonly maxEmployees = 10) {}
  getType() { return MembershipType.CORPORATE; }
  getPrice() { return 12000; }
  getDurationDays() { return 90; }
  isValid() { return true; }
  coversBaseSession() { return true; }
  coversEquipment() { return true; }
  coversPool() { return true; }
  getBenefits() {
    return [
      'Усі привілеї Місячного безліміту (зали, секції, інвентар, басейн) на 90 днів',
      'Командний доступ до 10 співробітників компанії',
      'Автоматична картка CORPORATE (-20% на персонального тренера)',
    ];
  }
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