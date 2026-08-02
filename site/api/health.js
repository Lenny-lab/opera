module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: '不支持的请求方式。' });
  }

  return res.status(200).json({
    ok: true,
    generation: Boolean(process.env.DEEPSEEK_API_KEY)
  });
};
