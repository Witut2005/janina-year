import { Tracker } from './models';
import { uid } from './util';

/** Swatches offered in the tracker editor. Grouped by hue, dark to light. */
export const PALETTE = [
  '#1E7466', '#4FB096', '#9AD1BC',
  '#1E4E79', '#3A78AE', '#6E9FCF',
  '#4E3591', '#8468C4', '#B9A8E3',
  '#B02E4C', '#EC7F8E', '#F6B7BF',
  '#8A4B0F', '#C47A27', '#DFA04F',
  '#5E5A66', '#9C918A', '#DDD3CB',
];

export interface TrackerTemplate {
  key: string;
  title: string;
  emoji: string;
  description: string;
  options: { label: string; color: string }[];
}

export const TEMPLATES: TrackerTemplate[] = [
  {
    key: 'mood',
    title: 'Nastrój',
    emoji: '🙂',
    description: 'Klasyczny Year in Pixels – jak się dziś czułeś?',
    options: [
      { label: 'Świetnie', color: '#1E7466' },
      { label: 'Dobrze', color: '#4FB096' },
      { label: 'Okej', color: '#DDD3CB' },
      { label: 'Słabo', color: '#EC7F8E' },
      { label: 'Źle', color: '#B02E4C' },
    ],
  },
  {
    key: 'sleep',
    title: 'Sen',
    emoji: '😴',
    description: 'Ile godzin udało się przespać.',
    options: [
      { label: '8 h i więcej', color: '#1E4E79' },
      { label: '7–8 h', color: '#3A78AE' },
      { label: '6–7 h', color: '#6E9FCF' },
      { label: 'Poniżej 6 h', color: '#DDD3CB' },
    ],
  },
  {
    key: 'workout',
    title: 'Trening',
    emoji: '💪',
    description: 'Aktywność fizyczna każdego dnia.',
    options: [
      { label: 'Intensywny', color: '#1E7466' },
      { label: 'Lekki', color: '#4FB096' },
      { label: 'Odpoczynek', color: '#DDD3CB' },
    ],
  },
  {
    key: 'reading',
    title: 'Czytanie',
    emoji: '📚',
    description: 'Czy dziś była chwila na książkę?',
    options: [
      { label: 'Ponad godzinę', color: '#4E3591' },
      { label: 'Chwilę', color: '#8468C4' },
      { label: 'Wcale', color: '#DDD3CB' },
    ],
  },
  {
    key: 'productivity',
    title: 'Produktywność',
    emoji: '⚡',
    description: 'Jak bardzo udany był dzień pracy.',
    options: [
      { label: 'Bardzo', color: '#8A4B0F' },
      { label: 'Średnio', color: '#C47A27' },
      { label: 'Mało', color: '#DFA04F' },
    ],
  },
  {
    key: 'habit',
    title: 'Nawyk',
    emoji: '✅',
    description: 'Proste tak / nie – np. woda, medytacja, bez słodyczy.',
    options: [
      { label: 'Zrobione', color: '#1E7466' },
      { label: 'Pominięte', color: '#EC7F8E' },
    ],
  },
  {
    key: 'custom',
    title: 'Własny tracker',
    emoji: '✨',
    description: 'Zacznij od zera i ustaw wszystko po swojemu.',
    options: [
      { label: 'Tak', color: '#3A78AE' },
      { label: 'Nie', color: '#DDD3CB' },
    ],
  },
];

export const EMOJI_SUGGESTIONS = ['🙂', '😴', '💪', '📚', '⚡', '✅', '💧', '🧘', '🍎', '💊', '🎨', '🎵', '💼', '❤️', '🌿', '☕'];

export function trackerFromTemplate(template: TrackerTemplate): Tracker {
  return {
    id: uid(),
    title: template.key === 'custom' ? '' : template.title,
    emoji: template.emoji,
    options: template.options.map((o) => ({ id: uid(), ...o })),
    createdAt: Date.now(),
  };
}
