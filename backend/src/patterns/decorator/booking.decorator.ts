export interface IBookingComponent {
  getCost(): number;
  getDescription(): string;
}

export class BaseBookingComponent implements IBookingComponent {
  constructor(
    private readonly basePrice: number,
    private readonly title: string,
  ) {}

  getCost(): number {
    return this.basePrice;
  }

  getDescription(): string {
    return this.title;
  }
}

export abstract class BookingDecorator implements IBookingComponent {
  constructor(protected readonly wrappee: IBookingComponent) {}

  getCost(): number {
    return this.wrappee.getCost();
  }

  getDescription(): string {
    return this.wrappee.getDescription();
  }
}

export class EquipmentRentalDecorator extends BookingDecorator {
  constructor(
    wrappee: IBookingComponent,
    private readonly isFreeByMembership = false,
    private readonly equipmentFee = 120,
  ) {
    super(wrappee);
  }

  getCost(): number {
    return this.wrappee.getCost() + (this.isFreeByMembership ? 0 : this.equipmentFee);
  }

  getDescription(): string {
    const suffix = this.isFreeByMembership ? ' (Включено в абонемент)' : '';
    return `${this.wrappee.getDescription()} + Інвентар${suffix}`;
  }
}

export class PoolAccessDecorator extends BookingDecorator {
  constructor(
    wrappee: IBookingComponent,
    private readonly isFree: boolean,
    private readonly freeReason = 'Premium / Абонемент',
    private readonly poolFee = 180,
  ) {
    super(wrappee);
  }

  getCost(): number {
    return this.wrappee.getCost() + (this.isFree ? 0 : this.poolFee);
  }

  getDescription(): string {
    const suffix = this.isFree ? ` (0 грн — ${this.freeReason})` : '';
    return `${this.wrappee.getDescription()} + Басейн${suffix}`;
  }
}

export class PersonalTrainerDecorator extends BookingDecorator {
  constructor(wrappee: IBookingComponent, private readonly trainerFee = 350) {
    super(wrappee);
  }

  getCost(): number {
    return this.wrappee.getCost() + this.trainerFee;
  }

  getDescription(): string {
    return `${this.wrappee.getDescription()} + Персональний тренер`;
  }
}