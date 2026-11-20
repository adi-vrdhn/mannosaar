import instrument from '@/lib/mind-check-questions.json';
import { buildReflection } from '@/lib/mind-check-reflections';

interface Props {
  concern: (typeof instrument.concerns)[number];
  answers: Readonly<Record<string, number>>;
}

export default function MindCheckReflection({ concern, answers }: Props) {
  const reflection = buildReflection(concern, answers);
  if (!reflection) return null;
  const standout = reflection.standouts[0];

  return <div className="mt-6">
    {standout ? <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-playfair text-xl font-semibold text-[#34213f]">{standout.title}</p>
        <span className="text-xs text-[#65527E]">You answered {standout.frequency.toLowerCase()}</span>
      </div>
      <p className="mt-2 text-sm leading-7 text-[#4c4052] sm:text-base">{standout.detail}</p>
    </> : <p className="text-sm leading-7 text-[#4c4052] sm:text-base">{reflection.quietNote}</p>}
    <div className="mt-6 border-t border-[#6f4b88]/20 pt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f4b88]">A small next step</p>
      <p className="mt-2 text-sm leading-7 text-[#4c4052] sm:text-base">{reflection.nextStep}</p>
    </div>
  </div>;
}
