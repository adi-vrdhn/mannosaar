# Mannosaar production readiness

Updated 3 November 2026. This is an engineering checklist, not a legal certification.

## Implemented in this change

- Booking consent requires durable database rows. A missing consent table now stops checkout instead of issuing an unrecorded signed receipt.
- The direct booking endpoint requires a verified PayU payment bound to the signed-in account and its consent record. Payment bypass is restricted to a verified admin outside production.
- Meeting creation and booking meeting-link updates require a fresh admin role lookup. The sensitive routes reject cross-origin writes.
- Booking creation and repeat email endpoints have server-side rate limits.
- Therapy, emergency, age and policy acknowledgements are separate keyboard-accessible choices.
- Optional Google Analytics loads only after an explicit choice on public informational pages. The footer provides a way to revisit the choice.
- API and private pages send `Cache-Control: private, no-store`. Sitemap `lastmod` values are no longer guessed.
- Public uploads now require a verified admin or therapist role, bounded file types and sizes, and rate limits. Comment moderation requires an admin role; public comment responses exclude contributor email.

## Before public launch

| Area | Required owner action and evidence |
| --- | --- |
| Legal and clinical review | India-qualified counsel and the clinical lead must approve the actual privacy notice, therapy consent, jurisdiction and eligibility, cancellation/refund policy, grievance contact, retention schedule, therapist credentials and crisis escalation. Do not claim legal compliance or certification without their sign-off. |
| Consent deployment | Apply and verify the `consents`, `audit_logs`, `privacy_requests`, `compliance_rate_limit`, and payment-context database objects in production. Test a missing-table failure and confirm checkout stops. Record version and timestamp of every policy release. |
| Authorization audit | Stage and apply `scripts/migrations/20261103_core_table_access.sql` after testing the `/api/private-data` browser bridge. This closes direct anon-key access to core and comment tables; the earlier `fix-rls-nextauth.sql` disabled core RLS. Review every service-role route and test each operation as anonymous, client, therapist, support and admin users. |
| Privileged accounts | Require MFA on admin, therapist, payment, hosting, database and email-provider accounts. Remove shared accounts, review access quarterly, and revoke access immediately when a role ends. |
| Booking integrity | Verify that the `wa_reserve_booking` trigger and exclusion constraint from the WhatsApp migration are deployed; they are the database boundary for website and bundle slot claims. Review duplicate provider IDs, then apply `scripts/migrations/20261103_booking_payment_uniqueness.sql`. Exercise simultaneous website bookings, callback replay and recovery against the production-equivalent schema. The website's separate slot update should still be consolidated into a transaction. |
| Monitoring | Configure uptime, error, payment, job and database alerts with an on-call owner. Do not send booking notes, symptoms, session content, raw request bodies or credentials to telemetry. Review daily health-report recipients and reduce person-level details where unnecessary. |
| Backups | Enable encrypted, access-controlled database backups or PITR with the hosting provider. Set approved RPO/RTO, keep credentials separate, perform a restore into an isolated environment at least quarterly, and record the last successful restore. Back up object storage and configuration separately if needed. |
| Incident response | Name an incident owner and deputy; document containment, credential rotation, provider escalation, evidence preservation, client notification decisions and legally required reporting windows. Exercise the procedure annually. |
| Accessibility | Run keyboard and screen-reader journeys for sign-in, consent, booking, payment, privacy requests and errors. Measure contrast and test at 200% zoom. Fix issues against WCAG 2.2 AA before claiming conformance. |
| End-to-end tests | Add Playwright with sandbox PayU and an isolated database. Cover enquiry to booking, failed payment, callback replay, simultaneous slot claims, reschedule, consent-table outage, and role denial. Never run payment tests against live merchant credentials. |
| SEO | Verify `https://www.mannosaar.com` in Search Console, submit `/sitemap.xml`, inspect canonical/indexing coverage weekly, and monitor search impressions, clicks, crawl errors and Core Web Vitals. Review clinical accuracy and author credentials on every health-related page before publication. |
| Updates | Enable dependency and security advisories. Review patches weekly, test in staging, deploy with rollback steps, and perform a quarterly access and policy review. |
| Public contributions | Blog comments currently publish immediately after a signed-in user submits them. Add a moderation queue and a warning not to disclose personal or therapy details before inviting public discussion. |

India's DPDP Act and Rules have staggered commencement dates under the official 13 November 2025 notifications. Counsel should map the applicable obligations and effective dates to Mannosaar's actual processing and locations: [Act commencement](https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf), [Rules](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf).
