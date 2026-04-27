import localFont from 'next/font/local'

// Modam Font Configuration
export const customFont = localFont({
    src: [
        {
            path: './fonts/Modam-Light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: './fonts/Modam-SemiBold.ttf',
            weight: '600',
            style: 'normal',
        },
    ],
    variable: '--font-custom',
    display: 'swap',
})
