const dns = require('dns');
const { execSync } = require('child_process');

// Prefer IPv4 — helps on Windows when SRV lookup via mongoose times out
dns.setDefaultResultOrder('ipv4first');

const SRV_TIMEOUT_MS = 25000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

/** Atlas: ac-zhqcgcp-shard-00-00.host.mongodb.net → atlas-zhqcgcp-shard-0 */
function guessReplicaSetFromHost(shardHost) {
  const m = String(shardHost).match(/^([a-z0-9]+)-shard-\d+-\d+\./i);
  if (!m) return null;
  const id = m[1].replace(/^ac-/i, 'atlas-');
  return `${id}-shard-0`;
}

/** Windows fallback when Node dns.promises.resolveSrv times out but nslookup works */
function expandSrvViaNslookup(clusterHost) {
  const srvName = `_mongodb._tcp.${clusterHost}`;
  const out = execSync(`nslookup -type=SRV ${srvName}`, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });

  const hosts = new Set();
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/svr hostname\s*=\s*(\S+)/i);
    if (m) hosts.add(`${m[1]}:27017`);
  }

  if (hosts.size === 0) {
    throw new Error('nslookup returned no SRV hostnames');
  }

  return { hosts: [...hosts], firstHost: [...hosts][0].split(':')[0] };
}

/**
 * Resolve mongodb+srv to mongodb:// with explicit hosts (avoids mongoose querySrv ETIMEOUT).
 */
async function expandSrvUri(srvUri) {
  const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/i);
  if (!match) {
    throw new Error('Invalid mongodb+srv URI');
  }

  const [, credentials, hostPart, dbPath = '/CRM', query = ''] = match;
  const clusterHost = hostPart.includes('.mongodb.net')
    ? hostPart
    : `${hostPart}.mongodb.net`;

  const srvName = `_mongodb._tcp.${clusterHost}`;
  console.log(`   Resolving SRV ${srvName} (workaround for querySrv ETIMEOUT)...`);

  let hostList;
  let firstHostName;

  try {
    const records = await withTimeout(
      dns.promises.resolveSrv(srvName),
      SRV_TIMEOUT_MS,
      'DNS SRV lookup',
    );
    if (!records?.length) throw new Error('No SRV records returned');
    hostList = records.map((r) => `${r.name}:${r.port}`);
    firstHostName = records[0].name;
  } catch (nodeDnsErr) {
    console.warn(`   ⚠️  Node DNS SRV failed: ${nodeDnsErr.message}`);
    console.log('   Trying nslookup (Windows fallback)...');
    const parsed = expandSrvViaNslookup(clusterHost);
    hostList = parsed.hosts;
    firstHostName = parsed.firstHost;
  }

  const hosts = hostList.join(',');
  const dbName = dbPath.replace(/^\//, '') || 'CRM';

  const params = new URLSearchParams(query.replace(/^\?/, ''));
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');
  if (!params.has('w')) params.set('w', 'majority');
  if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');

  if (!params.has('replicaSet')) {
    const fromEnv = process.env.MONGO_REPLICA_SET;
    const guessed = guessReplicaSetFromHost(firstHostName);
    const replicaSet = fromEnv || guessed;
    if (replicaSet) {
      params.set('replicaSet', replicaSet);
      console.log(`   Using replicaSet=${replicaSet}`);
    }
  }

  const standardUri = `mongodb://${credentials}@${hosts}/${dbName}?${params.toString()}`;
  console.log('   Using standard mongodb:// URI (SRV pre-resolved)');
  return standardUri;
}

/**
 * Pick the best URI: direct standard > expand srv > raw uri
 */
function normalizeMongoUri(uri) {
  let s = String(uri || '').trim();
  if (/^mmongodb/i.test(s)) {
    s = s.replace(/^mmongodb/i, 'mongodb');
  }
  return s;
}

async function resolveMongoConnectionString(rawUri) {
  rawUri = normalizeMongoUri(rawUri);
  const direct =
    process.env.MONGO_URI_STANDARD ||
    process.env.MONGO_URI_DIRECT ||
    process.env.MONGODB_URI_STANDARD;

  const directNorm = direct ? normalizeMongoUri(direct) : '';
  if (directNorm && directNorm.startsWith('mongodb://')) {
    console.log('   Using MONGO_URI_STANDARD / MONGO_URI_DIRECT from .env');
    return directNorm;
  }

  if (rawUri.includes('mongodb+srv://')) {
    try {
      return await expandSrvUri(rawUri);
    } catch (err) {
      console.warn(`   ⚠️  SRV expand failed: ${err.message}`);
      console.warn('   Falling back to mongodb+srv (may still hit querySrv ETIMEOUT)');
      console.warn(
        '   Tip: In Atlas → Connect → Drivers, copy the "Standard connection string" into MONGO_URI_STANDARD in .env',
      );
      return rawUri;
    }
  }

  return rawUri;
}

module.exports = { resolveMongoConnectionString, expandSrvUri };
