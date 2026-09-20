import mongoose from 'mongoose';

export async function connectMongo() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    throw new Error('MONGO_URL is not set');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  return mongoose.connection;
}
