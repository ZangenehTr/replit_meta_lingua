// Quick test script to create sample courses
const { courseCreator } = require('./server/services/course-creator.ts');

async function testCourseCreation() {
  try {
    console.log('Starting course creation test...');
    
    // Create Business English A2 course
    console.log('Creating Business English A2 course...');
    const businessCourse = await courseCreator.createBusinessEnglishA2Course();
    console.log('✅ Business English A2 course created:', businessCourse.title);
    
    // Create IELTS Speaking B2 course
    console.log('Creating IELTS Speaking B2 course...');
    const ieltsCourse = await courseCreator.createIELTSSpeakingB2Course();
    console.log('✅ IELTS Speaking B2 course created:', ieltsCourse.title);
    
    console.log('\n🎉 Both sample courses created successfully!');
    
    return {
      businessCourse,
      ieltsCourse
    };
    
  } catch (error) {
    console.error('❌ Error creating courses:', error);
    throw error;
  }
}

// Run the test
testCourseCreation()
  .then(result => {
    console.log('\nFinal result:', {
      businessEnglish: result.businessCourse.title,
      ieltsSpeaking: result.ieltsCourse.title
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });