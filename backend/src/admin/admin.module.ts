import { Module } from '@nestjs/common';
import { PatternsModule } from '../patterns/patterns.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PatternsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}