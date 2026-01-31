import { db } from './database';
import { addVocabulary } from './operations';

const SAMPLE_VOCAB = [
  { name: 'Apple', meaning: 'A round fruit with red, green, or yellow skin and crisp flesh.' },
  { name: 'Brilliant', meaning: 'Exceptionally clever or talented; very bright.' },
  { name: 'Catalyst', meaning: 'Something that precipitates an event or change.' },
  { name: 'Diligent', meaning: 'Having or showing care in one\'s work; conscientious.' },
  { name: 'Eloquent', meaning: 'Fluent or persuasive in speaking or writing.' },
  { name: 'Fortitude', meaning: 'Courage in pain or adversity; mental strength.' },
  { name: 'Graceful', meaning: 'Having or showing grace or elegance.' },
  { name: 'Harmony', meaning: 'Agreement or concord; a pleasing arrangement of parts.' },
  { name: 'Illuminate', meaning: 'To light up; to make clear or explain.' },
  { name: 'Jubilant', meaning: 'Feeling or expressing great happiness and triumph.' },
  { name: 'Keen', meaning: 'Having or showing eagerness or enthusiasm; sharp.' },
  { name: 'Luminous', meaning: 'Full of or shedding light; bright or shining.' },
  { name: 'Magnificent', meaning: 'Extremely beautiful, elaborate, or impressive.' },
  { name: 'Navigate', meaning: 'To plan and direct the course of a journey.' },
  { name: 'Optimistic', meaning: 'Hopeful and confident about the future.' },
  { name: 'Perseverance', meaning: 'Steadfastness in doing something despite difficulty.' },
  { name: 'Quintessential', meaning: 'Representing the most perfect example of a quality.' },
  { name: 'Resilient', meaning: 'Able to withstand or recover quickly from difficulties.' },
  { name: 'Serendipity', meaning: 'The occurrence of events by chance in a happy way.' },
  { name: 'Tenacious', meaning: 'Tending to keep a firm hold; persistent.' },
];

const getSortType = (name) => {
  const first = (name || '').trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : 'A';
};

export const seedDatabase = async () => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let added = 0;

    for (const item of SAMPLE_VOCAB) {
      const existing = await db.getFirstAsync('SELECT id FROM vocabulary WHERE name = ?', [item.name]);
      if (!existing) {
        await addVocabulary({
          name: item.name,
          meaning: item.meaning,
          sortType: getSortType(item.name),
          month: currentMonth,
          year: currentYear,
        });
        added++;
      }
    }

    if (added > 0) {
      console.log(`Seeded ${added} vocabulary entries.`);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
