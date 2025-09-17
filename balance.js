const usersBalance = {};

module.exports = (req, res) => {
  const { userId } = req.query;
  if (!usersBalance[userId]) {
    usersBalance[userId] = { points: 0, invites: 0, log: [], withdrawRequests: [] };
  }
  const user = usersBalance[userId];
  res.status(200).json({ user_id: userId, balance: user.points, today_log: user.log, invites: user.invites });
};
