// ============================================================================
// DevReview — Webhook Server Entry Point
// ============================================================================

import 'dotenv/config';
import { createWebhookServer } from './server/webhook.js';

const githubToken = process.env.GITHUB_TOKEN;
const webhookSecret = process.env.WEBHOOK_SECRET;

if (!githubToken || !webhookSecret) {
  console.error('Required env vars: GITHUB_TOKEN, WEBHOOK_SECRET');
  process.exit(1);
}

const server = createWebhookServer({
  githubToken,
  webhookSecret,
  port: parseInt(process.env.PORT || '3000'),
});

server.start();
