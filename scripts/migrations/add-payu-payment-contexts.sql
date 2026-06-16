-- Stores PayU initiation context keyed by txnid so the callback can
-- reconstruct bookings even if PayU omits or truncates udf payloads.
create table if not exists public.payu_payment_contexts (
  txnid text primary key,
  context jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payu_payment_contexts_created_at
  on public.payu_payment_contexts (created_at desc);
