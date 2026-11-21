import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterSectionsDto } from './dto/filter-sections.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getFacilities() {
    return this.prisma.facility.findMany({ include: { sections: true } });
  }

  getTrainers() {
    return this.prisma.trainer.findMany({ include: { sections: true } });
  }

  filterSections(filters: FilterSectionsDto) {
    return this.prisma.sportSection.findMany({
      where: {
        sportType: filters.sportType
          ? { equals: filters.sportType, mode: 'insensitive' }
          : undefined,
        skillLevel: filters.skillLevel
          ? { equals: filters.skillLevel, mode: 'insensitive' }
          : undefined,
        ageCategory: filters.ageCategory
          ? { equals: filters.ageCategory, mode: 'insensitive' }
          : undefined,
      },
      include: {
        facility: true,
        trainer: true,
        slots: {
          where: { availableSpots: { gt: 0 } },
          orderBy: { startTime: 'asc' },
        },
      },
    });
  }

  getAvailableSlots(sectionId: string, date?: string) {
    let dateFilter: { gte: Date; lte: Date } | undefined;
    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      dateFilter = { gte: start, lte: end };
    }

    return this.prisma.scheduleSlot.findMany({
      where: {
        sectionId,
        availableSpots: { gt: 0 },
        startTime: dateFilter,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  getActivePromotions() {
    return this.prisma.promotion.findMany({
      where: { validUntil: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}