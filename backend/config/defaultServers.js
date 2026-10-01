// Canonical inventory of the hosts shown by the Server Status Overview.
//
// This list is config driven on purpose: the monitoring grid must always cover
// the real estate, even on a fresh install with an empty database, so the ping
// view never silently reports "nothing to monitor". `scripts/seed.js` and
// `scripts/syncServers.js` copy the same list into MongoDB so the asset
// register and the monitor agree.
//
// `port` is only used as a fallback probe: plenty of Windows servers answer on
// TCP but block ICMP echo, so the monitor tries ICMP first and then a TCP
// connect before declaring a host offline.
export const DEFAULT_SERVERS = [
  { serverName: 'DC-1', ipAddress: '172.19.4.4', serverType: 'Domain Controller', port: 445 },
  { serverName: 'DC-2', ipAddress: '172.19.4.5', serverType: 'Domain Controller', port: 445 },
  { serverName: 'DSE', ipAddress: '172.19.4.9', serverType: 'Application Server', port: 80 },
  { serverName: 'SQL', ipAddress: '172.19.4.10', serverType: 'Database Server', port: 1433 },
  { serverName: 'FTP', ipAddress: '172.19.4.34', serverType: 'File Server', port: 21 },
  { serverName: 'Dashboard', ipAddress: '172.19.4.7', serverType: 'Web Server', port: 80 },
  { serverName: 'GV Core', ipAddress: '10.1.2.30', serverType: 'Application Server', port: 80 },
  { serverName: 'GV FSM-1', ipAddress: '10.1.2.4', serverType: 'Application Server', port: 80 },
  { serverName: 'GV FSM-2', ipAddress: '10.1.2.5', serverType: 'Application Server', port: 80 },
  { serverName: 'GV FTP', ipAddress: '10.1.2.6', serverType: 'File Server', port: 21 },
  { serverName: 'GV RE-1', ipAddress: '10.1.2.31', serverType: 'Application Server', port: 80 },
  { serverName: 'GV RE-2', ipAddress: '10.1.2.32', serverType: 'Application Server', port: 80 },
  { serverName: 'GV XRE', ipAddress: '10.1.4.71', serverType: 'Application Server', port: 80 },
  { serverName: 'Octopus X', ipAddress: '172.19.8.151', serverType: 'Application Server', port: 80 },
];

export default DEFAULT_SERVERS;
