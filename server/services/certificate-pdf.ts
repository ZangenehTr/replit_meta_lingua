import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

/**
 * Validates a logo URL to prevent SSRF.
 * Only allows http/https with non-private hosts.
 */
function isSafeLogoUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    const host = u.hostname.toLowerCase();
    // Block private/loopback ranges
    if (
      host === "localhost" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^::1$/.test(host) ||
      /^0\.0\.0\.0$/.test(host) ||
      /^169\.254\./.test(host)
    ) {
      return undefined;
    }
    return raw;
  } catch {
    return undefined;
  }
}

const CERT_DIR = path.join(process.cwd(), "uploads", "certificates");

// Ensure the certificates directory exists
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

export interface CertificateData {
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  courseLevel?: string | null;
  courseLanguage?: string | null;
  issuedAt: Date;
  instituteName?: string;
  instituteNameFa?: string;
  logo?: string;
  certTitle?: string;
  signatureTitle?: string;
  footerNote?: string;
}

function buildCertificateHtml(data: CertificateData): string {
  const issuedDateFa = data.issuedAt.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const instituteName = data.instituteNameFa || data.instituteName || "Meta Lingua Academy";
  const instituteNameEn = data.instituteName || "Meta Lingua Academy";
  const certTitle = data.certTitle || "گواهینامه پایان دوره";
  const signatureTitle = data.signatureTitle || "مدیر آموزش";
  const footerNote = data.footerNote || "این گواهینامه معتبر بوده و قابل تأیید الکترونیکی است.";
  const safeLogoUrl = isSafeLogoUrl(data.logo);

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>گواهینامه — ${data.certificateNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background: #f0f4f8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .certificate-wrapper {
      width: 900px;
      background: white;
      position: relative;
    }

    .certificate {
      padding: 60px 80px;
      border: 1px solid #e2e8f0;
      position: relative;
      text-align: center;
      background: linear-gradient(135deg, #fafafe 0%, #fff 50%, #fafafe 100%);
    }

    /* Decorative border */
    .certificate::before {
      content: "";
      position: absolute;
      top: 12px; left: 12px; right: 12px; bottom: 12px;
      border: 2px solid #3b82f6;
      border-radius: 4px;
      pointer-events: none;
    }

    .certificate::after {
      content: "";
      position: absolute;
      top: 16px; left: 16px; right: 16px; bottom: 16px;
      border: 1px solid #93c5fd;
      border-radius: 2px;
      pointer-events: none;
    }

    /* Top gradient bar */
    .top-bar {
      height: 6px;
      background: linear-gradient(90deg, #1d4ed8, #7c3aed, #f59e0b);
      margin: -60px -80px 40px -80px;
      border-radius: 0;
    }

    .seal {
      font-size: 60px;
      margin-bottom: 16px;
      line-height: 1;
    }

    .institute-name {
      font-size: 28px;
      font-weight: 900;
      color: #1d4ed8;
      margin-bottom: 4px;
      letter-spacing: 1px;
    }

    .institute-name-en {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 30px;
      font-family: 'Vazirmatn', sans-serif;
    }

    .divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #7c3aed);
      margin: 0 auto 24px;
    }

    .heading {
      font-size: 18px;
      color: #475569;
      margin-bottom: 8px;
      font-weight: 400;
    }

    .student-name {
      font-size: 30px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      padding: 12px 24px;
    }

    .completion-text {
      font-size: 16px;
      color: #475569;
      margin-bottom: 12px;
    }

    .course-title {
      font-size: 26px;
      font-weight: 700;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 16px 32px;
      margin: 16px auto;
      max-width: 500px;
      display: inline-block;
    }

    .details-row {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin: 24px 0;
      font-size: 14px;
      color: #64748b;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .detail-label {
      font-weight: 700;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .detail-value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 500;
    }

    .bottom-section {
      margin-top: 30px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cert-number {
      font-family: 'Vazirmatn', monospace;
      font-size: 11px;
      color: #94a3b8;
      direction: ltr;
      text-align: left;
    }

    .cert-number-label {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 2px;
    }

    .verify-url {
      font-size: 10px;
      color: #94a3b8;
      text-align: right;
    }

    .stamp {
      font-size: 12px;
      color: #94a3b8;
      font-style: italic;
    }
  </style>
</head>
<body>
<div class="certificate-wrapper">
  <div class="certificate">
    <div class="top-bar"></div>

    ${safeLogoUrl ? `<img src="${safeLogoUrl}" alt="logo" style="max-height:64px;max-width:180px;object-fit:contain;margin-bottom:8px;" />` : '<div class="seal">🏅</div>'}

    <div class="institute-name">${instituteName}</div>
    <div class="institute-name-en">${instituteNameEn}</div>

    <div class="divider"></div>

    <div style="font-size:22px;font-weight:700;color:#374151;margin-bottom:16px;">${certTitle}</div>

    <div class="heading">این گواهینامه به</div>
    <div class="student-name">${data.studentName}</div>
    <div class="completion-text">اعطا می‌گردد که دوره زیر را با موفقیت به پایان رسانده است:</div>

    <div class="course-title">${data.courseTitle}</div>

    <div class="details-row">
      <div class="detail-item">
        <span class="detail-label">تاریخ صدور</span>
        <span class="detail-value">${issuedDateFa}</span>
      </div>
      ${data.courseLevel ? `<div class="detail-item">
        <span class="detail-label">سطح</span>
        <span class="detail-value">${data.courseLevel}</span>
      </div>` : ""}
      ${data.courseLanguage ? `<div class="detail-item">
        <span class="detail-label">زبان</span>
        <span class="detail-value">${data.courseLanguage}</span>
      </div>` : ""}
    </div>

    <div class="bottom-section">
      <div>
        <div class="cert-number-label">شماره گواهینامه</div>
        <div class="cert-number">${data.certificateNumber}</div>
      </div>
      <div>
        <div class="stamp">${signatureTitle}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${footerNote}</div>
      </div>
      <div class="verify-url">
        <div>قابل تأیید در:</div>
        <div>/verify-certificate/${data.certificateNumber}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export async function generateCertificatePdf(data: CertificateData): Promise<string> {
  const fileName = `${data.certificateNumber}.pdf`;
  const filePath = path.join(CERT_DIR, fileName);

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    const page = await browser.newPage();
    const html = buildCertificateHtml(data);

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    // Give fonts time to load
    await page.waitForTimeout(1500);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return filePath;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

export function getCertificatePdfPath(certificateNumber: string): string | null {
  const filePath = path.join(CERT_DIR, `${certificateNumber}.pdf`);
  return fs.existsSync(filePath) ? filePath : null;
}
