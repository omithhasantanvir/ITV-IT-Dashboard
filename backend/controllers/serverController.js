import Server from '../models/Server.js';
import { getServerOverview as runServerOverview, probeSingle } from '../services/serverMonitor.js';

export const listServers = async (req, res) => {
  const servers = await Server.find().sort({ serverName: 1 });
  res.json({ success: true, data: servers });
};

export const createServer = async (req, res) => {
  const server = await Server.create(req.body);
  res.status(201).json({ success: true, data: server });
};

// GET /api/servers/overview[?refresh=true]
// Live reachability for the monitored inventory. Each host is pinged (ICMP) and
// falls back to a TCP connect, so a firewall that drops echo requests does not
// produce a false "Offline". One probe round is cached and shared with the
// dashboard summary.
export const getServerOverview = async (req, res, next) => {
  try {
    const overview = await runServerOverview({ force: req.query.refresh === 'true' });
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
};

export const updateServer = async (req, res) => {
  const server = await Server.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!server) return res.status(404).json({ success: false, message: 'Server not found' });
  res.json({ success: true, data: server });
};

// GET /api/servers/probe?host=DC-1  (or ?host=172.19.4.4)
// Probes a single host so a card can animate its own ping and flip green/red the
// moment its answer lands, instead of waiting for the whole grid.
export const probeServer = async (req, res, next) => {
  try {
    const host = req.query.host || req.params.id;
    if (!host) return res.status(400).json({ success: false, message: 'host query parameter is required' });

    const result = await probeSingle(host, { force: req.query.refresh === 'true' });
    if (!result) return res.status(404).json({ success: false, message: `Unknown host: ${host}` });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
