const https = require('https');

const INDIA_POST_HOST = 'api.postalpincode.in';
const FALLBACK_HOST = 'aniket-thapa.github.io';
const REQUEST_TIMEOUT_MS = 12000;

function fetchHttpsJson(hostname, path, { rejectUnauthorized = true } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname,
        path,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CRM-FORGE/1.0',
        },
        rejectUnauthorized,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} from ${hostname}${path}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      },
    );

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Pincode API request timed out (${hostname})`));
    });
  });
}

function mapIndiaPost(data) {
  if (
    data &&
    data[0] &&
    data[0].Status === 'Success' &&
    data[0].PostOffice?.length > 0
  ) {
    const postOffices = data[0].PostOffice;
    const first = postOffices[0];
    return {
      success: true,
      town: first.Name,
      district: first.District,
      state: first.State,
      region: first.Division || first.Region || first.District,
      postOffices: postOffices.map((po) => ({
        Name: po.Name,
        District: po.District,
        State: po.State,
        Division: po.Division,
        Region: po.Region,
        Block: po.Block,
        BranchType: po.BranchType,
      })),
    };
  }
  return null;
}

function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapFallback(data, pincode) {
  const offices = Array.isArray(data?.offices) ? data.offices : [];
  if (!data?.state || !data?.district || offices.length === 0) {
    return null;
  }

  const state = titleCase(data.state);
  const district = titleCase(data.district);
  const postOffices = offices.map((office) => ({
    Name: office.officeName || office.Name || '',
    District: district,
    State: state,
    Division: office.divisionName || '',
    Region: office.regionName || district,
    Block: '',
    BranchType: office.officeType || '',
  }));

  const first = postOffices[0];
  return {
    success: true,
    town: first.Name,
    district,
    state,
    region: first.Region || first.Division || district,
    postOffices,
    pincode,
  };
}

async function fetchFromIndiaPost(pincode) {
  const data = await fetchHttpsJson(INDIA_POST_HOST, `/pincode/${pincode}`, {
    rejectUnauthorized: false,
  });
  return mapIndiaPost(data);
}

async function fetchFromFallback(pincode) {
  const data = await fetchHttpsJson(
    FALLBACK_HOST,
    `/india-pincode-api/pincodes/${pincode}.json`,
  );
  return mapFallback(data, pincode);
}

async function fetchPincodeFromApi(pincode) {
  try {
    const primary = await fetchFromIndiaPost(pincode);
    if (primary?.success) return primary;
  } catch (err) {
    console.warn('India Post pincode API failed, trying fallback:', err.message);
  }

  try {
    const fallback = await fetchFromFallback(pincode);
    if (fallback?.success) return fallback;
  } catch (err) {
    console.warn('Fallback pincode API failed:', err.message);
    throw err;
  }

  return { success: false };
}

module.exports = { fetchPincodeFromApi };
