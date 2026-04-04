import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function runLandingPagesMigration() {
  console.log('[Migration] Running landing pages schema migration...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_landing_pages (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      program_name VARCHAR(255) NOT NULL,
      hero_title TEXT NOT NULL,
      hero_subtitle TEXT,
      hero_cta_primary VARCHAR(255),
      hero_cta_secondary VARCHAR(255),
      target_audience_bullets JSONB DEFAULT '[]',
      exam_tips_html TEXT,
      testimonials JSONB DEFAULT '[]',
      faq_items JSONB DEFAULT '[]',
      seo_title VARCHAR(255),
      seo_description TEXT,
      seo_keywords TEXT[] DEFAULT '{}',
      feature_bullets JSONB DEFAULT '[]',
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  console.log('[Migration] site_landing_pages table created');

  // Seed default content for all 5 programs
  await db.execute(sql`
    INSERT INTO site_landing_pages (
      slug, program_name, hero_title, hero_subtitle, hero_cta_primary, hero_cta_secondary,
      target_audience_bullets, exam_tips_html, testimonials, faq_items,
      seo_title, seo_description, seo_keywords, feature_bullets, is_published
    ) VALUES
    (
      'ielts',
      'IELTS',
      'آیلتس رو با MetaLingo فتح کن',
      'از سطح‌سنجی رایگان تا Band ۷ — با استادهای مجرب و مسیر آموزشی هوشمند',
      'ثبت‌نام در دوره IELTS',
      'Placement رایگان',
      '["کسانی که می‌خوان Band 7 یا بالاتر بگیرن", "دانشجویانی که برای مهاجرت یا تحصیل در خارج آماده می‌شن", "کسانی که قبلاً آیلتس دادن و می‌خوان نمره‌شون رو بالا ببرن", "متقاضیان ویزای کاری یا اقامت دائم"]',
      '<ul><li><strong>Speaking:</strong> هر روز ۱۵ دقیقه با استاد CallerN تمرین کن — بهترین راه برای روانی</li><li><strong>Writing:</strong> هر هفته حداقل ۲ تسک بنویس و فیدبک بگیر</li><li><strong>Reading:</strong> سرعت خوندنت رو بالا ببر — ۳ پاراگراف در ۲۰ دقیقه هدفته</li><li><strong>Listening:</strong> با پادکست‌های انگلیسی گوشت رو تنظیم کن</li></ul>',
      '[{"quote":"MetaLingo کمک کرد توی ۸ هفته از Band 6 به 7.5 برسم. استادهاشون فوق‌العاده‌ان.", "studentName":"سارا م.", "score":"Band 7.5", "examType":"IELTS Academic"}, {"quote":"CallerN رو خیلی دوست داشتم — هر شب با یه استاد Speaking تمرین می‌کردم. نتیجه؟ Speaking 8!", "studentName":"علی ر.", "score":"Speaking Band 8", "examType":"IELTS"}, {"quote":"Placement ابتدا سطح واقعیم رو نشون داد و مسیرم رو مشخص کرد. خیلی مهم بود.", "studentName":"نیلوفر ش.", "score":"Band 7.0", "examType":"IELTS General"}]',
      '[{"q":"آیلتس Academic با General چه فرقی داره؟","a":"Academic برای تحصیل در دانشگاه‌های خارج از کشور و General برای مهاجرت کاری یا اقامت استفاده می‌شه. سطح دشواری Reading و Writing در Academic بیشتره."}, {"q":"چند ماه باید برای Band 7 آماده بشم؟","a":"بسته به سطح فعلیت، معمولاً ۳ تا ۶ ماه با تمرین منظم کافیه. با آزمون Placement سطحت رو بسنج."}, {"q":"آیا کلاس‌ها آنلاین هستن؟","a":"بله، همه کلاس‌های گروهی و خصوصی MetaLingo آنلاین هستن و می‌تونی از هر جای ایران شرکت کنی."}, {"q":"آیا تضمین نمره وجود داره؟","a":"ما تضمین رشد نمره‌ات رو می‌دیم اگه تمام جلسات رو شرکت کنی و تکالیف رو کامل کنی."}, {"q":"Speaking رو چطور تمرین کنم؟","a":"با CallerN می‌تونی هر ساعت از شبانه‌روز با یه استاد متخصص IELTS تماس بگیری — بدون رزرو."}]',
      'بهترین کلاس آیلتس آنلاین | MetaLingo',
      'آموزش آیلتس آنلاین با استادهای مجرب. کلاس گروهی و خصوصی IELTS با Placement رایگان. Band ۷ در ۸ هفته.',
      ARRAY['آموزش آیلتس آنلاین', 'کلاس آیلتس خصوصی', 'نمره آیلتس 7', 'آموزش آیلتس در ایران', 'IELTS آنلاین', 'کلاس آیلتس آنلاین'],
      '["کلاس گروهی آنلاین با استادهای متخصص IELTS", "جلسات Speaking خصوصی با CallerN", "آزمون‌های تمرینی با نمره‌دهی دقیق", "فیدبک روی Writing و Speaking توسط استاد", "دسترسی به محتوای آموزشی ۲۴ ساعته"]',
      TRUE
    ),
    (
      'toefl',
      'TOEFL',
      'TOEFL iBT رو با اطمینان بده',
      'با دوره‌های تخصصی MetaLingo، نمره TOEFL مورد نیازت رو بگیر',
      'ثبت‌نام در دوره TOEFL',
      'Placement رایگان',
      '["کسانی که برای دانشگاه‌های آمریکا، کانادا یا اروپا اپلای می‌کنن", "دانشجویان کارشناسی و ارشد که به TOEFL 100+ نیاز دارن", "کسانی که اولین بار TOEFL می‌دن و نمی‌دونن از کجا شروع کنن", "کارشناسانی که برای ویزای کاری به TOEFL نیاز دارن"]',
      '<ul><li><strong>Integrated Writing:</strong> خوندن و گوش دادن هم‌زمان رو تمرین کن — کلیدی‌ترین بخش TOEFL</li><li><strong>Speaking:</strong> ۶ تسک Speaking رو با استاد CallerN تمرین کن</li><li><strong>Reading:</strong> روی Academic vocabulary تمرکز کن — ۲۰۰ کلمه کلیدی مهمه</li><li><strong>Listening:</strong> به لکچرهای دانشگاهی گوش بده — هر روز ۳۰ دقیقه</li></ul>',
      '[{"quote":"از TOEFL 87 به 105 رسیدم با MetaLingo. Integrated Writing بخش ضعیفم بود که باهاش درست شد.", "studentName":"محمد ک.", "score":"TOEFL 105", "examType":"TOEFL iBT"}, {"quote":"استادم روی Speaking خیلی کار کرد. نمره Speaking من از 19 به 26 رفت!", "studentName":"آرزو ت.", "score":"Speaking 26/30", "examType":"TOEFL iBT"}, {"quote":"Placement نشون داد که Reading و Listening قوی‌ام ولی Writing ضعیفه. سه ماه روی Writing کار کردم.", "studentName":"رضا م.", "score":"TOEFL 100", "examType":"TOEFL iBT"}]',
      '[{"q":"TOEFL iBT با TOEFL Essentials چه فرقی داره؟","a":"TOEFL iBT برای اکثر دانشگاه‌های آمریکا و کانادا پذیرفته می‌شه و معتبرتره. TOEFL Essentials جدیدتره و برخی موسسات می‌پذیرن."}, {"q":"چه نمره‌ای برای دانشگاه‌های آمریکا نیازه؟","a":"اکثر دانشگاه‌های معتبر 90-100 رو می‌خوان. MIT و Harvard معمولاً 100+ رو ترجیح می‌دن."}, {"q":"Integrated Writing چیه و چطور تمرین کنم؟","a":"در Integrated Writing باید بعد از خوندن یه متن و گوش دادن به یه لکچر، یه مقاله بنویسی. با استادهای CallerN این مهارت رو تمرین کن."}, {"q":"آیا TOEFL آنلاین هم می‌شه داد؟","a":"بله، TOEFL Home Edition وجود داره که می‌تونی از خونه بدی. MetaLingo برای هر دو فرمت آماده‌ات می‌کنه."}, {"q":"چقدر طول می‌کشه تا به TOEFL 100 برسم؟","a":"با سطح B2، معمولاً ۳-۴ ماه تمرین منظم کافیه. با Placement سطح دقیقت رو بسنج."}]',
      'کلاس TOEFL آنلاین | MetaLingo',
      'آموزش تافل آنلاین با استادهای متخصص. کلاس تافل iBT خصوصی و گروهی. نمره TOEFL 100+ با برنامه آموزشی هوشمند.',
      ARRAY['آموزش تافل آنلاین', 'کلاس تافل خصوصی', 'تافل ibt فارسی', 'TOEFL آنلاین', 'کلاس TOEFL گروهی', 'آموزش TOEFL در ایران'],
      '["برنامه درسی متناسب با دانشگاه هدفت", "تمرین Integrated Writing با استاد", "شبیه‌سازی آزمون واقعی TOEFL", "Speaking تمرین با CallerN بدون رزرو", "گزارش پیشرفت هفتگی"]',
      TRUE
    ),
    (
      'gre',
      'GRE',
      'GRE رو قبول کن، دانشگاه آمریکایی بگیر',
      'از Verbal تا Quant — با MetaLingo مسیر درست برو',
      'ثبت‌نام در دوره GRE',
      'Placement رایگان',
      '["کسانی که برای برنامه‌های Graduate آمریکا اپلای می‌کنن", "دانشجویانی که به GRE 320+ نیاز دارن", "کسانی که Verbal Reasoning ضعیف دارن", "کارشناسانی که برای MBA یا PhD آماده می‌شن"]',
      '<ul><li><strong>Verbal Reasoning:</strong> روزی ۲۰ کلمه جدید GRE یاد بگیر — لیست ۳۳۳۳ کلمه داریم</li><li><strong>Analytical Writing:</strong> Issue و Argument Essay رو با فرمول بنویس</li><li><strong>Quantitative:</strong> اگه ریاضی قویه، Quant رو ماکزیمم کن</li><li><strong>تمرین با استاد:</strong> Verbal رو با استاد GRE CallerN کار کن</li></ul>',
      '[{"quote":"GRE Verbal بخش ضعیفم بود. با MetaLingo از 148 به 161 رسیدم در ۴ ماه.", "studentName":"پارسا ن.", "score":"Verbal 161", "examType":"GRE"}, {"quote":"دوره Analytical Writing استادم فرمول نوشتن Issue Essay رو بهم داد. خیلی کمک کرد.", "studentName":"شیرین ف.", "score":"AWA 4.5", "examType":"GRE"}, {"quote":"نمره کلم GRE 322 شد. Stanford قبولم کرد. ممنون MetaLingo!", "studentName":"کامران ه.", "score":"GRE 322", "examType":"GRE"}]',
      '[{"q":"GRE General با GRE Subject چه فرقی داره؟","a":"GRE General برای اکثر رشته‌ها پذیرفته می‌شه و شامل Verbal، Quant و AWA هست. GRE Subject برای رشته‌های خاص مثل Math، Physics یا Psychology ه."}, {"q":"چه نمره GRE برای دانشگاه‌های Top 50 لازمه؟","a":"معمولاً 315-320 برای دانشگاه‌های معتبر. Verbal 160+ و Quant 165+ هدف خوبیه."}, {"q":"Verbal Reasoning چطور بهبود پیدا می‌کنه؟","a":"با مطالعه متون آکادمیک، یادگیری واژگان GRE، و تمرین مداوم با استادهای CallerN می‌تونی Verbal رو بالا ببری."}, {"q":"AWA چقدر اهمیت داره؟","a":"اکثر برنامه‌ها AWA 4.0 رو می‌خوان. برخی PhD programs به 4.5 نیاز دارن."}, {"q":"چقدر باید برای GRE وقت بذارم؟","a":"۳-۶ ماه با روزی ۲ ساعت مطالعه کافیه. با Placement سطحت رو تعیین کن."}]',
      'آموزش GRE آنلاین | MetaLingo',
      'کلاس GRE آنلاین خصوصی و گروهی. Verbal، Quant و AWA با استادهای متخصص. نمره GRE 320+ هدف ماست.',
      ARRAY['آموزش GRE آنلاین', 'کلاس جی آر ای', 'verbal GRE فارسی', 'GRE آنلاین', 'کلاس GRE خصوصی', 'آموزش GRE در ایران'],
      '["تمرین Verbal Reasoning با استاد GRE", "فرمول نوشتن AWA Essay", "بانک ۳۳۳۳ واژه GRE", "آزمون‌های تمرینی Quant", "شبیه‌سازی آزمون کامل GRE"]',
      TRUE
    ),
    (
      'pte',
      'PTE',
      'PTE Academic — سریع‌ترین راه به اتریش و نیوزیلند',
      'آزمون کامپیوتری PTE با نتایج سریع‌تر — MetaLingo برای PTE آماده‌ات می‌کنه',
      'ثبت‌نام در دوره PTE',
      'Placement رایگان',
      '["کسانی که برای مهاجرت به استرالیا، نیوزیلند یا کانادا آماده می‌شن", "کسانی که می‌خوان نتیجه سریع‌تر از IELTS بگیرن", "متقاضیان ویزای Student یا PR", "کسانی که با فناوری راحت‌ترن — PTE کاملاً کامپیوتریه"]',
      '<ul><li><strong>Speaking & Writing:</strong> Summarize Spoken Text و Describe Image رو تمرین کن</li><li><strong>Reading:</strong> Fill in the Blanks بخش کلیدی PTE Reading ه</li><li><strong>Listening:</strong> Highlight Incorrect Words سخت‌ترین بخشه — تمرین کن</li><li><strong>Enabling Skills:</strong> Oral Fluency و Pronunciation در PTE امتیاز جداگانه دارن</li></ul>',
      '[{"quote":"PTE 79 گرفتم و ویزای استرالیام تایید شد! با MetaLingo ۶ هفته آموزش دیدم.", "studentName":"فاطمه ع.", "score":"PTE 79", "examType":"PTE Academic"}, {"quote":"Speaking PTE از 65 به 82 رفت. Describe Image رو یاد گرفتم چطور استراکچر بدم.", "studentName":"امیر ز.", "score":"Speaking 82", "examType":"PTE Academic"}, {"quote":"نتیجه PTE در ۵ روز اومد! خیلی سریع‌تر از آیلتس. ممنون MetaLingo.", "studentName":"ملیکا ر.", "score":"PTE 76", "examType":"PTE Academic"}]',
      '[{"q":"PTE Academic با PTE Core چه فرقی داره؟","a":"PTE Academic برای تحصیل و مهاجرت به استرالیا/نیوزیلند/کانادا ه. PTE Core جدیدتره و برای Express Entry کانادا ساخته شده."}, {"q":"نتیجه PTE چقدر دیر می‌شه؟","a":"معمولاً ۲-۵ روز کاری. این یکی از مزایای اصلی PTE نسبت به IELTS ه."}, {"q":"چه نمره PTE برای ویزای استرالیا لازمه؟","a":"برای اکثر ویزاهای مهاجرتی، PTE 65 کافیه. برای دانشگاه‌های معتبر 58-79 نیازه."}, {"q":"Speaking PTE با IELTS چه فرقی داره؟","a":"در PTE با کامپیوتر حرف می‌زنی، نه با ممتحن. Oral Fluency و Pronunciation جداگانه امتیاز داری."}, {"q":"چقدر طول می‌کشه تا به PTE 65 برسم؟","a":"با سطح B2، معمولاً ۴-۸ هفته تمرین هدفمند کافیه."}]',
      'کلاس PTE Academic آنلاین | MetaLingo',
      'آموزش PTE آنلاین با استادهای متخصص. کلاس PTE Academic خصوصی و گروهی. نمره PTE 65+ برای ویزای استرالیا.',
      ARRAY['آموزش PTE آنلاین', 'کلاس PTE خصوصی', 'PTE Academic ایران', 'PTE آنلاین', 'کلاس PTE گروهی', 'آزمون PTE'],
      '["شبیه‌سازی کامل آزمون PTE Academic", "تمرین Describe Image با فرمول", "نکات Oral Fluency و Pronunciation", "آموزش Fill in the Blanks", "نتایج سریع — نمره در ۵ روز"]',
      TRUE
    ),
    (
      'conversation',
      'Conversation',
      'مکالمه انگلیسی روان — از همین امشب',
      'با CallerN هر روز با یه استاد واقعی تمرین کن. بدون ترس، بدون خجالت.',
      'ثبت‌نام در دوره مکالمه',
      'Placement رایگان',
      '["کسانی که می‌خوان انگلیسی روزمره‌شون رو بهبود بدن", "کسانی که در جلسات کاری انگلیسی نیاز دارن", "دانشجویانی که برای مصاحبه دانشگاه آماده می‌شن", "مسافرانی که می‌خوان راحت انگلیسی صحبت کنن", "کسانی که گرامر می‌دونن ولی در صحبت کردن مشکل دارن"]',
      '<ul><li><strong>روزانه صحبت کن:</strong> هر روز ۱۵ دقیقه با استاد CallerN — بهترین راه برای روانی</li><li><strong>از اشتباه نترس:</strong> هر اشتباه یه فرصت یادگیریه — استادهای ما صبور و حمایت‌گرن</li><li><strong>موضوعات روزمره:</strong> روی موضوعاتی که برات مهمه صحبت کن</li><li><strong>لهجه:</strong> لهجه کامل مهم نیست — وضوح و روانی مهمه</li></ul>',
      '[{"quote":"بعد از ۳ ماه کلاس مکالمه MetaLingo، تونستم توی جلسه کاریم انگلیسی حرف بزنم. خیلی فرق کرده!", "studentName":"رها م.", "score":"B2 Level", "examType":"Conversation"}, {"quote":"CallerN رو خیلی دوست دارم — هر شب قبل خواب ۱۵ دقیقه تمرین می‌کنم. انگلیسیم خیلی بهتر شده.", "studentName":"بهنام ف.", "score":"Intermediate+", "examType":"Conversation"}, {"quote":"قبلاً خجالت می‌کشیدم انگلیسی حرف بزنم. حالا راحتم. ممنون از استادهای MetaLingo!", "studentName":"زهره ک.", "score":"B1→B2", "examType":"Conversation"}]',
      '[{"q":"دوره مکالمه برای چه سطحی مناسبه؟","a":"برای همه سطح‌ها داریم — از مبتدی تا پیشرفته. با Placement سطح دقیقت رو بسنج."}, {"q":"آیا لازمه گرامر کامل بلد باشم؟","a":"نه! در کلاس مکالمه تمرکز روی صحبت کردن و روانیه. گرامر در حین صحبت بهتر می‌شه."}, {"q":"هر هفته چند جلسه داریم؟","a":"کلاس‌های گروهی معمولاً ۳ بار در هفته هستن. برای خصوصی می‌تونی برنامه خودت رو انتخاب کنی."}, {"q":"CallerN چطور کار می‌کنه؟","a":"CallerN یه سرویس تدریس زنده ۲۴/۷ ه. هر وقت خواستی با یه استاد واقعی تماس می‌گیری — بدون رزرو قبلی."}, {"q":"چقدر طول می‌کشه روانی پیدا کنم؟","a":"با تمرین روزانه، اکثر دانشجوها در ۲-۳ ماه تفاوت بزرگی احساس می‌کنن."}]',
      'کلاس مکالمه انگلیسی آنلاین | MetaLingo',
      'آموزش مکالمه انگلیسی آنلاین با استادهای متخصص. انگلیسی روزمره، مکالمه کاری، و تمرین روزانه با CallerN.',
      ARRAY['آموزش مکالمه انگلیسی', 'انگلیسی روزمره آنلاین', 'کلاس مکالمه خصوصی', 'مکالمه انگلیسی آنلاین', 'کلاس زبان انگلیسی', 'تمرین مکالمه انگلیسی'],
      '["کلاس مکالمه گروهی آنلاین ۳ بار در هفته", "جلسات ۱۵ دقیقه‌ای با CallerN هر شب", "موضوعات روزمره، کاری و آکادمیک", "فیدبک روی تلفظ و روانی", "گزارش پیشرفت ماهانه"]',
      TRUE
    )
    ON CONFLICT (slug) DO NOTHING
  `);

  console.log('[Migration] site_landing_pages seeded with 5 programs');
}
