import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';
import { initSocket } from './sockets/io';

const server = http.createServer(app);

// Initialize Socket.IO on top of the HTTP server
initSocket(server);

// Connect to MongoDB, then start the server
const start = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB connected successfully.');

    server.listen(config.port, config.host, () => {
      const hostDisplay = config.host === '0.0.0.0' ? 'All Interfaces' : config.host;
      const localAccess = `http://localhost:${config.port}/api`;
      const lanAccess = config.host === '0.0.0.0' ? `http://<LAN_IP>:${config.port}/api` : '';
      
      console.log(`===============================================`);
      console.log(`  Queue Cure Backend Server is running!`);
      console.log(`  Host    : ${hostDisplay}`);
      console.log(`  Port    : ${config.port}`);
      console.log(`  Env     : ${config.nodeEnv}`);
      console.log(`  DB      : MongoDB`);
      console.log(`  Local   : ${localAccess}`);
      if (lanAccess) console.log(`  LAN     : ${lanAccess}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

start();

// ─────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────

const shutdown = async () => {
  console.log('\nShutdown signal received. Starting graceful shutdown...');
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('Shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
