import mongoose from 'mongoose';
export async function connectDatabase(uri = process.env.MONGO_URI ?? process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is required. Copy .env.example to .env and configure it.');
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });
  console.info(`MongoDB connected to database "${mongoose.connection.name}".`);
}
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
