const SUBMISSION_FIELDS = [
  'completedAt',
  'warehouseProcessedAt',
  'listedAt',
  'managerRequestedAt',
  'sentToManagerAt',
  'submittedAt',
  'poSubmittedAt',
  'updatedAt',
  'createdAt',
];

function timeMs(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

function dcSubmissionTimeMs(doc) {
  if (!doc) return 0;
  let max = 0;
  for (const field of SUBMISSION_FIELDS) {
    const t = timeMs(doc[field]);
    if (t > max) max = t;
  }
  return max;
}

function sortDcsNewestFirst(docs) {
  return (Array.isArray(docs) ? docs : []).slice().sort((a, b) => dcSubmissionTimeMs(b) - dcSubmissionTimeMs(a));
}

/** Mongo sort: newest activity first. updatedAt is set on every pipeline save. */
const DC_LIST_MONGO_SORT = { updatedAt: -1, createdAt: -1 };
const COMPLETED_DC_MONGO_SORT = { completedAt: -1, warehouseProcessedAt: -1, updatedAt: -1, createdAt: -1 };
const WAREHOUSE_DC_MONGO_SORT = {
  updatedAt: -1,
  managerRequestedAt: -1,
  sentToManagerAt: -1,
  createdAt: -1,
};

module.exports = {
  dcSubmissionTimeMs,
  sortDcsNewestFirst,
  DC_LIST_MONGO_SORT,
  COMPLETED_DC_MONGO_SORT,
  WAREHOUSE_DC_MONGO_SORT,
};
