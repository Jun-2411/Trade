const H = () => ({ 'APCA-API-KEY-ID': process.env.ALPACA_KEY, 'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET });
const D = 'https://data.alpaca.markets';
const iso = (d) => d.toISOString().slice(0, 10);

export default async function handler(req, res) {
  const { type, symbols = '', symbol = '' } = req.query;
  if (!process.env.ALPACA_KEY) return res.status(500).json({ error: '未配置 ALPACA_KEY / ALPACA_SECRET 环境变量' });
  const clean = (s) => s.replace(/[^A-Z0-9,]/gi, '').toUpperCase();
  let url;
  if (type === 'snap') url = `${D}/v2/stocks/snapshots?symbols=${clean(symbols)}&feed=${process.env.ALPACA_FEED || 'iex'}`;
  else if (type === 'bars') {
    const start = iso(new Date(Date.now() - 300 * 864e5));
    url = `${D}/v2/stocks/bars?symbols=${clean(symbols)}&timeframe=1Day&start=${start}&limit=10000&adjustment=split&feed=${process.env.ALPACA_FEED || 'iex'}`;
  } else if (type === 'chain') {
    const a = iso(new Date(Date.now() + 21 * 864e5)), b = iso(new Date(Date.now() + 50 * 864e5));
    url = `${D}/v1beta1/options/snapshots/${clean(symbol)}?feed=${process.env.ALPACA_OPT_FEED || 'indicative'}&limit=1000&expiration_date_gte=${a}&expiration_date_lte=${b}`;
  } else if (type === 'optmarks') url = `${D}/v1beta1/options/snapshots?symbols=${clean(symbols)}&feed=${process.env.ALPACA_OPT_FEED || 'indicative'}`;
  else return res.status(400).json({ error: 'bad type' });
  try {
    const r = await fetch(url, { headers: H() });
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(502).json({ error: String(e) }); }
}
