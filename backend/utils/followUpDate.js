/**
 * Follow-up is a calendar date only. Persist UTC midnight for that date
 * and never attach a local timezone clock time (e.g. IST 05:30).
 */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function ymdFromParts(y, m, d) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function followUpDateToYmd(value) {
  if (value == null || value === '') return null;
  const s = value instanceof Date ? value.toISOString() : String(value).trim();
  if (!s) return null;

  const prefix = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (prefix) {
    return `${prefix[1]}-${prefix[2]}-${prefix[3]}`;
  }

  const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (dmy) {
    return ymdFromParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  }

  const d = value instanceof Date ? value : new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return ymdFromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return ymdFromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * @param {*} value YYYY-MM-DD, dd-mm-yyyy, or Date/ISO
 * @returns {Date|null} UTC midnight for that calendar date
 */
function parseFollowUpDateOnly(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const ymd = followUpDateToYmd(value);
  if (!ymd) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const [y, m, day] = ymd.split('-').map(Number);
  if (!y || !m || !day) return null;
  return new Date(Date.UTC(y, m - 1, day));
}

module.exports = {
  followUpDateToYmd,
  parseFollowUpDateOnly,
};
