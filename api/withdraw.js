const usersWithdraw = require('./db');

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { userId, amount, method } = req.body;
  if (!userId || !amount || !method) return res.status(400).json({error:'Missing fields'});
  if (!usersWithdraw[userId]) usersWithdraw[userId] = { points: 0, invites: 0, log: [], withdrawRequests: [] };
  const user = usersWithdraw[userId];
  if (user.points < amount) return res.status(400).json({error:'Not enough points'});
  user.points -= amount;
  user.withdrawRequests.push({ amount, method, time: new Date().toLocaleString() });
  res.status(200).json({ balance: user.points, message: 'Withdrawal requested' });
}
