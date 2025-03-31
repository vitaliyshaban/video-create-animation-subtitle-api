import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RenderModule } from './render/render.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [RenderModule, AuthModule, QueueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
