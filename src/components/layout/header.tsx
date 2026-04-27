'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Wind } from 'lucide-react';

import { LanguageToggle } from '@/components/language-toggle';

import { useLanguage } from '@/contexts/language-context';

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const navLinks = [
        { name: t('features'), href: '#features' },
        { name: t('pricing'), href: '#pricing' },
        { name: t('about'), href: '#about' },
        { name: t('contact'), href: '#contact-us' },
    ];

    return (
        <>
            <motion.header
                className={cn(
                    "fixed top-4 left-0 right-0 z-50 mx-auto max-w-5xl px-4"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                // Fade in animation
                transition={{ duration: 0.5 }}
            >
                <div className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-2 shadow-sm backdrop-blur-md",
                    "bg-white/70 border-gray-200/60 supports-[backdrop-filter]:bg-white/70",
                    scrolled && "bg-white/90 shadow-md"
                )}>
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 pl-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                            <Wind className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="font-bold text-sm text-gray-900 hidden sm:inline-block">Acme Inc.</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors duration-300"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-0 sm:gap-2">
                        <LanguageToggle />
                        <Button size="sm" className="hidden sm:flex px-6 font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0" asChild>
                            <Link href="/login">{t('sign_in')}</Link>
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="md:hidden rounded-full relative z-50 hover:bg-transparent hover:text-orange-500 transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <motion.div
                                animate={mobileMenuOpen ? "open" : "closed"}
                                className="flex flex-col gap-1.5 items-center justify-center w-6 h-6"
                            >
                                <motion.span
                                    variants={{
                                        closed: { rotate: 0, y: 0 },
                                        open: { rotate: 45, y: 3.5 },
                                    }}
                                    className="w-5 h-px bg-current block rounded-full origin-center"
                                    transition={{ duration: 0.3 }}
                                />
                                <motion.span
                                    variants={{
                                        closed: { rotate: 0, y: 0 },
                                        open: { rotate: -45, y: -3.5 },
                                    }}
                                    className="w-5 h-px bg-current block rounded-full origin-center"
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.div>
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center"
                    >
                        <nav className="flex flex-col gap-1 items-center w-full max-w-sm px-6 relative z-10">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                                    className="w-full"
                                >
                                    <Link
                                        href={link.href}
                                        className="flex items-center justify-center text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors duration-300 py-1"
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}

                            {/* Sign In as text link */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + navLinks.length * 0.05, duration: 0.3 }}
                                className="w-full mt-4"
                            >
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center text-lg font-medium text-gray-700 hover:text-orange-500 transition-colors duration-300 py-1"
                                >
                                    {t('sign_in')}
                                </Link>
                            </motion.div>

                            {/* Create Account as orange button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + (navLinks.length + 1) * 0.05, duration: 0.3 }}
                                className="w-full mt-4"
                            >
                                <Button
                                    className="w-full text-base h-12 font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl border-0"
                                    asChild
                                >
                                    <Link href="/signup">{t('create_account')}</Link>
                                </Button>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    );
}
