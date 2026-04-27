'use client';

import * as React from 'react';
import { Languages, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/language-context';

export function LanguageToggle() {
    const { setLanguage, language, t } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent hover:text-orange-500 transition-colors">
                    <Languages className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('language')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={language === 'ku' ? 'start' : 'end'} className="min-w-[150px] !bg-[hsl(0deg_0%_0%_/_60%)] border-border/40 supports-[backdrop-filter]:bg-[hsl(0deg_0%_0%_/_60%)] backdrop-blur-md text-white">
                <DropdownMenuItem
                    onClick={() => setLanguage('en')}
                    className="flex items-center justify-between cursor-pointer focus:bg-white/10 focus:text-white"
                >
                    <span>English</span>
                    {language === 'en' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage('ku')}
                    className="flex items-center justify-between cursor-pointer font-sans focus:bg-white/10 focus:text-white"
                >
                    <span>کوردی</span>
                    {language === 'ku' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
