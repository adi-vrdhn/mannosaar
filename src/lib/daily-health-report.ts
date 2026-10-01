import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { protectToken, revealToken } from '@/lib/google-calendar/token-protection';
import { fetchWithNetworkRetry } from '@/lib/supabase/retry-fetch';

export type HealthLevel = 'GOOD' | 'NORMAL' | 'BAD';

interface BookingSummary {
  client: string;
  sessionType: string;
  bookedAt: string;
  scheduledFor: string;
  status: string;
}

export interface DailyHealthReport {
  generatedAt: string;
  windowStart: string;
  todayIst: string;
  level: HealthLevel;
  site: { ok: boolean; status: number | null; latencyMs: number | null };
  counts: {
    newUsers: number;
    bookingsCreated: number;
    sessionsToday: number;
    failedPayments: number;
    deadJobs: number;
    failedMessages: number;
    upcomingCalendarGaps: number;
  };
  newUserNames: string[];
  bookings: BookingSummary[];
  errors: string[];
  warnings: string[];
  google: {
    connected: boolean;
    tokenHealthy: boolean;
    email: string | null;
    testMode: boolean;
    daysRemaining: number | null;
    message: string;
  };
  analytics: {
    configured: boolean;
    activeUsers: number | null;
    newUsers: number | null;
    sessions: number | null;
    views: number | null;
  };
  search: {
    configured: boolean;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
    indexedUrls: number | null;
    submittedUrls: number | null;
  };
}

interface GoogleCredential {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry?: string | null;
  email?: string | null;
  connected_at?: string | null;
  refresh_token_expires_at?: string | null;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithNetworkRetry },
    }
  );
}

function dateInIst(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
  }).format(date);
}

function bookingSchedule(row: Record<string, unknown>) {
  const sessions = Array.isArray(row.session_dates) ? row.session_dates : [];
  if (sessions.length) {
    return sessions.map((entry) => {
      const item = entry as Record<string, unknown>;
      const date = String(item.date || 'Date pending');
      const time = String(item.startTime || item.start_time || '').slice(0, 5);
      return `${date}${time ? ` at ${time}` : ''}`;
    }).join(', ');
  }
  const date = String(row.slot_date || 'Date pending');
  const time = String(row.slot_start_time || '').slice(0, 5);
  return `${date}${time ? ` at ${time}` : ''}`;
}

async function checkSite() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (!origin) return { ok: false, status: null, latencyMs: null };
  const started = Date.now();
  try {
    const response = await fetch(origin, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, status: null, latencyMs: Date.now() - started };
  }
}

async function loadGoogleCredential(client: SupabaseClient) {
  const rich = await client
    .from('google_oauth_credentials')
    .select('user_id,access_token,refresh_token,token_expiry,email,connected_at,refresh_token_expires_at')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!rich.error) return rich.data as GoogleCredential | null;

  // Allows the report to run before the optional countdown migration is applied.
  const fallback = await client
    .from('google_oauth_credentials')
    .select('user_id,access_token,refresh_token,token_expiry,email')
    .limit(1)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return fallback.data as GoogleCredential | null;
}

async function getGoogleAccessToken(client: SupabaseClient, credentials: GoogleCredential) {
  if (credentials.token_expiry && Date.parse(credentials.token_expiry) > Date.now() + 120_000) {
    return revealToken(credentials.access_token);
  }

  const response = await fetchWithNetworkRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: revealToken(credentials.refresh_token),
      grant_type: 'refresh_token',
    }).toString(),
  });
  if (!response.ok) throw new Error('GOOGLE_RECONNECT_REQUIRED');
  const token = await response.json() as { access_token: string; expires_in: number };
  await client.from('google_oauth_credentials').update({
    access_token: protectToken(token.access_token),
    token_expiry: new Date(Date.now() + token.expires_in * 1000).toISOString(),
  }).eq('user_id', credentials.user_id);
  return token.access_token;
}

async function loadAnalytics(accessToken: string | null, startDate: string, endDate: string) {
  const property = process.env.GOOGLE_ANALYTICS_PROPERTY_ID?.replace(/^properties\//, '');
  if (!property || !accessToken) return { configured: Boolean(property), activeUsers: null, newUsers: null, sessions: null, views: null };
  const response = await fetchWithNetworkRetry(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(property)}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    }),
  });
  if (!response.ok) throw new Error('GA4_REPORT_UNAVAILABLE');
  const body = await response.json() as { rows?: Array<{ metricValues?: Array<{ value?: string }> }> };
  const values = body.rows?.[0]?.metricValues || [];
  return {
    configured: true,
    activeUsers: Number(values[0]?.value || 0),
    newUsers: Number(values[1]?.value || 0),
    sessions: Number(values[2]?.value || 0),
    views: Number(values[3]?.value || 0),
  };
}

