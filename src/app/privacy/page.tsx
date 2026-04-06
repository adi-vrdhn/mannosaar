export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              MANNOSAAR ("we", "us", "our", or "Company") operates the platform. This page informs you 
              of our policies regarding the collection, use, and disclosure of personal data when you use 
              our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information Collection and Use</h2>
            <p>We collect several different types of information for various purposes to provide and 
              improve our Service to you.</p>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2.1 Personal Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Name and Email:</strong> Collected during account registration</li>
              <li><strong>Phone Number:</strong> For appointment confirmations and communications</li>
              <li><strong>Profile Information:</strong> Your profile picture and bio</li>
              <li><strong>Booking Information:</strong> Session dates, times, and types</li>
              <li><strong>Payment Information:</strong> Processed securely through Razorpay (we do not store full card details)</li>
              <li><strong>Health Information:</strong> Session notes and therapy records (stored securely with encryption)</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2.2 Usage Data</h3>
            <p>We may also collect information about how the Service is accessed and used ("Usage Data") including:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Your device's IP address</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Features used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Use of Data</h2>
            <p>MANNOSAAR uses the collected data for various purposes:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service</li>
              <li>To provide customer care and support</li>
              <li>To gather analysis or valuable information to improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues and fraud</li>
              <li>To send you marketing emails (only with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Security of Data</h2>
            <p>
              The security of your data is important to us, but remember that no method of transmission 
              over the internet or method of electronic storage is 100% secure. While we strive to use 
              commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Therapist-Patient Confidentiality</h2>
            <p>
              All information shared during therapy sessions is protected by therapist-patient confidentiality, 
              except in cases where:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Legally required by law or court order</li>
              <li>There is imminent danger to you or others</li>
              <li>You provide written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Google OAuth</h2>
            <p>
              When you sign in using Google OAuth, we collect your email address and name from your Google account. 
              We do not store your Google password. Your Google account data is handled according to Google's privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Opt-out of marketing emails</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Cookies</h2>
            <p>
              MANNOSAAR uses cookies to track your preferences and recognize you. You can instruct your browser 
              to refuse all cookies or to indicate when a cookie is being sent. However, some features of our 
              Service may not function properly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@mannosaar.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
