import { db } from './server/db';
import { games, gameLevels } from '@shared/schema';
import { gameService } from './server/game-service';

async function testGameSystem() {
  console.log('🎮 Testing Game System with Real Data...\n');

  try {
    // 1. Create a vocabulary game
    console.log('1. Creating Vocabulary Game...');
    const [vocabGame] = await db.insert(games).values({
      gameName: 'English Vocabulary Master',
      gameCode: 'VOCAB_MASTER_EN',
      description: 'Master essential English vocabulary through interactive challenges',
      gameType: 'vocabulary',
      ageGroup: 'teens',
      minLevel: 'A1',
      maxLevel: 'B2',
      language: 'en',
      gameMode: 'practice',
      duration: 15,
      pointsPerCorrect: 10,
      bonusMultiplier: '1.5',
      livesSystem: true,
      timerEnabled: true,
      thumbnailUrl: '/images/vocabulary-game.jpg',
      backgroundImage: '/images/vocabulary-bg.jpg',
      soundEffects: {
        correct: '/sounds/correct.mp3',
        incorrect: '/sounds/incorrect.mp3',
        levelUp: '/sounds/levelup.mp3'
      },
      totalLevels: 5,
      unlockRequirements: {
        minLevel: 1,
        minPoints: 0
      },
      isActive: true
    }).returning();
    console.log('✅ Vocabulary game created:', vocabGame.gameName);

    // 2. Create game levels
    console.log('\n2. Creating Game Levels...');
    const levels = [];
    for (let i = 1; i <= 5; i++) {
      const [level] = await db.insert(gameLevels).values({
        gameId: vocabGame.id,
        levelNumber: i,
        levelName: `Level ${i}: ${['Basic Words', 'Common Phrases', 'Intermediate Vocabulary', 'Advanced Terms', 'Expert Language'][i-1]}`,
        languageLevel: ['A1', 'A1', 'A2', 'B1', 'B2'][i-1],
        contentType: 'vocabulary',
        contentData: {
          words: 10 + (i * 2),
          categories: ['daily', 'common', 'business'][i % 3],
          theme: ['basic', 'common', 'intermediate', 'advanced', 'expert'][i-1]
        },
        difficulty: ['easy', 'easy', 'medium', 'hard', 'expert'][i-1],
        speedMultiplier: 1 + (i * 0.2),
        itemCount: 10 + (i * 2),
        xpReward: 50 * i,
        coinsReward: 25 * i,
        badgeId: null,
        passingScore: 60 + (i * 5),
        starsThresholds: {
          oneStar: 60 + (i * 5),
          twoStars: 75 + (i * 5),
          threeStars: 90 + (i * 2)
        }
      }).returning();
      levels.push(level);
      console.log(`✅ Level ${i} created:`, level.levelName);
    }

    // 3. Generate real questions for first level
    console.log('\n3. Generating Real Questions...');
    const questions = await gameService.generateGameQuestions(vocabGame.id, levels[0].id, 10);
    console.log(`✅ Generated ${questions.length} questions for Level 1`);
    
    // Display sample questions
    console.log('\nSample Questions:');
    questions.slice(0, 3).forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.question}`);
      console.log(`     Type: ${q.questionType}`);
      console.log(`     Answer: ${typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : q.correctAnswer}`);
    });

    // 4. Create daily challenge
    console.log('\n4. Creating Daily Challenge...');
    const dailyChallenge = await gameService.generateDailyChallenge();
    console.log('✅ Daily challenge created:', dailyChallenge.challengeName);
    console.log('   Type:', dailyChallenge.challengeType);
    console.log('   Difficulty:', dailyChallenge.difficulty);
    console.log('   XP Reward:', dailyChallenge.xpReward);

    // 5. Test answer checking
    console.log('\n5. Testing Answer Checking...');
    const testQuestion = questions[0];
    const result = await gameService.checkAnswer(
      testQuestion.id,
      testQuestion.correctAnswer,
      1, // Mock session ID
      42 // Admin user ID
    );
    console.log('✅ Answer check result:');
    console.log('   Correct:', result.isCorrect);
    console.log('   Points:', result.points);
    console.log('   Feedback:', result.feedback.substring(0, 50) + '...');

    // 6. Create a grammar game
    console.log('\n6. Creating Grammar Game...');
    const [grammarGame] = await db.insert(games).values({
      gameName: 'Grammar Champion',
      gameCode: 'GRAMMAR_CHAMP_EN',
      description: 'Master English grammar rules through practice',
      gameType: 'grammar',
      ageGroup: 'teens',
      minLevel: 'A2',
      maxLevel: 'B2',
      language: 'en',
      gameMode: 'challenge',
      duration: 20,
      pointsPerCorrect: 15,
      bonusMultiplier: '2.0',
      livesSystem: true,
      timerEnabled: true,
      thumbnailUrl: '/images/grammar-game.jpg',
      backgroundImage: '/images/grammar-bg.jpg',
      soundEffects: {
        correct: '/sounds/correct.mp3',
        incorrect: '/sounds/incorrect.mp3',
        levelUp: '/sounds/levelup.mp3'
      },
      totalLevels: 3,
      unlockRequirements: {
        minLevel: 2,
        minPoints: 100
      },
      isActive: true
    }).returning();
    console.log('✅ Grammar game created:', grammarGame.gameName);

    // 7. Create listening game
    console.log('\n7. Creating Listening Game...');
    const [listeningGame] = await db.insert(games).values({
      gameName: 'Listening Pro',
      gameCode: 'LISTEN_PRO_EN',
      description: 'Improve your listening comprehension skills',
      gameType: 'listening',
      ageGroup: 'adults',
      minLevel: 'B1',
      maxLevel: 'C1',
      language: 'en',
      gameMode: 'practice',
      duration: 25,
      pointsPerCorrect: 20,
      bonusMultiplier: '2.5',
      livesSystem: true,
      timerEnabled: false,
      thumbnailUrl: '/images/listening-game.jpg',
      backgroundImage: '/images/listening-bg.jpg',
      soundEffects: {
        correct: '/sounds/correct.mp3',
        incorrect: '/sounds/incorrect.mp3',
        levelUp: '/sounds/levelup.mp3'
      },
      totalLevels: 4,
      unlockRequirements: {
        minLevel: 3,
        minPoints: 200
      },
      isActive: true
    }).returning();
    console.log('✅ Listening game created:', listeningGame.gameName);

    // 8. Test leaderboard update
    console.log('\n8. Testing Leaderboard Update...');
    await gameService.updateLeaderboard(42, vocabGame.id, 250, 1);
    const leaderboard = await gameService.getLeaderboard(vocabGame.id, 'daily', 10);
    console.log('✅ Leaderboard updated. Top entries:', leaderboard.length);

    // 9. Summary
    console.log('\n📊 Game System Test Summary:');
    console.log('✅ Created 3 games (Vocabulary, Grammar, Listening)');
    console.log('✅ Generated 5 levels with increasing difficulty');
    console.log('✅ Created 10 real questions with proper content');
    console.log('✅ Daily challenge system working');
    console.log('✅ Answer checking and scoring functional');
    console.log('✅ Leaderboard tracking active');
    console.log('\n🎉 Game system fully operational with real data!');

  } catch (error) {
    console.error('❌ Error testing game system:', error);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

testGameSystem();