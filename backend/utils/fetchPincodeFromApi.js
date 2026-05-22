const https = require('https');

const PINCODE_HOST = 'api.postalpincode.in';
const REQUEST_TIMEOUT_MS = 12000;

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: PINCODE_HOST,
        path,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CRM-FORGE/1.0',
        },
        // India Post API cert is often expired
        rejectUnauthorized: false,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
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
      req.destroy(new Error('Pincode API request timed out'));
    });
  });
}

async function fetchPincodeFromApi(pincode) {
  const data = await fetchJson(`/pincode/${pincode}`);

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

  return { success: false };
}

module.exports = { fetchPincodeFromApi };
