import {
  BookingStatus,
  LoyaltyTier,
  MembershipStatus,
  MembershipType,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function daysFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('1. Clearing db...');
  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.sportSection.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  console.log('2. Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const [admin, premiumClient, standardClient, corpClient, newbieClient] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'Євгеній Адміністратор',
        email: 'admin@sportclub.ua',
        passwordHash,
        phone: '+380670000001',
        preferences: ['football', 'fitness'],
        role: UserRole.ADMIN,
        loyaltyTier: LoyaltyTier.CORPORATE,
        bonusPoints: 500,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Ірина Коваль',
        email: 'client@sportclub.ua',
        passwordHash,
        phone: '+380671112233',
        preferences: ['yoga', 'swimming'],
        role: UserRole.CLIENT,
        loyaltyTier: LoyaltyTier.PREMIUM,
        bonusPoints: 340,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Максим Савченко',
        email: 'standard@sportclub.ua',
        passwordHash,
        phone: '+380932223344',
        preferences: ['football', 'fitness'],
        role: UserRole.CLIENT,
        loyaltyTier: LoyaltyTier.STANDARD,
        bonusPoints: 265,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Олена Ткаченко',
        email: 'corp@sportclub.ua',
        passwordHash,
        phone: '+380503334455',
        preferences: ['swimming', 'yoga'],
        role: UserRole.CLIENT,
        loyaltyTier: LoyaltyTier.CORPORATE,
        bonusPoints: 180,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'Тарас Бойко',
        email: 'newbie@sportclub.ua',
        passwordHash,
        phone: '+380974445566',
        preferences: ['fitness'],
        role: UserRole.CLIENT,
        loyaltyTier: LoyaltyTier.STANDARD,
        bonusPoints: 45,
      },
    }),
  ]);

  console.log('3. Creating sport halls...');
  const [arenaHall, aquaHall, yogaStudio, fitnessClub, youthCenter] = await Promise.all([
    prisma.facility.create({
      data: {
        name: 'Арена «СпортЛайф» (Футбольний манеж)',
        address: 'вул. Спортивна, 12',
        sportType: 'football',
        capacity: 24,
        baseHourlyRate: 650,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Аквакомплекс «Хвиля» (Басейн 50м)',
        address: 'пр. Чорновола, 45',
        sportType: 'swimming',
        capacity: 20,
        baseHourlyRate: 500,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Студія «Гармонія» (Зал йоги)',
        address: 'вул. Сахарова, 23',
        sportType: 'yoga',
        capacity: 16,
        baseHourlyRate: 400,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Фітнес-клуб «Імпульс»',
        address: 'вул. Наукова, 7Б',
        sportType: 'fitness',
        capacity: 30,
        baseHourlyRate: 450,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Дитячий спортцентр «Старт»',
        address: 'вул. Стрийська, 88',
        sportType: 'football',
        capacity: 18,
        baseHourlyRate: 350,
      },
    }),
  ]);

  console.log('4. Creating trainers...');
  const [tFootball, tYoga, tSwimming, tFitness, tCrossfit, tKids] = await Promise.all([
    prisma.trainer.create({
      data: { fullName: 'Андрій Шевчук', specialization: 'Футбол / Міні-футбол', rating: 4.9 },
    }),
    prisma.trainer.create({
      data: { fullName: 'Анна Мельник', specialization: 'Хатха-йога / Стретчинг', rating: 5.0 },
    }),
    prisma.trainer.create({
      data: { fullName: 'Дмитро Бондар', specialization: 'Спортивне плавання / Аквааеробіка', rating: 4.8 },
    }),
    prisma.trainer.create({
      data: { fullName: 'Вікторія Лисенко', specialization: 'Функціональний фітнес / Пілатес', rating: 4.9 },
    }),
    prisma.trainer.create({
      data: { fullName: 'Роман Кравчук', specialization: 'Кросфіт / Силова підготовка', rating: 4.7 },
    }),
    prisma.trainer.create({
      data: { fullName: 'Софія Романюк', specialization: 'Дитяча акробатика та плавання', rating: 5.0 },
    }),
  ]);

  console.log('5. Creating sport sections...');
  const now = new Date();
  const soonStart = addHours(now, 6);
  const soonEnd = addHours(soonStart, 1.5);
  const soon2Start = addHours(now, 14);
  const soon2End = addHours(soon2Start, 1.5);

  const secYogaEvening = await prisma.sportSection.create({
    data: {
      title: 'Вечірня Хатха-йога',
      sportType: 'yoga',
      skillLevel: 'beginner',
      ageCategory: 'adult',
      basePrice: 350,
      facilityId: yogaStudio.id,
      trainerId: tYoga.id,
      slots: {
        create: [
          { startTime: soonStart, endTime: soonEnd, availableSpots: 10 },
          { startTime: daysFromNow(2, 18, 30), endTime: daysFromNow(2, 20, 0), availableSpots: 12 },
          { startTime: daysFromNow(4, 18, 30), endTime: daysFromNow(4, 20, 0), availableSpots: 14 },
        ],
      },
    },
    include: { slots: true },
  });

  const secYogaPro = await prisma.sportSection.create({
    data: {
      title: 'Аштанга-йога Інтенсив',
      sportType: 'yoga',
      skillLevel: 'pro',
      ageCategory: 'adult',
      basePrice: 450,
      facilityId: yogaStudio.id,
      trainerId: tYoga.id,
      slots: {
        create: [
          { startTime: daysFromNow(1, 8, 0), endTime: daysFromNow(1, 9, 30), availableSpots: 8 },
          { startTime: daysFromNow(3, 8, 0), endTime: daysFromNow(3, 9, 30), availableSpots: 1 }, // Останнє місце!
        ],
      },
    },
    include: { slots: true },
  });

  const secSwimAdult = await prisma.sportSection.create({
    data: {
      title: 'Спортивне плавання (Дорослі)',
      sportType: 'swimming',
      skillLevel: 'intermediate',
      ageCategory: 'adult',
      basePrice: 420,
      facilityId: aquaHall.id,
      trainerId: tSwimming.id,
      slots: {
        create: [
          { startTime: soon2Start, endTime: soon2End, availableSpots: 9 },
          { startTime: daysFromNow(2, 7, 30), endTime: daysFromNow(2, 9, 0), availableSpots: 12 },
          { startTime: daysFromNow(4, 19, 0), endTime: daysFromNow(4, 20, 30), availableSpots: 10 },
        ],
      },
    },
    include: { slots: true },
  });

  const secSwimKids = await prisma.sportSection.create({
    data: {
      title: 'Школа плавання для дітей',
      sportType: 'swimming',
      skillLevel: 'beginner',
      ageCategory: 'kids',
      basePrice: 300,
      facilityId: aquaHall.id,
      trainerId: tKids.id,
      slots: {
        create: [
          { startTime: daysFromNow(1, 15, 0), endTime: daysFromNow(1, 16, 0), availableSpots: 12 },
          { startTime: daysFromNow(3, 15, 0), endTime: daysFromNow(3, 16, 0), availableSpots: 12 },
        ],
      },
    },
    include: { slots: true },
  });

  const secFootballAmateur = await prisma.sportSection.create({
    data: {
      title: 'Міні-футбол (Аматорська ліга)',
      sportType: 'football',
      skillLevel: 'intermediate',
      ageCategory: 'adult',
      basePrice: 520,
      facilityId: arenaHall.id,
      trainerId: tFootball.id,
      slots: {
        create: [
          { startTime: daysFromNow(1, 20, 0), endTime: daysFromNow(1, 21, 30), availableSpots: 10 },
          { startTime: daysFromNow(3, 20, 0), endTime: daysFromNow(3, 21, 30), availableSpots: 12 },
          { startTime: daysFromNow(-3, 20, 0), endTime: daysFromNow(-3, 21, 30), availableSpots: 4 }, // Минулий слот
        ],
      },
    },
    include: { slots: true },
  });

  const secFootballTeens = await prisma.sportSection.create({
    data: {
      title: 'Юнацька академія футболу (U-16)',
      sportType: 'football',
      skillLevel: 'pro',
      ageCategory: 'teens',
      basePrice: 380,
      facilityId: arenaHall.id,
      trainerId: tFootball.id,
      slots: {
        create: [
          { startTime: daysFromNow(2, 16, 30), endTime: daysFromNow(2, 18, 0), availableSpots: 14 },
          { startTime: daysFromNow(5, 16, 30), endTime: daysFromNow(5, 18, 0), availableSpots: 14 },
        ],
      },
    },
    include: { slots: true },
  });

  const secFootballKids = await prisma.sportSection.create({
    data: {
      title: 'Футбол для найменших (6–10 років)',
      sportType: 'football',
      skillLevel: 'beginner',
      ageCategory: 'kids',
      basePrice: 260,
      facilityId: youthCenter.id,
      trainerId: tKids.id,
      slots: {
        create: [
          { startTime: daysFromNow(1, 16, 0), endTime: daysFromNow(1, 17, 0), availableSpots: 15 },
          { startTime: daysFromNow(4, 16, 0), endTime: daysFromNow(4, 17, 0), availableSpots: 15 },
        ],
      },
    },
    include: { slots: true },
  });

  const secFitnessStart = await prisma.sportSection.create({
    data: {
      title: 'Функціональний фітнес Start',
      sportType: 'fitness',
      skillLevel: 'beginner',
      ageCategory: 'adult',
      basePrice: 340,
      facilityId: fitnessClub.id,
      trainerId: tFitness.id,
      slots: {
        create: [
          { startTime: daysFromNow(1, 18, 0), endTime: daysFromNow(1, 19, 0), availableSpots: 16 },
          { startTime: daysFromNow(3, 18, 0), endTime: daysFromNow(3, 19, 0), availableSpots: 18 },
        ],
      },
    },
    include: { slots: true },
  });

  const secCrossfitPro = await prisma.sportSection.create({
    data: {
      title: 'CrossFit Hardcore WOD',
      sportType: 'fitness',
      skillLevel: 'pro',
      ageCategory: 'adult',
      basePrice: 580,
      facilityId: fitnessClub.id,
      trainerId: tCrossfit.id,
      slots: {
        create: [
          { startTime: daysFromNow(2, 19, 30), endTime: daysFromNow(2, 21, 0), availableSpots: 8 },
          { startTime: daysFromNow(5, 19, 30), endTime: daysFromNow(5, 21, 0), availableSpots: 10 },
        ],
      },
    },
    include: { slots: true },
  });

  const secFitnessTeens = await prisma.sportSection.create({
    data: {
      title: 'Підліткова ОФП та силова гімнастика',
      sportType: 'fitness',
      skillLevel: 'intermediate',
      ageCategory: 'teens',
      basePrice: 290,
      facilityId: youthCenter.id,
      trainerId: tFitness.id,
      slots: {
        create: [
          { startTime: daysFromNow(2, 17, 0), endTime: daysFromNow(2, 18, 0), availableSpots: 12 },
          { startTime: daysFromNow(4, 17, 0), endTime: daysFromNow(4, 18, 0), availableSpots: 12 },
        ],
      },
    },
    include: { slots: true },
  });

  console.log('6. Creating memberships...');
  await prisma.membership.createMany({
    data: [
      {
        userId: premiumClient.id,
        type: MembershipType.MONTHLY,
        status: MembershipStatus.ACTIVE,
        price: 2200,
        expiresAt: daysFromNow(25, 23, 59),
      },
      {
        userId: premiumClient.id,
        type: MembershipType.SINGLE,
        status: MembershipStatus.CANCELLED,
        price: 400,
        visitsLeft: 0,
        expiresAt: daysFromNow(-5, 23, 59),
      },
      {
        userId: standardClient.id,
        type: MembershipType.SINGLE,
        status: MembershipStatus.ACTIVE,
        price: 400,
        visitsLeft: 1,
        expiresAt: daysFromNow(6, 23, 59),
      },
      {
        userId: corpClient.id,
        type: MembershipType.CORPORATE,
        status: MembershipStatus.ACTIVE,
        price: 12000,
        companyName: 'SoftTech Ukraine',
        maxEmployees: 15,
        expiresAt: daysFromNow(80, 23, 59),
      },
    ],
  });

  console.log('7. Creating test bookings...');
  await prisma.booking.createMany({
    data: [
      {
        userId: premiumClient.id,
        sectionId: secYogaEvening.id,
        slotId: secYogaEvening.slots[0].id,
        totalPrice: 297.5,
        bonusPointsUsed: 0,
        appliedAddons: [],
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
      },
      {
        userId: premiumClient.id,
        sectionId: secSwimAdult.id,
        slotId: secSwimAdult.slots[0].id,
        totalPrice: 459,
        bonusPointsUsed: 0,
        appliedAddons: ['pool', 'equipment'],
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
      },
      {
        userId: standardClient.id,
        sectionId: secFootballAmateur.id,
        slotId: secFootballAmateur.slots[0].id,
        totalPrice: 540,
        bonusPointsUsed: 100,
        appliedAddons: ['equipment'],
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
      },
      {
        userId: standardClient.id,
        sectionId: secFootballAmateur.id,
        slotId: secFootballAmateur.slots[2].id,
        totalPrice: 520,
        bonusPointsUsed: 0,
        appliedAddons: [],
        status: BookingStatus.COMPLETED,
        reminderSent: true,
      },
      {
        userId: corpClient.id,
        sectionId: secYogaPro.id,
        slotId: secYogaPro.slots[0].id,
        totalPrice: 640,
        bonusPointsUsed: 0,
        appliedAddons: ['trainer'],
        status: BookingStatus.CONFIRMED,
        reminderSent: false,
      },
      {
        userId: newbieClient.id,
        sectionId: secFitnessStart.id,
        slotId: secFitnessStart.slots[0].id,
        totalPrice: 340,
        bonusPointsUsed: 0,
        appliedAddons: [],
        status: BookingStatus.CANCELLED,
        reminderSent: false,
      },
    ],
  });

  console.log('8. Creating promotions...');
  await prisma.promotion.createMany({
    data: [
      {
        title: 'Зимовий заряд на плавання',
        description: 'Отримайте -20% на всі абонементи та ранкові секції в Аквакомплексі «Хвиля»!',
        discountPercent: 20,
        validUntil: daysFromNow(30, 23, 59),
      },
      {
        title: 'Приведи друга на CrossFit',
        description: 'Знижка -15% на парні вечірні тренування у фітнес-клубі «Імпульс».',
        discountPercent: 15,
        validUntil: daysFromNow(21, 23, 59),
      },
      {
        title: 'Сімейний вікенд у «Старті»',
        description: 'Додаткові бонуси та -10% на дитячі секції футболу й плавання у суботу та неділю.',
        discountPercent: 10,
        validUntil: daysFromNow(45, 23, 59),
      },
    ],
  });

  console.log('9. Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: premiumClient.id,
        eventType: 'LOYALTY_UPGRADED',
        title: 'Вітаємо! Ваш статус PREMIUM активний',
        message: 'Ви маєте постійну знижку -15%, 10% кешбеку та безкоштовний доступ до басейну на секціях плавання.',
        isRead: true,
      },
      {
        userId: premiumClient.id,
        eventType: 'BOOKING_CONFIRMED',
        title: 'Бронювання підтверджено',
        message: 'Спортивне плавання (Дорослі) + Equipment Rental + Pool Access (Free with Premium Card). Оплачено: 459 грн.',
        isRead: false,
      },
      {
        userId: premiumClient.id,
        eventType: 'BONUS_ACCRUED',
        title: 'Нараховано бонусні бали',
        message: 'Ви отримали +45 бонусних балів за останнє бронювання!',
        isRead: false,
      },
      {
        userId: standardClient.id,
        eventType: 'BONUS_ACCRUED',
        title: 'Ще трохи до статусу PREMIUM!',
        message: 'На вашому рахунку 265 балів. Накопичте 300 балів, щоб отримати знижку -15% та безкоштовний басейн.',
        isRead: false,
      },
      {
        userId: standardClient.id,
        eventType: 'PROMOTION_PUBLISHED',
        title: 'Акція: Зимовий заряд на плавання (-20%)',
        message: 'Отримайте -20% на всі абонементи та ранкові секції в Аквакомплексі «Хвиля»!',
        isRead: false,
      },
      {
        userId: corpClient.id,
        eventType: 'MEMBERSHIP_PURCHASED',
        title: 'Корпоративний абонемент активовано',
        message: 'Абонемент CORPORATE (SoftTech Ukraine) активний на 90 днів. Ваша знижка на бронювання: -20%.',
        isRead: false,
      },
    ],
  });

  console.log('Database is cleared and new test data added');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());