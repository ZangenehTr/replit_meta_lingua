import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const countryCodes = [
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
];

export function PhoneInput({ value = "", onChange, placeholder = "Enter phone number", className }: PhoneInputProps) {
  // Parse existing value
  const parseValue = (val: string) => {
    const country = countryCodes.find(c => val.startsWith(c.code));
    if (country) {
      return {
        countryCode: country.code,
        number: val.slice(country.code.length).replace(/\s+/g, '')
      };
    }
    return {
      countryCode: "+98", // Default to Iran
      number: val.replace(/^\+?98/, '').replace(/\s+/g, '')
    };
  };

  const { countryCode: initialCountryCode, number: initialNumber } = parseValue(value);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const fullNumber = newCountryCode + phoneNumber;
    onChange?.(fullNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const newNumber = e.target.value.replace(/[^\d]/g, '');
    setPhoneNumber(newNumber);
    const fullNumber = countryCode + newNumber;
    onChange?.(fullNumber);
  };

  return (
    <div className={`flex ${className || ''}`}>
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[120px] rounded-r-none border-r-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countryCodes.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className="rounded-l-none"
        type="tel"
        inputMode="numeric"
      />
    </div>
  );
}