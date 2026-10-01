begin;

alter table public.google_oauth_credentials
  add column if not exists connected_at timestamptz,
  add column if not exists refresh_token_expires_at timestamptz;

comment on column public.google_oauth_credentials.connected_at is
  'Most recent explicit Google OAuth consent time.';
comment on column public.google_oauth_credentials.refresh_token_expires_at is
  'Expected refresh-token expiry for test-mode OAuth clients; null in production mode.';

commit;
