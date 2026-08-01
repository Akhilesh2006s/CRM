/**
 * Validate DC Details fields used by Raise DC / Closed Sales flows.
 * DC Remarks is optional unless requireRemarks is true (UI shows *).
 */

function validateRaiseDcDetails(body = {}, { requireRemarks = false } = {}) {
  const dcDate = body.dcDate != null ? String(body.dcDate).trim() : '';
  const dcCategory = body.dcCategory != null ? String(body.dcCategory).trim() : '';
  const dcRemarks = body.dcRemarks != null ? String(body.dcRemarks).trim() : '';

  if (!dcDate) {
    return { ok: false, message: 'DC Date is required.' };
  }
  if (!dcCategory) {
    return { ok: false, message: 'DC Category is required.' };
  }
  if (requireRemarks && !dcRemarks) {
    return { ok: false, message: 'DC Remarks is required.' };
  }
  return {
    ok: true,
    fields: {
      dcDate,
      dcCategory,
      dcRemarks: dcRemarks || undefined,
    },
  };
}

/**
 * Pending DC Open → Save / Submit to Warehouse required DC Details.
 */
function validatePendingDcDetails(body = {}) {
  const dcDateRaw = body.dcDate != null ? String(body.dcDate).trim() : '';
  const dcCategory = body.dcCategory != null ? String(body.dcCategory).trim() : '';
  const financeRemarks = body.financeRemarks != null ? String(body.financeRemarks).trim() : '';
  const splApproval = body.splApproval != null ? String(body.splApproval).trim() : '';
  const dcRemarks = body.dcRemarks != null ? String(body.dcRemarks).trim() : '';
  const dcNotes = body.dcNotes != null ? String(body.dcNotes).trim() : '';

  if (!dcDateRaw) {
    return { ok: false, message: 'DC Date is required.' };
  }
  const parsedDate = new Date(dcDateRaw);
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, message: 'DC Date is required.' };
  }
  if (!dcCategory) {
    return { ok: false, message: 'Please select a DC Category.' };
  }
  if (!financeRemarks) {
    return { ok: false, message: 'Finance Remarks is required.' };
  }
  if (!splApproval) {
    return { ok: false, message: 'SPL Approval is required.' };
  }
  if (!dcRemarks) {
    return { ok: false, message: 'DC Remarks is required.' };
  }
  if (!dcNotes) {
    return { ok: false, message: 'DC Notes is required.' };
  }

  return {
    ok: true,
    fields: {
      dcDate: dcDateRaw,
      dcCategory,
      financeRemarks,
      splApproval,
      dcRemarks,
      dcNotes,
    },
  };
}

module.exports = {
  validateRaiseDcDetails,
  validatePendingDcDetails,
};
