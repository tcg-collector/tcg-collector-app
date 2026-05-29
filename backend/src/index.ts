import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { connectDB } from './config/database';
import routes from './routes';
import { syncPricesOnly } from './services/PokeTCGService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: [
    'https://tcgbindex.app',
    'https://www.tcgbindex.app',
    'https://tcg-collector-app.vercel.app',
    'http://localhost:8081',
    'http://localhost:8083',
    'http://192.168.15.31:8081',
    'http://192.168.15.31:8083',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Bindex TCG API', version: '1.0.0', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  try {
    await connectDB();

    // Cron: atualiza preços todo dia às 06:00 UTC (03:00 BRT)
    cron.schedule('0 6 * * *', async () => {
      console.log('⏰ Cron: iniciando sync diário de preços...');
      try {
        await syncPricesOnly();
      } catch (e) {
        console.error('❌ Erro no cron de preços:', e);
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Bindex TCG API rodando na porta ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`⏰ Cron de preços: todo dia às 06:00 UTC`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
