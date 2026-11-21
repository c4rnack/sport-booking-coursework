import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { FilterSectionsDto } from './dto/filter-sections.dto';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('facilities')
  getFacilities() {
    return this.catalogService.getFacilities();
  }

  @Get('trainers')
  getTrainers() {
    return this.catalogService.getTrainers();
  }

  @Get('sections')
  filterSections(@Query() filters: FilterSectionsDto) {
    return this.catalogService.filterSections(filters);
  }

  @Get('sections/:id/slots')
  @ApiQuery({ name: 'date', required: false, example: '2026-11-22' })
  getSlots(@Param('id') sectionId: string, @Query('date') date?: string) {
    return this.catalogService.getAvailableSlots(sectionId, date);
  }

  @Get('promotions')
  getPromotions() {
    return this.catalogService.getActivePromotions();
  }
}