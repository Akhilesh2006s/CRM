function nonEmpty(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (nonEmpty(value)) return String(value).trim();
  }
  return '';
}

function resolveTransportFields(order) {
  const pe = order?.pendingEdit || null;
  return {
    transport_name: firstNonEmpty(order?.transport_name, pe?.transport_name),
    transport_location: firstNonEmpty(order?.transport_location, pe?.transport_location),
    pincode: firstNonEmpty(order?.pincode, pe?.pincode),
  };
}

function isTransportComplete(order) {
  const { transport_name, transport_location, pincode } = resolveTransportFields(order);
  return nonEmpty(transport_name) && nonEmpty(transport_location) && nonEmpty(pincode);
}

/** Merge existing DcOrder with incoming update payload for transport validation. */
function isTransportCompleteForUpdate(existing, body) {
  const merged = {
    transport_name: body?.transport_name !== undefined ? body.transport_name : existing?.transport_name,
    transport_location:
      body?.transport_location !== undefined ? body.transport_location : existing?.transport_location,
    pincode: body?.pincode !== undefined ? body.pincode : existing?.pincode,
    pendingEdit: existing?.pendingEdit,
  };
  return isTransportComplete(merged);
}

module.exports = {
  resolveTransportFields,
  isTransportComplete,
  isTransportCompleteForUpdate,
};
