import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { logger } from './lib/logger.js';

const PORT = process.env['PORT'] ?? 4000;

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
