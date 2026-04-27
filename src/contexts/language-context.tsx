'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

type Language = 'en' | 'ku';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    en: {
        'dashboard': 'Dashboard',
        'messages': 'Messages',
        'admins': 'Admins',
        'kyc_verification': 'KYC Verification',
        'audit_log': 'Audit Log',
        'payments': 'Payments',
        'cardDesigner': 'Card Designer',
        'logout': 'Logout',
        'search': 'Search',
        'notifications': 'Notifications',
        'profile': 'Profile',
        'settings': 'Settings',
        'dark_mode': 'Dark Mode',
        'light_mode': 'Light Mode',
        'system': 'System',
        'language': 'Language',
        'english': 'English',
        'kurdish': 'Kurdish',
        'welcome': 'Welcome',
        'view_profile': 'View Profile',
        'admin_panel': 'Admin Panel',
        'hero_title': 'The Future of Student Identification',
        'hero_description': 'Secure, digital, and always accessible. Manage student IDs, verify identities, and streamline campus life with our comprehensive platform.',
        'register_now': 'Register Now',
        'university_admin_login': 'University Admin Login',
        'contact_sales': 'Contact Sales',
        'learn_more': 'Learn More',
        'features': 'Features',
        'pricing': 'Pricing',
        'about': 'About',
        'contact': 'Contact',
        'sign_in': 'Sign In',
        'create_account': 'Create Account',

        // Overview
        'overview_title': 'Overview',
        'overview_desc': 'Our platform transforms the traditional, manual student ID process into an efficient digital system. Students can now complete their registration, submit identity documents, verify their information, and pay for their university ID card — all through a unified online platform. Universities gain a centralized, secure, and automated solution for managing student identities at scale.',

        // How it Works
        'how_it_works_title': 'How the System Works',
        'step_1_title': 'Student Registration',
        'step_1_desc': 'Students create an account using their university credentials and gain access to their personal dashboard.',
        'step_2_title': 'Profile Completion',
        'step_2_desc': 'Required personal and academic information is filled out within a guided form to ensure accuracy and consistency.',
        'step_3_title': 'Secure KYC Verification',
        'step_3_desc': 'Students upload their identity documents for validation. All data is encrypted and processed in accordance with modern security standards.',
        'step_4_title': 'Online Payment (25,000 IQD)',
        'step_4_desc': 'The ID card issuance fee is paid directly through the integrated online payment gateway, eliminating the need for in-person transactions.',
        'step_5_title': 'Automated Printing Workflow',
        'step_5_desc': 'Once the payment is confirmed, the student’s information is sent automatically to the printing system — reducing administrative workload and errors.',
        'step_6_title': 'Notifications & Pickup',
        'step_6_desc': 'Students receive an instant email and dashboard notification once their ID card is printed and ready for collection.',

        // Features
        'platform_features_title': 'Platform Features',
        'feature_1_title': 'Advanced Identity Verification (KYC)',
        'feature_1_desc': 'Ensures all student identities are validated securely using a streamlined digital process.',
        'feature_2_title': 'Integrated Online Payments',
        'feature_2_desc': 'Fast, safe, and transparent payment system with instant confirmation for the 25,000 IQD ID card fee.',
        'feature_3_title': 'Automated Print Queue',
        'feature_3_desc': 'Student data flows directly to the printing unit, removing manual handling and improving accuracy.',
        'feature_4_title': 'Real-Time Notifications',
        'feature_4_desc': 'Students receive updates throughout every stage: submission, review, payment, printing, and readiness for pickup.',
        'feature_5_title': 'Centralized Data Management',
        'feature_5_desc': 'Universities access a structured database with real-time records, analytics, and secure storage.',
        'feature_6_title': 'Administrative Dashboard',
        'feature_6_desc': 'Enables universities to manage students, track payment statuses, review KYC documents, and monitor printing activity.',

        // Benefits
        'benefits_uni_title': 'For Universities',
        'benefits_uni_1': 'Eliminates paperwork and manual data entry',
        'benefits_uni_2': 'Reduces administrative costs and time',
        'benefits_uni_3': 'Ensures accuracy and reduces human error',
        'benefits_uni_4': 'Provides secure and unified student data storage',
        'benefits_uni_5': 'Streamlines ID issuance for large student populations',
        'benefits_uni_6': 'Enhances institutional efficiency and digital transformation',

        'benefits_student_title': 'For Students',
        'benefits_student_1': 'Easy online registration',
        'benefits_student_2': 'No queues or in-person paperwork',
        'benefits_student_3': 'Fast secure identity verification',
        'benefits_student_4': 'Convenient digital payment',
        'benefits_student_5': 'Transparent status tracking',
        'benefits_student_6': 'Automatic notifications when the card is ready',
        'benefits_student_7': 'Modern and user-friendly interface',

        // Security
        'security_title': 'Data Protection & Security',
        'security_desc': 'We prioritize privacy, accuracy, and safety at every step. Our platform is equipped with:',
        'security_1': 'End-to-end data encryption',
        'security_2': 'Secure document handling',
        'security_3': 'Role-based access control',
        'security_4': 'Enforced authentication',
        'security_5': 'Payment security aligned with international standards',
        'security_6': 'Regular security monitoring and auditing procedures',
        'security_note': 'Student information is managed responsibly and kept fully confidential.',

        // About
        'about_title': 'About the System',
        'about_desc': 'This platform was developed to support universities in the Kurdistan Region and Iraq by modernizing their student identification workflows. Our mission is to provide reliable, scalable, and secure digital solutions that improve efficiency for institutions and convenience for students.',

        // FAQ
        'faq_title': 'Frequently Asked Questions',
        'faq_1_q': 'How do I register for a student ID?',
        'faq_1_a': 'Click on the "Register Now" button at the top of the page. You\'ll need your university email address and basic personal information to create an account.',
        'faq_2_q': 'What documents are required for KYC?',
        'faq_2_a': 'You typically need a valid government-issued ID (National ID, Passport, or Driver\'s License) and a recent passport-sized photo.',
        'faq_3_q': 'How much does the ID card cost?',
        'faq_3_a': 'The standard fee for a new student ID card is 25,000 IQD. Replacement cards may have a different fee structure.',
        'faq_4_q': 'How long does it take to get my card?',
        'faq_4_a': 'Once your payment is confirmed, printing usually takes 1-3 business days. You will receive a notification when it\'s ready for pickup at your university\'s administrative office.',
        'faq_5_q': 'Is my personal data secure?',
        'faq_5_a': 'Yes, we use industry-standard encryption and security protocols to protect your personal and biometric data. Only authorized university personnel have access to your information.',

        // Footer
        'copyright': '© 2024 Acme Inc. All rights reserved.',
        'terms': 'Terms of Service',
        'privacy': 'Privacy',
    },
    ku: {
        'dashboard': 'داشبۆرد',
        'messages': 'نامەکان',
        'admins': 'ئەدمینەکان',
        'kyc_verification': 'سەلماندنی ناسنامە',
        'audit_log': 'تۆماری چالاکی',
        'payments': 'پارەدانەکان',
        'cardDesigner': 'دیزاینی کارت',
        'logout': 'چوونەدەرەوە',
        'search': 'گەڕان',
        'notifications': 'ئاگانامەکان',
        'profile': 'پرۆفایل',
        'settings': 'ڕێکخستنەکان',
        'dark_mode': 'دۆخی تاریک',
        'light_mode': 'دۆخی ڕووناک',
        'system': 'سیستەم',
        'language': 'زمان',
        'english': 'ئینگلیزی',
        'kurdish': 'کوردی',
        'welcome': 'بەخێربێیت',
        'view_profile': 'بینینی پرۆفایل',
        'admin_panel': 'پەنێڵی ئەدمین',
        'hero_title': 'داهاتووی ناسنامەی خوێندکاران',
        'hero_description': 'پارێزراو، دیجیتاڵی و هەمیشە بەردەست. بەڕێوەبردنی ناسنامەی خوێندکاران، پشتڕاستکردنەوەی ناسنامەکان و ئاسانکردنی ژیانی کەمپەس لەگەڵ پلاتفۆرمە گشتگیرەکەمان.',
        'register_now': 'تۆمارکردن',
        'university_admin_login': 'چوونەژوورەوەی ئەدمینی زانکۆ',
        'contact_sales': 'پەیوەندی بە بەشی فرۆشتن',
        'learn_more': 'زیاتر فێربە',
        'features': 'تایبەتمەندییەکان',
        'pricing': 'نرخەکان',
        'about': 'دەربارە',
        'contact': 'پەیوەندی',
        'sign_in': 'چوونەژوورەوە',
        'create_account': 'دروستکردنی هەژمار',

        // Overview
        'overview_title': 'تێڕوانینێکی گشتی',
        'overview_desc': 'پلاتفۆرمەکەمان پرۆسەی تەقلیدی و دەستیی ناسنامەی خوێندکاران دەگۆڕێت بۆ سیستەمێکی دیجیتاڵی کارا. خوێندکاران ئێستا دەتوانن تۆمارکردنەکەیان تەواو بکەن، بەڵگەنامەکانی ناسنامە پێشکەش بکەن، زانیارییەکانیان پشتڕاست بکەنەوە و پارەی کارتی ناسنامەی زانکۆ بدەن — هەموو ئەمانە لە ڕێگەی پلاتفۆرمێکی ئۆنلاینی یەکگرتووەوە. زانکۆکان چارەسەرێکی ناوەندی، پارێزراو و ئۆتۆماتیکی بەدەست دەهێنن بۆ بەڕێوەبردنی ناسنامەی خوێندکاران بە شێوەیەکی فراوان.',

        // How it Works
        'how_it_works_title': 'چۆنیەتی کارکردنی سیستەمەکە',
        'step_1_title': 'تۆمارکردنی خوێندکار',
        'step_1_desc': 'خوێندکاران هەژمارێک دروست دەکەن بە بەکارهێنانی زانیارییەکانی زانکۆکەیان و دەستیان دەگات بە داشبۆردی کەسی خۆیان.',
        'step_2_title': 'تەواوکردنی پرۆفایل',
        'step_2_desc': 'زانیارییە کەسی و ئەکادیمییە پێویستەکان لە ناو فۆرمێکی ڕێنماییکراودا پڕ دەکرێنەوە بۆ دڵنیابوون لە وردی و یەکگرتوویی.',
        'step_3_title': 'سەلماندنی ناسنامەی پارێزراو (KYC)',
        'step_3_desc': 'خوێندکاران بەڵگەنامەکانی ناسنامەیان بار دەکەن بۆ پشتڕاستکردنەوە. هەموو داتاکان بەپێی ستانداردە مۆدێرنەکانی ئاسایش کۆد دەکرێن و پرۆسێس دەکرێن.',
        'step_4_title': 'پارەدانی ئۆنلاین (٢٥,٠٠٠ دینار)',
        'step_4_desc': 'کرێی دەرکردنی کارتی ناسنامە ڕاستەوخۆ لە ڕێگەی دەروازەی پارەدانی ئۆنلاینی یەکخراوەوە دەدرێت، کە پێویستی بە مامەڵەی ڕووبەڕوو نامێنێت.',
        'step_5_title': 'ڕەوتی کاری چاپکردنی ئۆتۆماتیکی',
        'step_5_desc': 'کاتێک پارەدانەکە پشتڕاست کرایەوە، زانیارییەکانی خوێندکار بە شێوەیەکی ئۆتۆماتیکی دەنێردرێت بۆ سیستەمی چاپکردن — ئەمەش بارگرانی کارگێڕی و هەڵەکان کەم دەکاتەوە.',
        'step_6_title': 'ئاگانامە و وەرگرتنەوە',
        'step_6_desc': 'خوێندکاران ئیمەیڵ و ئاگانامەی داشبۆردی دەستبەجێ وەردەگرن کاتێک کارتی ناسنامەکەیان چاپ دەکرێت و ئامادە دەبێت بۆ وەرگرتنەوە.',

        // Features
        'platform_features_title': 'تایبەتمەندییەکانی پلاتفۆرم',
        'feature_1_title': 'پشتڕاستکردنەوەی ناسنامەی پێشکەوتوو (KYC)',
        'feature_1_desc': 'دڵنیایی دەدات کە هەموو ناسنامەکانی خوێندکاران بە شێوەیەکی پارێزراو پشتڕاست دەکرێنەوە بە بەکارهێنانی پرۆسەیەکی دیجیتاڵی ڕێکخراو.',
        'feature_2_title': 'پارەدانی ئۆنلاینی یەکخراو',
        'feature_2_desc': 'سیستەمێکی پارەدانی خێرا، پارێزراو و شەفاف لەگەڵ پشتڕاستکردنەوەی دەستبەجێ بۆ کرێی کارتی ناسنامەی ٢٥,٠٠٠ دیناری.',
        'feature_3_title': 'ڕیزبەندی چاپی ئۆتۆماتیکی',
        'feature_3_desc': 'داتای خوێندکار ڕاستەوخۆ دەچێت بۆ یەکەی چاپکردن، کە مامەڵەی دەستی لادەبات و وردی باشتر دەکات.',
        'feature_4_title': 'ئاگانامەی کاتی ڕاستەقینە',
        'feature_4_desc': 'خوێندکاران لە هەموو قۆناغێکدا نوێکاری وەردەگرن: پێشکەشکردن، پێداچوونەوە، پارەدان، چاپکردن و ئامادەبوون بۆ وەرگرتنەوە.',
        'feature_5_title': 'بەڕێوەبردنی داتای ناوەندی',
        'feature_5_desc': 'زانکۆکان دەستیان دەگات بە بنکەدراوەیەکی پێکهاتوو لەگەڵ تۆمارەکانی کاتی ڕاستەقینە، شیکاری و هەڵگرتنی پارێزراو.',
        'feature_6_title': 'داشبۆردی کارگێڕی',
        'feature_6_desc': 'ڕێگە بە زانکۆکان دەدات خوێندکاران بەڕێوەببەن، دۆخی پارەدانەکان چاودێری بکەن، پێداچوونەوە بە بەڵگەنامەکانی KYC بکەن و چاودێری چالاکی چاپکردن بکەن.',

        // Benefits
        'benefits_uni_title': 'بۆ زانکۆکان',
        'benefits_uni_1': 'کاغەزکاری و تێکردنی داتای دەستی لادەبات',
        'benefits_uni_2': 'تێچوو و کاتی کارگێڕی کەم دەکاتەوە',
        'benefits_uni_3': 'دڵنیایی لە وردی دەدات و هەڵەی مرۆیی کەم دەکاتەوە',
        'benefits_uni_4': 'هەڵگرتنی داتای خوێندکاری پارێزراو و یەکگرتوو دابین دەکات',
        'benefits_uni_5': 'دەرکردنی ناسنامە بۆ ژمارەیەکی زۆری خوێندکاران ڕێکدەخات',
        'benefits_uni_6': 'کارایی دامەزراوەیی و گۆڕانی دیجیتاڵی باشتر دەکات',

        'benefits_student_title': 'بۆ خوێندکاران',
        'benefits_student_1': 'تۆمارکردنی ئۆنلاینی ئاسان',
        'benefits_student_2': 'بێ سەرە یان کاغەزکاری ڕووبەڕوو',
        'benefits_student_3': 'پشتڕاستکردنەوەی ناسنامەی خێرا و پارێزراو',
        'benefits_student_4': 'پارەدانی دیجیتاڵی ئاسان',
        'benefits_student_5': 'چاودێریکردنی دۆخی شەفاف',
        'benefits_student_6': 'ئاگانامەی ئۆتۆماتیکی کاتێک کارتەکە ئامادە دەبێت',
        'benefits_student_7': 'ڕووکارێکی مۆدێرن و دۆستانە بۆ بەکارهێنەر',

        // Security
        'security_title': 'پاراستنی داتا و ئاسایش',
        'security_desc': 'ئێمە نهێنی، وردی و سەلامەتی لە هەموو هەنگاوێکدا لە پێشینە دادەنێین. پلاتفۆرمەکەمان بەم شتانە ئامادە کراوە:',
        'security_1': 'کۆدکردنی داتا لە سەرەتاوە بۆ کۆتایی',
        'security_2': 'مامەڵەکردنی پارێزراو لەگەڵ بەڵگەنامەکان',
        'security_3': 'کۆنترۆڵی دەستگەیشتن بەپێی ڕۆڵ',
        'security_4': 'سەلماندنی ناسنامەی بەهێزکراو',
        'security_5': 'ئاسایشی پارەدان هاوتەریب لەگەڵ ستانداردە نێودەوڵەتییەکان',
        'security_6': 'ڕێکارەکانی چاودێری و وردبینی ئاسایشی بەردەوام',
        'security_note': 'زانیاری خوێندکار بە بەرپرسیارێتی بەڕێوەدەبرێت و بە تەواوی بە نهێنی دەهێڵرێتەوە.',

        // About
        'about_title': 'دەربارەی سیستەمەکە',
        'about_desc': 'ئەم پلاتفۆرمە پەرەی پێدراوە بۆ پشتگیریکردنی زانکۆکان لە هەرێمی کوردستان و عێراق لە ڕێگەی مۆدێرنکردنی ڕەوتی کاری ناسنامەی خوێندکاران. ئەرکی ئێمە دابینکردنی چارەسەری دیجیتاڵی جێی متمانە، گەورەکراو و پارێزراوە کە کارایی بۆ دامەزراوەکان و ئاسانکاری بۆ خوێندکاران باشتر دەکات.',

        // FAQ
        'faq_title': 'پرسیارە باوەکان',
        'faq_1_q': 'چۆن تۆمار بکەم بۆ ناسنامەی خوێندکار؟',
        'faq_1_a': 'کلیک لەسەر دوگمەی "تۆمارکردن" بکە لە سەرەوەی پەڕەکە. پێویستت بە ئیمەیڵی زانکۆ و زانیاری کەسی بنەڕەتی دەبێت بۆ دروستکردنی هەژمار.',
        'faq_2_q': 'چ بەڵگەنامەیەک پێویستە بۆ KYC؟',
        'faq_2_a': 'بە شێوەیەکی گشتی پێویستت بە ناسنامەیەکی فەرمی حکومی (کارتی نیشتمانی، پاسپۆرت، یان مۆڵەتی شۆفێری) و وێنەیەکی قەبارە پاسپۆرتی نوێ دەبێت.',
        'faq_3_q': 'تێچووی کارتی ناسنامەکە چەندە؟',
        'faq_3_a': 'کرێی ستاندارد بۆ کارتی ناسنامەی خوێندکاری نوێ ٢٥,٠٠٠ دینارە. کارتە جێگرەوەکان ڕەنگە پێکهاتەی کرێی جیاوازیان هەبێت.',
        'faq_4_q': 'چەند کات دەخایەنێت بۆ وەرگرتنی کارتەکەم؟',
        'faq_4_a': 'کاتێک پارەدانەکەت پشتڕاست کرایەوە، چاپکردن بەزۆری ١-٣ ڕۆژی کار دەخایەنێت. ئاگانامەیەک وەردەگریت کاتێک ئامادە دەبێت بۆ وەرگرتنەوە لە نووسینگەی کارگێڕی زانکۆکەت.',
        'faq_5_q': 'ئایا داتا کەسییەکانم پارێزراون؟',
        'faq_5_a': 'بەڵێ، ئێمە پرۆتۆکۆڵی کۆدکردن و ئاسایشی ستانداردی پیشەسازی بەکاردەهێنین بۆ پاراستنی داتا کەسی و بایۆمەترییەکانت. تەنها کارمەندانی ڕێگەپێدراوی زانکۆ دەستیان دەگات بە زانیارییەکانت.',

        // Footer
        'copyright': '© ٢٠٢٤ ئەکمێ ئینک. هەموو مافەکان پارێزراون.',
        'terms': 'مەرجەکانی خزمەتگوزاری',
        'privacy': 'پاراستنی نهێنی',
    },
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const controls = useAnimation();

    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as Language;
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const handleSetLanguage = async (lang: Language) => {
        if (lang === language) return;

        await controls.start({ opacity: 0, transition: { duration: 0.15 } });
        setLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.dir = lang === 'ku' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        setIsTransitioning(true);
    };

    // Initialize direction on mount and handle fade in after language change
    useEffect(() => {
        document.documentElement.dir = language === 'ku' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        if (isTransitioning) {
            controls.start({ opacity: 1, transition: { duration: 0.15 } }).then(() => {
                setIsTransitioning(false);
            });
        }
    }, [language, isTransitioning, controls]);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t,
                dir: language === 'ku' ? 'rtl' : 'ltr',
            }}
        >
            <motion.div
                initial={{ opacity: 1 }}
                animate={controls}
                className="w-full"
                style={{ willChange: 'opacity' }}
            >
                {children}
            </motion.div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
