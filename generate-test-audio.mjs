import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import gtts from 'node-gtts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create output directory
const outputDir = join(__dirname, 'uploads', 'tts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate English listening practice audio
const englishText = `Welcome to Meta Lingua listening practice. Today we will practice shopping vocabulary. 

Listen carefully to this conversation:

Sarah went to the grocery store to buy fresh vegetables and fruits. The store was very crowded because it was Saturday morning. She needed carrots, tomatoes, lettuce, apples, and bananas for her family's meals.

At the vegetable section, she picked up fresh carrots and ripe tomatoes. The lettuce looked crisp and green. Then she moved to the fruit section and selected sweet apples and yellow bananas.

When she finished shopping, Sarah went to the checkout. There was a long queue, but she waited patiently. The cashier was friendly and helped her pack the groceries into bags.

This shopping trip took longer than usual because of the weekend crowds, but Sarah was happy with her fresh purchases.`;

const englishFilename = `listening_practice_english_${Date.now()}.mp3`;
const englishPath = join(outputDir, englishFilename);

// Generate Persian listening practice audio
const persianText = `سلام! به تمرین شنیداری متالینگوا خوش آمدید. امروز واژگان مربوط به خرید را تمرین می‌کنیم.

با دقت به این گفتگو گوش دهید:

فاطمه به فروشگاه رفت تا سبزیجات و میوه‌های تازه بخرد. فروشگاه بسیار شلوغ بود چون روز جمعه بود. او به هویج، گوجه فرنگی، کاهو، سیب و موز برای غذاهای خانواده‌اش نیاز داشت.

در قسمت سبزیجات، هویج تازه و گوجه فرنگی رسیده برداشت. کاهو تر و سبز به نظر می‌رسید. سپس به قسمت میوه رفت و سیب شیرین و موز زرد انتخاب کرد.

وقتی خریدش تمام شد، فاطمه به صندوق رفت. صف طولانی بود، اما صبورانه منتظر ماند. صندوقدار مهربان بود و به او کمک کرد تا خریدهایش را در کیسه بگذارد.`;

const persianFilename = `listening_practice_persian_${Date.now()}.mp3`;
const persianPath = join(outputDir, persianFilename);

console.log('🎵 Generating test listening audio files...');

// Generate English TTS
const englishTTS = gtts('en');
englishTTS.save(englishPath, englishText, (err) => {
  if (err) {
    console.error('❌ English TTS generation failed:', err);
    return;
  }
  console.log('✅ English listening practice audio generated:');
  console.log(`   File: ${englishFilename}`);
  console.log(`   Path: /uploads/tts/${englishFilename}`);
  console.log(`   URL: http://localhost:5000/uploads/tts/${englishFilename}`);
  console.log(`   Content: Shopping vocabulary practice (English)`);
  console.log(`   Duration: ~2-3 minutes`);
});

// Generate Arabic TTS (closer to Persian)
const arabicTTS = gtts('ar');
arabicTTS.save(persianPath.replace('.mp3', '_arabic.mp3'), 'مرحبا بكم في تدريب الاستماع. اليوم سنتدرب على مفردات التسوق.', (err) => {
  if (err) {
    console.error('❌ Arabic TTS generation failed:', err);
    return;
  }
  console.log('✅ Arabic listening practice audio generated:');
  console.log(`   File: ${persianFilename.replace('.mp3', '_arabic.mp3')}`);
  console.log(`   URL: http://localhost:5000/uploads/tts/${persianFilename.replace('.mp3', '_arabic.mp3')}`);
  console.log(`   Content: Arabic listening practice`);
  console.log(`   Duration: ~30 seconds`);
});

// Generate vocabulary pronunciation examples
const vocabularyWords = [
  { word: 'groceries', text: 'Groceries. I bought groceries at the supermarket.' },
  { word: 'vegetables', text: 'Vegetables. Fresh vegetables are healthy and delicious.' },
  { word: 'crowded', text: 'Crowded. The store was very crowded on Saturday.' },
  { word: 'queue', text: 'Queue. I waited in a long queue at the checkout.' },
  { word: 'cashier', text: 'Cashier. The cashier was friendly and helpful.' }
];

vocabularyWords.forEach((vocab, index) => {
  const vocabFilename = `vocab_${vocab.word}_${Date.now() + index}.mp3`;
  const vocabPath = join(outputDir, vocabFilename);
  
  const vocabTTS = gtts('en');
  vocabTTS.save(vocabPath, vocab.text, (err) => {
    if (err) {
      console.error(`❌ Vocabulary TTS failed for ${vocab.word}:`, err);
      return;
    }
    console.log(`✅ Vocabulary audio generated: ${vocab.word}`);
    console.log(`   URL: http://localhost:5000/uploads/tts/${vocabFilename}`);
  });
});

console.log('\n🎧 Audio generation started... Files will be available shortly at the URLs above.');
console.log('📱 You can click on the URLs to listen to the generated audio files.');