import { Router } from 'express';

export const userdataRouter = Router();

const userStore = new Map<string, Map<string, { value: unknown; version: number }>>();

userdataRouter.get('/:userId/:key', (req, res) => {
  const data = userStore.get(req.params.userId)?.get(req.params.key);
  if (!data) return res.json({ found: false });
  res.json({ found: true, value: data.value, version: data.version });
});

userdataRouter.put('/:userId/:key', (req, res) => {
  const { userId, key } = req.params;
  const { value, version } = req.body;
  if (!userStore.has(userId)) userStore.set(userId, new Map());
  const existing = userStore.get(userId)!.get(key);
  if (existing && version !== undefined && existing.version !== version) {
    return res.status(409).json({ error: 'version conflict', serverVersion: existing.version });
  }
  const newVersion = (existing?.version ?? 0) + 1;
  userStore.get(userId)!.set(key, { value, version: newVersion });
  res.json({ success: true, version: newVersion });
});
