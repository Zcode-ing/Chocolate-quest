import { ArrowRight, Check, X } from 'lucide-react';

type Option = { id: string; text: string };
type Feedback = 'correct' | 'wrong' | null;

export function AnswerOption({ option, index, eliminated, disabled, feedback = null, onClick }: {
  option: Option;
  index: number;
  eliminated: boolean;
  disabled: boolean;
  feedback?: Feedback;
  onClick: () => void;
}) {
  const key = String(index + 1);
  return (
    <button type="button" data-testid={`button-answer-${key}`} disabled={disabled || eliminated} onClick={onClick}
      className={`answer-option answer-in ${eliminated ? 'is-eliminated' : ''} ${feedback === 'correct' ? 'is-answer-correct' : feedback === 'wrong' ? 'is-answer-wrong' : ''}`} style={{ animationDelay: `${index * 55}ms` }}>
      <span className="option-key mono" aria-hidden="true">{key}</span>
      <span className="option-text">{option.text}</span>
      <span className="option-feedback" aria-hidden="true">{feedback === 'correct' ? <Check size={16} /> : feedback === 'wrong' || eliminated ? <X size={15} /> : <ArrowRight size={15} />}</span>
    </button>
  );
}