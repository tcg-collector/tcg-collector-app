/**
 * Setup global para testes com banco real (MongoDB in-memory).
 *
 * INSTALAÇÃO (rodar uma vez no terminal):
 *   cd backend && npm install --save-dev mongodb-memory-server
 *
 * Este arquivo é carregado automaticamente pelo Jest antes de cada suite.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export async function connect(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

export async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function disconnect(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}
