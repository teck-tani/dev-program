import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const notoSansKr = Noto_Sans_KR({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "웹 도구 모음 | 생활에 편리한 계산기, 시계, 이모지 | Tani DevTool",
    description: "일상생활과 업무에 필요한 다양한 웹 도구 모음. 계산기, 시계, 이모지 등 필요한 도구를 한 곳에서 사용하세요. 모바일에서도 편리하게 이용 가능합니다.",
    keywords: "웹 도구, 온라인 계산기, 대한민국 시계, 이모지 모음, 실용적인 웹 도구, 생활 도구, 개발자 도구, 온라인 유틸리티",
    openGraph: {
        type: "website",
        url: "https://tani-devtool.netlify.app/",
        title: "웹 도구 모음 | Tani DevTool",
        description: "일상생활과 업무에 필요한 다양한 웹 도구 모음. 계산기, 시계, 이모지 등 필요한 도구를 한 곳에서 사용하세요.",
        images: ["https://tani-devtool.netlify.app/images/og-image.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "웹 도구 모음 | Tani DevTool",
        description: "일상생활과 업무에 필요한 다양한 웹 도구 모음. 계산기, 시계, 이모지 등 필요한 도구를 한 곳에서 사용하세요.",
        images: ["https://tani-devtool.netlify.app/images/og-image.png"],
    },
    verification: {
        google: "ZTX_kH9VuRhwH3JT8c4V_rB_cCUwVP7It4cCGr2bHE",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <head>
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/favicon.svg" />
                {/* Google Analytics can be added here or using a third-party library */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-7TCWX4SNV8"></script>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag() { dataLayer.push(arguments); }
              gtag('js', new Date());
              gtag('config', 'G-7TCWX4SNV8');
            `,
                    }}
                />
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4836555208250151"
                    crossOrigin="anonymous"></script>
            </head>
            <body className={notoSansKr.className}>
                <div id="top-container">
                    <Header />
                </div>
                <main>{children}</main>
                <div id="footer-container">
                    <Footer />
                </div>
            </body>
        </html>
    );
}
