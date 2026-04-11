import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      message: 'RK_Dodani is running successfully',
      timestamp: new Date().toISOString(),
    };
  }
}