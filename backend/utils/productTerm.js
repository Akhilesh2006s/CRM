const ALLOWED_PRODUCT_TERMS = ['Term 1', 'Term 2', 'Both'];
const CLOSE_LEAD_DESTINATION = {
  MY_CLIENT: 'MY_CLIENT',
  TERM_WISE_DC: 'TERM_WISE_DC',
};

/**
 * Maps UI / legacy values (e.g. "Term1", "term_2") to DcOrder / Lead enum values.
 */
function normalizeProductTerm(term) {
  if (term == null || term === '') return 'Term 1';
  const t = String(term).trim();
  if (ALLOWED_PRODUCT_TERMS.includes(t)) return t;
  const collapsed = t.toLowerCase().replace(/[\s_-]+/g, '');
  if (collapsed === 'term1' || collapsed === 't1') return 'Term 1';
  if (collapsed === 'term2' || collapsed === 't2') return 'Term 2';
  if (collapsed === 'both') return 'Both';
  return 'Term 1';
}

function normalizeDcOrderProductTermsInArray(products) {
  if (!Array.isArray(products)) return products;
  return products.map((p) => {
    if (!p || typeof p !== 'object') return p;
    return { ...p, term: normalizeProductTerm(p.term) };
  });
}

/** Collapse level/term labels for matching (e.g. "Level 2" → "level2"). */
function collapseLabel(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function getRowStageFlags(row) {
  const levelKey = collapseLabel(row?.level);
  const termKey = collapseLabel(row?.term);

  const isLevel1 =
    levelKey === 'level1' ||
    /^level1(?!\d)/.test(levelKey);
  const isLevel2 =
    levelKey === 'level2' ||
    /^level2(?!\d)/.test(levelKey);

  const levelIsTerm1 = levelKey.startsWith('term1');
  const levelIsTerm2 = levelKey.startsWith('term2');
  const isLevelBased = isLevel1 || isLevel2;

  // Level-based rows must not count a defaulted term (often "Term 1") for term pairing.
  const isTerm1 =
    levelIsTerm1 ||
    (!isLevelBased && (termKey === 'term1' || termKey === 't1' || termKey === 'both'));
  const isTerm2 =
    levelIsTerm2 ||
    (!isLevelBased && (termKey === 'term2' || termKey === 't2'));

  return { isLevel1, isLevel2, isTerm1, isTerm2 };
}

/**
 * Close Lead routing: group by product, then send second-stage rows to Term-Wise
 * ONLY when that same product also has the matching first stage.
 *
 * Level 1+2 → Level 1 My Clients, Level 2 Term-Wise
 * Level 2 alone → My Clients
 * Term 1+2 → Term 1 My Clients, Term 2 Term-Wise
 * Term 2 alone → My Clients
 * No level/term → My Clients
 *
 * Stamps closeLeadDestination on each row.
 */
function partitionProductsForCloseLeadRouting(productDetails) {
  const rows = Array.isArray(productDetails) ? productDetails : [];
  const byProduct = new Map();

  for (const p of rows) {
    if (!p || typeof p !== 'object') continue;
    const name = String(p.product || p.productName || p.product_name || 'Unknown')
      .trim()
      .toLowerCase();
    if (!byProduct.has(name)) byProduct.set(name, []);
    byProduct.get(name).push(p);
  }

  const myClientsProducts = [];
  const termWiseProducts = [];

  for (const group of byProduct.values()) {
    const flags = group.map(getRowStageFlags);
    const hasLevel1 = flags.some((f) => f.isLevel1);
    const hasLevel2 = flags.some((f) => f.isLevel2);
    const hasTerm1 = flags.some((f) => f.isTerm1);
    const hasTerm2 = flags.some((f) => f.isTerm2);

    const splitByLevel = hasLevel1 && hasLevel2;
    const splitByTerm = !splitByLevel && hasTerm1 && hasTerm2;

    for (let i = 0; i < group.length; i++) {
      const p = group[i];
      const f = flags[i];
      let destination = CLOSE_LEAD_DESTINATION.MY_CLIENT;

      if (splitByLevel && f.isLevel2) {
        destination = CLOSE_LEAD_DESTINATION.TERM_WISE_DC;
      } else if (splitByTerm && f.isTerm2) {
        destination = CLOSE_LEAD_DESTINATION.TERM_WISE_DC;
      }

      const stamped = { ...p, closeLeadDestination: destination };
      if (destination === CLOSE_LEAD_DESTINATION.TERM_WISE_DC) {
        termWiseProducts.push(stamped);
      } else {
        myClientsProducts.push(stamped);
      }
    }
  }

  return {
    myClientsProducts,
    termWiseProducts,
    needsTermWiseSplit: termWiseProducts.length > 0 && myClientsProducts.length > 0,
    termWiseOnly: termWiseProducts.length > 0 && myClientsProducts.length === 0,
  };
}

module.exports = {
  ALLOWED_PRODUCT_TERMS,
  CLOSE_LEAD_DESTINATION,
  normalizeProductTerm,
  normalizeDcOrderProductTermsInArray,
  getRowStageFlags,
  partitionProductsForCloseLeadRouting,
};
