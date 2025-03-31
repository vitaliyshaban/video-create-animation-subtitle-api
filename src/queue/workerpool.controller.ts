import { Controller, Post } from '@nestjs/common';
import { WorkerpoolService } from './workerpool.service';

@Controller()
export class WorkerpoolController {
  constructor(private readonly workerpoolService: WorkerpoolService) {}
  @Post('process-image')
  async processImages() {
    try {
      const overlay = await this.workerpoolService.processImage();
      const result = await this.workerpoolService.createFinalVideo(overlay);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
