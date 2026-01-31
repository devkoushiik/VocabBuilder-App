import { db } from './database';
import { addVocabulary } from './operations';

const SEED_DATA = [
  { "word": "Aberration", "meaning": "বিচ্যুতি" },
  { "word": "Abstain", "meaning": "বিরত থাকা" },
  { "word": "Adversity", "meaning": "দুর্দশা বা প্রতিকূলতা" },
  { "word": "Aesthetic", "meaning": "নান্দনিক বা সৌন্দর্যবোধ সংক্রান্ত" },
  { "word": "Amicable", "meaning": "বন্ধুত্বপূর্ণ" },
  { "word": "Anachronistic", "meaning": "সেকাল বা সময়ানুক্রমিক ভুল" },
  { "word": "Arid", "meaning": "শুষ্ক বা অনুর্বর" },
  { "word": "Asylum", "meaning": "আশ্রয়" },
  { "word": "Benevolent", "meaning": "দয়ালু বা পরোপকারী" },
  { "word": "Bias", "meaning": "পক্ষপাতিত্ব" },
  { "word": "Boisterous", "meaning": "উত্তাল বা হইচইপূর্ণ" },
  { "word": "Brazen", "meaning": "নির্লজ্জ বা বেহায়া" },
  { "word": "Capitulate", "meaning": "আত্মসমর্পণ করা" },
  { "word": "Clairvoyant", "meaning": "অতীন্দ্রিয় দর্শনের অধিকারী" },
  { "word": "Collaborate", "meaning": "যৌথভাবে কাজ করা" },
  { "word": "Compassion", "meaning": "করুণা বা সহানুভূতি" },
  { "word": "Compromise", "meaning": "আপোষ করা" },
  { "word": "Condescending", "meaning": "উদ্ধত বা তুচ্ছজ্ঞানসম্পন্ন" },
  { "word": "Conditional", "meaning": "শর্তসাপেক্ষ" },
  { "word": "Conformist", "meaning": "প্রচলিত প্রথা অনুসারী" },
  { "word": "Convergence", "meaning": "অভিমুখিতা বা মিলন" },
  { "word": "Deleterious", "meaning": "ক্ষতিকর" },
  { "word": "Demagogue", "meaning": "জনমোহিনী নেতা" },
  { "word": "Digression", "meaning": "অান্তর বিষয় বা মূল প্রসঙ্গ থেকে বিচ্যুতি" },
  { "word": "Diligent", "meaning": "পরিশ্রমী" },
  { "word": "Discredit", "meaning": "সুনাম নষ্ট করা" },
  { "word": "Disdain", "meaning": "অবজ্ঞা বা ঘৃণা" },
  { "word": "Divergent", "meaning": "ভিন্নমুখী" },
  { "word": "Empathy", "meaning": "সহমর্মিতা" },
  { "word": "Emulate", "meaning": "অনুকরণ করা" },
  { "word": "Enervating", "meaning": "শক্তি ক্ষয়কারী" },
  { "word": "Ephemeral", "meaning": "ক্ষণস্থায়ী" },
  { "word": "Evanescent", "meaning": "দ্রুত বিলীন হয়ে যায় এমন" },
  { "word": "Exasperation", "meaning": "তীব্র বিরক্তি" },
  { "word": "Exemplary", "meaning": "দৃষ্টান্তমূলক" },
  { "word": "Extenuating", "meaning": "দোষ লাঘবকারী" },
  { "word": "Florid", "meaning": "জমকালো বা রক্তবর্ণ" },
  { "word": "Fortuitous", "meaning": "আকস্মিক সৌভাগ্য" },
  { "word": "Frugal", "meaning": "মিতব্যয়ী" },
  { "word": "Hackneyed", "meaning": "মামুলি বা অতিব্যবহৃত" },
  { "word": "Haughty", "meaning": "অহংকারী" },
  { "word": "Hedonist", "meaning": "ভোগবাদী" },
  { "word": "Hypothetical", "meaning": "অনুমাননির্ভর" },
  { "word": "Impetuous", "meaning": "অবিবেচক বা হঠকারী" },
  { "word": "Impute", "meaning": "দোষারোপ করা" },
  { "word": "Incompatible", "meaning": "বেমানান বা অসামঞ্জস্যপূর্ণ" },
  { "word": "Inconsequential", "meaning": "তাৎপর্যহীন বা নগণ্য" },
  { "word": "Inevitable", "meaning": "অনিবার্য" },
  { "word": "Integrity", "meaning": "সাধুতা বা অখণ্ডতা" },
  { "word": "Intrepid", "meaning": "নির্ভীক বা সাহসী" },
  { "word": "Intuition", "meaning": "প্রজ্ঞা বা স্বজ্ঞা" },
  { "word": "Jubilation", "meaning": "উল্লাস" },
  { "word": "Lobbyist", "meaning": "প্রভাব বিস্তারকারী ব্যক্তি" },
  { "word": "Longevity", "meaning": "দীর্ঘায়ু" },
  { "word": "Mundane", "meaning": "সাধারণ বা জাগতিক" },
  { "word": "Nonchalant", "meaning": "উদাসীন" },
  { "word": "Novice", "meaning": "শিক্ষানবিশ" },
  { "word": "Opulent", "meaning": "ঐশ্বর্যশালী" },
  { "word": "Orator", "meaning": "সুবাগ্মী বা বক্তা" },
  { "word": "Ostentatious", "meaning": "জাঁকজমকপূর্ণ বা লোক-দেখানো" },
  { "word": "Parched", "meaning": "তৃষ্ণার্ত বা শুষ্ক" },
  { "word": "Perfidious", "meaning": "বিশ্বাসঘাতক" },
  { "word": "Precocious", "meaning": "অকালপক্ক" },
  { "word": "Pretentious", "meaning": "ভণ্ডামিপূর্ণ বা জাঁকালো" },
  { "word": "Procrastinate", "meaning": "দীর্ঘসূত্রতা করা" },
  { "word": "Prosaic", "meaning": "গদ্যময় বা নীরস" },
  { "word": "Prosperity", "meaning": "সমৃদ্ধি" },
  { "word": "Provocative", "meaning": "উত্তেজক" },
  { "word": "Prudent", "meaning": "বিচক্ষণ" },
  { "word": "Querulous", "meaning": "খিটখিটে বা অভিযোগপ্রবণ" },
  { "word": "Rancorous", "meaning": "বিদ্বেষপূর্ণ" },
  { "word": "Reclusive", "meaning": "নির্জনতাপ্রিয়" },
  { "word": "Reconciliation", "meaning": "মিমাংসা বা পুনর্মিলন" },
  { "word": "Renovation", "meaning": "সংস্কার" },
  { "word": "Resilient", "meaning": "সহনশীল বা স্থিতিস্থাপক" },
  { "word": "Restrained", "meaning": "সংযত" },
  { "word": "Reverence", "meaning": "শ্রদ্ধা" },
  { "word": "Sagacity", "meaning": "বিজ্ঞতা বা তীক্ষ্ণ বুদ্ধি" },
  { "word": "Scrutinize", "meaning": "নিরীক্ষণ করা" },
  { "word": "Spontaneous", "meaning": "স্বতঃস্ফূর্ত" },
  { "word": "Spurious", "meaning": "নকল বা কৃত্রিম" },
  { "word": "Submissive", "meaning": "অনুগত" },
  { "word": "Substantiate", "meaning": "প্রমাণ করা" },
  { "word": "Subtle", "meaning": "সূক্ষ্ম" },
  { "word": "Superficial", "meaning": "ভাসা ভাসা বা অগভীর" },
  { "word": "Superfluous", "meaning": "অপ্রয়োজনীয় বা অতিরিক্ত" },
  { "word": "Surreptitious", "meaning": "গোপন বা অলক্ষিত" },
  { "word": "Tactful", "meaning": "কৌশলী" },
  { "word": "Tenacious", "meaning": "দৃঢ় বা নাছোড়বান্দা" },
  { "word": "Transient", "meaning": "অস্থায়ী" },
  { "word": "Trivial", "meaning": "তুচ্ছ" },
  { "word": "Venerable", "meaning": "শ্রদ্ধেয়" },
  { "word": "Vindicate", "meaning": "নির্দোষ প্রমাণ করা" },
  { "word": "Wary", "meaning": "সতর্ক" },
  { "word": "Zealous", "meaning": "প্রবল উৎসাহী" },
  { "word": "Acquiesce", "meaning": "মৌন সম্মতি দেওয়া" },
  { "word": "Coherent", "meaning": "সুসংগত" },
  { "word": "Fabricate", "meaning": "উদ্ভাবন বা জাল করা" },
  { "word": "Innate", "meaning": "জন্মগত" },
  { "word": "Oblivious", "meaning": "বিস্মৃত বা অসচেতন" }
];

export const seedDatabase = async () => {
  try {
    console.log('Checking seed data...');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let addedCount = 0;

    for (const item of SEED_DATA) {
      const name = item.word.trim();

      // Check if this specific word already exists to avoid duplicates
      const existing = await db.getFirstAsync(
        'SELECT id FROM vocabulary WHERE name = ?',
        [name]
      );

      if (!existing) {
        const meaning = item.meaning.trim();
        const sortType = name.charAt(0).toUpperCase();

        await addVocabulary({
          name,
          meaning,
          sortType,
          month: currentMonth,
          year: currentYear
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`Successfully seeded ${addedCount} new vocabulary items.`);
    } else {
      console.log('Seed data already exists.');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