async function loadSearchConsole(accessToken: string | null, startDate: string, endDate: string) {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const empty = { configured: Boolean(siteUrl), clicks: null, impressions: null, ctr: null, position: null, indexedUrls: null, submittedUrls: null };
  if (!siteUrl || !accessToken) return empty;
  const encodedSite = encodeURIComponent(siteUrl);
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const [performanceResponse, sitemapResponse] = await Promise.all([
    fetchWithNetworkRetry(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
      method: 'POST', headers, body: JSON.stringify({ startDate, endDate }),
    }),
    fetchWithNetworkRetry(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, { headers }),
  ]);
  if (!performanceResponse.ok) throw new Error('SEARCH_CONSOLE_REPORT_UNAVAILABLE');
  const performance = await performanceResponse.json() as { rows?: Array<{ clicks?: number; impressions?: number; ctr?: number; position?: number }> };
  const row = performance.rows?.[0];
  let indexedUrls: number | null = null;
  let submittedUrls: number | null = null;
  if (sitemapResponse.ok) {
    const sitemap = await sitemapResponse.json() as { sitemap?: Array<{ contents?: Array<{ type?: string; submitted?: number; indexed?: number }> }> };
    const contents = (sitemap.sitemap || []).flatMap((item) => item.contents || []).filter((item) => item.type === 'web');
    indexedUrls = contents.reduce((sum, item) => sum + Number(item.indexed || 0), 0);
    submittedUrls = contents.reduce((sum, item) => sum + Number(item.submitted || 0), 0);
  }
  return {
    configured: true,
    clicks: Number(row?.clicks || 0),
    impressions: Number(row?.impressions || 0),
    ctr: Number(row?.ctr || 0),
    position: Number(row?.position || 0),
    indexedUrls,
    submittedUrls,
  };
}

