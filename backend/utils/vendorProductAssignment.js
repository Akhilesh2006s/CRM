function productAssignmentKey(name) {
  return String(name || '').trim().toLowerCase();
}

/**
 * Pick the Vendor-master vendor assigned to this product.
 * One assignment → that vendor. Several → keep current if it is assigned, else first.
 */
function resolveAssignedVendor(productName, currentVendor, byProduct) {
  const assigned = (byProduct instanceof Map
    ? byProduct.get(productAssignmentKey(productName))
    : byProduct?.[productAssignmentKey(productName)]) || [];
  const list = Array.isArray(assigned) ? assigned : [];
  if (!list.length) {
    return {
      assigned: [],
      selectedName: String(currentVendor || '').trim(),
      vendorId: undefined,
      locked: false,
    };
  }
  const currentKey = String(currentVendor || '').trim().toLowerCase();
  const match = list.find((v) => String(v?.name || '').trim().toLowerCase() === currentKey);
  const pick = match || list[0];
  return {
    assigned: list,
    selectedName: String(pick?.name || '').trim(),
    vendorId: pick?._id,
    locked: list.length === 1,
  };
}

function productVendorNameMap(byProduct) {
  const out = {};
  if (!(byProduct instanceof Map)) return out;
  for (const [key, list] of byProduct.entries()) {
    out[key] = (Array.isArray(list) ? list : []).map((v) => v.name).filter(Boolean);
  }
  return out;
}

module.exports = {
  productAssignmentKey,
  resolveAssignedVendor,
  productVendorNameMap,
};
