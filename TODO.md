# Project TODO List

## Unresolved Issues

- [ ] **Fix Migration History Mismatch**:
    - **Issue**: `supabase db push` from the root fails because remote migrations (applied from `hr-recruitment-platform/supabase/migrations`) are missing from the root `supabase/migrations` folder.
    - **Context**: Discovered while trying to push `enable_careflow_all.sql`.
    - **Impact**: Cannot easily push new schema changes from the CLI root.
    - **Resolution**: Consolidate migrations into the root `supabase/migrations` folder or use `supabase migration repair` to sync the history.

## Resolved (Waiting Verification)
- [x] **Fix Persistent CORS Error in `sync-to-careflow`**:
    - **Resolution**: Identified that the `supabase` CLI was using the root `supabase/functions` directory instead of the subfolder. Overwrote the root function with the fixed code (Deno.serve + robust CORS) and redeployed.
    - **Status**: Verified by user (2025-12-16).
