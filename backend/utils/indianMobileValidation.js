/** Indian mobile: exactly 10 digits starting with 6–9. Keep in sync with lib/phone.ts */

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function validateStrictIndianMobile(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  if (/\D/.test(trimmed) || !INDIAN_MOBILE_REGEX.test(trimmed)) {
    return { ok: false, message: 'Enter a valid 10-digit mobile number.' };
  }
  return { ok: true, digits: trimmed };
}

module.exports = {
  INDIAN_MOBILE_REGEX,
  validateStrictIndianMobile,
};
