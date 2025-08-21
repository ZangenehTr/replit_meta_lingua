import { Parser } from 'json2csv';

export function generateCSV(data: any[], fields?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Auto-detect fields if not provided
  const csvFields = fields || Object.keys(data[0]);
  
  const json2csvParser = new Parser({ fields: csvFields });
  return json2csvParser.parse(data);
}

export function exportStudentsCSV(students: any[]): string {
  const fields = [
    'id',
    'firstName',
    'lastName',
    'email',
    'phone',
    'nationalId',
    'level',
    'status',
    'courses',
    'progress',
    'attendance',
    'enrollmentDate',
    'lastActivity'
  ];

  const processedData = students.map(student => ({
    ...student,
    courses: Array.isArray(student.courses) ? student.courses.join(', ') : '',
    enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString(),
    lastActivity: student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'
  }));

  return generateCSV(processedData, fields);
}

export function exportTeachersCSV(teachers: any[]): string {
  const fields = [
    'id',
    'name',
    'email',
    'specializations',
    'rating',
    'totalStudents',
    'totalSessions',
    'languages',
    'availability',
    'isActive'
  ];

  const processedData = teachers.map(teacher => ({
    ...teacher,
    specializations: Array.isArray(teacher.specializations) ? teacher.specializations.join(', ') : '',
    languages: Array.isArray(teacher.languages) ? teacher.languages.join(', ') : '',
    availability: teacher.availability || 'Not set'
  }));

  return generateCSV(processedData, fields);
}

export function exportFinancialReportCSV(transactions: any[]): string {
  const fields = [
    'id',
    'date',
    'studentName',
    'amount',
    'type',
    'status',
    'paymentMethod',
    'description',
    'invoiceNumber'
  ];

  const processedData = transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.createdAt).toLocaleDateString(),
    amount: `${transaction.amount.toLocaleString()} IRR`
  }));

  return generateCSV(processedData, fields);
}

export function exportAttendanceCSV(attendance: any[]): string {
  const fields = [
    'date',
    'studentName',
    'courseName',
    'sessionTitle',
    'status',
    'teacherName',
    'notes'
  ];

  const processedData = attendance.map(record => ({
    ...record,
    date: new Date(record.date).toLocaleDateString(),
    status: record.status || 'Not marked'
  }));

  return generateCSV(processedData, fields);
}