import puppeteer from 'puppeteer';

export interface PayslipData {
  teacherId: number;
  teacherName: string;
  period: string;
  baseSalary: number;
  sessionsCount: number;
  totalHours: number;
  bonuses: number;
  deductions: number;
  netAmount: number;
  paymentDate: string;
  payslipId: number;
  instituteName?: string;
  instituteAddress?: string;
}

export async function generatePayslipPDF(data: PayslipData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Create HTML content for the payslip
    const html = `
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payslip - ${data.teacherName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Vazirmatn', 'Segoe UI', Tahoma, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
          }
          
          .header p {
            color: #666;
            font-size: 14px;
          }
          
          .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .info-item:last-child {
            border-bottom: none;
          }
          
          .label {
            font-weight: 600;
            color: #555;
          }
          
          .value {
            color: #000;
          }
          
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          
          .details-table th,
          .details-table td {
            padding: 12px;
            text-align: right;
            border: 1px solid #ddd;
          }
          
          .details-table th {
            background: #2563eb;
            color: white;
            font-weight: 600;
          }
          
          .details-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          
          .summary {
            background: #e8f4fd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            border: 2px solid #2563eb;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 16px;
          }
          
          .summary-row.total {
            border-top: 2px solid #2563eb;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 20px;
            font-weight: 700;
            color: #2563eb;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          
          .amount {
            font-family: monospace;
            font-size: 18px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.instituteName || 'Meta Lingua Academy'}</h1>
          <p>${data.instituteAddress || 'موسسه آموزش زبان متا لینگوا'}</p>
          <p>فیش حقوقی مدرس</p>
        </div>
        
        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">نام مدرس:</span>
              <span class="value">${data.teacherName}</span>
            </div>
            <div class="info-item">
              <span class="label">شماره فیش:</span>
              <span class="value">${data.payslipId}</span>
            </div>
            <div class="info-item">
              <span class="label">دوره پرداخت:</span>
              <span class="value">${data.period}</span>
            </div>
            <div class="info-item">
              <span class="label">تاریخ پرداخت:</span>
              <span class="value">${new Date(data.paymentDate).toLocaleDateString('fa-IR')}</span>
            </div>
          </div>
        </div>
        
        <table class="details-table">
          <thead>
            <tr>
              <th>شرح</th>
              <th>مقدار</th>
              <th>مبلغ (ریال)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>حقوق پایه</td>
              <td>-</td>
              <td class="amount">${data.baseSalary.toLocaleString('fa-IR')}</td>
            </tr>
            <tr>
              <td>تعداد جلسات</td>
              <td>${data.sessionsCount} جلسه</td>
              <td>-</td>
            </tr>
            <tr>
              <td>مجموع ساعات تدریس</td>
              <td>${data.totalHours} ساعت</td>
              <td>-</td>
            </tr>
            <tr>
              <td>پاداش و اضافه کار</td>
              <td>-</td>
              <td class="amount">${data.bonuses.toLocaleString('fa-IR')}</td>
            </tr>
            <tr>
              <td>کسورات</td>
              <td>-</td>
              <td class="amount">${data.deductions > 0 ? '-' : ''}${data.deductions.toLocaleString('fa-IR')}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-row">
            <span class="label">جمع دریافتی:</span>
            <span class="amount">${(data.baseSalary + data.bonuses).toLocaleString('fa-IR')} ریال</span>
          </div>
          <div class="summary-row">
            <span class="label">جمع کسورات:</span>
            <span class="amount">${data.deductions.toLocaleString('fa-IR')} ریال</span>
          </div>
          <div class="summary-row total">
            <span>خالص پرداختی:</span>
            <span class="amount">${data.netAmount.toLocaleString('fa-IR')} ریال</span>
          </div>
        </div>
        
        <div class="footer">
          <p>این فیش حقوقی به صورت خودکار تولید شده است.</p>
          <p>${new Date().toLocaleDateString('fa-IR')} - ${data.instituteName || 'Meta Lingua Academy'}</p>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export interface TestResultsPDFData {
  studentName: string;
  studentEmail: string;
  testDate: string;
  overallBand: string;
  overallScore: number;
  totalTimeMin: number;
  skillResults: Array<{
    skill: string;
    band: string;
    score: number;
    confidence: number;
    timeSpentSec: number;
  }>;
  analytics: {
    totalAttempts: number;
    averageScore: number;
    highestScore: number;
    mostRecentBand: string | null;
    improvementRate: number;
    consistencyScore: number;
    strongestSkill: string | null;
    weakestSkill: string | null;
  };
  recommendations?: string[];
  reportId: string;
}

export async function generateTestResultsPDF(data: TestResultsPDFData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // CEFR Band colors mapping
    const bandColors: Record<string, string> = {
      'A1': '#ef4444', 'A2': '#f97316', 'B1': '#eab308', 
      'B2': '#22c55e', 'C1': '#3b82f6', 'C2': '#8b5cf6'
    };
    
    const getBandColor = (band: string) => {
      const baseBand = band.replace(/[+-]/, '');
      return bandColors[baseBand] || '#6b7280';
    };

    // Create comprehensive HTML for MST test results
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MST Test Results - ${data.studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
            padding: 40px;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 30px;
            margin-bottom: 40px;
          }
          
          .header h1 {
            color: #3b82f6;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .header .subtitle {
            color: #6b7280;
            font-size: 18px;
            font-weight: 500;
          }
          
          .student-info {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 32px;
            border-left: 4px solid #3b82f6;
          }
          
          .student-info h2 {
            color: #1f2937;
            font-size: 20px;
            margin-bottom: 16px;
            font-weight: 600;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .info-label {
            font-weight: 500;
            color: #6b7280;
          }
          
          .info-value {
            font-weight: 600;
            color: #1f2937;
          }
          
          .overall-result {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 32px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 32px;
          }
          
          .overall-band {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          
          .overall-score {
            font-size: 24px;
            margin-bottom: 4px;
          }
          
          .overall-label {
            opacity: 0.9;
            font-size: 16px;
          }
          
          .skills-section {
            margin-bottom: 32px;
          }
          
          .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
          }
          
          .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .skill-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            transition: transform 0.2s;
          }
          
          .skill-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
          
          .skill-name {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
            text-transform: capitalize;
          }
          
          .skill-band {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 16px;
            color: white;
            margin-bottom: 12px;
          }
          
          .skill-score {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          
          .skill-confidence {
            font-size: 14px;
            color: #6b7280;
          }
          
          .analytics-section {
            margin-bottom: 32px;
          }
          
          .analytics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 24px;
          }
          
          .analytics-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          
          .analytics-value {
            font-size: 28px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 4px;
          }
          
          .analytics-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .recommendations {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 32px;
          }
          
          .recommendations h3 {
            color: #92400e;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
          }
          
          .recommendations ul {
            list-style: none;
            padding: 0;
          }
          
          .recommendations li {
            color: #92400e;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
          }
          
          .recommendations li::before {
            content: "→";
            position: absolute;
            left: 0;
            color: #f59e0b;
            font-weight: bold;
          }
          
          .chart-section {
            margin-bottom: 32px;
          }
          
          .skills-chart {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
          }
          
          .chart-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .bar-chart {
            display: flex;
            align-items: end;
            justify-content: space-around;
            height: 200px;
            border-bottom: 2px solid #e5e7eb;
            padding: 20px 0;
          }
          
          .bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 80px;
          }
          
          .bar-fill {
            width: 40px;
            border-radius: 4px 4px 0 0;
            margin-bottom: 8px;
            min-height: 10px;
          }
          
          .bar-label {
            font-size: 12px;
            font-weight: 500;
            color: #6b7280;
            text-align: center;
            margin-bottom: 4px;
          }
          
          .bar-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .report-id {
            font-family: monospace;
            color: #9ca3af;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .skills-grid {
              grid-template-columns: repeat(4, 1fr);
            }
            
            .analytics-grid {
              grid-template-columns: repeat(4, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Meta Skills Test (MST) Results</h1>
          <p class="subtitle">Comprehensive Language Proficiency Assessment Report</p>
        </div>
        
        <div class="student-info">
          <h2>Student Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${data.studentName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${data.studentEmail}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Test Date:</span>
              <span class="info-value">${new Date(data.testDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration:</span>
              <span class="info-value">${data.totalTimeMin} minutes</span>
            </div>
          </div>
        </div>
        
        <div class="overall-result">
          <div class="overall-band">${data.overallBand}</div>
          <div class="overall-score">${data.overallScore}/100</div>
          <div class="overall-label">Overall CEFR Level & Score</div>
        </div>
        
        <div class="skills-section">
          <h2 class="section-title">Individual Skills Assessment</h2>
          <div class="skills-grid">
            ${data.skillResults.map(skill => `
              <div class="skill-card">
                <div class="skill-name">${skill.skill}</div>
                <div class="skill-band" style="background-color: ${getBandColor(skill.band)}">
                  ${skill.band}
                </div>
                <div class="skill-score">Score: ${Math.round(skill.score * 100)}/100</div>
                <div class="skill-confidence">Confidence: ${Math.round(skill.confidence * 100)}%</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chart-section">
          <div class="skills-chart">
            <div class="chart-title">Skills Performance Comparison</div>
            <div class="bar-chart">
              ${data.skillResults.map(skill => {
                const height = (skill.score * 160); // Max height 160px
                return `
                  <div class="bar">
                    <div class="bar-fill" style="height: ${height}px; background-color: ${getBandColor(skill.band)};"></div>
                    <div class="bar-label">${skill.skill}</div>
                    <div class="bar-value">${Math.round(skill.score * 100)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        
        <div class="analytics-section">
          <h2 class="section-title">Performance Analytics</h2>
          <div class="analytics-grid">
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.totalAttempts}</div>
              <div class="analytics-label">Total Attempts</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.averageScore}</div>
              <div class="analytics-label">Average Score</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.highestScore}</div>
              <div class="analytics-label">Highest Score</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.improvementRate}%</div>
              <div class="analytics-label">Improvement Rate</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.consistencyScore}%</div>
              <div class="analytics-label">Consistency Score</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-value">${data.analytics.strongestSkill || 'N/A'}</div>
              <div class="analytics-label">Strongest Skill</div>
            </div>
          </div>
        </div>
        
        ${data.recommendations && data.recommendations.length > 0 ? `
          <div class="recommendations">
            <h3>Learning Recommendations</h3>
            <ul>
              ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>This report was generated automatically by Meta Lingua Academy's MST System.</p>
          <p>For questions about your results, please contact your instructor or academic advisor.</p>
          <p class="report-id">Report ID: ${data.reportId}</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with optimal settings for test results
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; color: #6b7280; text-align: center; width: 100%;">
          MST Results Report - ${data.studentName}
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; color: #6b7280; text-align: center; width: 100%;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> - Meta Lingua Academy
        </div>
      `
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export async function generateCertificatePDF(data: {
  studentName: string;
  courseName: string;
  completionDate: string;
  grade?: string;
  certificateId: string;
  instructorName?: string;
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Certificate - ${data.studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Open+Sans:wght@400;600&display=swap');
          
          body {
            margin: 0;
            padding: 40px;
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .certificate {
            background: white;
            padding: 60px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            text-align: center;
            position: relative;
            border: 3px solid #667eea;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #667eea;
            border-radius: 10px;
            opacity: 0.5;
          }
          
          .header {
            margin-bottom: 40px;
          }
          
          .logo {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            color: #667eea;
            margin-bottom: 10px;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            color: #333;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
          }
          
          .recipient {
            font-size: 32px;
            color: #667eea;
            font-weight: 700;
            margin: 20px 0;
            font-family: 'Playfair Display', serif;
          }
          
          .details {
            font-size: 18px;
            color: #555;
            line-height: 1.8;
            margin: 30px 0;
          }
          
          .course-name {
            font-size: 24px;
            color: #333;
            font-weight: 600;
            margin: 20px 0;
          }
          
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding-top: 40px;
            border-top: 1px solid #e0e0e0;
          }
          
          .signature {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 2px solid #333;
            margin-bottom: 10px;
          }
          
          .signature-name {
            font-size: 14px;
            color: #666;
          }
          
          .certificate-id {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 12px;
            color: #999;
          }
          
          .grade-badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            margin-top: 20px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="logo">Meta Lingua Academy</div>
          </div>
          
          <div class="title">Certificate of Completion</div>
          
          <div class="subtitle">This is to certify that</div>
          
          <div class="recipient">${data.studentName}</div>
          
          <div class="details">
            has successfully completed the course
          </div>
          
          <div class="course-name">${data.courseName}</div>
          
          ${data.grade ? `<div class="grade-badge">Grade: ${data.grade}</div>` : ''}
          
          <div class="details">
            on ${new Date(data.completionDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          
          <div class="signatures">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-name">${data.instructorName || 'Instructor'}</div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-name">Director</div>
            </div>
          </div>
          
          <div class="certificate-id">Certificate ID: ${data.certificateId}</div>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}