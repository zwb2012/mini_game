import { Router } from 'express';

export const rankingRouter = Router();

interface RankEntry {
  userId: string; score: number; metadata?: Record<string, unknown>; timestamp: number;
}

const leaderboard = new Map<string, RankEntry[]>();

rankingRouter.post('/submit', (req, res) => {
  const { userId, score, metadata, boardType = 'alltime' } = req.body;
  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'userId and score required' });
  }
  const board = leaderboard.get(boardType) ?? [];
  board.push({ userId, score, metadata, timestamp: Date.now() });
  board.sort((a, b) => b.score - a.score);
  leaderboard.set(boardType, board.slice(0, 1000));
  const rank = board.findIndex(e => e.userId === userId) + 1;
  res.json({ success: true, rank, totalPlayers: board.length });
});

rankingRouter.get('/leaderboard', (req, res) => {
  const { boardType = 'alltime', limit = '50', offset = '0' } = req.query;
  const board = leaderboard.get(boardType as string) ?? [];
  res.json({ entries: board.slice(Number(offset), Number(offset) + Number(limit)), total: board.length });
});
