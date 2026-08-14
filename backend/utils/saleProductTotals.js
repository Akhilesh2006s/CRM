/**
 * Shared sale/Add-Products list-price helper.
 * classTotal = classStrength × selectedSubjectCount × unitPrice
 * (subject count defaults to 1 when none selected)
 */
function computeClassSubjectUnitTotal(classStrength, selectedSubjectCount, unitPrice) {
  const strength = Number(classStrength) || 0;
  const subjects = Math.max(1, Number(selectedSubjectCount) || 0);
  const price = Number(unitPrice) || 0;
  return strength * subjects * price;
}

function subjectCountFromProductRow(row = {}) {
  const fromArray = Array.isArray(row.selected_subjects)
    ? row.selected_subjects.map((s) => String(s || '').trim()).filter(Boolean)
    : [];
  if (fromArray.length > 0) return fromArray.length;
  const subject = String(row.subject || '').trim();
  if (!subject) return 1;
  // Legacy joined subject display e.g. "Physics, Math"
  const parts = subject.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 ? parts.length : 1;
}

/** Ensure each product row has quantity/total consistent with subject expansion. */
function normalizeSaleProductTotals(products) {
  if (!Array.isArray(products)) return products;
  return products.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const strength = Number(row.strength) || 0;
    const unitPrice = Number(row.unit_price ?? row.price) || 0;
    const subjectCount = subjectCountFromProductRow(row);
    const qtyFromStrengthSubjects = computeClassSubjectUnitTotal(strength, subjectCount, 1);
    const rawQty = Number(row.quantity);
    // Prefer explicit quantity when it already includes subject expansion;
    // otherwise derive quantity = strength × selected subjects.
    const quantity =
      Number.isFinite(rawQty) && rawQty > 0
        ? Math.max(rawQty, qtyFromStrengthSubjects > 0 ? qtyFromStrengthSubjects : rawQty)
        : qtyFromStrengthSubjects > 0
          ? qtyFromStrengthSubjects
          : Math.max(1, strength);
    const total = quantity * unitPrice;
    return { ...row, quantity, total };
  });
}

module.exports = {
  computeClassSubjectUnitTotal,
  subjectCountFromProductRow,
  normalizeSaleProductTotals,
};
