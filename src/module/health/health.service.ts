import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      message: 'AgentArum AI API is running...',
      timestamp: new Date().toISOString(),
    };
  }
}

