const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

(() => {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        return;
      }
    } catch {
      // ignore
    }
  }
  dotenv.config();
})();

const connectDB = require('../config/db');
const { ensureWarehouseInventoryIntegrity } = require('../utils/warehouseProductMaster');

async function run() {
  await connectDB();
  const result = await ensureWarehouseInventoryIntegrity();
  if (result?.skipped) {
    console.log('Skipped: Product Master is empty, inventory was not changed.');
  } else {
    console.log(
      `Aligned warehouse inventory to Product Master. Deleted ${result.deleted}, updated ${result.updated}, kept ${result.kept}.`
    );
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
