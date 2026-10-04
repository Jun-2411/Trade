// 新增：只负责加密货币行情（Alpaca 免费，无需额外密钥类型）
const H = () => ({ 'APCA-API-KEY-ID': process.env.ALPACA_KEY, 'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET });
const D = 'https://data.alpaca.markets/v1beta3/crypto/us';

export default async function handler(req, res) {
  const { type, symbols = '' } = req.query;
  if (!process.env.ALPACA_KEY) return res.status(500).json({ error: '未配置 ALPACA_KEY / ALPACA_SECRET 环境变量' });
  const s = encodeURIComponent(symbols.replace(/[^A-Z0-9,\/]/gi, '').toUpperCase());
  const start = new Date(Date.now() - 300 * 864e5).toISOString().slice(0, 10);
  let url;
  if (type === 'snap') url = `${D}/snapshots?symbols=${s}`;
  else if (type === 'bars') url = `${D}/bars?symbols=${s}&timeframe=1Day&start=${start}&limit=10000`;
  else return res.status(400).json({ error: 'bad type' });
  try {
    const r = await fetch(url, { headers: H() });
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(502).json({ error: String(e) }); }
}
