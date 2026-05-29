import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS explícito — necessário para Safari mobile e Clerk Production
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
  optionsSuccessStatus: 200, // Safari preflight precisa de 200, não 204
};

app.use(cors(corsOptions));

// Responde ao preflight OPTIONS em todas as rotas
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rotas
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Bindex TCG API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Inicia servidor
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Bindex TCG API rodando na porta ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
