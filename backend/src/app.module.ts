import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PatternsModule } from './patterns/patterns.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { BookingModule } from './booking/booking.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PatternsModule,
    AuthModule,
    CatalogModule,
    BookingModule,
    UserModule,
    AdminModule,
  ],
})
export class AppModule {}
