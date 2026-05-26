import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI não definida no .env');
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconectado');
});
