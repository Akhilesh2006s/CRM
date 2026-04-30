# Program Billing Rollout

## Feature flag
- `ENABLE_PROGRAM_BILLING_ABACUS=true` enables cumulative program-billing recomputation on completed Abacus DCs.
- Default behavior is disabled when the flag is absent.

## Safe rollout steps
1. Deploy backend with the flag disabled.
2. Run backfill once:
   - `npm run backfill:program-billing`
3. Validate snapshots and ledger:
   - `GET /api/program-billing/:id`
   - `GET /api/program-billing/:id/ledger`
4. Enable the flag in production.
5. Configure nightly reconciliation:
   - `npm run reconcile:program-billing`

## Notes
- Rounding is fixed to 2 decimals.
- Repeated level deliveries are idempotent by unique key (`programId`, `levelNumber`).
- Payable decreases create `credit_note` adjustment records in `Payment`.
