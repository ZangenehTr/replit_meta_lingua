# How Language Proficiency Data is Collected

## Current Implementation

Right now, the proficiency data is calculated using simplified estimates:

1. **Basic Level Detection**: 
   - Reads user's profile level (beginner/intermediate/advanced)
   - Assigns preset score ranges for each skill based on this level

2. **Static Scores**:
   - Beginner: Speaking 65%, Listening 70%, Reading 60%, etc.
   - Intermediate: Speaking 75%, Listening 80%, Reading 70%, etc.
   - Advanced: Speaking 85%, Listening 90%, Reading 80%, etc.

3. **Mock Progress History**:
   - Generates fake historical data showing gradual improvement

## What Should Be Tracked for Real Data

### Speaking Skills
- AI conversation sessions (pronunciation, fluency, response time)
- Live class participation scores from teachers
- Voice message quality in homework submissions

### Listening Skills  
- Comprehension test scores from audio lessons
- Response accuracy in AI conversations
- Video lesson completion and quiz results

### Reading Skills
- Reading speed with comprehension checks
- Article completion rates
- Performance on reading comprehension quizzes

### Writing Skills
- Essay grades from teachers
- Grammar error rates in submitted work
- Forum post quality scores

### Grammar Skills
- Grammar exercise completion and accuracy
- Error patterns in all written work
- Specific grammar quiz results

### Vocabulary Skills
- New words learned per week
- Flashcard retention rates
- Correct usage in context

## How to Implement Real Tracking

1. **Add Activity Logging**: Every learning activity should record skill points
2. **Create Assessment System**: Automatic scoring for exercises and quizzes
3. **Track Progress Over Time**: Daily snapshots of skill levels
4. **Generate Real Insights**: Based on actual performance patterns

The system would then aggregate all these data points to create accurate, dynamic visualizations that reflect real learning progress rather than estimates.