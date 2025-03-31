import { Module } from '@nestjs/common';
import { RenderService } from './render.service';
import { RenderGateway } from './render.gateway';

@Module({
  providers: [RenderGateway, RenderService],
})
export class RenderModule {}
