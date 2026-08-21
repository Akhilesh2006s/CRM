/**
 * Single source of truth for school-sale DC pipeline stages.
 * A sale/DC must occupy exactly one workflowStage at any time.
 */
const WORKFLOW_STAGE = Object.freeze({
  ClosedSales: 'ClosedSales',
  PendingDC: 'PendingDC',
  EmpDC: 'EmpDC',
  CompletedDC: 'CompletedDC',
});

const ALL_WORKFLOW_STAGES = Object.values(WORKFLOW_STAGE);

/** Map DC.status → workflowStage (pipeline stages only). */
function workflowStageFromDcStatus(status) {
  switch (status) {
    case 'pending_dc':
      return WORKFLOW_STAGE.PendingDC;
    case 'sent_to_manager':
    case 'warehouse_processing':
    case 'hold':
      return WORKFLOW_STAGE.EmpDC;
    case 'completed':
    case 'Completed':
      return WORKFLOW_STAGE.CompletedDC;
    default:
      return null;
  }
}

/** Stages that must not appear on Closed Sales. */
const POST_CLOSED_SALES_STAGES = [
  WORKFLOW_STAGE.PendingDC,
  WORKFLOW_STAGE.EmpDC,
  WORKFLOW_STAGE.CompletedDC,
];

/** Super Admin Closed Sales queue (waiting for Raise DC). */
const CLOSED_SALES_QUEUE_STATUSES = ['dc_requested', 'dc_accepted'];

/** True only after Executive clicks Request DC (not Edit PO / EM approval). */
function hasExplicitDcRequest(order) {
  if (!order) return false;
  return Boolean(order.requestedAt || order.requestedBy);
}

/**
 * Closed Sales visibility. Edit PO and Executive Manager approval must not pass this.
 * DC_REQUESTED with no requestedAt/requestedBy is a false promotion (e.g. old po_submitted heal).
 */
function belongsOnClosedSalesList(order) {
  const status = String(order?.status || '');
  if (POST_CLOSED_SALES_STAGES.includes(order?.workflowStage)) return false;
  if (status === 'dc_accepted') return true;
  if (status !== 'dc_requested') return false;
  return hasExplicitDcRequest(order);
}

/** Mongo clause: dc_requested rows that were never actually requested by the Executive. */
function falseClosedSalesPromotionFilter() {
  return {
    status: 'dc_requested',
    $and: [
      { $or: [{ requestedAt: { $exists: false } }, { requestedAt: null }] },
      { $or: [{ requestedBy: { $exists: false } }, { requestedBy: null }] },
    ],
  };
}

/** Extra Closed Sales list gate on top of status=dc_requested|dc_accepted. */
function closedSalesExplicitRequestClause() {
  return {
    $or: [
      { status: 'dc_accepted' },
      { requestedAt: { $exists: true, $ne: null } },
      { requestedBy: { $exists: true, $ne: null } },
    ],
  };
}

module.exports = {
  WORKFLOW_STAGE,
  ALL_WORKFLOW_STAGES,
  workflowStageFromDcStatus,
  POST_CLOSED_SALES_STAGES,
  CLOSED_SALES_QUEUE_STATUSES,
  hasExplicitDcRequest,
  belongsOnClosedSalesList,
  falseClosedSalesPromotionFilter,
  closedSalesExplicitRequestClause,
};
