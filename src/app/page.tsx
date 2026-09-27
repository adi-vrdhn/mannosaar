import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import MentalLoadSection from '@/components/home/MentalLoadSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import ServicesSection from '@/components/home/ServicesSection';
import FaqSection from '@/components/home/FaqSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Online Counselling in India',
  description: 'Private online counselling with Neetu Rathore for personal, relationship, career and everyday emotional concerns in Hindi and English.',
  path: '/',
});

export default function Home() {
  return (
    <div className="flex w-full flex-col bg-[#cbb7df]">
      <HeroSection />
      <MentalLoadSection />
      <HowItWorksSection />
      <ServicesSection />
      <FaqSection />
      <ReviewsSection />
    </div>
  );
}
