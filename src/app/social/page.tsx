import SocialExperience from '@/components/social/SocialExperience';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Social Wellbeing Community',
  description: 'Explore Life Rooms, anonymous reflections, guided journeys, and a calm peer wellbeing community at Mannosaar.',
  path: '/social',
});

export default function SocialPage() {
  return <SocialExperience />;
}
