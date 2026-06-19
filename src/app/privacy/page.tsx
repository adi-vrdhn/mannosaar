const sections = [
  {
    title: '1. Introduction',
    body: [
      'Welcome to MANNOSAAR LLP. This Privacy Policy explains how MANNOSAAR LLP ("MANNOSAAR", "we", "our", or "us") collects, uses, stores, and protects your personal information when you use our website, platform, and mental health services.',
      'By using our platform, you agree to the practices described in this Privacy Policy.',
    ],
  },
  {
    title: '2. Information We Collect',
    body: ['We collect information to provide, improve, and secure our services.'],
    list: [
      'Full name',
      'Email address',
      'Phone number',
      'Google account information when signing in via Google',
      'Profile details',
      'Appointment and booking information',
      'Communication records',
      'Therapy-related information shared voluntarily during sessions',
    ],
  },
  {
    title: '3. Session Recordings & Therapy Information',
    body: [
      'MANNOSAAR may store therapy session recordings and related therapy information for operational, security, documentation, quality assurance, or continuity-of-care purposes.',
      'All therapy-related data is treated as confidential and protected using reasonable technical and organizational safeguards.',
      'Access to such information is restricted to authorized personnel and therapists where necessary.',
    ],
    callout: {
      title: 'Confidential handling',
      body: 'Therapy information is handled with restricted access and kept confidential except where disclosure is required for legitimate operational, security, or care-related reasons.',
    },
  },
  {
    title: '4. Payment Information',
    body: [
      'Payments are processed securely through PayU.',
      'We do not store full debit/credit card details, CVV numbers, or banking passwords.',
      'Payment processing is handled directly by certified third-party payment providers.',
    ],
  },
  {
    title: '5. Usage & Technical Data',
    body: ['We may automatically collect certain technical and usage information including:'],
    list: [
      'IP address',
      'Browser type and version',
      'Device information',
      'Pages visited',
      'Session duration',
      'Click behavior and interactions',
      'Referral sources',
    ],
    extra: ['We use services such as Google Analytics to understand platform usage and improve user experience.'],
  },
  {
    title: '6. How We Use Your Information',
    body: ['We use collected information to:'],
    list: [
      'Create and manage accounts',
      'Schedule and manage appointments',
      'Provide therapy and wellness services',
      'Send notifications and reminders',
      'Improve platform performance',
      'Process payments',
      'Maintain security and prevent misuse',
      'Comply with legal obligations',
      'Provide customer support',
    ],
  },
  {
    title: '7. Therapist-Patient Confidentiality',
    body: [
      'Information shared during therapy sessions is treated confidentially.',
      'Disclosure may occur if required by applicable law, ordered by courts or legal authorities, necessary to prevent serious harm to the user or others, or required for emergency intervention or safety concerns.',
    ],
  },
  {
    title: '8. Data Sharing',
    body: ['We do not sell your personal data.'],
    list: [
      'Licensed therapists associated with MANNOSAAR',
      'Payment processors',
      'Analytics providers',
      'Technology and hosting providers',
      'Government or legal authorities when legally required',
    ],
    extra: ['All third-party providers are expected to maintain appropriate confidentiality and security standards.'],
  },
  {
    title: '9. Data Storage & Security',
    body: [
      'We implement reasonable security measures to protect user information, including secure servers, encrypted storage where applicable, restricted access controls, and authentication protections.',
      'However, no internet-based platform can guarantee absolute security.',
      'Users are responsible for maintaining confidentiality of their account credentials.',
    ],
  },
  {
    title: '10. Data Retention',
    body: [
      'We retain personal and therapy-related information only for as long as necessary to provide services, maintain records, resolve disputes, comply with legal obligations, and improve platform operations.',
      'Certain records may be retained longer where required under applicable law.',
    ],
  },
  {
    title: '11. Account & Data Deletion',
    body: [
      'Users may request deletion of their account and associated personal data by contacting support@mannosaar.com.',
      'Some information may still be retained for legal compliance, fraud prevention, dispute resolution, or medical or operational recordkeeping requirements.',
    ],
  },
  {
    title: '12. Cookies & Tracking Technologies',
    body: [
      'MANNOSAAR may use cookies and similar technologies to improve user experience, maintain login sessions, analyze traffic and engagement, and personalize platform functionality.',
      'Users may disable cookies through browser settings, though some features may not function properly.',
    ],
  },
  {
    title: '13. Third-Party Services',
    body: ['Our platform may integrate third-party services including:'],
    list: [
      'Google Sign-In',
      'Google Analytics',
      'PayU',
    ],
    extra: ['We are not responsible for the privacy practices of third-party services. Users are encouraged to review their respective privacy policies.'],
  },
  {
    title: '14. Children’s Privacy',
    body: [
      'MANNOSAAR services are not intentionally directed toward children under the age required by applicable law without parental or guardian consent.',
      'If we become aware of unauthorized collection of data from minors, we may remove such information.',
    ],
  },
  {
    title: '15. Changes to This Privacy Policy',
    body: [
      'We may update this Privacy Policy from time to time.',
      'Updated versions will be posted on www.mannosaar.com.',
      'Continued use of the platform after updates constitutes acceptance of the revised policy.',
    ],
  },
  {
    title: '16. Contact Us',
    body: ['For privacy-related questions or requests, contact:'],
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
  callout,
  contact,
}: {
  title: string;
  body: readonly string[];
  list?: readonly string[];
  extra?: readonly string[];
  callout?: { title: string; body: string };
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

        {callout && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
            <p className="font-semibold">{callout.title}</p>
            <p className="mt-2">{callout.body}</p>
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-purple-600">
            MANNOSAAR LLP
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Privacy Policy
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
