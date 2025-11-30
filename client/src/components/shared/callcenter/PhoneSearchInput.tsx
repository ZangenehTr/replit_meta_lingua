import { forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Phone, Search, Loader2 } from "lucide-react";

export interface PhoneSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  minLength?: number;
  label?: string;
  placeholder?: string;
  direction?: "ltr" | "rtl";
  errorMessage?: string;
  disabled?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const PhoneSearchInput = forwardRef<HTMLInputElement, PhoneSearchInputProps>(
  (
    {
      value,
      onChange,
      onSearch,
      isLoading = false,
      minLength = 10,
      label,
      placeholder = "09123456789",
      direction = "ltr",
      errorMessage,
      disabled = false,
      showIcon = true,
      className = "",
    },
    ref
  ) => {
    const { t } = useTranslation(["callcenter", "common"]);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && value.length >= minLength && !isLoading) {
          onSearch();
        }
      },
      [value.length, minLength, isLoading, onSearch]
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.replace(/[^0-9+]/g, "");
        onChange(newValue);
      },
      [onChange]
    );

    const isSearchDisabled = value.length < minLength || isLoading || disabled;

    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex gap-3">
          <div className="flex-1">
            {label && (
              <Label htmlFor="phone-search" className="flex items-center gap-2 mb-1.5">
                {showIcon && <Phone className="h-4 w-4 text-muted-foreground" />}
                {label}
              </Label>
            )}
            <Input
              ref={ref}
              id="phone-search"
              type="tel"
              inputMode="numeric"
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              dir={direction}
              className="text-left font-mono"
              disabled={disabled}
              data-testid="input-phone-search"
              aria-describedby={errorMessage ? "phone-search-error" : undefined}
            />
          </div>
          <Button
            type="button"
            onClick={onSearch}
            disabled={isSearchDisabled}
            className={label ? "mt-7" : ""}
            data-testid="button-search-phone"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                <span className="hidden sm:inline">{t("callcenter:search", "جستجو")}</span>
              </>
            )}
          </Button>
        </div>

        {errorMessage && (
          <p id="phone-search-error" className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        {isLoading && (
          <div className="text-center py-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("callcenter:searching", "در حال جستجو...")}
            </p>
          </div>
        )}
      </div>
    );
  }
);

PhoneSearchInput.displayName = "PhoneSearchInput";

export default PhoneSearchInput;
