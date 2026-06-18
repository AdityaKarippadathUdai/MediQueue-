import http from 'http';
import app from './app';
import config from './config';
import { initSocket } from './sockets/io';
import prisma from './prisma/client';

const server = http.createServer(app);

// Initialize Socket.io on top of the HTTP server
initSocket(server);

// Start server
const port = config.port;
server.listen(port, () => {
  console.log(`===============================================`);
  console.log(`  MediQueue Backend Server is running!`);
  console.log(`  Port: ${port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  API Base: http://localhost:${port}/api`);
  console.log(`===============================================`);
});

// Handle graceful shutdown signals
const shutdown = async () => {
  console.log('Shutdown signal received. Starting graceful shutdown process...');
  
  server.close(async () => {
    console.log('Express server closed to new connections.');
    try {
      await prisma.$disconnect();
      console.log('Database connection pool terminated successfully.');
      process.exit(0);
    } catch (err) {
      console.error('Failed to disconnect database clean:', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Shutdown timed out. Forcefully closing processes...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
