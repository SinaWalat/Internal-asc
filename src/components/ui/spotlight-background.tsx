'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from "@/lib/utils";

export function SpotlightBackground({ className }: { className?: string }) {
    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
            {/* Top Left - Main Spotlight */}
            <div
                className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/15 blur-[120px]"
            />

            {/* Bottom Right - Secondary Spotlight */}
            <div
                className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-800/15 blur-[120px]"
            />

            {/* Center/Random - Subtle Highlights */}
            <div
                className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"
            />

            <div
                className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]"
            />
        </div>
    );
}
