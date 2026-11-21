import { Module } from '@nestjs/common';
import { PatternsModule } from '../patterns/patterns.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PatternsModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}