import { Controller, Get, Header } from '@nestjs/common';
import { APP_CONFIG } from './config/app.config';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Header('Content-Type', 'text/html')
  getApiInfo(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_CONFIG.name}</title>

  <style>
    :root {
      --bg: #0f172a;
      --card: #020617;
      --text: #e5e7eb;
      --muted: #94a3b8;
      --primary: #38bdf8;
      --success: #22c55e;
      --border: #1e293b;
    }

    * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }

    body {
      margin: 0;
      background: radial-gradient(circle at top, #020617, #000);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }

    .container {
      max-width: 720px;
      width: 100%;
      padding: 24px;
    }

    .card {
      background: linear-gradient(180deg, #020617, #020617);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 30px 80px rgba(0,0,0,.6);
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: .5px;
      margin-bottom: 4px;
    }

    .tagline {
      color: var(--muted);
      margin-bottom: 24px;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(56,189,248,.15);
      color: var(--primary);
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }

    .info-item {
      background: #020617;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }

    .info-item span {
      display: block;
      font-size: 12px;
      color: var(--muted);
    }

    .info-item strong {
      font-size: 16px;
      font-weight: 600;
    }

    .links a {
      display: block;
      padding: 14px 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      color: var(--text);
      text-decoration: none;
      margin-bottom: 12px;
      transition: all .2s ease;
    }

    .links a:hover {
      border-color: var(--primary);
      background: rgba(56,189,248,.05);
      transform: translateY(-1px);
    }

    footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>

<body>
  <div class="container">
    <div class="card">
    <h1>${APP_CONFIG.name}</h1>
      <div class="tagline">
      ${APP_CONFIG.description}
      </div>

      <div class="badge">Backend Service</div>

      <div class="info">
        <div class="info-item">
          <span>Version</span>
          <strong>v${APP_CONFIG.version}</strong>
        </div>

        <div class="info-item">
          <span>Environment</span>
          <strong>${process.env.NODE_ENV ?? 'development'}</strong>
        </div>

        <div class="info-item">
          <span>Framework</span>
          <strong>NestJS</strong>
        </div>

        <div class="info-item">
          <span>Status</span>
          <strong style="color: var(--success)">● Online</strong>
        </div>
      </div>

      <div class="links">

        <a href="/docs">📘 API Documentation</a>
        <a href="/health">❤️ Health Check</a>
        <a href="/v${APP_CONFIG.version.split('.')[0]}">🔗 API Base URL</a>
      </div>

      <footer>
        © ${new Date().getFullYear()} AgentArum AI • All rights reserved
      </footer>
    </div>
  </div>
</body>
</html>
    `;
  }
}
