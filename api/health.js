module.exports = function handler(req, res) {
  res.json({ status: 'ok', keySet: !!process.env.ANTHROPIC_API_KEY });
};
