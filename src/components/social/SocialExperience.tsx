'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMemo, useState } from 'react';
import {
  ArrowRight, Bookmark, Check, ChevronRight, CircleHelp, EyeOff, Flag,
  Home, LockKeyhole, MessageCircleHeart, MoreHorizontal, NotebookPen,
  Pause, ShieldCheck, Sparkles, UsersRound, X,
} from 'lucide-react';

type LifeRoom = { title: string; description: string; lessons: number; position: string; tall?: boolean };

const lifeRooms: LifeRoom[] = [
  { title: 'Breakups & Moving On', description: 'For the days when letting go feels less like a decision and more like practice.', lessons: 6, position: '0% center', tall: true },
  { title: 'Career & Placement Stress', description: 'When everyone seems ahead and you are trying to figure out what comes next.', lessons: 7, position: '33% center' },
  { title: 'Academic Pressure', description: 'A softer place to untangle expectations, deadlines, and the fear of falling behind.', lessons: 5, position: '31% center' },
  { title: 'Overthinking', description: 'Make a little room between a thought and the story it keeps becoming.', lessons: 8, position: '100% center', tall: true },
  { title: 'Loneliness', description: 'For feeling disconnected, even when there are people all around you.', lessons: 5, position: '100% center' },
  { title: 'Family Expectations', description: 'Hold what matters to you without losing yourself in what others need.', lessons: 6, position: '1% center' },
  { title: 'Relationships', description: 'Notice patterns, name needs, and find kinder ways to stay connected.', lessons: 7, position: '0% center', tall: true },
  { title: 'Burnout', description: 'Slow down before rest becomes something you have to earn.', lessons: 5, position: '32% center' },
  { title: 'Confidence & Self-Worth', description: 'Rebuild trust in your own voice, one small choice at a time.', lessons: 6, position: '2% center' },
  { title: 'New City & Homesickness', description: 'For making a place feel yours while still missing the one you left.', lessons: 5, position: '67% center', tall: true },
];

const initialPosts = [
  { id: 1, room: 'Career & Placement Stress', text: 'I feel like everyone around me knows what they’re doing except me.', color: '#eee8df' },
  { id: 2, room: 'Moving On', text: 'I stopped checking their profile for three days. It sounds small, but I’m proud of it.', color: '#eadfe5' },
  { id: 3, room: 'New City & Homesickness', text: 'I moved cities for college and I didn’t realise how lonely it would feel.', color: '#e2e8e2' },
  { id: 4, room: 'Overthinking', text: 'Today I wrote down the thought instead of arguing with it for an hour.', color: '#e8e2d8' },
  { id: 5, room: 'Family Expectations', text: 'Saying “I need time to think” felt like a boundary and not an excuse.', color: '#eee2dc' },
  { id: 6, room: 'Burnout', text: 'Rested before finishing everything. The unfinished things were still there, and I was okay.', color: '#e0e5e1' },
];

const journeys = [
  ['5 days of slowing down overthinking', '5 days', 'One quiet prompt and one small practice each day.', 0],
  ['7 days after a breakup', '7 days', 'Gentle structure for the hours that feel unexpectedly heavy.', 28],
  ['Getting through placement season', '6 days', 'Separate your next step from everyone else’s timeline.', 0],
  ['Rebuilding confidence', '8 days', 'Collect evidence of the person you are becoming.', 50],
  ['Finding your routine in a new city', '5 days', 'Create familiar anchors in an unfamiliar place.', 0],
] as const;

const recommendations: Record<string, string[]> = {
  Career: ['Career & Placement Stress', 'Confidence & Self-Worth'],
  Studies: ['Academic Pressure', 'Overthinking'],
  Relationships: ['Relationships', 'Breakups & Moving On'],
  Family: ['Family Expectations', 'Confidence & Self-Worth'],
  Loneliness: ['Loneliness', 'New City & Homesickness'],
  Money: ['Career & Placement Stress', 'Overthinking'],
  Health: ['Burnout', 'Overthinking'],
  'Nothing specific': ['Overthinking', 'Confidence & Self-Worth'],
};

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="max-w-2xl">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#76576e]">{eyebrow}</p>
    <h2 className="mt-3 font-playfair text-3xl leading-tight text-[#302334] sm:text-4xl lg:text-[2.8rem]">{title}</h2>
    {copy && <p className="mt-4 max-w-xl text-base leading-7 text-[#655d66]">{copy}</p>}
  </div>;
}

