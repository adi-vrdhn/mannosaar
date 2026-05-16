const sections = [
  {
    title: '1. Introduction',
    body: [
      'Welcome to MANNOSAAR LLP. These Terms & Conditions ("Terms") govern your access to and use of the MANNOSAAR platform, website, and services operated by MANNOSAAR LLP ("Company", "we", "our", or "us").',
      'By accessing or using our platform, you agree to comply with and be legally bound by these Terms. If you do not agree with these Terms, please do not use our services.',
    ],
  },
  {
    title: '2. About MANNOSAAR',
    body: [
      'MANNOSAAR is an online mental health and wellness platform that enables users to book therapy and counseling sessions with qualified mental health professionals.',
    ],
    list: [
      'Appointment booking',
      'Online consultation sessions',
      'User accounts and profiles',
      'Payment processing',
      'Communication and scheduling tools',
      'Wellness-related content and resources',
    ],
  },
  {
    title: '3. Eligibility',
    body: [
      'By using MANNOSAAR, you confirm that:',
    ],
    list: [
      'You are at least 18 years old, or using the platform under parental/legal guardian supervision',
      'The information provided by you is accurate and complete',
      'You are legally capable of entering into binding agreements under applicable Indian laws',
    ],
  },
  {
    title: '4. User Accounts',
    body: [
      'To access certain services, you may be required to create an account using email address, Google Sign-In authentication, or phone number.',
      'You agree to maintain confidentiality of your login credentials, be responsible for all activities under your account, and notify us immediately of any unauthorized access or security breach.',
      'We reserve the right to suspend or terminate accounts found violating these Terms.',
    ],
  },
  {
    title: '5. Therapy & Wellness Services',
    body: [
      'MANNOSAAR acts as a platform connecting users with mental health professionals.',
      'Therapy outcomes may vary for every individual. Sessions are intended for emotional and mental wellness support. MANNOSAAR does not guarantee specific therapeutic results and the platform is not a substitute for emergency medical services.',
    ],
    callout: {
      title: 'Emergency Disclaimer',
      body: 'MANNOSAAR is not designed for crisis or emergency situations. If you are experiencing suicidal thoughts, self-harm risk, a medical emergency, or a severe psychiatric emergency, please immediately contact local emergency services, the nearest hospital, or licensed emergency mental health professionals.',
    },
  },
  {
    title: '6. Appointments, Cancellations & Rescheduling',
    body: ['Users agree to:'],
    list: [
      'Book appointments responsibly',
      'Attend sessions on time',
      'Provide accurate booking details',
    ],
    extra: [
      'Rescheduling or cancellation requests must be made within the timeline specified on the platform or by the therapist.',
      'Refund eligibility may vary depending on cancellation timing.',
      'Repeated no-shows or misuse may result in account suspension.',
      'Therapists reserve the right to reschedule appointments due to unavoidable circumstances.',
    ],
  },
  {
    title: '7. Payments & Refunds',
    body: [
      'Payments on MANNOSAAR are securely processed through Razorpay.',
      'By making payments, you agree that you are authorized to use the selected payment method, the payment details provided are accurate, and charges for booked services may apply immediately.',
    ],
    extra: [
      'Refunds, if applicable, shall be processed according to our separate Refund Policy. Processing timelines may vary depending on banks and payment providers.',
      'MANNOSAAR reserves the right to refuse refunds in cases involving abuse of services, fraudulent transactions, or violation of platform policies.',
    ],
  },
  {
    title: '8. Privacy & Data Collection',
    body: [
      'We may collect and process name, email address, phone number, Google account information, appointment details, and basic usage analytics.',
      'Your data is handled in accordance with our Privacy Policy.',
    ],
    list: [
      'Google Analytics',
      'Google Sign-In',
      'Razorpay',
    ],
    extra: ['By using the platform, you consent to such data processing.'],
  },
  {
    title: '9. Confidentiality',
    body: [
      'Therapy sessions are intended to remain confidential between therapist and client, subject to legal obligations, court orders, risk of self-harm or harm to others, and situations mandated under Indian law.',
      'Users agree not to record, distribute, or misuse session content without consent.',
    ],
  },
  {
    title: '10. Intellectual Property',
    body: [
      'All content on MANNOSAAR including branding, logos, website design, text, graphics, and platform features are the intellectual property of MANNOSAAR LLP and may not be copied, reproduced, or distributed without written permission.',
    ],
  },
  {
    title: '11. Prohibited Activities',
    body: ['Users must not:'],
    list: [
      'Harass or abuse therapists or other users',
      'Attempt unauthorized access to the platform',
      'Upload harmful, illegal, or misleading content',
      'Use the platform for unlawful activities',
      'Impersonate another person or entity',
    ],
    extra: ['Violation may result in suspension or legal action.'],
  },
  {
    title: '12. Limitation of Liability',
    body: [
      'To the maximum extent permitted under applicable law, MANNOSAAR LLP shall not be liable for indirect or consequential damages, emotional distress claims arising from therapy outcomes, technical interruptions or downtime, third-party service failures, or loss of data or unauthorized access beyond reasonable control.',
      'Use of the platform is at your own discretion and risk.',
    ],
  },
  {
    title: '13. Third-Party Services',
    body: [
      'MANNOSAAR may contain integrations or links to third-party services. We are not responsible for their content, privacy practices, service availability, or payment processing failures.',
      'Users are encouraged to review respective third-party policies.',
    ],
  },
  {
    title: '14. Modifications to Terms',
    body: [
      'We reserve the right to update or modify these Terms at any time. Updated Terms will be posted on the platform with revised effective dates.',
      'Continued use of the platform after changes constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: '15. Governing Law',
    body: [
      'These Terms shall be governed by and interpreted in accordance with the laws of India.',
      'Any disputes arising under these Terms shall be subject to the jurisdiction of competent courts in India.',
    ],
  },
  {
    title: '16. Contact Information',
    body: [
      'For questions regarding these Terms, please contact:',
    ],
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
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">{title}</h2>

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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <p className="font-semibold">{callout.title}</p>
            <p className="mt-2">{callout.body}</p>
          </div>
        )}

        {contact && (
          <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-gray-700">
            <p className="font-semibold text-gray-900">{contact.company}</p>
            <p className="mt-2">
              Website: <a href={contact.website} className="font-medium text-purple-700 underline underline-offset-4">{contact.website}</a>
            </p>
            <p className="mt-1">
              Email: <a href={`mailto:${contact.email}`} className="font-medium text-purple-700 underline underline-offset-4">{contact.email}</a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-purple-600 mb-2">
            MANNOSAAR LLP
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Terms & Conditions
          </h1>
          <p className="mt-3 text-gray-600">
            Last updated: May 16, 2026
          </p>
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
