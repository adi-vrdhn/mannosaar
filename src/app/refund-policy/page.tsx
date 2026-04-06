export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-2">
          Refund Policy
        </h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: April 2026</p>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Overview</h2>
            <p>
              At MANNOSAAR, we want you to be satisfied with your therapy experience. This Refund Policy 
              outlines the terms under which refunds can be requested for therapy sessions and services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Refund Eligibility</h2>
            <p>You may request a refund if:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You cancel your session at least 24 hours before the scheduled time</li>
              <li>The therapist cancels the session without completing it</li>
              <li>Payment was processed incorrectly</li>
              <li>Technical issues prevented you from attending the session for which you paid</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Non-Refundable Situations</h2>
            <p>Refunds will NOT be issued in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You cancel within 24 hours of your scheduled session</li>
              <li>You miss or no-show for your scheduled appointment</li>
              <li>You fail to join the session at the scheduled time</li>
              <li>The session has already been completed</li>
              <li>You request a refund more than 7 days after the session date</li>
            </ul>
            <p className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-800">
              <strong>Note:</strong> To maintain fairness and respect for therapist schedules, 
              we enforce strict cancellation policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Refund Process</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Contact our support team within 7 days of the transaction</li>
              <li>Provide your booking ID and reason for refund request</li>
              <li>Include any supporting documentation (screenshots, error messages, etc.)</li>
              <li>Our team will review and respond within 5-7 business days</li>
              <li>If approved, refunds are processed to your original payment method</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Refund Timeline</h2>
            <p>
              Once a refund is approved, the funds will be returned to your original payment method. 
              Depending on your bank or payment service provider, it may take 5-10 business days for 
              the amount to appear in your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Cancellation Policy</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-4">
              <p className="font-bold text-blue-900 mb-3">📅 Cancellation Timeline:</p>
              <ul className="list-disc pl-6 space-y-2 text-blue-900">
                <li><strong>More than 24 hours before:</strong> Full refund eligible</li>
                <li><strong>12-24 hours before:</strong> 50% refund</li>
                <li><strong>Less than 12 hours:</strong> No refund</li>
                <li><strong>No-show:</strong> No refund (full amount forfeited)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Rescheduling Instead of Canceling</h2>
            <p>
              Instead of requesting a refund, you can reschedule your session to another time without penalty. 
              To reschedule:
            </p>
            <ol className="list-decimal pl-6 space-y-2 mt-4">
              <li>Visit your bookings page in the dashboard</li>
              <li>Click "Reschedule" on the booking</li>
              <li>Select a new date and time within 30 days</li>
              <li>No additional charges will be applied</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Dispute Resolution</h2>
            <p>
              If you believe a charge was made in error or you have a dispute regarding a refund, 
              please contact our support team immediately:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> support@mannosaar.com<br/>
              <strong>Response time:</strong> Within 48 business hours
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Changes to Refund Policy</h2>
            <p>
              MANNOSAAR reserves the right to modify this Refund Policy at any time. Changes will be posted 
              on this page, and your continued use of our services signifies your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact Support</h2>
            <p>
              For any refund-related inquiries, please contact us at support@mannosaar.com with:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Your account email</li>
              <li>Booking ID</li>
              <li>Transaction ID</li>
              <li>Detailed explanation of your request</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
