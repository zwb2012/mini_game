import { Router } from 'express';

export const paymentRouter = Router();

interface Order {
  orderId: string; userId: string; productId: string; platform: string; verified: boolean; timestamp: number;
}
const orders = new Map<string, Order>();

paymentRouter.post('/verify', (req, res) => {
  const { userId, receipt, productId, platform } = req.body;
  if (!userId || !receipt) return res.status(400).json({ error: 'userId and receipt required' });
  const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (orders.has(orderId)) return res.json({ success: true, orderId, status: 'duplicate' });
  orders.set(orderId, { orderId, userId, productId: productId ?? 'unknown', platform: platform ?? 'unknown', verified: true, timestamp: Date.now() });
  res.json({ success: true, orderId, status: 'verified' });
});

paymentRouter.get('/order/:orderId', (req, res) => {
  const order = orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'order not found' });
  res.json(order);
});
