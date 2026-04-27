'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, CreditCard, Printer, Bell, Database, LayoutDashboard, CheckCircle2, School, User, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

import { useLanguage } from '@/contexts/language-context';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SpotlightCard } from '@/components/ui/spotlight-card';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden antialiased text-gray-900 bg-white">
      {/* Global Stunning Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/50 via-white to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-50/50 via-transparent to-white" />
      </div>

      <main className="flex-1 relative z-10">
        <div className="relative w-full">

          {/* 1. Hero Section */}
          <section className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-10">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6 max-w-5xl flex flex-col items-center">
                  
                  {/* Premium Badge */}
                  <div className="inline-flex items-center rounded-full border border-orange-200/50 bg-orange-50/50 backdrop-blur-md px-3 py-1 text-sm font-medium text-orange-600 mb-4 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
                    Premium University Management System
                  </div>

                  <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500 pb-2">
                    {t('hero_title').split(' ').slice(0, -2).join(' ')}{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">
                      {t('hero_title').split(' ').slice(-2).join(' ')}
                    </span>
                  </h1>
                  
                  <p className="mx-auto max-w-[800px] text-gray-500 text-lg sm:text-xl md:text-2xl leading-relaxed font-light">
                    {t('hero_description')}
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row gap-5 min-[400px]:gap-6 w-full sm:w-auto px-4 sm:px-0">
                  {/* Register Button */}
                  <Button size="lg" className="h-14 px-10 text-lg font-semibold rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white transition-all duration-300 shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:shadow-[0_15px_40px_rgb(249,115,22,0.4)] w-full sm:w-auto" asChild>
                    <Link href="/signup">
                      {t('register_now')} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>

                  {/* Login Button */}
                  <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-semibold rounded-2xl bg-white/80 backdrop-blur-md text-gray-900 hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto" asChild>
                    <Link href="/login">
                      {t('university_admin_login')}
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Soft bottom fade for hero */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
          </section>

          {/* 2. Overview */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900 pb-2">{t('overview_title')}</motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1 }}
                  className="mx-auto max-w-[800px] text-gray-500 md:text-xl leading-relaxed font-light">
                  {t('overview_desc')}
                </motion.p>
              </div>
            </div>
          </section>

          {/* 3. How the System Works */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center mb-16">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900 pb-2">{t('how_it_works_title')}</h2>
                <div className="h-1.5 w-20 bg-orange-500 rounded-full mt-6 opacity-80" />
              </motion.div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { step: 1, title: t('step_1_title'), desc: t('step_1_desc') },
                  { step: 2, title: t('step_2_title'), desc: t('step_2_desc') },
                  { step: 3, title: t('step_3_title'), desc: t('step_3_desc') },
                  { step: 4, title: t('step_4_title'), desc: t('step_4_desc') },
                  { step: 5, title: t('step_5_title'), desc: t('step_5_desc') },
                  { step: 6, title: t('step_6_title'), desc: t('step_6_desc') }
                ].map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={item.step} className="group h-full">
                    <div className="h-full rounded-3xl bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500">
                      <SpotlightCard className="p-8">
                        <div className="relative z-10 flex flex-col items-start space-y-5">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50 shadow-sm shadow-orange-100 text-2xl font-bold text-orange-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                            {item.step}
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{item.title}</h3>
                          <p className="text-gray-500 leading-relaxed font-light">{item.desc}</p>
                        </div>
                      </SpotlightCard>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Platform Features */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center mb-16">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900 pb-2">{t('platform_features_title')}</h2>
                <div className="h-1.5 w-20 bg-orange-500 rounded-full mt-6 opacity-80" />
              </motion.div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: t('feature_1_title'), desc: t('feature_1_desc') },
                  { icon: CreditCard, title: t('feature_2_title'), desc: t('feature_2_desc') },
                  { icon: Printer, title: t('feature_3_title'), desc: t('feature_3_desc') },
                  { icon: Bell, title: t('feature_4_title'), desc: t('feature_4_desc') },
                  { icon: Database, title: t('feature_5_title'), desc: t('feature_5_desc') },
                  { icon: LayoutDashboard, title: t('feature_6_title'), desc: t('feature_6_desc') }
                ].map((feature, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={index} className="group h-full">
                    <div className="h-full rounded-3xl bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500">
                      <SpotlightCard className="p-8">
                        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50 shadow-sm shadow-orange-100 text-orange-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <feature.icon className="h-8 w-8" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">{feature.title}</h3>
                          <p className="text-gray-500 leading-relaxed font-light">{feature.desc}</p>
                        </div>
                      </SpotlightCard>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* 5. Benefits */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Universities */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
                  className="relative h-full rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                  <SpotlightCard className="p-10 md:p-14">
                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50 shadow-inner">
                          <School className="h-8 w-8 text-orange-500" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('benefits_uni_title')}</h2>
                      </div>
                      <ul className="space-y-5">
                        {[
                          t('benefits_uni_1'),
                          t('benefits_uni_2'),
                          t('benefits_uni_3'),
                          t('benefits_uni_4'),
                          t('benefits_uni_5'),
                          t('benefits_uni_6')
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-4 group">
                            <div className="mt-1 flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 group-hover:bg-orange-500 transition-colors duration-300">
                              <CheckCircle2 className="h-4 w-4 text-orange-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <span className="text-lg leading-relaxed text-gray-600 font-light group-hover:text-gray-900 transition-colors duration-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </SpotlightCard>
                </motion.div>

                {/* Students */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.1 }}
                  className="relative h-full rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                  <SpotlightCard className="p-10 md:p-14">
                    <div className="space-y-8 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50 shadow-inner">
                          <User className="h-8 w-8 text-orange-500" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('benefits_student_title')}</h2>
                      </div>
                      <ul className="space-y-5">
                        {[
                          t('benefits_student_1'),
                          t('benefits_student_2'),
                          t('benefits_student_3'),
                          t('benefits_student_4'),
                          t('benefits_student_5'),
                          t('benefits_student_6'),
                          t('benefits_student_7')
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-4 group">
                            <div className="mt-1 flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 group-hover:bg-orange-500 transition-colors duration-300">
                              <CheckCircle2 className="h-4 w-4 text-orange-500 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <span className="text-lg leading-relaxed text-gray-600 font-light group-hover:text-gray-900 transition-colors duration-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </SpotlightCard>
                </motion.div>
              </div>
            </div>
          </section>

          {/* 6. Data Protection & Security */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-10">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                  className="p-5 rounded-3xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50 shadow-xl shadow-orange-500/10">
                  <Lock className="w-14 h-14 text-orange-500" />
                </motion.div>
                
                <div className="space-y-4 max-w-3xl">
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900 pb-2">{t('security_title')}</motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-[800px] text-gray-500 md:text-xl font-light mx-auto">
                    {t('security_desc')}
                  </motion.p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-left max-w-5xl w-full">
                  {[
                    t('security_1'),
                    t('security_2'),
                    t('security_3'),
                    t('security_4'),
                    t('security_5'),
                    t('security_6')
                  ].map((item, index) => (
                    <motion.div 
                      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                      key={index} className="flex items-center gap-4 p-5 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-50 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="font-semibold text-gray-800">{item}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p 
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.8 }}
                  className="text-gray-400 italic pt-6">
                  {t('security_note')}
                </motion.p>
              </div>
            </div>
          </section>

          {/* 7. About the System */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                  className="flex flex-col items-center text-center">
                  <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900 pb-2">{t('about_title')}</h2>
                  <div className="h-1.5 w-20 bg-orange-500 rounded-full mt-6 opacity-80" />
                </motion.div>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-xl text-gray-500 leading-relaxed font-light mt-8">
                  {t('about_desc')}
                </motion.p>
              </div>
            </div>
          </section>

          {/* 8. FAQ */}
          <section className="relative w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-12 max-w-4xl mx-auto">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl leading-tight text-gray-900">{t('faq_title')}</motion.h2>
                
                <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto space-y-4 text-left">
                  {[
                    { q: 'faq_1_q', a: 'faq_1_a', value: 'item-1' },
                    { q: 'faq_2_q', a: 'faq_2_a', value: 'item-2' },
                    { q: 'faq_3_q', a: 'faq_3_a', value: 'item-3' },
                    { q: 'faq_4_q', a: 'faq_4_a', value: 'item-4' },
                    { q: 'faq_5_q', a: 'faq_5_a', value: 'item-5' },
                  ].map((faq, index) => (
                    <motion.div 
                      key={faq.value}
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="relative">
                      <AccordionItem value={faq.value} className="bg-white/60 backdrop-blur-lg rounded-2xl px-8 border border-white shadow-sm hover:shadow-md transition-shadow duration-300">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline py-6 text-gray-800 hover:text-orange-500 transition-colors duration-300">{t(faq.q)}</AccordionTrigger>
                        <AccordionContent className="text-gray-500 pb-6 text-base leading-relaxed font-light">
                          {t(faq.a)}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-8 border-t border-gray-200/50 bg-white/50 backdrop-blur-xl">
        <p className="text-sm text-gray-500 font-medium">{t('copyright')}</p>
        <nav className="sm:ml-auto flex gap-6">
          <Link href="#" className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors duration-300">
            {t('terms')}
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors duration-300">
            {t('privacy')}
          </Link>
        </nav>
      </footer>
    </div>
  );
}
