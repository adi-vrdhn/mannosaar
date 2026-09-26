begin;
set local search_path=public,extensions,pg_temp;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='users_role_allowed') then
    alter table public.users add constraint users_role_allowed check(role in ('admin','therapist','support','finance','user')) not valid;
  end if;
end $$;

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null,
  user_id uuid not null references public.users(id),
  booking_id uuid references public.bookings(id),
  consent_type text not null,
  consent_version text not null,
  policy_version text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}',
  unique(receipt_id, consent_type)
);
create index if not exists consents_user_idx on public.consents(user_id, accepted_at desc);
create index if not exists consents_booking_idx on public.consents(booking_id);
alter table public.whatsapp_payments add column if not exists consent_receipt_id uuid;

create or replace function public.protect_consent_history() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  if old.booking_id is null and new.booking_id is not null
     and row(old.id,old.receipt_id,old.user_id,old.consent_type,old.consent_version,old.policy_version,old.accepted,old.accepted_at,old.withdrawn_at,old.ip_address,old.user_agent,old.metadata)
         is not distinct from
         row(new.id,new.receipt_id,new.user_id,new.consent_type,new.consent_version,new.policy_version,new.accepted,new.accepted_at,new.withdrawn_at,new.ip_address,new.user_agent,new.metadata) then
    return new;
  end if;
  raise exception 'CONSENT_HISTORY_IS_IMMUTABLE';
end $$;
drop trigger if exists protect_consent_history on public.consents;
create trigger protect_consent_history before update or delete on public.consents for each row execute function public.protect_consent_history();

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  request_type text not null check(request_type in ('ACCESS','CORRECTION','DELETION','CONSENT_WITHDRAWAL','DATA_EXPORT','PRIVACY_COMPLAINT')),
  status text not null default 'SUBMITTED' check(status in ('SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','COMPLETED')),
  details text check(char_length(details)<=2000),
  resolution_note text check(char_length(resolution_note)<=2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists privacy_requests_user_idx on public.privacy_requests(user_id, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.users(id),
  actor_role text,
  action text not null,
  resource_type text not null,
  resource_id text,
  occurred_at timestamptz not null default now(),
  ip_address text,
  metadata jsonb not null default '{}'
);
create index if not exists audit_logs_resource_idx on public.audit_logs(resource_type,resource_id,occurred_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_user_id,occurred_at desc);
create or replace function public.protect_audit_history() returns trigger language plpgsql set search_path=pg_catalog as $$ begin raise exception 'AUDIT_HISTORY_IS_IMMUTABLE'; end $$;
drop trigger if exists protect_audit_history on public.audit_logs;
create trigger protect_audit_history before update or delete on public.audit_logs for each row execute function public.protect_audit_history();

create table if not exists public.therapist_profiles (
  user_id uuid primary key references public.users(id),
  full_name text not null,
  professional_title text not null check(professional_title in ('Psychiatrist','Clinical Psychologist','Counselling Psychologist','Counsellor','Therapist')),
  qualification text not null,
  registration_authority text,
  registration_number text,
  registration_valid_until date,
  verification_status text not null default 'PENDING' check(verification_status in ('PENDING','VERIFIED','REJECTED','EXPIRED')),
  verification_date timestamptz,
  verified_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  therapist_id uuid not null references public.users(id),
  booking_id uuid references public.bookings(id),
  encrypted_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.retention_settings (
  category text primary key check(category in ('ACCOUNT','BOOKING','PAYMENT','CONSENT','CLINICAL','SUPPORT','AUDIT')),
  retention_days integer not null check(retention_days>0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id)
);
insert into public.retention_settings(category,retention_days) values
 ('ACCOUNT',2555),('BOOKING',2555),('PAYMENT',2920),('CONSENT',2920),('CLINICAL',2555),('SUPPORT',1095),('AUDIT',2555)
on conflict(category) do nothing;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  user_id uuid not null references public.users(id),
  provider text not null,
  provider_transaction_id text not null unique,
  amount numeric(10,2) not null check(amount>=0),
  currency text not null default 'INR',
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_rate_limits (
  key_hash text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 1,
  primary key(key_hash,bucket_start)
);
create or replace function public.compliance_rate_limit(p_key_hash text,p_limit integer,p_window_seconds integer) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_bucket timestamptz; v_allowed boolean;
begin
  if p_limit<1 or p_window_seconds<1 then raise exception 'INVALID_RATE_LIMIT'; end if;
  v_bucket:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
  insert into api_rate_limits(key_hash,bucket_start,request_count) values(p_key_hash,v_bucket,1)
  on conflict(key_hash,bucket_start) do update set request_count=api_rate_limits.request_count+1
  where api_rate_limits.request_count<p_limit returning true into v_allowed;
  delete from api_rate_limits where bucket_start<now()-interval '2 days';
  return coalesce(v_allowed,false);
end $$;

do $$ declare t text; begin
  foreach t in array array['consents','privacy_requests','audit_logs','therapist_profiles','clinical_records','retention_settings','payments','api_rate_limits'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
revoke all on function public.protect_consent_history() from public,anon,authenticated;
grant execute on function public.protect_consent_history() to service_role;
revoke all on function public.protect_audit_history() from public,anon,authenticated;
grant execute on function public.protect_audit_history() to service_role;
revoke all on function public.compliance_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.compliance_rate_limit(text,integer,integer) to service_role;

commit;
