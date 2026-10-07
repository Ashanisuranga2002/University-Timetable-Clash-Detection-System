import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
async function startServer() {
  const port = Number(process.env.PORT ?? 5001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required. Copy .env.example to .env and configure it.');
  if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET === 'change_this_secret' || process.env.JWT_SECRET.length < 32)) {
    throw new Error('JWT_SECRET must be replaced with a random value of at least 32 characters in production.');
  }
  if (process.env.JWT_SECRET === 'change_this_secret') console.warn('JWT_SECRET is the development placeholder. Replace it before deployment.');
  await connectDatabase();
  const server = app.listen(port, '0.0.0.0', () => console.info(`University Timetable API listening on http://localhost:${port}`));
  const shutdown = signal => {
    console.info(`${signal} received; closing API and MongoDB connection.`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}
void startServer().catch(error => {
  console.error('Backend startup failed:', error);
  process.exitCode = 1;
});
