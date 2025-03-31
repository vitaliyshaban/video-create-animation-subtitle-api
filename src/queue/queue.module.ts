import { Module } from '@nestjs/common';
import { WorkerpoolService } from './workerpool.service';
import { WorkerpoolController } from './workerpool.controller';

@Module({
  controllers: [WorkerpoolController],
  imports: [],
  providers: [WorkerpoolService],
})
export class QueueModule {}
