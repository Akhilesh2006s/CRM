/** Trainer assigned to the visit, or staff updating on their behalf. */
function canUploadVisitFeedback(record, user) {
  if (!record || !user) return false;
  const trainerId = String(record.trainerId?._id ?? record.trainerId ?? '');
  if (trainerId && trainerId === String(user._id)) return true;
  const role = (user.role || '').trim();
  return [
    'Admin',
    'Super Admin',
    'Manager',
    'Coordinator',
    'Senior Coordinator',
    'Executive Manager',
  ].includes(role);
}

module.exports = { canUploadVisitFeedback };
