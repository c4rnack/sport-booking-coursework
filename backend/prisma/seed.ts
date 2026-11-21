import { PrismaClient, LoyaltyTier, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@sportclub.ua' },
    update: {},
    create: {
      fullName: 'Євгеній Адмін',
      email: 'admin@sportclub.ua',
      passwordHash,
      role: UserRole.ADMIN,
      loyaltyTier: LoyaltyTier.CORPORATE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'client@sportclub.ua' },
    update: {},
    create: {
      fullName: 'Ірина Коваль',
      email: 'client@sportclub.ua',
      passwordHash,
      phone: '+380671112233',
      preferences: ['yoga', 'swimming'],
      role: UserRole.CLIENT,
      loyaltyTier: LoyaltyTier.PREMIUM,
      bonusPoints: 120,
    },
  });

  // 2. Зали та тренери
  const arena = await prisma.facility.create({
    data: {
      name: 'Арена Південь (Головний зал)',
      address: 'вул. Спортивна, 12',
      sportType: 'football',
      capacity: 20,
      baseHourlyRate: 600,
    },
  });

  const wellnessHall = await prisma.facility.create({
    data: {
      name: 'Зал Йоги та Басейн',
      address: 'вул. Спортивна, 12, корпус Б',
      sportType: 'yoga',
      capacity: 15,
      baseHourlyRate: 400,
    },
  });

  const trainer1 = await prisma.trainer.create({
    data: { fullName: 'Максим Шевченко', specialization: 'Футбол / Фітнес', rating: 4.9 },
  });

  const trainer2 = await prisma.trainer.create({
    data: { fullName: 'Анна Мельник', specialization: 'Хатха-йога / Плавання', rating: 5.0 },
  });

  // 3. Секції та часові слоти на завтра
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(19, 30, 0, 0);

  await prisma.sportSection.create({
    data: {
      title: 'Вечірня Хатха-йога',
      sportType: 'yoga',
      skillLevel: 'beginner',
      ageCategory: 'adult',
      basePrice: 350,
      facilityId: wellnessHall.id,
      trainerId: trainer2.id,
      slots: {
        create: [
          { startTime: tomorrow, endTime: tomorrowEnd, availableSpots: 12 },
        ],
      },
    },
  });

  await prisma.sportSection.create({
    data: {
      title: 'Міні-футбол (аматори)',
      sportType: 'football',
      skillLevel: 'intermediate',
      ageCategory: 'adult',
      basePrice: 500,
      facilityId: arena.id,
      trainerId: trainer1.id,
      slots: {
        create: [
          { startTime: tomorrow, endTime: tomorrowEnd, availableSpots: 10 },
        ],
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());