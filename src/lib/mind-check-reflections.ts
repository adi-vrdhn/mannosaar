import instrument from '@/lib/mind-check-questions.json';
import { isAnswered } from '@/lib/mind-check';

export interface ReflectionContent {
  headline: string;
  opening: string;
  quietNote: string;
  question: string;
  nextStep: string;
  patterns: readonly { title: string; detail: string }[];
}

// Original editorial reflections. A clinician must review every line before public release.
export const REFLECTIONS: Record<string, ReflectionContent> = {
  stress: {
    headline: 'There may be more on your plate than room around it.',
    opening: 'Pressure is often made of ordinary things arriving all at once. Your answers can help you notice where the day asks for more than it gives back.',
    quietNote: 'You did not mark these pressure statements as recurring for this fortnight. If this topic still drew you in, notice what helps you keep breathing room in your days.',
    question: 'Which demand feels genuinely yours, and which one have you picked up because it was left there?',
    nextStep: 'Choose one task for tomorrow. Write the smallest useful next move, then choose a time when you will stop thinking about it for the day.',
    patterns: [
      { title: 'The pile-up', detail: 'Responsibilities felt as if they arrived faster than you could deal with them. It may help to separate what is urgent from what is simply loud.' },
      { title: 'Rest that does not feel restful', detail: 'Even free time did not always feel like a chance to settle. You might notice what your mind keeps doing when your schedule finally pauses.' },
      { title: 'Too many directions', detail: 'Being pulled between several needs can make it hard to know what deserves your attention first. Naming one priority may create a little space.' },
      { title: 'A day knocked off course', detail: 'Unexpected changes stood out in your answers. Think about which part of a changed plan you can still choose for yourself.' },
      { title: 'Time that does not feel yours', detail: 'Having little say over your time can wear on you. A small protected pocket of time may matter more than a perfect schedule.' },
      { title: 'The day following you home', detail: 'Unfinished responsibilities stayed with you after the day ended. A brief written stopping point can give those thoughts somewhere to wait.' },
      { title: 'Recovery squeezed out', detail: 'Breaks were difficult to make room for. Even a short pause is easier to protect when it is treated as part of the plan.' },
    ],
  },
  worry: {
    headline: 'Your mind may be trying to solve more than it can know right now.',
    opening: 'Worry often asks for certainty before life can provide it. This reflection is a way to notice where thinking helps you prepare and where it keeps circling.',
    quietNote: 'You did not mark these worry statements as recurring for this fortnight. If you still chose this area, you might notice what helps you let an uncertain thought pass.',
    question: 'Which thought is asking for an action today, and which is asking for an answer nobody has yet?',
    nextStep: 'Put one worry on paper. Draw two columns: “one action I can take” and “what I cannot know yet.” Place each part where it belongs.',
    patterns: [
      { title: 'Many worries at once', detail: 'Several concerns competed for your attention. Listing them separately may make each one easier to see clearly.' },
      { title: 'A thought that keeps returning', detail: 'Setting a worry aside felt difficult. You can notice its return without treating every return as a new problem to solve.' },
      { title: 'The future running ahead', detail: 'Your mind spent time on what could go wrong. Try asking whether this is a likely next step or one possibility among many.' },
      { title: 'Replaying the past', detail: 'Past conversations or decisions kept coming back. It may help to name what you wish had gone differently and what you can do now.' },
      { title: 'Waiting for certainty', detail: 'Uncertainty slowed decisions. A decision can sometimes be made with enough information, even without complete reassurance.' },
      { title: 'Reassurance that fades', detail: 'You looked for reassurance before settling on a decision. Notice how long it lasts and what you still need after it wears off.' },
      { title: 'Attention pulled away', detail: 'Worry interrupted things you wanted to focus on. A brief note to revisit later may help you return to the task in front of you.' },
    ],
  },
  mood: {
    headline: 'Some days ask for a smaller beginning.',
    opening: 'Enjoyment and momentum can change from week to week. Your answers describe what has felt harder to begin, carry, or look forward to lately.',
    quietNote: 'You did not mark these changes as recurring for this fortnight. If mood still feels important to you, notice the people and activities that support your everyday energy.',
    question: 'What is one thing that matters to you even if you do not feel motivated to do it right now?',
    nextStep: 'Pick one meaningful or enjoyable activity and shrink it to ten minutes. The aim is to make a little room for it, not to force a mood change.',
    patterns: [
      { title: 'Enjoyment felt quieter', detail: 'Things you usually like felt less interesting. You do not have to make them feel good on command; noticing the shift is enough to begin.' },
      { title: 'Getting started took effort', detail: 'The first step of an everyday activity felt hard. Making that first step very small may reduce the amount of energy it asks for.' },
      { title: 'A lower mood', detail: 'Your mood felt lower than you wanted. Consider what the day has been asking of you, without blaming yourself for how it felt.' },
      { title: 'Small tasks felt bigger', detail: 'Ordinary tasks required more effort. That is useful information about this fortnight, even if the task looked easy from outside.' },
      { title: 'Less to look forward to', detail: 'Anticipating good things felt harder. You might plan one modest, specific thing to look toward rather than waiting for excitement to appear.' },
      { title: 'Stepping back from activities', detail: 'You did less of what you would normally choose. A gentle return can start with the easiest version of one activity.' },
      { title: 'Momentum felt distant', detail: 'Pursuing what matters to you felt difficult. Motivation may not need to come first; a very small action can come before it.' },
    ],
  },
  sleep: {
    headline: 'Rest is a whole-day story, not just a bedtime task.',
    opening: 'Your answers may point to where sleep, routine, and daytime energy meet. A difficult night is not a personal failure, and the pattern may be worth observing with care.',
    quietNote: 'You did not mark these sleep and rest statements as recurring for this fortnight. If rest brought you here, notice what is already helping it feel possible.',
    question: 'What happens in the hour before bed, and what does the next morning feel like?',
    nextStep: 'For a few nights, note bedtime, wake time, and one thing that seemed to help or interrupt rest. Look for a pattern rather than a perfect night.',
    patterns: [
      { title: 'Falling asleep took time', detail: 'Getting to sleep when you wanted was difficult. Notice whether the difficulty begins at bedtime or earlier in the evening.' },
      { title: 'The night was interrupted', detail: 'Waking and returning to sleep stood out. A brief record may help you describe this clearly if you decide to seek advice.' },
      { title: 'Sleep did not feel restoring', detail: 'You woke less rested than hoped. Hours in bed and feeling restored are not always the same experience.' },
      { title: 'Tiredness followed you into the day', detail: 'Low energy made ordinary activities harder. This is a useful detail to share with a health professional if it continues.' },
      { title: 'Thoughts arrived at bedtime', detail: 'Concerns kept you awake. Giving them a written place earlier in the evening may make bedtime less like planning time.' },
      { title: 'A changing sleep rhythm', detail: 'Keeping a consistent schedule felt difficult. Start by noticing one wake-up time or evening cue you can keep reasonably steady.' },
      { title: 'Rest affected other parts of life', detail: 'You noticed mood or concentration changing alongside sleep. Looking at both together may be more useful than judging one night alone.' },
    ],
  },
  esteem: {
    headline: 'The voice you live with most deserves some kindness.',
    opening: 'Self-talk can become so familiar that it sounds like fact. Your answers offer a chance to hear how you have been speaking to yourself lately.',
    quietNote: 'You did not mark these self-critical experiences as recurring for this fortnight. If you chose this area anyway, notice what helps you keep a fair view of yourself.',
    question: 'If a friend described the same moment, would you use the words you used for yourself?',
    nextStep: 'Write down one self-critical sentence. Under it, write a version that is still honest but less punishing.',
    patterns: [
      { title: 'Small mistakes became big judgments', detail: 'You noticed criticism after small errors. An error can be real without becoming a verdict on your worth.' },
      { title: 'Comparison left a mark', detail: 'Comparing yourself with others felt painful. You may be seeing their visible chapter beside your whole unfinished story.' },
      { title: 'Kind words were hard to receive', detail: 'Positive feedback was difficult to take in. You do not have to feel convinced at once; simply record what was said.' },
      { title: 'Confidence narrowed', detail: 'You doubted challenges you might usually try. Think of one past example of handling uncertainty, even imperfectly.' },
      { title: 'Shortcomings took the spotlight', detail: 'Your attention leaned toward what felt lacking. Naming one strength does not erase a difficulty; it gives a fuller picture.' },
      { title: 'Fear of judgment', detail: 'Other people’s opinions weighed on you. Try distinguishing what someone actually said from what you fear they might think.' },
      { title: 'A harsher inner tone', detail: 'Your words to yourself felt less gentle than those you would offer a friend. That difference is worth noticing, not another reason to criticise yourself.' },
    ],
  },
  relationships: {
    headline: 'Connection can be honest and gentle at the same time.',
    opening: 'Relationships ask us to balance closeness with our own needs. Your answers show where speaking up, setting limits, or asking for support has felt complicated.',
    quietNote: 'You did not mark these relationship difficulties as recurring for this fortnight. If you chose this area, consider what makes it easier to speak openly and feel heard.',
    question: 'What do you wish one person understood about your needs, in one clear sentence?',
    nextStep: 'Write one “I” statement about a specific need. You can decide later whether, when, and with whom to share it.',
    patterns: [
      { title: 'Holding a need back', detail: 'You kept a need to yourself in a close relationship. Naming it privately may be a first step before any conversation.' },
      { title: 'A disagreement stayed open', detail: 'An unresolved conflict kept occupying your mind. Ask what part needs a conversation and what part needs time.' },
      { title: 'Saying no felt difficult', detail: 'A request felt too demanding, yet a no was hard to say. A boundary can be brief and respectful without a long defence.' },
      { title: 'The fear of disappointing someone', detail: 'Setting limits brought concern about another person’s reaction. Their disappointment and your need can both be real.' },
      { title: 'Not feeling understood', detail: 'An important conversation left you feeling misunderstood. You might try describing the specific moment where your meaning was lost.' },
      { title: 'Avoiding conflict', detail: 'You held back from a conversation because it might become difficult. Choosing a calm time and one topic can make it more manageable.' },
      { title: 'Asking for support felt hard', detail: 'You wanted support but found it difficult to ask. A small, concrete request can be easier for both people to respond to.' },
    ],
  },
  emotions: {
    headline: 'A feeling can be strong without having the final word.',
    opening: 'Your answers may show moments when emotions were hard to name, settle, or share. The point is not to control every feeling, but to understand what it asks of you.',
    quietNote: 'You did not mark these emotional difficulties as recurring for this fortnight. If you chose this area, notice what helps you recognise and make room for feelings.',
    question: 'When a feeling rises, what do you notice first in your body, thoughts, or urge to act?',
    nextStep: 'In one difficult moment, pause long enough to name the feeling and one thing you need. You can choose what to do after that.',
    patterns: [
      { title: 'A bigger reaction than expected', detail: 'An emotional response felt more intense than you anticipated. It may help to notice what happened just before it rose.' },
      { title: 'Hard to find the word', detail: 'Identifying the feeling itself was difficult. You can start broadly—hurt, afraid, angry, tired—without needing a perfect label.' },
      { title: 'Little space before responding', detail: 'Strong feelings made pausing difficult. A breath or a short sentence such as “I need a moment” can create room for choice.' },
      { title: 'A long way back to calm', detail: 'An upsetting event stayed with you. Notice which parts of settling need time, company, movement, or quiet.' },
      { title: 'Keeping it inside', detail: 'You held difficult feelings privately even when you wanted support. Sharing a small piece with someone safe may feel more possible than explaining everything.' },
      { title: 'Fast changes in mood', detail: 'Shifts in feeling frustrated you. Tracking the situations around those shifts can be more useful than judging them.' },
      { title: 'Coping felt uncertain', detail: 'You struggled to find a helpful response to difficult emotions. Try one low-pressure option and notice whether it gives even a little space.' },
    ],
  },
  focus: {
    headline: 'Attention is easier to use when the next step is visible.',
    opening: 'Focus can be affected by context, demands, rest, and many other things. Your answers describe where attention has felt slippery, without explaining why.',
    quietNote: 'You did not mark these attention difficulties as recurring for this fortnight. If you chose this area, notice what helps you begin and stay with tasks.',
    question: 'Where does your attention leave the task: before starting, in the middle, or when deciding what comes next?',
    nextStep: 'Pick one task. Write a ten-minute starting step, move one distraction out of reach, and stop to notice what happened.',
    patterns: [
      { title: 'Staying with one task', detail: 'It was hard to remain with something you wanted to finish. A shorter work window may help you see where attention breaks away.' },
      { title: 'Switching before finishing', detail: 'You moved between activities. Keeping a visible “return to” note can make it easier to come back.' },
      { title: 'Distractions entered easily', detail: 'Interruptions pulled you from work or daily activities. One small environmental change may be more useful than relying on willpower alone.' },
      { title: 'The order felt unclear', detail: 'Organising tasks was difficult. Choose the first concrete action, then decide what follows after it is done.' },
      { title: 'Putting off something that mattered', detail: 'A meaningful task stayed on hold. Ask whether the first step is too large, unclear, or emotionally costly.' },
      { title: 'Losing your place', detail: 'Routine activities sometimes lost their thread. A simple cue or checklist may help you pick up where you left off.' },
      { title: 'The cost of scattered focus', detail: 'Concentration affected your sense of progress or satisfaction. Notice the setting and time of day when this happens most.' },
    ],
  },
  connection: {
    headline: 'Being around people and feeling known are different things.',
    opening: 'Connection is about the quality of contact as much as the number of people nearby. Your answers can show what kind of closeness you may be missing.',
    quietNote: 'You did not mark these disconnection experiences as recurring for this fortnight. If you chose this area, consider what makes an interaction feel meaningful to you.',
    question: 'Who feels easiest to be yourself with, and what makes that conversation different?',
    nextStep: 'Think of one person who feels reasonably safe. Send a simple invitation or message that says what kind of contact you would enjoy.',
    patterns: [
      { title: 'Lonely in company', detail: 'You felt lonely even with people nearby. The missing piece may be understanding or openness rather than company alone.' },
      { title: 'Wanting a real conversation', detail: 'You wished for someone you could speak openly with. You might start by sharing one small true thing with a trusted person.' },
      { title: 'Closeness felt thin', detail: 'Relationships did not feel as close as you wanted. Consider what kind of contact would feel more meaningful to you.' },
      { title: 'Reaching out felt hard', detail: 'You wanted company but hesitated to ask. A low-pressure message can leave room for connection without demanding an immediate answer.' },
      { title: 'Distance from important people', detail: 'You felt disconnected from people who matter. Naming the gap may help you choose a way to reconnect that fits.' },
      { title: 'Feeling left out', detail: 'Social plans or conversations left you on the edge. That can hurt; notice whether there is a person you could talk to directly about it.' },
      { title: 'Not enough meaningful contact', detail: 'Your interactions felt fewer or less satisfying than you wanted. One steady connection may matter more than a crowded calendar.' },
    ],
  },
  fulfilment: {
    headline: 'A sense of direction can begin with one honest choice.',
    opening: 'Feeling fulfilled does not require a perfectly mapped life. Your answers can help you notice where your days and your values feel close together—or far apart.',
    quietNote: 'You did not mark these direction and fulfilment concerns as recurring for this fortnight. If you chose this area, notice which ordinary moments feel most like your own.',
    question: 'What matters to you that has had too little space in an ordinary week?',
    nextStep: 'Choose one value—such as learning, care, creativity, or rest—and one small action this week that expresses it.',
    patterns: [
      { title: 'A gap between days and values', detail: 'Your routine felt disconnected from what matters most. Naming one value can make that gap more specific.' },
      { title: 'Everyday life felt flat', detail: 'Fulfilment was hard to find in ordinary days. Look for a moment that felt meaningful, however small, rather than waiting for a grand answer.' },
      { title: 'Priorities felt unclear', detail: 'It was difficult to know what to put first. You can try asking what deserves attention this week, without deciding your whole future.' },
      { title: 'Meaning had little room', detail: 'Activities that matter to you were squeezed out. A small appointment with one of them can be more realistic than a life overhaul.' },
      { title: 'Feeling stuck in a routine', detail: 'Some patterns felt hard to change. Identify one part of the routine you can adjust without needing everything else to shift.' },
      { title: 'Choices and values felt apart', detail: 'You questioned whether current choices reflect who you want to be. That question can guide a next step without becoming self-judgment.' },
      { title: 'Progress was hard to see', detail: 'Movement toward important things felt difficult to recognise. Smaller markers may help you notice progress that a big goal hides.' },
    ],
  },
};

export function buildReflection(
  concern: (typeof instrument.concerns)[number],
  answers: Readonly<Record<string, number>>,
) {
  const content = REFLECTIONS[concern.id];
  if (!content) return null;
  const standouts = concern.questions
    .map((question, index) => ({
      ...content.patterns[index],
      response: answers[question.id],
      question: question.text,
      index,
    }))
    .filter(item => isAnswered(item.response) && item.response > 0)
    .sort((a, b) => b.response - a.response || a.index - b.index)
    .slice(0, 2)
    .map(item => ({ ...item, frequency: instrument.responseScale[item.response].label }));
  return { ...content, standouts };
}
