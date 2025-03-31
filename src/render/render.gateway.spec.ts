import { Test, TestingModule } from '@nestjs/testing';
import { RenderGateway } from './render.gateway';
import { RenderService } from './render.service';

describe('RenderGateway', () => {
  let gateway: RenderGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RenderGateway, RenderService],
    }).compile();

    gateway = module.get<RenderGateway>(RenderGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
