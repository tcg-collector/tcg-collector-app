import request from 'supertest';
import express from 'express';

// App mínimo para testar sem conectar ao MongoDB
const app = express();
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Bindex TCG API' });
});

describe('GET /health', () => {
  it('retorna status 200 com payload correto', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('Bindex TCG API');
  });
});
