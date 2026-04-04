import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Phone, Video, Clock, Users, Star, Award } from 'lucide-react';

interface CallerNSpotlightProps {
  headlineText?: string;
  className?: string;
}

export function CallerNSpotlight({
  headlineText = 'هر ساعت از شبانه‌روز با یه استاد واقعی تماس بگیر',
  className = '',
}: CallerNSpotlightProps) {
  const features = [
    { icon: Clock, text: '۱۵ دقیقه‌ای' },
    { icon: Users, text: 'استاد واقعی' },
    { icon: Star, text: 'بدون رزرو' },
    { icon: Award, text: 'AI supervisor' },
  ];

  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 py-14 ${className}`}
      dir="rtl"
    >
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 text-white text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm mb-5">
              <Video className="h-4 w-4" />
              <span className="text-sm font-medium">تدریس زنده ۲۴ ساعته — بدون رزرو</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
              {headlineText}
            </h2>
            <p className="text-white/85 text-base mb-6">
              با CallerN هر ساعت از شبانه‌روز با یه استاد واقعی تماس بگیر. بدون انتظار، بدون رزرو.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-50 font-bold">
                <Link href="/callern" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  با یه استاد تماس بگیر
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/50 text-white hover:bg-white/10">
                <Link href="/auth?tab=register">ثبت‌نام رایگان</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            {features.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white/15 rounded-2xl p-4 text-center text-white">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-cyan-200" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
