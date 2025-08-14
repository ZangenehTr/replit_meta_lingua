import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';
let adminToken;
let teacherId;
let courseId;
let classId;
let studentId;

async function login() {
  console.log('🔐 Logging in as admin...');
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' })
  });
  const data = await res.json();
  adminToken = data.token;
  console.log('✅ Logged in successfully');
  return adminToken;
}

async function createCourse() {
  console.log('📚 Creating test course...');
  const res = await fetch(`${API_BASE}/api/admin/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Advanced Persian Language',
      description: 'Comprehensive Persian language course with weekly sessions',
      fee: 5000000,
      level: 'intermediate',
      language: 'persian',
      duration: 12,
      totalSessions: 24,
      isFeatured: true,
      isActive: true
    })
  });
  const data = await res.json();
  courseId = data.course?.id;
  console.log(`✅ Course created with ID: ${courseId}`);
  return courseId;
}

async function createTeacher() {
  console.log('👩‍🏫 Creating test teacher...');
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: `teacher_${Date.now()}@test.com`,
      password: 'teacher123',
      name: 'Sarah Johnson',
      role: 'Teacher/Tutor',
      phoneNumber: '+989121234567',
      targetLanguage: 'persian',
      currentProficiency: 'advanced'
    })
  });
  const data = await res.json();
  teacherId = data.user?.id;
  console.log(`✅ Teacher created with ID: ${teacherId}`);
  return teacherId;
}

async function createStudent() {
  console.log('👨‍🎓 Creating test student...');
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: `student_${Date.now()}@test.com`,
      password: 'student123',
      name: 'John Smith',
      role: 'Student',
      phoneNumber: '+989127654321',
      targetLanguage: 'persian',
      currentProficiency: 'beginner',
      enrolledCourseId: courseId // Assign course during creation
    })
  });
  const data = await res.json();
  studentId = data.user?.id;
  console.log(`✅ Student created with ID: ${studentId} (assigned to course ${courseId})`);
  return studentId;
}

async function createClass() {
  console.log('🏫 Creating test class with weekly schedule...');
  const startDate = new Date();
  
  const res = await fetch(`${API_BASE}/api/admin/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      courseId: courseId,
      teacherId: teacherId,
      startDate: startDate.toISOString().split('T')[0],
      weekdays: ['monday', 'wednesday', 'friday'], // 3 days per week
      startTime: '18:00',
      endTime: '19:30',
      maxStudents: 20,
      deliveryMode: 'online',
      isRecurring: true,
      recurringPattern: 'weekly',
      totalSessions: 24,
      notes: 'Advanced Persian language class with interactive sessions'
    })
  });
  
  const data = await res.json();
  classId = data.class?.id;
  console.log(`✅ Class created with ID: ${classId}`);
  console.log(`   Schedule: Monday, Wednesday, Friday at 18:00-19:30`);
  console.log(`   End date will be calculated considering holidays`);
  return classId;
}

async function searchStudents() {
  console.log('🔍 Searching for students to enroll...');
  
  // Search by course
  const res1 = await fetch(`${API_BASE}/api/admin/enrollments/search-students?courseId=${courseId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const studentsByCourse = await res1.json();
  console.log(`   Found ${studentsByCourse.length} students assigned to course ${courseId}`);
  
  // Search by name
  const res2 = await fetch(`${API_BASE}/api/admin/enrollments/search-students?query=John`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const studentsByName = await res2.json();
  console.log(`   Found ${studentsByName.length} students matching "John"`);
  
  return studentsByCourse;
}

async function enrollStudent() {
  console.log('📝 Enrolling student in class...');
  const res = await fetch(`${API_BASE}/api/admin/enrollments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      classId: classId,
      studentId: studentId,
      enrollmentType: 'admin',
      paymentStatus: 'paid',
      notes: 'Test enrollment for advanced Persian class'
    })
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message);
  }
  
  const data = await res.json();
  console.log(`✅ Student enrolled successfully`);
  console.log(`   Enrollment ID: ${data.enrollment?.id}`);
  return data.enrollment;
}

async function getClassEnrollments() {
  console.log('📋 Getting class enrollments...');
  const res = await fetch(`${API_BASE}/api/admin/classes/${classId}/enrollments`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const enrollments = await res.json();
  console.log(`   Class has ${enrollments.length} enrolled students`);
  return enrollments;
}

async function getStudentEnrollments() {
  console.log('📋 Getting student enrollments...');
  const res = await fetch(`${API_BASE}/api/admin/students/${studentId}/enrollments`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const enrollments = await res.json();
  console.log(`   Student is enrolled in ${enrollments.length} classes`);
  return enrollments;
}

async function bulkEnroll() {
  console.log('👥 Testing bulk enrollment...');
  
  // Create additional students
  const studentIds = [];
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: `bulk_student_${Date.now()}_${i}@test.com`,
        password: 'student123',
        name: `Bulk Student ${i+1}`,
        role: 'Student',
        phoneNumber: `+98912000${i}000`,
        enrolledCourseId: courseId
      })
    });
    const data = await res.json();
    if (data.user?.id) {
      studentIds.push(data.user.id);
    }
  }
  
  // Bulk enroll
  const res = await fetch(`${API_BASE}/api/admin/enrollments/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      action: 'enroll',
      classId: classId,
      studentIds: studentIds
    })
  });
  
  const data = await res.json();
  console.log(`✅ Bulk enrollment completed: ${data.enrolledCount} students enrolled`);
  if (data.errors && data.errors.length > 0) {
    console.log(`   Errors: ${data.errors.length}`);
  }
  
  return data;
}

async function runTests() {
  console.log('🚀 Starting Class Enrollment System Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // Setup
    await login();
    await createCourse();
    await createTeacher();
    await createStudent();
    await createClass();
    
    console.log('\n' + '=' .repeat(50));
    console.log('📚 Testing Enrollment Features');
    console.log('=' .repeat(50) + '\n');
    
    // Test enrollment features
    await searchStudents();
    await enrollStudent();
    await getClassEnrollments();
    await getStudentEnrollments();
    await bulkEnroll();
    
    // Verify final state
    const finalEnrollments = await getClassEnrollments();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed successfully!');
    console.log(`📊 Final Statistics:`);
    console.log(`   - Total enrolled students: ${finalEnrollments.length}`);
    console.log(`   - Class capacity: ${finalEnrollments.length}/20`);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();