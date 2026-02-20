import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
