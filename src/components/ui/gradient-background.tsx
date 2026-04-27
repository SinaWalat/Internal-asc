'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface GradientBackgroundProps {
    fixedPosition?: string; // If present, use deterministic positions
}

export function GradientBackground({ fixedPosition }: GradientBackgroundProps) {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const [blobs, setBlobs] = useState<{ x: number; y: number; size: number; opacity: number; delay: number; duration: number }[]>([]);

    useEffect(() => {
        if (fixedPosition) {
            // Deterministic "nice" arrangement for Login (keep simple)
            setBlobs([
                { x: 3, y: 22, size: 800, opacity: 0.8, delay: 0, duration: 4 },
                { x: 85, y: 85, size: 600, opacity: 0.6, delay: 1, duration: 3 },
                { x: 50, y: 50, size: 900, opacity: 0.5, delay: 2, duration: 5 },
            ]);
        } else {
            // Generate 15 random blobs for the landing page to ensure coverage
            const newBlobs = Array.from({ length: 15 }).map(() => ({
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
                size: Math.floor(Math.random() * 500) + 400, // 400-900px
                opacity: Math.random() * 0.3 + 0.2, // 0.2-0.5
                delay: Math.random() * 5,
                duration: Math.random() * 5 + 5, // 5-10s
            }));
            setBlobs(newBlobs);
        }
        setMounted(true);
    }, [fixedPosition]);

    if (!mounted) return null;

    const isDark = resolvedTheme === 'dark';

    return (
        <div
            className="absolute inset-0 z-0 w-full h-full overflow-hidden transition-colors duration-500 pointer-events-none"
            style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        >
            {blobs.map((blob, i) => (
                <div
                    key={i}
                    className="absolute rounded-full mix-blend-screen transition-opacity will-change-transform blur-3xl"
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, rgba(153,56,0,0.8) 0%, rgba(153,56,0,0) 70%)'
                            : 'radial-gradient(circle, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0) 70%)',
                        width: `${blob.size}px`,
                        height: `${blob.size}px`,
                        left: `${blob.x}%`,
                        top: `${blob.y}%`,
                        transform: 'translate(-50%, -50%)',
                        opacity: isDark ? blob.opacity : blob.opacity * 0.8,
                        transition: `all ${blob.duration}s ease-in-out`,
                        animationDelay: `${blob.delay}s`,
                    }}
                />
            ))}

            {/* Dark Overlay only for Dark Mode to ensure text readability */}
            {isDark && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}

            {/* Light Mode might need a very subtle overlay or none */}
            {!isDark && <div className="absolute inset-0 bg-white/10 pointer-events-none" />}
        </div>
    );
}
