import type { Metadata } from 'next';
import SocialExperience from '@/components/social/SocialExperience';

export const metadata: Metadata = {
  title: 'Social Wellbeing Community',
  description: 'Explore Life Rooms, anonymous reflections, guided journeys, and a calm peer wellbeing community at Mannosaar.',
  alternates: { canonical: '/social' },
};

export default function SocialPage() {
  return <SocialExperience />;
}
