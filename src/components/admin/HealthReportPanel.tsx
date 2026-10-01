'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  MailCheck,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import type { DailyHealthReport } from '@/lib/daily-health-report';

interface ReportResponse {
  report: DailyHealthReport;
  emailed: boolean;
  recipientConfigured: boolean;
}

export default function HealthReportPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReportResponse | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/health-report', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to generate the report.');
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate the report.');
    } finally {
      setLoading(false);
    }
  };

  const report = result?.report;
  const statusStyles = report?.level === 'GOOD'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : report?.level === 'NORMAL'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-red-200 bg-red-50 text-red-800';

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/60 p-5 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b267a]">Website monitoring</p>
          <h2 className="mt-2 font-playfair text-2xl font-semibold text-[#34213f]">Health report</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate the latest website, booking, user, Google, and delivery checks. A copy is also emailed to the configured report address.
          </p>
        </div>
        <button
          type="button"
          onClick={generateReport}
          disabled={loading}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#5b267a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#472061] disabled:cursor-wait disabled:opacity-65"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating report…' : report ? 'Refresh report' : 'Get report now'}
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {report && (
        <div className="mt-7 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${statusStyles}`}>
              {report.level === 'BAD' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {report.level}
            </span>
            <span className="text-sm text-slate-500">
              Generated {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(report.generatedAt))}
            </span>
            {result.emailed && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><MailCheck className="h-4 w-4" /> Email sent</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Users} label="New users" value={report.counts.newUsers} />
            <Metric icon={CalendarCheck} label="Bookings made" value={report.counts.bookingsCreated} />
            <Metric icon={Activity} label="Sessions today" value={report.counts.sessionsToday} />
            <Metric icon={AlertTriangle} label="Problems" value={report.errors.length + report.warnings.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-900">System checks</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <ReportRow label="Website" value={report.site.ok ? `Online · ${report.site.latencyMs} ms` : 'Needs attention'} />
                <ReportRow label="Failed payments" value={String(report.counts.failedPayments)} />
                <ReportRow label="Dead jobs" value={String(report.counts.deadJobs)} />
                <ReportRow label="Calendar gaps" value={String(report.counts.upcomingCalendarGaps)} />
              </dl>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-900">Google</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{report.google.message}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <ReportRow label="GA active users" value={report.analytics.activeUsers === null ? 'Not available' : String(report.analytics.activeUsers)} />
                <ReportRow label="GA sessions" value={report.analytics.sessions === null ? 'Not available' : String(report.analytics.sessions)} />
                <ReportRow label="Search impressions" value={report.search.impressions === null ? 'Not available' : String(report.search.impressions)} />
                <ReportRow label="Indexed URLs" value={report.search.indexedUrls === null ? 'Not available' : `${report.search.indexedUrls}/${report.search.submittedUrls}`} />
              </dl>
            </div>
          </div>

          {(report.errors.length > 0 || report.warnings.length > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="flex items-center gap-2 font-bold text-amber-950"><Search className="h-4 w-4" /> Needs attention</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
                {[...report.errors, ...report.warnings].map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          )}

          {!result.recipientConfigured && (
            <p className="text-sm font-semibold text-amber-700">The report was generated, but no report email address is configured.</p>
          )}
        </div>
      )}
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white bg-white/80 p-4 shadow-sm">
      <Icon className="h-5 w-5 text-[#5b267a]" />
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#34213f]">{value}</p>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="font-bold text-slate-900">{value}</dd></div>;
}
