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
  constructor(wrappee: IBookingComponent, private readonly equipmentFee = 120) {
    super(wrappee);
  }

  getCost(): number {
    return this.wrappee.getCost() + this.equipmentFee;
  }

  getDescription(): string {
    return `${this.wrappee.getDescription()} + Equipment Rental`;
  }
}

export class PoolAccessDecorator extends BookingDecorator {
  constructor(
    wrappee: IBookingComponent,
    private readonly isFreeForPremium: boolean,
    private readonly poolFee = 180,
  ) {
    super(wrappee);
  }

  getCost(): number {
    return this.wrappee.getCost() + (this.isFreeForPremium ? 0 : this.poolFee);
  }

  getDescription(): string {
    const suffix = this.isFreeForPremium ? ' (Free with Premium Card)' : '';
    return `${this.wrappee.getDescription()} + Pool Access${suffix}`;
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
    return `${this.wrappee.getDescription()} + Personal Trainer`;
  }
}