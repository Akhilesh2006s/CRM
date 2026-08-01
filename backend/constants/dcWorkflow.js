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

module.exports = {
  WORKFLOW_STAGE,
  ALL_WORKFLOW_STAGES,
  workflowStageFromDcStatus,
  POST_CLOSED_SALES_STAGES,
};
