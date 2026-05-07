import { Router } from 'express';

export const configRouter = Router();

const defaultConfig: Record<string, unknown> = {
  shakeStages: [
    { duration: 15, amplitude: 2, frequency: 0.5 },
    { duration: 15, amplitude: 5, frequency: 1.0 },
    { duration: 15, amplitude: 10, frequency: 1.5 },
    { duration: 15, amplitude: 15, frequency: 2.0 },
  ],
  reviveAdCooldown: 120,
  itemPool: ['book', 'box', 'plate', 'cup', 'pot', 'vase', 'lamp', 'ball'],
};

configRouter.get('/:project', (req, res) => {
  res.json({
    project: req.params.project,
    version: (req.query.version as string) ?? '1.0.0',
    config: defaultConfig,
    featureFlags: { ranking: true, reviveAd: true, stabilizerAd: true },
    abGroup: Math.random() > 0.5 ? 'A' : 'B',
  });
});
