'use client';

import { SignUpForm } from '@/components/signup-form';
import { Wind } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GradientBackground } from '@/components/ui/gradient-background';



export default function SignUpPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center bg-white antialiased pt-28 pb-12 px-4 overflow-y-auto">
      {/* Premium subtle background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-gray-50 via-white to-white pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-5xl my-auto"
      >
        
        <SignUpForm />

        <div className="mt-10 text-center text-xs text-gray-400/80 font-medium tracking-wide uppercase">
          <p>© 2024 Acme Inc. All rights reserved.</p>
        </div>
      </motion.div>
    </div>
  );
}
