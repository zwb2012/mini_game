/**
 * 小游戏后端服务入口 — Express + TypeScript
 */
import express from 'express';
import { rankingRouter } from './routes/ranking';
import { userdataRouter } from './routes/userdata';
import { configRouter } from './routes/config';
import { paymentRouter } from './routes/payment';

const app = express();
app.use(express.json());

app.use('/api/ranking', rankingRouter);
app.use('/api/userdata', userdataRouter);
app.use('/api/config', configRouter);
app.use('/api/payment', paymentRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
