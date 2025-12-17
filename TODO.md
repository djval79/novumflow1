# Project TODO List

## Unresolved Issues

- [x] **Fix Migration History Mismatch**:
    - **Resolution**: Archived sub-repo migrations `hr-recruitment-platform/supabase/migrations_archived`. Created `MIGRATION_REPAIR_GUIDE.md` for manual history sync.
    - **Status**: Consolidated. Repair guide available.

## Resolved (Waiting Verification)
- [x] **Fix Persistent CORS Error in `sync-to-careflow`**:
    - **Resolution**: Identified that the `supabase` CLI was using the root `supabase/functions` directory instead of the subfolder. Overwrote the root function with the fixed code (Deno.serve + robust CORS) and redeployed.
    - **Status**: Verified by user (2025-12-16).
