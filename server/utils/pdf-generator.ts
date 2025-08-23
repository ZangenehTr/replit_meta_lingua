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