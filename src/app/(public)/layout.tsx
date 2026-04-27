import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/theme-provider';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider forcedTheme="light">
            <Header />
            {children}
        </ThemeProvider>
    );
}
