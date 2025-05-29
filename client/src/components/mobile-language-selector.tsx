import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";

export function MobileLanguageSelector() {
  const { language, setLanguage, getTextDirection } = useLanguage();

  const languages = [
    { code: 'en' as const, name: 'English', flag: '🇺🇸' },
    { code: 'fa' as const, name: 'فارسی', flag: '🇮🇷' },
    { code: 'ar' as const, name: 'العربية', flag: '🇸🇦' },
  ];

  const currentLang = languages.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-2 ${getTextDirection(lang.code) === 'rtl' ? 'flex-row-reverse' : ''} ${
              language === lang.code ? 'bg-muted' : ''
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className={`font-medium ${getTextDirection(lang.code) === 'rtl' ? 'font-arabic' : ''}`}>
              {lang.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}