import { Router } from 'express';
import { env } from '../config/env.js';
import { getDatabaseStatus } from '../config/database.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const healthy = dbStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      environment: env.nodeEnv,
      database: dbStatus,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    message: healthy ? 'Service healthy' : 'Database not connected',
  });
});

export default router;
