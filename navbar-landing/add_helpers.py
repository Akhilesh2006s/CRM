from pathlib import Path

path = Path('backend/controllers/expenseController.js')
text = path.read_text()

helper_block = """const ExcelJS = require('exceljs');

const EXPENSE_TRANSPORT_TYPES = ['Auto', 'Bike', 'Bus', 'Car', 'Flight', 'Train'];

const normalizeExpenseCategory = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase();
  if (key === 'travel') return 'Travel';
  if (key === 'food') return 'Food';
  if (key === 'accommodation' || key === 'accomodation') return 'Accommodation';
  if (key === 'others' || key === 'other') return 'Others';
  return trimmed;
};

const normalizeTransportType = (value) => {
  if (!value || typeof value !== 'string') return null;
  const key = value.trim().toLowerCase();
  return EXPENSE_TRANSPORT_TYPES.find((type) => type.toLowerCase() === key) || null;
};

const sanitizeString = (value) => {
  if (!value || typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};
"""

if 'EXPENSE_TRANSPORT_TYPES' not in text:
    target = "const ExcelJS = require('exceljs');"
    if target not in text:
        raise SystemExit('Unable to find ExcelJS import to extend')
    text = text.replace(target, helper_block, 1)
    path.write_text(text)
