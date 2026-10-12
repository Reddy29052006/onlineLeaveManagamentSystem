import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import app from './app.js';
import { initWebSocketServer } from './services/websocket.service.js';

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(env.port, () => {
      console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
      console.log(`[server] health check: http://localhost:${env.port}/api/v1/health`);
    });

    // Initialize real-time WebSocket server
    initWebSocketServer(server);

    const shutdown = async (signal) => {
      console.log(`\n[server] ${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('[server] shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[server] failed to start:', error.message);
    process.exit(1);
  }
}

bootstrap();
