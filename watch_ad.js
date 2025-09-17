const usersWatch = {};

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { userId } = req.body;
  if (!usersWatch[userId]) usersWatch[userId] = { points: 0, invites: 0, log: [], withdrawRequests: [] };
  const user = usersWatch[userId];
  const pointsEarned = 10;
  user.points += pointsEarned;
  const now = new Date();
  user.log.push({points: pointsEarned, time: now.toLocaleTimeString()});
  res.status(200).json({balance: user.points, pointsEarned, log: user.log});
};
