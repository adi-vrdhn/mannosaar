'use client';

import { usePathname } from 'next/navigation';

const WhatsAppButton = () => {
  const pathname = usePathname();
  const whatsappLink = `https://wa.me/917080633396?text=${encodeURIComponent('Hi, I would like to know more about Mannosaar.')}`;
  const bottomPosition = pathname === '/appointment/slots'
    ? 'bottom-36 sm:bottom-32'
    : pathname === '/social'
      ? 'bottom-24 sm:bottom-6'
      : 'bottom-6';

  return (
    <a
      href={whatsappLink}
      aria-label="WhatsApp us at +91 70806 33396"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed right-4 z-[90] inline-flex min-h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 font-semibold text-white shadow-lg transition hover:bg-[#1da851] hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128c7e] sm:right-6 ${bottomPosition}`}
    >
      <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.52 3.48A11.85 11.85 0 0 0 12.07 0C5.49 0 .13 5.36.13 11.94c0 2.1.55 4.16 1.6 5.98L0 24l6.23-1.63a11.9 11.9 0 0 0 5.84 1.49h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.44ZM12.08 21.84a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.7.97.99-3.6-.23-.37a9.91 9.91 0 0 1-1.52-5.3c0-5.48 4.46-9.94 9.95-9.94a9.88 9.88 0 0 1 7.04 2.91 9.87 9.87 0 0 1 2.91 7.04c0 5.48-4.46 9.94-9.93 9.94Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.11.57-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z"/>
      </svg>
      <span>WhatsApp us</span>
    </a>
  );
};

export default WhatsAppButton;
