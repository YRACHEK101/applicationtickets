import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/api';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' }
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user, setUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const changeLanguage = async (languageCode: string) => {
    setIsUpdating(true);
    
    try {
      // Change language in i18next
      await i18n.changeLanguage(languageCode);
      
      // If user is logged in, save preference to user account
      if (user) {
        const response = await api.put('/auth/preferences', {
          preferredLanguage: languageCode
        });
        
        // Update user in context with new language preference
        setUser({
          ...user,
          preferredLanguage: languageCode
        });
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Get current language name
  const currentLanguage = languages.find(lang => lang.code === i18n.language)?.name || 'English';
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-1" disabled={isUpdating}>
          <Globe className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">{currentLanguage}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={i18n.language} onValueChange={changeLanguage}>
          {languages.map(lang => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.name}
              {i18n.language === lang.code && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}