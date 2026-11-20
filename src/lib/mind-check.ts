export interface MindCheckConcern {
  id: string;
  title: string;
  questions: readonly { id: string; text: string }[];
}

export function isAnswered(value: number | undefined) {
  return Number.isInteger(value) && value !== undefined && value >= 0 && value <= 4;
}

export function firstUnansweredIndex(questions: readonly { id: string }[], answers: Readonly<Record<string, number>>) {
  return questions.findIndex(question => !isAnswered(answers[question.id]));
}

export function scoreConcerns<T extends MindCheckConcern>(
  concerns: readonly T[],
  selected: readonly string[],
  answers: Readonly<Record<string, number>>,
) {
  return concerns
    .filter(concern => selected.includes(concern.id))
    .map(concern => {
      const values = concern.questions.map(question => answers[question.id]);
      const valid = values.filter(isAnswered);
      return {
        ...concern,
        score: valid.reduce((sum, value) => sum + value, 0),
        count: valid.length,
        max: 28,
        frequent: concern.questions.filter(question => answers[question.id] >= 3).map(question => question.text),
      };
    })
    .sort((a, b) => b.score - a.score);
}
