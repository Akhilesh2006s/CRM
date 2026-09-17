/**
 * School visit categories.
 *
 * Mirrors the legacy `school_visit_categories` list. Kept here (rather than as a
 * hard mongoose enum) so the list can be adjusted without a schema migration —
 * Visit.category is validated against this array at write time.
 *
 * NOTE: confirm this list against the client's live category list before rollout.
 */
const VISIT_CATEGORIES = [
  'New Business',
  'Follow-up',
  'Demo / Presentation',
  'Collection',
  'Service',
  'Training',
  'Complaint / Issue',
  'Relationship',
  'Renewal',
  'Other',
];

/** Outcome of the visit — drives the lead's next priority. */
const VISIT_OUTCOMES = [
  'Hot',
  'Warm',
  'Cold',
  'Visit Again',
  'Not Met Management',
  'Not Interested',
];

module.exports = { VISIT_CATEGORIES, VISIT_OUTCOMES };
