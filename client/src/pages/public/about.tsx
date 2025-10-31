import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Heart, Award, Sparkles, Target } from 'lucide-react';

export default function About() {
  const { t } = useTranslation(['common']);

  const values = [
    { icon: Globe, title: t('about.values.globalReach', 'Global Reach'), description: t('about.values.globalReachDesc', 'Connecting learners worldwide with quality language education') },
    { icon: Heart, title: t('about.values.studentCentered', 'Student-Centered'), description: t('about.values.studentCenteredDesc', 'Every decision we make prioritizes student success and satisfaction') },
    { icon: Award, title: t('about.values.excellence', 'Excellence'), description: t('about.values.excellenceDesc', 'Committed to delivering the highest quality teaching and resources') },
    { icon: Sparkles, title: t('about.values.innovation', 'Innovation'), description: t('about.values.innovationDesc', 'Leveraging AI and technology to enhance the learning experience') },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title={t('about.seoTitle', 'About Us')}
        description={t('about.seoDescription', 'Meta Lingua is a comprehensive language learning platform designed to make language education accessible, effective, and enjoyable for everyone.')}
        keywords="language learning, online education, AI tutoring, language courses"
      />
      
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4" data-testid="badge-about">{t('about.badge', 'About Us')}</Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-about">{t('about.title', 'Empowering Language Learners Globally')}</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto" data-testid="text-about-subtitle">
            {t('about.subtitle', 'Meta Lingua is a comprehensive language learning platform designed to make language education accessible, effective, and enjoyable for everyone.')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-4" data-testid="heading-mission">{t('about.mission', 'Our Mission')}</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-mission-1">
                {t('about.missionText1', 'We believe that language learning should be accessible to everyone, regardless of location or background. Our mission is to provide world-class language education through innovative technology and proven teaching methods.')}
              </p>
              <p className="text-muted-foreground" data-testid="text-mission-2">
                {t('about.missionText2', 'Since our founding, we\'ve helped thousands of students achieve their language learning goals through personalized instruction, AI-powered tools, and a supportive global community.')}
              </p>
            </div>
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Target className="h-24 w-24 text-primary" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-12" data-testid="heading-values">{t('about.ourValues', 'Our Values')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} data-testid={`card-value-${index}`}>
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-accent/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="heading-why-choose">{t('about.whyChoose', 'Why Choose Meta Lingua?')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center" data-testid="stat-languages">
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <p className="text-muted-foreground">{t('about.languagesSupported', 'Languages Supported')}</p>
            </div>
            <div className="text-center" data-testid="stat-students">
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-muted-foreground">{t('about.activeStudents', 'Active Students')}</p>
            </div>
            <div className="text-center" data-testid="stat-satisfaction">
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">{t('about.studentSatisfaction', 'Student Satisfaction')}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
