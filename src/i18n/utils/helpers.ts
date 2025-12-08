import type { SupportedLanguage } from '../config'

// Format number with locale-specific formatting
export function formatNumber(number: number, language: SupportedLanguage): string {
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  return new Intl.NumberFormat(locale).format(number)
}

// Format currency with Thai Baht symbol
export function formatCurrency(amount: number, language: SupportedLanguage): string {
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format date with locale-specific formatting
export function formatDate(date: Date, language: SupportedLanguage): string {
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Format short date (for tables, etc.)
export function formatShortDate(date: Date, language: SupportedLanguage): string {
  const locale = language === 'th' ? 'th-TH' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Get text direction for a language
export function getTextDirection(_language: SupportedLanguage): 'ltr' | 'rtl' {
  // Currently all supported languages are LTR, but this function
  // allows for easy addition of RTL languages in the future
  return 'ltr'
}

// Check if a language is RTL
export function isRTL(language: SupportedLanguage): boolean {
  return getTextDirection(language) === 'rtl'
}

// Validate that a string is a supported language code
export function isValidLanguage(code: string): code is SupportedLanguage {
  return code === 'en' || code === 'th'
}

// Get the opposite language (useful for language toggle buttons)
export function getOppositeLanguage(language: SupportedLanguage): SupportedLanguage {
  return language === 'en' ? 'th' : 'en'
}