export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-2">
          Terms & Conditions
        </h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p>
              Welcome to MANNOSAAR, a mental health and wellness platform. These Terms & Conditions 
              govern your use of our services. By accessing and using MANNOSAAR, you agree to be 
              bound by these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of Service</h2>
            <p>
              You agree to use MANNOSAAR only for lawful purposes and in a way that does not infringe 
              upon the rights of others or restrict their use and enjoyment of MANNOSAAR.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Do not engage in any conduct that restricts or inhibits anyone's use or enjoyment of MANNOSAAR</li>
              <li>Do not harassment, abuse, defame, threaten or deceive other users</li>
              <li>Maintain confidentiality of your account credentials</li>
              <li>You are responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Therapy Services</h2>
            <p>
              MANNOSAAR connects you with licensed mental health professionals. The services provided are 
              professional therapeutic consultations and should not be considered emergency mental health services.
            </p>
            <p className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-800">
              <strong>⚠️ Important:</strong> If you are experiencing a mental health emergency, please contact 
              emergency services (911 in US, 999 in India) or go to the nearest hospital.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Booking & Rescheduling</h2>
            <p>
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Book appointments in advance as indicated on the platform</li>
              <li>Arrive on time for scheduled sessions</li>
              <li>Notify the therapist of cancellations with reasonable notice</li>
              <li>Comply with the therapist's session policies and guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
            <p>
              All payments are processed securely through Razorpay. By proceeding with payment, you confirm:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You are authorized to use the payment method provided</li>
              <li>The information provided is accurate and current</li>
              <li>You authorize MANNOSAAR to charge your account for the services</li>
              <li>You understand our refund policy as stated separately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Privacy & Confidentiality</h2>
            <p>
              Your privacy and the confidentiality of your information are paramount. All personal and 
              health information is protected according to our Privacy Policy. Therapist-client 
              confidentiality is maintained except where legally required to disclose.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              MANNOSAAR is provided "as-is" without warranties of any kind. In no event shall MANNOSAAR, 
              its therapists, or affiliates be liable for indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
            <p>
              All content, features, and functionality (including but not limited to all information, 
              software, text, displays, images, video and audio) are the exclusive property of MANNOSAAR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Termination</h2>
            <p>
              MANNOSAAR reserves the right to terminate or suspend your account immediately, 
              without prior notice or liability, for any reason, including if you breach any provisions of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Changes to Terms</h2>
            <p>
              MANNOSAAR reserves the right to modify these Terms at any time. Changes will be posted on this page, 
              and your continued use constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about these Terms & Conditions, please contact us at support@mannosaar.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