export async function createDailyHealthReport(now = new Date()): Promise<DailyHealthReport> {
  const client = db();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const todayIst = dateInIst(now);
  const previousFullDayIst = dateInIst(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const searchEndIst = dateInIst(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
  const searchStartIst = dateInIst(new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000));
  const errors: string[] = [];
  const warnings: string[] = [];
  const site = await checkSite();
  if (!site.ok) errors.push('Website health check failed.');

  const [usersResult, bookingsResult, todaySessionsResult, failedPaymentsResult, calendarGapsResult] = await Promise.all([
    client.from('users').select('name,email,created_at').gte('created_at', since.toISOString()).order('created_at', { ascending: false }),
    client.from('bookings').select('user_name,user_email,session_type,status,created_at,slot_date,slot_start_time,session_dates').gte('created_at', since.toISOString()).order('created_at', { ascending: false }),
    client.from('bookings').select('id').eq('slot_date', todayIst).in('status', ['pending', 'confirmed']),
    client.from('bookings').select('id').eq('payment_status', 'failed').gte('created_at', since.toISOString()),
    client.from('bookings').select('id,google_calendar_event_id,meeting_link').gte('slot_date', todayIst).eq('status', 'confirmed'),
  ]);

  const coreResults = [usersResult, bookingsResult, todaySessionsResult, failedPaymentsResult, calendarGapsResult];
  const coreLabels = ['new users', 'new bookings', 'today sessions', 'failed payments', 'calendar gaps'];
  coreResults.forEach((result, index) => {
    if (result.error) errors.push(`Database check failed for ${coreLabels[index]}.`);
  });

  let deadJobs = 0;
  let failedMessages = 0;
  if (process.env.WHATSAPP_BOOKING_ENABLED === 'true') {
    const [jobsResult, messagesResult] = await Promise.all([
      client.from('background_jobs').select('id,last_error').eq('status', 'DEAD').gte('updated_at', since.toISOString()),
      client.from('whatsapp_messages').select('id,error_code').not('error_code', 'is', null).gte('created_at', since.toISOString()),
    ]);
    if (jobsResult.error) warnings.push('WhatsApp background-job monitoring is unavailable.');
    else deadJobs = jobsResult.data?.length || 0;
    if (messagesResult.error) warnings.push('WhatsApp delivery monitoring is unavailable.');
    else failedMessages = messagesResult.data?.length || 0;
  }

  const users = usersResult.data || [];
  const bookingRows = bookingsResult.data || [];
  const upcomingRows = calendarGapsResult.data || [];
  const upcomingCalendarGaps = upcomingRows.filter((row) => !row.google_calendar_event_id || !row.meeting_link).length;
  if ((failedPaymentsResult.data?.length || 0) > 0) warnings.push('One or more payments failed in the last 24 hours.');
  if (deadJobs > 0) errors.push('One or more background jobs need attention.');
  if (failedMessages > 0) warnings.push('One or more WhatsApp messages reported an error.');
  if (upcomingCalendarGaps > 0) warnings.push(`${upcomingCalendarGaps} upcoming booking(s) are missing a calendar event or meeting link.`);

  let google: DailyHealthReport['google'] = {
    connected: false, tokenHealthy: false, email: null,
    testMode: process.env.GOOGLE_OAUTH_TEST_MODE === 'true', daysRemaining: null,
    message: 'Google Calendar is not connected.',
  };
  let accessToken: string | null = null;
  try {
    const credentials = await loadGoogleCredential(client);
    if (credentials) {
      accessToken = await getGoogleAccessToken(client, credentials);
      const expiresAt = credentials.refresh_token_expires_at ? Date.parse(credentials.refresh_token_expires_at) : null;
      const daysRemaining = expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - now.getTime()) / 86_400_000));
      google = {
        connected: true, tokenHealthy: true, email: credentials.email || null,
        testMode: process.env.GOOGLE_OAUTH_TEST_MODE === 'true', daysRemaining,
        message: daysRemaining === null && process.env.GOOGLE_OAUTH_TEST_MODE === 'true'
          ? 'Reconnect once to start the 7-day test-mode countdown.'
          : daysRemaining !== null && daysRemaining <= 2
            ? `Reconnect Google soon — about ${daysRemaining} day(s) remain.`
            : 'Google Calendar token is healthy.',
      };
      if (daysRemaining !== null && daysRemaining <= 2) warnings.push(google.message);
    } else {
      errors.push('Google Calendar is not connected.');
    }
  } catch {
    google.message = 'Google authorization has expired or could not be refreshed. Reconnect it now.';
    errors.push(google.message);
  }

  let analytics: DailyHealthReport['analytics'];
  try {
    analytics = await loadAnalytics(accessToken, previousFullDayIst, previousFullDayIst);
    if (!analytics.configured) warnings.push('GA4 property ID is not configured for the daily report.');
  } catch {
    analytics = { configured: true, activeUsers: null, newUsers: null, sessions: null, views: null };
    warnings.push('Google Analytics data could not be loaded. Reconnect Google and verify GA4 access.');
  }

  let search: DailyHealthReport['search'];
  try {
    search = await loadSearchConsole(accessToken, searchStartIst, searchEndIst);
    if (!search.configured) warnings.push('Search Console site URL is not configured for the daily report.');
  } catch {
    search = { configured: true, clicks: null, impressions: null, ctr: null, position: null, indexedUrls: null, submittedUrls: null };
    warnings.push('Search Console data could not be loaded. Reconnect Google and verify site access.');
  }

  const level: HealthLevel = errors.length > 0 ? 'BAD' : warnings.length > 0 ? 'NORMAL' : 'GOOD';
  return {
    generatedAt: now.toISOString(), windowStart: since.toISOString(), todayIst, level, site,
    counts: {
      newUsers: users.length,
      bookingsCreated: bookingRows.length,
      sessionsToday: todaySessionsResult.data?.length || 0,
      failedPayments: failedPaymentsResult.data?.length || 0,
      deadJobs,
      failedMessages,
      upcomingCalendarGaps,
    },
    newUserNames: users.map((user) => user.name || user.email || 'Unnamed user'),
    bookings: bookingRows.map((row) => ({
      client: row.user_name || row.user_email || 'Unknown client',
      sessionType: row.session_type || 'Unknown',
      bookedAt: formatDateTime(row.created_at),
      scheduledFor: bookingSchedule(row),
      status: row.status || 'Unknown',
    })),
    errors, warnings, google, analytics, search,
  };
}
