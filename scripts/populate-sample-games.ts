import { db } from "../server/db";
import { games, gameLevels, achievements } from "../shared/schema";

async function populateSampleGames() {
  console.log('Populating sample games...');

  // Sample games for different age groups
  const sampleGames = [
    // Age 5-10
    {
      gameName: "Word Match for Kids",
      gameCode: "WM-KIDS-001",
      description: "Fun word matching game for young learners",
      gameType: "vocabulary",
      ageGroup: "5-10",
      minLevel: "A1",
      maxLevel: "A2",
      language: "en",
      gameMode: "single_player",
      duration: 15,
      pointsPerCorrect: 10,
      thumbnailUrl: "/assets/games/word-match-kids.png",
      totalLevels: 20,
      isActive: true
    },
    {
      gameName: "Listen and Choose",
      gameCode: "LC-KIDS-001",
      description: "Audio recognition game for children",
      gameType: "listening",
      ageGroup: "5-10",
      minLevel: "A1",
      maxLevel: "A2",
      language: "en",
      gameMode: "single_player",
      duration: 20,
      pointsPerCorrect: 15,
      thumbnailUrl: "/assets/games/listen-choose.png",
      totalLevels: 25,
      isActive: true
    },
    {
      gameName: "Color Grammar",
      gameCode: "CG-KIDS-001",
      description: "Learn basic grammar through colors",
      gameType: "grammar",
      ageGroup: "5-10",
      minLevel: "A1",
      maxLevel: "A2",
      language: "en",
      gameMode: "single_player",
      duration: 25,
      pointsPerCorrect: 20,
      thumbnailUrl: "/assets/games/color-grammar.png",
      totalLevels: 30,
      isActive: true
    },
    
    // Age 11-14
    {
      gameName: "Vocabulary Challenge",
      gameCode: "VC-TEEN-001",
      description: "Challenging vocabulary building game",
      gameType: "vocabulary",
      ageGroup: "11-14",
      minLevel: "A2",
      maxLevel: "B1",
      language: "en",
      gameMode: "single_player",
      duration: 30,
      pointsPerCorrect: 25,
      thumbnailUrl: "/assets/games/vocab-challenge.png",
      totalLevels: 35,
      isActive: true
    },
    {
      gameName: "Story Builder",
      gameCode: "SB-TEEN-001",
      description: "Create stories while learning grammar",
      gameType: "writing",
      ageGroup: "11-14",
      minLevel: "A2",
      maxLevel: "B1",
      language: "en",
      gameMode: "single_player",
      duration: 40,
      pointsPerCorrect: 30,
      thumbnailUrl: "/assets/games/story-builder.png",
      totalLevels: 40,
      isActive: true
    },
    {
      gameName: "Conversation Practice",
      gameCode: "CP-TEEN-001",
      description: "Practice conversations with AI",
      gameType: "speaking",
      ageGroup: "11-14",
      minLevel: "A2",
      maxLevel: "B1",
      language: "en",
      gameMode: "single_player",
      duration: 35,
      pointsPerCorrect: 35,
      thumbnailUrl: "/assets/games/conversation-practice.png",
      totalLevels: 30,
      isActive: true
    },
    
    // Age 15-20
    {
      gameName: "Advanced Grammar Quest",
      gameCode: "AGQ-YOUTH-001",
      description: "Master advanced grammar concepts",
      gameType: "grammar",
      ageGroup: "15-20",
      minLevel: "B1",
      maxLevel: "B2",
      language: "en",
      gameMode: "single_player",
      duration: 45,
      pointsPerCorrect: 40,
      thumbnailUrl: "/assets/games/grammar-quest.png",
      totalLevels: 50,
      isActive: true
    },
    {
      gameName: "Reading Comprehension Pro",
      gameCode: "RCP-YOUTH-001",
      description: "Advanced reading comprehension challenges",
      gameType: "reading",
      ageGroup: "15-20",
      minLevel: "B1",
      maxLevel: "B2",
      language: "en",
      gameMode: "single_player",
      duration: 50,
      pointsPerCorrect: 45,
      thumbnailUrl: "/assets/games/reading-pro.png",
      totalLevels: 45,
      isActive: true
    },
    {
      gameName: "Debate Master",
      gameCode: "DM-YOUTH-001",
      description: "Practice debate and argumentation",
      gameType: "speaking",
      ageGroup: "15-20",
      minLevel: "B1",
      maxLevel: "B2",
      language: "en",
      gameMode: "single_player",
      duration: 55,
      pointsPerCorrect: 50,
      thumbnailUrl: "/assets/games/debate-master.png",
      totalLevels: 40,
      isActive: true
    },
    
    // Age 21+
    {
      gameName: "Business English Simulator",
      gameCode: "BES-ADULT-001",
      description: "Master business English skills",
      gameType: "vocabulary",
      ageGroup: "21+",
      minLevel: "B2",
      maxLevel: "C1",
      language: "en",
      gameMode: "single_player",
      duration: 60,
      pointsPerCorrect: 55,
      thumbnailUrl: "/assets/games/business-english.png",
      totalLevels: 60,
      isActive: true
    },
    {
      gameName: "Academic Writing Workshop",
      gameCode: "AWW-ADULT-001",
      description: "Perfect your academic writing",
      gameType: "writing",
      ageGroup: "21+",
      minLevel: "B2",
      maxLevel: "C1",
      language: "en",
      gameMode: "single_player",
      duration: 65,
      pointsPerCorrect: 60,
      thumbnailUrl: "/assets/games/academic-writing.png",
      totalLevels: 55,
      isActive: true
    },
    {
      gameName: "Professional Listening",
      gameCode: "PL-ADULT-001",
      description: "Advanced listening for professionals",
      gameType: "listening",
      ageGroup: "21+",
      minLevel: "B2",
      maxLevel: "C1",
      language: "en",
      gameMode: "single_player",
      duration: 70,
      pointsPerCorrect: 65,
      thumbnailUrl: "/assets/games/professional-listening.png",
      totalLevels: 50,
      isActive: true
    }
  ];

  try {
    // Insert games
    for (const game of sampleGames) {
      await db.insert(games).values(game).onConflictDoNothing();
    }
    
    console.log(`Successfully populated ${sampleGames.length} sample games`);
    
    // Create sample achievements
    const sampleAchievements = [
      {
        title: "First Steps",
        description: "Complete your first game",
        type: "progress",
        xpReward: 50,
        isActive: true
      },
      {
        title: "Vocabulary Master",
        description: "Complete 10 vocabulary games",
        type: "skill",
        xpReward: 200,
        isActive: true
      },
      {
        title: "Grammar Guru",
        description: "Master 5 grammar games",
        type: "skill",
        xpReward: 150,
        isActive: true
      },
      {
        title: "Week Warrior",
        description: "Play games for 7 consecutive days",
        type: "streak",
        xpReward: 300,
        isActive: true
      },
      {
        title: "Perfect Score",
        description: "Achieve 100% accuracy in a game",
        type: "performance",
        xpReward: 100,
        isActive: true
      }
    ];

    for (const achievement of sampleAchievements) {
      await db.insert(achievements).values(achievement).onConflictDoNothing();
    }

    console.log(`Successfully populated ${sampleAchievements.length} sample achievements`);
    
  } catch (error) {
    console.error('Error populating sample games:', error);
  }
}

// Run the script
populateSampleGames().then(() => {
  console.log('Sample games population completed');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});