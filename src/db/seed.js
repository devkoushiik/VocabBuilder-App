import { initDatabase } from './database';
import { addVocabulary } from './operations';

const sampleVocabulary = [
    { name: 'Beautiful', meaning: 'সুন্দর (Sundor)', sortType: 'B', month: 1, year: 2026 },
    { name: 'Happy', meaning: 'খুশি (Khushi)', sortType: 'H', month: 1, year: 2026 },
    { name: 'Friend', meaning: 'বন্ধু (Bondhu)', sortType: 'F', month: 1, year: 2026 },
    { name: 'Love', meaning: 'ভালোবাসা (Bhalobasha)', sortType: 'L', month: 1, year: 2026 },
    { name: 'Book', meaning: 'বই (Boi)', sortType: 'B', month: 1, year: 2026 },
    { name: 'Water', meaning: 'পানি (Pani)', sortType: 'W', month: 1, year: 2026 },
    { name: 'Mother', meaning: 'মা (Ma)', sortType: 'M', month: 1, year: 2026 },
    { name: 'Father', meaning: 'বাবা (Baba)', sortType: 'F', month: 1, year: 2026 },
    { name: 'School', meaning: 'স্কুল (School)', sortType: 'S', month: 1, year: 2026 },
    { name: 'Home', meaning: 'বাড়ি (Bari)', sortType: 'H', month: 1, year: 2026 },
    { name: 'Food', meaning: 'খাবার (Khabar)', sortType: 'F', month: 1, year: 2026 },
    { name: 'Tree', meaning: 'গাছ (Gach)', sortType: 'T', month: 1, year: 2026 },
    { name: 'Sun', meaning: 'সূর্য (Surjo)', sortType: 'S', month: 1, year: 2026 },
    { name: 'Moon', meaning: 'চাঁদ (Chand)', sortType: 'M', month: 1, year: 2026 },
    { name: 'Star', meaning: 'তারা (Tara)', sortType: 'S', month: 1, year: 2026 },
    { name: 'Rain', meaning: 'বৃষ্টি (Brishti)', sortType: 'R', month: 1, year: 2026 },
    { name: 'River', meaning: 'নদী (Nodi)', sortType: 'R', month: 1, year: 2026 },
    { name: 'Mountain', meaning: 'পাহাড় (Pahar)', sortType: 'M', month: 1, year: 2026 },
    { name: 'Ocean', meaning: 'সাগর (Sagor)', sortType: 'O', month: 1, year: 2026 },
    { name: 'Sky', meaning: 'আকাশ (Akash)', sortType: 'S', month: 1, year: 2026 },
];

export const seedDatabase = async () => {
    try {
        console.log('🌱 Seeding database with sample vocabulary...');

        let successCount = 0;
        for (const vocab of sampleVocabulary) {
            try {
                await addVocabulary(vocab);
                successCount++;
                console.log(`✅ Added: ${vocab.name} - ${vocab.meaning}`);
            } catch (error) {
                console.log(`⚠️  Skipped ${vocab.name}: ${error.message}`);
            }
        }

        console.log(`\n🎉 Successfully added ${successCount} out of ${sampleVocabulary.length} vocabulary entries!`);
        return successCount;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};