function LifeRoomCard({ room }: { room: LifeRoom }) {
  return <article className="group mb-5 break-inside-avoid overflow-hidden rounded-[1.7rem] border border-[#ddd5d5] bg-white transition duration-200 hover:-translate-y-1 hover:border-[#bdaeb9]">
    <div className={`${room.tall ? 'h-72' : 'h-48'} bg-cover transition duration-200 group-hover:scale-[1.015]`} style={{ backgroundImage: "url('/images/social/life-rooms-editorial.png')", backgroundPosition: room.position, backgroundSize: '400% 100%' }} role="img" aria-label="Calm editorial still life" />
    <div className="p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#88727f]">Life Room · {room.lessons} short lessons</p>
      <h3 className="mt-2 font-playfair text-2xl text-[#302334]">{room.title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#6d646b]">{room.description}</p>
      <a href="#room-preview" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#5b267a]">Enter room <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></a>
    </div>
  </article>;
}

function CommunityPost({ post, onHide }: { post: (typeof initialPosts)[number]; onHide: () => void }) {
  const [reaction, setReaction] = useState('');
  const [menu, setMenu] = useState(false);
  const [reported, setReported] = useState(false);
  const options = post.id % 2 ? ['I relate', 'You’re not alone', 'Rooting for you'] : ['I relate', 'Thank you for sharing'];
  return <article className="mb-4 break-inside-avoid rounded-[1.5rem] border border-[#ded7d4] p-5 sm:p-6" style={{ backgroundColor: post.color }}>
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-xs font-semibold text-[#4d3c4e]">Anonymous</p><p className="mt-1 text-[11px] text-[#7a6f76]">Someone in {post.room}</p></div>
      <div className="relative">
        <button type="button" onClick={() => setMenu(value => !value)} className="rounded-full p-2 text-[#766d72] hover:bg-white/60" aria-label="Post options"><MoreHorizontal size={18} /></button>
        {menu && <div className="absolute right-0 top-10 z-10 w-40 overflow-hidden rounded-xl border border-[#d7cecf] bg-white p-1 shadow-lg">
          <button type="button" onClick={onHide} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f5f1ee]"><EyeOff size={14} /> Hide content</button>
          <button type="button" onClick={() => { setReported(true); setMenu(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-[#f5f1ee]"><Flag size={14} /> Report post</button>
        </div>}
      </div>
    </div>
    <p className="mt-6 font-playfair text-[1.35rem] leading-8 text-[#332936]">“{post.text}”</p>
    {reported ? <p className="mt-5 text-xs font-medium text-[#6a5a63]">Thank you. This has been sent for moderation review.</p> : <div className="mt-6 flex flex-wrap gap-2">{options.map(item => <button type="button" key={item} onClick={() => setReaction(item)} className={`rounded-full border px-3 py-2 text-xs transition ${reaction === item ? 'border-[#5b267a] bg-[#5b267a] text-white' : 'border-[#cfc4c8] bg-white/55 text-[#574d54] hover:bg-white'}`}>{reaction === item && <Check size={12} className="mr-1 inline" />}{item}</button>)}</div>}
  </article>;
}

function DailyCheckIn() {
  const [energy, setEnergy] = useState('Steady');
  const [stress, setStress] = useState('Some');
  const [social, setSocial] = useState('Low');
  const [headspace, setHeadspace] = useState('');
  const controls = [
    { label: 'Energy', value: energy, setter: setEnergy, choices: ['Low', 'Steady', 'Full'] },
    { label: 'Stress', value: stress, setter: setStress, choices: ['Light', 'Some', 'Heavy'] },
    { label: 'Social battery', value: social, setter: setSocial, choices: ['Low', 'Okay', 'Open'] },
  ];
  return <section className="rounded-[2rem] border border-[#d9d1cf] bg-[#f3eee9] p-6 sm:p-9 lg:p-12">
    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#76576e]">A small pause</p><h2 className="mt-3 font-playfair text-3xl text-[#302334] sm:text-4xl">How are you doing today?</h2><p className="mt-4 text-sm leading-6 text-[#6d646b]">No score, no diagnosis. Just a quick way to notice what you might need.</p></div>
      <div className="space-y-7">
        {controls.map(control => <div key={control.label}><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d6269]">{control.label}</p><div className="grid grid-cols-3 gap-2">{control.choices.map(choice => <button key={choice} type="button" onClick={() => control.setter(choice)} className={`min-h-10 rounded-full border px-3 text-sm ${control.value === choice ? 'border-[#5b267a] bg-[#5b267a] text-white' : 'border-[#d1c7c6] bg-white/70 text-[#5d5359]'}`}>{choice}</button>)}</div></div>)}
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6d6269]">What’s taking up most of your headspace?</p><div className="flex flex-wrap gap-2">{Object.keys(recommendations).map(option => <button key={option} type="button" onClick={() => setHeadspace(option)} className={`rounded-full border px-3.5 py-2 text-sm ${headspace === option ? 'border-[#5b267a] bg-white text-[#5b267a]' : 'border-[#d4c9c7] text-[#62585e]'}`}>{option}</button>)}</div></div>
        {headspace && <div className="rounded-2xl border border-[#d5c8cf] bg-white/70 p-5" aria-live="polite"><p className="text-sm font-semibold text-[#392d3d]">Rooms that may feel relevant</p><div className="mt-3 flex flex-wrap gap-2">{recommendations[headspace].map(room => <a key={room} href="#life-rooms" className="inline-flex items-center gap-1 rounded-full bg-[#eee6f1] px-3 py-2 text-xs font-medium text-[#5b267a]">{room}<ChevronRight size={13} /></a>)}</div></div>}
      </div>
    </div>
  </section>;
}

export default function SocialExperience() {
  const { data: session } = useSession();
  const [lessonChoice, setLessonChoice] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerRoom, setComposerRoom] = useState('Overthinking');
  const [posted, setPosted] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<number[]>([]);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [mutedRoom, setMutedRoom] = useState(false);
  const visiblePosts = useMemo(() => initialPosts.filter(post => !hiddenPosts.includes(post.id)), [hiddenPosts]);

  return <div className="min-h-screen bg-[#faf8f5] pb-20 text-[#302a30] lg:pb-0">
    <nav className="sticky top-[81px] z-30 border-b border-[#e3dcda] bg-[#faf8f5]/95 backdrop-blur" aria-label="Social sections"><div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-3 text-sm [scrollbar-width:none] sm:px-6 lg:px-8 [&::-webkit-scrollbar]:hidden">{['Discover', 'Life Rooms', 'Journeys', 'Community', 'Your Space'].map(item => <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="whitespace-nowrap font-medium text-[#756b71] transition hover:text-[#5b267a]">{item}</a>)}</div></nav>

    <section id="discover" className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-28">
      <div className="relative min-h-[620px] overflow-hidden rounded-[2rem] bg-[#e9e0d8] lg:min-h-[650px]">
        <Image src="/images/social/community-hero.png" alt="Friends sharing a quiet afternoon together" fill priority sizes="(max-width: 1024px) 100vw, 1280px" className="object-cover object-[66%_center] lg:object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,239,232,0.98)_0%,rgba(245,239,232,0.9)_36%,rgba(245,239,232,0.12)_70%)]" />
        <div className="relative flex min-h-[620px] max-w-2xl flex-col justify-center p-7 sm:p-12 lg:min-h-[650px] lg:p-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#76576e]">Mannosaar Social</p>
          <h1 className="mt-5 max-w-xl font-playfair text-[2.9rem] leading-[1.03] text-[#302334] sm:text-6xl lg:text-7xl">You’re not the only one going through it.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#61575e] sm:text-lg">A quiet space to learn, reflect, share, and connect with people navigating similar parts of life.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#life-rooms" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#5b267a] px-6 text-sm font-semibold text-white hover:bg-[#48205f]">Explore Life Rooms</a><button type="button" onClick={() => { setComposerOpen(true); document.getElementById('share-something')?.scrollIntoView(); }} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#8e7988] bg-white/65 px-6 text-sm font-semibold text-[#4c3b4e] hover:bg-white">Share Something</button></div>
          <p className="mt-8 max-w-sm text-xs leading-5 text-[#776c72]">Peer wellbeing, not therapy. Browse quietly, take what helps, and leave the rest.</p>
        </div>
      </div>
    </section>

    <section id="life-rooms" className="scroll-mt-36 border-y border-[#e7e0dd] bg-[#f3efea] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Life Rooms" title="Find a room for what life looks like right now" copy="Short guided lessons, private reflections, and honest community notes—without pressure to perform or explain everything." /><p className="max-w-xs text-sm leading-6 text-[#756c71]">Enter quietly. Participate when you want to. Your pace is enough.</p></div><div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">{lifeRooms.map(room => <LifeRoomCard key={room.title} room={room} />)}</div></div></section>

    <section id="room-preview" className="scroll-mt-32 py-20 sm:py-28"><div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
      <div><SectionHeading eyebrow="Inside a Life Room" title="A little guidance, then space to hear yourself" copy="Life Rooms are interactive experiences—not articles to finish and forget." /><div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#6b6167]">{['Learn', 'Reflect', 'Answer', 'Try something', 'Come back'].map((step, index) => <span key={step} className="inline-flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#cbbfc5] text-[10px]">{index + 1}</span>{step}</span>)}</div></div>
      <article className="rounded-[2rem] border border-[#dcd3d4] bg-white p-6 sm:p-9"><div className="flex items-center justify-between gap-4 border-b border-[#ece6e3] pb-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#806879]">Moving On After a Breakup</p><p className="mt-2 text-sm text-[#70666c]">Lesson 2 of 6</p></div><div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#eee9e7]"><div className="h-full w-1/3 rounded-full bg-[#7c5a73]" /></div></div><h3 className="mt-7 font-playfair text-3xl text-[#302334]">Why your mind keeps going back</h3><p className="mt-3 text-sm leading-6 text-[#6c6368]">Missing someone is not always a request to return. Sometimes it is your mind revisiting what once felt familiar.</p><p className="mt-7 text-sm font-semibold text-[#3c303d]">When do you think about them most?</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{['At night', 'When I’m alone', 'When I see something online', 'After something good happens'].map(option => <button key={option} type="button" onClick={() => setLessonChoice(option)} className={`rounded-xl border px-4 py-3 text-left text-sm ${lessonChoice === option ? 'border-[#5b267a] bg-[#f1eaf4] text-[#5b267a]' : 'border-[#ddd5d4] bg-[#fbfaf8] text-[#62585e]'}`}>{lessonChoice === option && <Check size={14} className="mr-2 inline" />}{option}</button>)}</div>{lessonChoice && <div className="mt-6 rounded-xl bg-[#f3eee9] p-4 text-sm leading-6 text-[#62575d]"><span className="font-semibold text-[#3d303e]">A small action:</span> When that moment arrives today, write one sentence beginning with “Right now, I need…”</div>}</article>
    </div></section>

    <section id="community" className="scroll-mt-32 border-y border-[#e5dedb] bg-[#eee9e3] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Community" title="Things people are carrying today" copy="Small anonymous notes from people finding their way through ordinary, difficult, hopeful days." /><div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">{visiblePosts.map(post => <CommunityPost key={post.id} post={post} onHide={() => setHiddenPosts(current => [...current, post.id])} />)}</div></div></section>

    <section id="share-something" className="scroll-mt-36 py-20 sm:py-28"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="rounded-[2rem] border border-[#dcd4d2] bg-white p-6 sm:p-10">
      <div className="flex items-start justify-between gap-5"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#76576e]">A quiet note</p><h2 className="mt-3 font-playfair text-3xl text-[#302334] sm:text-4xl">What’s on your mind?</h2></div><NotebookPen className="text-[#876a80]" /></div>
      {!composerOpen && !posted ? <button type="button" onClick={() => setComposerOpen(true)} className="mt-8 w-full rounded-2xl border border-[#ded6d4] bg-[#faf8f5] px-5 py-6 text-left text-[#8a8186]">You don’t need to have the right words.</button> : posted ? <div className="mt-8 rounded-2xl bg-[#f0ebe6] p-6"><p className="font-semibold text-[#3c303d]">Thank you for sharing.</p><p className="mt-2 text-sm text-[#6d6368]">Your anonymous note has been added to {composerRoom} for this visit.</p><button type="button" onClick={() => { setPosted(false); setComposerOpen(true); }} className="mt-4 text-sm font-semibold text-[#5b267a]">Write another note</button></div> : <div className="mt-8"><textarea autoFocus value={composerText} onChange={event => setComposerText(event.target.value)} maxLength={500} rows={5} placeholder="You don’t need to have the right words." className="w-full resize-none rounded-2xl border border-[#dcd4d2] bg-[#faf8f5] p-5 text-base leading-7 outline-none placeholder:text-[#999095] focus:border-[#8f7487]" /><label className="mt-4 block text-xs font-semibold text-[#6b6067]">Life Room<select value={composerRoom} onChange={event => setComposerRoom(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#d9d1cf] bg-white px-3 text-sm font-normal">{lifeRooms.map(room => <option key={room.title}>{room.title}</option>)}</select></label><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="inline-flex items-center gap-2 text-xs text-[#6d6368]"><LockKeyhole size={14} /> Anonymous. Please leave out identifying details.</p>{session?.user ? <button type="button" onClick={() => { if (composerText.trim()) { setPosted(true); setComposerText(''); } }} disabled={!composerText.trim()} className="min-h-11 rounded-full bg-[#5b267a] px-6 text-sm font-semibold text-white disabled:opacity-40">Post anonymously</button> : <Link href="/auth/login" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#5b267a] px-6 text-sm font-semibold text-white">Sign in to post</Link>}</div></div>}
      <p className="mt-6 border-t border-[#ece6e3] pt-5 text-xs leading-5 text-[#81777c]">Keep it respectful. Mannosaar is a peer wellbeing space and not a substitute for professional or emergency support.</p>
    </div></div></section>

    <section id="journeys" className="scroll-mt-32 bg-[#333038] py-20 text-white sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d2bdcf]">Guided journeys</p><h2 className="mt-3 font-playfair text-3xl sm:text-4xl lg:text-[2.8rem]">A little structure when you need it</h2></div><p className="max-w-md text-sm leading-6 text-[#cec8cf]">Short daily invitations. No streaks, ranks, or pressure to keep up.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{journeys.map(([title, duration, description, progress], index) => <article key={title} className={`rounded-[1.5rem] border border-white/15 p-6 ${index === 1 ? 'bg-[#514554]' : 'bg-white/[0.06]'}`}><div className="flex items-center justify-between text-xs text-[#d7d0d6]"><span>{duration}</span>{progress > 0 && <span>{progress}%</span>}</div><h3 className="mt-8 font-playfair text-2xl leading-8">{title}</h3><p className="mt-3 text-sm leading-6 text-[#d2ccd2]">{description}</p>{progress > 0 && <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#d7c0d9]" style={{ width: `${progress}%` }} /></div>}<button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">{progress ? 'Continue journey' : 'Start journey'} <ArrowRight size={15} /></button></article>)}</div></div></section>

    <section className="py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><DailyCheckIn /></div></section>

    <section id="your-space" className="scroll-mt-32 border-t border-[#e4ddda] bg-white py-20 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading eyebrow="Private to you" title="Your Space" copy="Rooms in progress, saved reflections, and things you want to return to later." />{session?.user ? <div className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]"><article className="rounded-[1.7rem] border border-[#ddd5d4] bg-[#f6f2ee] p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#806d79]">Continue your room</p><h3 className="mt-2 font-playfair text-2xl text-[#332736]">Career & Placement Stress</h3><p className="mt-2 text-sm text-[#71666d]">4 of 7 lessons</p></div><button type="button" className="min-h-11 rounded-full bg-[#5b267a] px-6 text-sm font-semibold text-white">Continue</button></div><div className="mt-7 h-2 overflow-hidden rounded-full bg-[#e3dcda]"><div className="h-full w-[57%] rounded-full bg-[#80617a]" /></div></article><div className="grid grid-cols-2 gap-4">{[['Saved reflections', '3'], ['Completed lessons', '11'], ['Saved posts', '5'], ['Revisit later', '2']].map(([label, value]) => <div key={label} className="rounded-[1.4rem] border border-[#e1dad7] p-5"><p className="font-playfair text-3xl text-[#3b2d3d]">{value}</p><p className="mt-2 text-xs leading-5 text-[#776c72]">{label}</p></div>)}</div></div> : <div className="mt-10 flex flex-col gap-5 rounded-[1.7rem] border border-[#ded6d4] bg-[#f6f2ee] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="font-playfair text-2xl text-[#352837]">Keep your progress in one quiet place.</p><p className="mt-2 text-sm text-[#71676d]">Sign in to save rooms, reflections, journeys, and posts.</p></div><Link href="/auth/login" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#5b267a] px-6 text-sm font-semibold text-white">Sign in</Link></div>}</div></section>

    <section className="border-t border-[#e5ddda] bg-[#f3eee9] py-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-[#6d5167]" size={20} /><div><p className="font-semibold text-[#3b303c]">Need immediate support?</p><p className="mt-1 text-sm text-[#6e6469]">Mannosaar Social is not monitored as an emergency service.</p></div></div><button type="button" onClick={() => setSafetyOpen(true)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#8e7988] px-5 text-sm font-semibold text-[#4e3d50]">Open support options</button></div></section>

    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#dfd7d4] bg-[#faf8f5]/95 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Social mobile navigation">{[{ label: 'Home', href: '#discover', icon: Home }, { label: 'Rooms', href: '#life-rooms', icon: UsersRound }, { label: 'Share', href: '#share-something', icon: MessageCircleHeart }, { label: 'Journey', href: '#journeys', icon: Sparkles }, { label: 'My space', href: '#your-space', icon: Bookmark }].map(({ label, href, icon: Icon }) => <a key={label} href={href} className="flex flex-col items-center gap-1 py-1 text-[10px] font-medium text-[#655a61]"><Icon size={18} />{label}</a>)}</nav>

    {safetyOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="safety-title"><div className="w-full max-w-xl rounded-t-[2rem] bg-white p-6 sm:rounded-[2rem] sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#76576e]">Support now</p><h2 id="safety-title" className="mt-2 font-playfair text-3xl text-[#302334]">You deserve immediate support.</h2></div><button type="button" onClick={() => setSafetyOpen(false)} className="rounded-full p-2 hover:bg-[#f4f0ed]" aria-label="Close support panel"><X size={20} /></button></div><p className="mt-4 text-sm leading-6 text-[#696066]">If you may hurt yourself or someone else, contact your local emergency services now or go to the nearest emergency department.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/emergency" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#5b267a] px-5 text-sm font-semibold text-white">Emergency resources</Link><a href="mailto:care@mannosaar.com" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#9d8997] px-5 text-sm font-semibold text-[#4d3c4e]">Email care@mannosaar.com</a></div><div className="mt-6 flex items-center justify-between rounded-xl bg-[#f4f0ed] px-4 py-3"><span className="inline-flex items-center gap-2 text-sm text-[#5f555b]"><Pause size={15} /> Mute this Life Room</span><button type="button" onClick={() => setMutedRoom(value => !value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mutedRoom ? 'bg-[#5b267a] text-white' : 'bg-white text-[#5b267a]'}`}>{mutedRoom ? 'Muted' : 'Mute'}</button></div></div></div>}
    <button type="button" onClick={() => setSafetyOpen(true)} className="fixed bottom-20 left-4 z-30 hidden items-center gap-2 rounded-full border border-[#d3c8cc] bg-white px-4 py-2 text-xs font-semibold text-[#554650] shadow-sm sm:inline-flex lg:bottom-5"><CircleHelp size={15} /> Need immediate support?</button>
  </div>;
}
