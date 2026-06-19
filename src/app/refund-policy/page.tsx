const sections = [
  {
    title: '1. Introduction',
    body: [
      'Welcome to MANNOSAAR LLP. This Refund & Cancellation Policy explains the conditions under which refunds, cancellations, and rescheduling requests are handled for services provided by MANNOSAAR LLP.',
      'By booking a session through our platform, you agree to this policy.',
    ],
  },
  {
    title: '2. Appointment Cancellation Policy',
    body: ['Users may cancel or reschedule therapy sessions through the platform or by contacting our support team.'],
    list: [
      'More than 24 hours before the session: Eligible for a 100% refund',
      'Between 12 to 24 hours before the session: Eligible for a 50% refund',
      'Less than 12 hours before the session: No refund will be issued',
    ],
  },
  {
    title: '3. No-Show Policy',
    body: ['Refunds will not be provided if:'],
    list: [
      'The user fails to attend the scheduled session',
      'The user joins significantly late and the therapist is unavailable',
      'The user does not respond during the scheduled appointment time',
    ],
    extra: ['In such cases, the full session amount may be forfeited.'],
  },
  {
    title: '4. Therapist Cancellation',
    body: [
      'If a therapist cancels a session, users may choose to reschedule the appointment or request a full refund.',
      'Refunds in such situations will be processed without cancellation charges.',
    ],
  },
  {
    title: '5. Technical Issues',
    body: [
      'If verified technical problems from MANNOSAAR’s side prevent a session from taking place, users may be eligible for a full refund or session rescheduling without additional charges.',
      'Technical issues caused by the user’s personal internet connection, device issues, or unsupported software may not qualify for refunds.',
    ],
  },
  {
    title: '6. Incorrect or Duplicate Payments',
    body: ['Users may request refunds for:'],
    list: [
      'Duplicate payments',
      'Incorrect billing',
      'Failed transactions where payment was deducted but booking was not confirmed',
    ],
    extra: ['Such requests are subject to verification by MANNOSAAR LLP and payment partners.'],
  },
  {
    title: '7. Non-Refundable Situations',
    body: ['Refunds shall not be issued in the following situations:'],
    list: [
      'Completed therapy sessions',
      'Cancellation requests made after the session has started',
      'Requests submitted more than 7 days after the scheduled session date',
      'Violation of platform policies or misuse of services',
      'Dissatisfaction based solely on therapy outcomes or personal expectations',
    ],
  },
  {
    title: '8. Refund Processing Timeline',
    body: [
      'Approved refunds are generally processed within 5 to 10 business days.',
      'Actual credit timelines may vary depending on banks, card issuers, payment providers, or UPI or wallet services.',
      'Payments are processed securely through PayU.',
    ],
  },
  {
    title: '9. Rescheduling Policy',
    body: [
      'Users may request to reschedule appointments subject to therapist availability.',
      'Repeated last-minute rescheduling or misuse of booking slots may result in restrictions or account suspension.',
    ],
  },
  {
    title: '10. Changes to This Policy',
    body: [
      'MANNOSAAR LLP reserves the right to modify this Refund & Cancellation Policy at any time.',
      'Updated versions will be posted on www.mannosaar.com.',
      'Continued use of the platform after updates constitutes acceptance of the revised policy.',
    ],
  },
  {
    title: '11. Contact Information',
    body: ['For refund-related queries, please contact:'],
    contact: {
      company: 'MANNOSAAR LLP',
      website: 'https://www.mannosaar.com',
      email: 'support@mannosaar.com',
    },
  },
] as const;

function SectionCard({
  title,
  body,
  list,
  extra,
  contact,
}: {
  title: string;
  body: readonly string[];
  list?: readonly string[];
  extra?: readonly string[];
  contact?: { company: string; website: string; email: string };
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>

      <div className="mt-4 space-y-4 text-sm sm:text-base leading-7 text-gray-700">
        {body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        {list && (
          <ul className="space-y-2 pl-5 list-disc">
            {list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {extra && (
          <div className="space-y-3">
            {extra.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {contact && (
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-gray-700">
            <p className="font-semibold text-gray-900">{contact.company}</p>
            <p className="mt-2">
              Website:{' '}
              <a
                href={contact.website}
                className="font-medium text-purple-700 underline underline-offset-4"
              >
                {contact.website}
              </a>
            </p>
            <p className="mt-1">
              Email:{' '}
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-purple-700 underline underline-offset-4"
              >
                {contact.email}
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-purple-600">
            MANNOSAAR LLP
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-3 text-gray-600">Last updated: May 16, 2026</p>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <SectionCard key={section.title} {...section} />
          ))}
        </div>
      </div>
    </div>
  );
}
