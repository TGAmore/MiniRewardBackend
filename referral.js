const usersReferral = {};

module.exports = (req, res) => {
  const { userId } = req.query;
  if (!usersReferral[userId]) usersReferral[userId] = { points: 0, invites: 0, log: [], withdrawRequests: [] };
  const user = usersReferral[userId];
  res.status(200).json({ user_id: userId, invites: user.invites });
};
