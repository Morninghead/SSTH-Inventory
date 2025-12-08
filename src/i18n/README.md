# SSTH Inventory - Internationalization (i18n) System

A comprehensive, scalable internationalization system for the SSTH Inventory Management application.

## 🌍 Supported Languages

- **English (en)** - Default language
- **Thai (th)** - Complete Thai translation

## 📁 Structure

```
src/i18n/
├── I18nProvider.tsx     # Main React provider and hook
├── config.ts           # Configuration and types
├── index.ts            # Main exports
├── README.md           # This file
├── locales/            # Translation files
│   ├── en.json         # English translations
│   └── th.json         # Thai translations
└── utils/
    ├── translator.ts   # Translation engine
    ├── loader.ts       # Dynamic translation loading
    └── helpers.ts      # Locale-specific formatting utilities
```

## 🚀 Quick Start

### Using the Translation Hook

```typescript
import { useI18n } from '../i18n'

function MyComponent() {
  const { t, language, setLanguage } = useI18n()

  // Simple translation
  const title = t('inventory.title')

  // Translation with parameters
  const message = t('inventory.messages.itemDeleted', { count: 5 })

  // Change language
  const handleLanguageChange = async () => {
    await setLanguage('th')
  }

  return (
    <div>
      <h1>{title}</h1>
      <p>{message}</p>
      <button onClick={handleLanguageChange}>
        Switch to Thai
      </button>
    </div>
  )
}
```

### Language Switcher Component

```typescript
import LanguageSwitcher from '../components/i18n/LanguageSwitcher'

// Full version with language names
<LanguageSwitcher variant="full" />

// Compact version with just flags
<LanguageSwitcher variant="compact" />
```

### Formatting Utilities

```typescript
import { formatCurrency, formatDate } from '../i18n/utils/helpers'

function PriceDisplay({ amount, language }) {
  return (
    <span>
      {formatCurrency(amount, language)}
    </span>
  )
}
```

## 🔧 Configuration

### Adding New Languages

1. Add the language to `src/i18n/config.ts`:
```typescript
export const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'th', 'fr'], // Add 'fr' here
  fallbackLanguage: 'en'
}
```

2. Add language metadata:
```typescript
export const languageMetadata = {
  // ... existing languages
  fr: {
    name: 'Français',
    code: 'fr',
    flag: '🇫🇷',
    dir: 'ltr' as const
  }
}
```

3. Create translation file: `src/i18n/locales/fr.json`

4. Update TypeScript types in `config.ts` if needed

### Translation File Structure

Translation files use a nested structure for organization:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "inventory": "Inventory"
  },
  "inventory": {
    "title": "Inventory Management",
    "addItem": "Add Item",
    "messages": {
      "itemCreated": "Item created successfully!",
      "itemDeleted": "Item deleted: {{name}}"
    }
  }
}
```

## 🔍 Advanced Features

### Dynamic Parameter Interpolation

```typescript
// Translation key: "inventory.messages.welcome"
// English: "Welcome, {{name}}! You have {{count}} items."
// Thai: "ยินดีต้อนรับ, {{name}}! คุณมี {{count}} รายการ"

const message = t('inventory.messages.welcome', {
  name: 'John',
  count: 5
})
```

### Fallback System

- If a translation key is missing, it falls back to the key itself
- Missing languages fall back to the configured fallback language
- No runtime errors for missing translations

### Lazy Loading

Translations are loaded on-demand to improve initial bundle size:

```typescript
// Translations are loaded automatically when setLanguage is called
await setLanguage('th') // Loads th.json if not already cached
```

### Browser Language Detection

The system automatically detects the user's preferred language from:
1. Previously stored preference (localStorage)
2. Browser `navigator.languages`
3. Falls back to default language

## 🧪 Testing

### Mock Translation for Tests

```typescript
import { renderHook } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nProvider'

const wrapper = ({ children }) => (
  <I18nProvider initialLanguage="en">
    {children}
  </I18nProvider>
)

const { result } = renderHook(() => useI18n(), { wrapper })
expect(result.current.t('common.save')).toBe('Save')
```

## 📈 Performance Features

- **Lazy Loading**: Translation files loaded on-demand
- **Caching**: Translations cached after first load
- **Tree Shaking**: Only used translation utilities bundled
- **Minimal Bundle Impact**: Core i18n system is lightweight

## 🔧 Maintenance

### Translation Key Best Practices

- Use **nested keys** for organization: `'inventory.title'` vs `'inventoryTitle'`
- Use **camelCase** for keys
- Group related translations together
- Include **context** in key names: `'button.save'` vs `'save'`

### Adding New Translations

1. Add keys to all language files simultaneously
2. Test with all supported languages
3. Use interpolation for dynamic content
4. Consider context and cultural differences

### Tools and Extensions

Recommended VS Code extensions for translation management:
- **i18n Ally** - Inline translation previews
- **JSON Tree** - Better JSON file navigation
- **Thunder Client** - API testing with locales

## 🐛 Troubleshooting

### Common Issues

1. **Translation not appearing**: Check key structure and spelling
2. **Language not switching**: Verify language code is valid
3. **Build errors**: Ensure all language files are valid JSON
4. **TypeScript errors**: Check imported types from i18n/config

### Debug Mode

Enable debug logging in development:

```typescript
// In browser console
localStorage.setItem('ssth-inventory-debug', 'true')
```

This will log:
- Translation key lookups
- Language loading events
- Fallback usage