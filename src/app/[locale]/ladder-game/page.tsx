import { NextIntlClientProvider } from 'next-intl';
import LadderGameClient from "./LadderGameClient";
import { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/navigation';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

const baseUrl = 'https://teck-tani.com';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params;
    const t = await getTranslations({ locale, namespace: 'LadderGame.meta' });
    const isKo = locale === 'ko';
    const url = `${baseUrl}/${locale}/ladder-game`;

    return {
        title: t('title'),
        description: t('description'),
        keywords: t('keywords'),
        alternates: {
            canonical: url,
            languages: {
                'ko': `${baseUrl}/ko/ladder-game`,
                'en': `${baseUrl}/en/ladder-game`,
                'x-default': `${baseUrl}/ko/ladder-game`,
            },
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            url,
            siteName: 'Teck-Tani 웹도구',
            type: 'website',
            locale: isKo ? 'ko_KR' : 'en_US',
            alternateLocale: isKo ? 'en_US' : 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('ogTitle'),
            description: t('ogDescription'),
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

function generateFaqSchema(locale: string) {
    const faqData = locale === 'ko' ? [
        {
            question: "사다리타기 게임이란 무엇인가요?",
            answer: "사다리타기(Ghost Leg, 아미다쿠지)는 참가자들이 사다리 위에서 시작하여 아래로 내려가면서 만나는 가로선을 따라 이동해 최종 결과를 결정하는 공정한 랜덤 결정 게임입니다. 한국, 일본 등 아시아에서 오래 사용되어 온 방법으로, 당첨자 선정, 역할 분담, 벌칙 결정, 순서 정하기 등에 널리 사용됩니다."
        },
        {
            question: "몇 명까지 참가할 수 있나요?",
            answer: "최소 2명부터 최대 20명까지 참가할 수 있습니다. 참가자 수에 맞게 결과 항목도 자동으로 조정됩니다. 소규모 모임부터 학교 수업, 회사 팀 단위까지 다양하게 활용할 수 있습니다."
        },
        {
            question: "사다리타기 결과가 공정한가요? 조작이 가능한가요?",
            answer: "네, 완전히 공정합니다. 사다리의 가로선은 JavaScript의 Math.random()을 사용한 무작위 알고리즘으로 생성되며, 모든 참가자가 동일한 확률로 각 결과에 도달합니다. 서버 통신 없이 브라우저에서 직접 계산하므로 외부 조작이 불가능합니다."
        },
        {
            question: "모바일에서도 사용할 수 있나요?",
            answer: "네, 이 사다리타기 게임은 반응형 디자인으로 PC, 태블릿, 모바일 모두에서 최적화되어 있습니다. 터치 조작도 지원하며 다크모드도 사용 가능합니다."
        },
        {
            question: "사다리타기로 점심 메뉴를 어떻게 정하나요?",
            answer: "'점심 메뉴' 프리셋 버튼을 클릭하면 치킨, 피자, 짜장면 등 인기 메뉴가 자동으로 입력됩니다. 참가자 이름을 입력하고 사다리를 생성하면 누가 어떤 메뉴를 먹을지 공정하게 결정할 수 있습니다."
        },
        {
            question: "레이스 모드와 순차 모드의 차이는 무엇인가요?",
            answer: "레이스 모드는 모든 참가자가 동시에 사다리를 타고 내려가는 모드로 스피드감이 있습니다. 순차 모드는 한 명씩 차례대로 사다리를 타는 모드로 긴장감을 줍니다. 상황에 맞게 선택하세요."
        },
        {
            question: "사다리타기 결과를 공유할 수 있나요?",
            answer: "네, 게임이 끝나면 결과를 텍스트로 복사하여 카카오톡, 문자, SNS 등에 공유할 수 있습니다. 공유 버튼을 클릭하면 결과가 자동으로 복사됩니다."
        },
        {
            question: "네이버 사다리타기와 차이점은 무엇인가요?",
            answer: "네이버 사다리타기는 최대 24명을 지원하지만 레이스 모드가 없고 프리셋 템플릿이 없습니다. teck-tani.com은 레이스/순차 듀얼 모드, 인기 프리셋(점심/벌칙/커피 등), 다크모드, 한영 이중언어를 지원하며 광고 없이 깔끔한 UI를 제공합니다."
        }
    ] : [
        {
            question: "What is Ghost Leg (Ladder Game)?",
            answer: "Ghost Leg (also known as Ladder Game or Amidakuji) is a fair random decision-making game where participants start at the top of a ladder and move downward, following horizontal lines to reach a final result. It's widely used in Asia for selecting winners, assigning roles, and determining penalties."
        },
        {
            question: "How many players can participate?",
            answer: "You can have between 2 to 20 participants. The number of result options automatically adjusts to match the number of players, suitable for small groups to classroom or team settings."
        },
        {
            question: "Are the results fair? Can it be manipulated?",
            answer: "Yes, it's completely fair. Horizontal rungs are generated using JavaScript's Math.random() algorithm, ensuring all participants have equal probability. The game runs entirely in your browser with no server communication, making external manipulation impossible."
        },
        {
            question: "Can I use it on mobile?",
            answer: "Yes, this ladder game features responsive design optimized for PC, tablet, and mobile devices. Touch controls are supported and dark mode is available."
        },
        {
            question: "What's the difference between Race and Sequential modes?",
            answer: "Race mode has all players descend the ladder simultaneously for an exciting experience. Sequential mode has players take turns one by one, building suspense. Choose based on your situation."
        },
        {
            question: "Can I share the results?",
            answer: "Yes, after the game ends you can copy the results as text and share via messaging apps or social media. Click the share button to automatically copy the results."
        },
        {
            question: "How do I use the preset templates?",
            answer: "Click any preset button (Lunch Pick, Penalty Game, Coffee Bet, Turn Order) to auto-fill result options. Then enter player names and generate the ladder for instant fair decisions."
        },
        {
            question: "Is my data private?",
            answer: "Absolutely. All participant names and results are processed entirely in your browser. No data is sent to any server. Everything is automatically deleted when you close the page."
        }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
            }
        }))
    };
}

function generateHowToSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": isKo ? "사다리타기 게임 사용법" : "How to Use Ghost Leg (Ladder Game)",
        "description": isKo
            ? "온라인 사다리타기 게임으로 공정하게 결정하는 방법 - 벌칙, 순서, 점심 메뉴 정하기"
            : "How to make fair decisions with the online Ghost Leg ladder game",
        "totalTime": "PT1M",
        "step": isKo ? [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "모드 선택 및 프리셋 적용",
                "text": "레이스 모드 또는 순차 모드를 선택하세요. 점심 메뉴, 벌칙 게임, 커피 내기, 순서 정하기 등 인기 프리셋을 클릭하면 결과가 자동 입력됩니다."
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "참가자 입력",
                "text": "사다리타기에 참여할 사람들의 이름을 입력하세요. 최소 2명, 최대 20명까지 추가할 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "결과 입력",
                "text": "각 참가자에게 배정될 결과 항목을 입력하세요. 프리셋을 사용하면 이 단계를 건너뛸 수 있습니다."
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "사다리 생성 및 게임 시작",
                "text": "'사다리 생성' 버튼을 클릭하여 무작위 사다리를 만든 후, '게임 시작'을 눌러 애니메이션을 확인하세요."
            },
            {
                "@type": "HowToStep",
                "position": 5,
                "name": "결과 확인 및 공유",
                "text": "모든 참가자의 결과를 확인하고, 공유 버튼으로 결과를 복사하여 카카오톡이나 SNS에 공유하세요."
            }
        ] : [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Select Mode & Preset",
                "text": "Choose Race or Sequential mode. Click a popular preset (Lunch Pick, Penalty Game, Coffee Bet, Turn Order) to auto-fill results."
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Enter Players",
                "text": "Enter the names of participants. You can add between 2 to 20 players."
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Enter Results",
                "text": "Enter result options to be assigned. This step can be skipped if using a preset."
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "Generate & Start",
                "text": "Click 'Generate Ladder' to create a random ladder, then 'Start Game' to watch the animation."
            },
            {
                "@type": "HowToStep",
                "position": 5,
                "name": "Check Results & Share",
                "text": "View results and use the share button to copy and share via messaging apps or social media."
            }
        ]
    };
}

function generateWebAppSchema(locale: string) {
    const isKo = locale === 'ko';

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": isKo ? "사다리타기 게임" : "Ghost Leg Game (Ladder Lottery)",
        "description": isKo
            ? "무료 온라인 사다리타기 게임. 2~20명 공정한 무작위 결정, 벌칙 정하기, 순서 정하기, 점심 메뉴 결정에 최적화된 사다리 타기 도구입니다."
            : "Free online Ghost Leg game (Amidakuji). Perfect for fair random decisions with 2-20 players. Ideal for penalties, turn order, and lunch picks.",
        "url": `${baseUrl}/${locale}/ladder-game`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": isKo ? "KRW" : "USD"
        },
        "featureList": isKo
            ? [
                "2~20명 무작위 사다리 생성",
                "레이스 모드 & 순차 모드",
                "인기 프리셋 (점심/벌칙/커피/순서)",
                "실시간 캔버스 애니메이션",
                "모바일 최적화 & 다크모드",
                "공정한 랜덤 알고리즘",
                "결과 공유 기능",
                "광고 없음"
            ]
            : [
                "Random ladder for 2-20 players",
                "Race mode & Sequential mode",
                "Popular presets (Lunch/Penalty/Coffee/Order)",
                "Real-time canvas animation",
                "Mobile optimized & dark mode",
                "Fair random algorithm",
                "Result sharing",
                "Ad-free"
            ],
        "browserRequirements": "Requires JavaScript. Requires HTML5 Canvas.",
        "softwareVersion": "2.0",
        "inLanguage": isKo ? "ko" : "en"
    };
}

const seoContent = {
    ko: {
        ariaLabel: "사다리타기 게임 안내",
        section1Title: "사다리타기 게임이란?",
        section1Desc: "사다리타기(Ghost Leg, 아미다쿠지)는 한국과 일본에서 오랜 역사를 가진 공정한 무작위 결정 방법입니다. 참가자들이 사다리의 맨 위에서 시작하여 아래로 내려가면서, 만나는 가로선을 따라 옆으로 이동하다 보면 예측할 수 없는 결과에 도달하게 됩니다. 수학적으로 사다리타기는 순열(permutation)의 원리를 이용하여 모든 참가자가 정확히 하나의 결과와 매칭되며, 결과가 중복되지 않는 것이 보장됩니다.",
        section1Desc2: "이 온라인 사다리타기 게임은 종이와 펜 없이도 언제 어디서나 공정하게 결정을 내릴 수 있게 해줍니다. 점심 메뉴 정하기, 벌칙 게임, 커피 내기, 발표 순서 정하기, 당번 배정 등 다양한 상황에서 활용하세요.",
        featuresTitle: "주요 기능",
        features: [
            { icon: "🎲", title: "2~20명 지원", desc: "소규모 모임부터 학교 수업, 회사 팀 단위까지. 참가자 수에 맞게 자동 조정됩니다." },
            { icon: "🏎️", title: "듀얼 모드", desc: "레이스 모드(전원 동시 출발)와 순차 모드(한 명씩 차례대로) 두 가지 게임 방식을 지원합니다." },
            { icon: "⚡", title: "인기 프리셋", desc: "점심 메뉴, 벌칙 게임, 커피 내기, 순서 정하기 등 인기 시나리오를 원클릭으로 바로 시작하세요." },
            { icon: "🔒", title: "공정성 보장", desc: "완전한 무작위 알고리즘으로 생성. 서버 통신 없이 브라우저에서 직접 계산하여 조작이 불가능합니다." }
        ],
        howToTitle: "사다리타기 사용 방법",
        howToSteps: [
            { name: "모드 선택", text: "레이스 모드(전원 동시) 또는 순차 모드(한 명씩)를 선택하세요. 프리셋 버튼으로 인기 시나리오를 바로 적용할 수도 있습니다." },
            { name: "참가자 입력", text: "사다리타기에 참여할 사람들의 이름을 입력하세요. 2~20명까지 자유롭게 추가/삭제 가능합니다." },
            { name: "결과 입력", text: "각 참가자에게 배정될 결과를 입력하세요. 예: 치킨, 피자, 당첨, 꽝, 커피 쏘기 등" },
            { name: "사다리 생성 및 시작", text: "'사다리 생성' 버튼으로 무작위 사다리를 만든 뒤, '게임 시작'을 눌러 애니메이션으로 결과를 확인하세요." },
            { name: "결과 확인 및 공유", text: "결과를 확인하고, 공유 버튼으로 카카오톡이나 SNS에 바로 공유할 수 있습니다." }
        ],
        section2Title: "이런 상황에서 사다리타기를 사용하세요",
        section2Items: [
            { icon: "🍽️", title: "점심 메뉴 정하기", desc: "\"오늘 뭐 먹지?\" 치킨, 피자, 짜장면 중 사다리로 결정! 직장인, 학생 점심 고민 해결." },
            { icon: "🎭", title: "벌칙/복불복 게임", desc: "술자리, 모임에서 재미있게 벌칙 대상자를 선정하세요. 노래 부르기, 개인기, 춤추기 등." },
            { icon: "☕", title: "커피 내기", desc: "\"오늘 커피 누가 사?\" 공정한 사다리타기로 커피 쏘는 사람을 결정하세요." },
            { icon: "📋", title: "순서/당번 정하기", desc: "발표 순서, 청소 당번, 회의 진행자 등 순서를 정할 때 누구도 불만 없이 결정." },
            { icon: "🎉", title: "당첨자 추첨", desc: "이벤트, 경품 추첨, 선물 교환 등에서 공정하게 당첨자를 뽑으세요." },
            { icon: "👩‍🏫", title: "수업/모둠 활동", desc: "학교에서 모둠 구성, 발표자 선정, 역할 분담에 사다리타기를 활용하세요." }
        ],
        faqTitle: "자주 묻는 질문",
        faqItems: [
            { q: "사다리타기 게임이란 무엇인가요?", a: "사다리타기(Ghost Leg, 아미다쿠지)는 참가자들이 사다리 위에서 시작하여 아래로 내려가면서 만나는 가로선을 따라 이동해 최종 결과를 결정하는 공정한 랜덤 결정 게임입니다. 한국, 일본 등 아시아에서 당첨자 선정, 역할 분담, 벌칙 결정 등에 널리 사용됩니다." },
            { q: "몇 명까지 참가할 수 있나요?", a: "최소 2명부터 최대 20명까지 참가할 수 있습니다. 참가자 수에 맞게 결과 항목도 자동으로 조정됩니다." },
            { q: "사다리타기 결과가 공정한가요? 조작이 가능한가요?", a: "완전히 공정합니다. 가로선은 무작위 알고리즘으로 생성되며 서버 통신 없이 브라우저에서 직접 계산하므로 외부 조작이 불가능합니다." },
            { q: "모바일에서도 사용 가능한가요?", a: "네, 반응형 디자인으로 PC, 태블릿, 모바일 모두에서 최적화되어 있습니다. 다크모드도 지원합니다." },
            { q: "사다리타기로 점심 메뉴를 어떻게 정하나요?", a: "'점심 메뉴' 프리셋 버튼을 클릭하면 인기 메뉴가 자동 입력됩니다. 참가자 이름만 입력하면 바로 시작할 수 있습니다." },
            { q: "레이스 모드와 순차 모드의 차이는?", a: "레이스 모드는 모든 참가자가 동시에 사다리를 타는 스피드 모드, 순차 모드는 한 명씩 차례대로 타는 서스펜스 모드입니다." },
            { q: "네이버 사다리타기와 뭐가 다른가요?", a: "듀얼 모드(레이스+순차), 인기 프리셋(점심/벌칙/커피 등), 다크모드, 한영 이중언어 지원, 광고 없는 깔끔한 UI가 차별점입니다." },
            { q: "개인정보는 안전한가요?", a: "모든 데이터는 브라우저에서만 처리되며 서버로 전송되지 않습니다. 페이지를 닫으면 자동 삭제됩니다." }
        ],
        tipsTitle: "사다리타기 꿀팁",
        tips: [
            "결과에 긍정적인 항목(칭찬 듣기)과 부정적인 항목(커피 쏘기)을 섞으면 더 스릴 있는 게임이 됩니다.",
            "참가자가 많을수록 사다리가 복잡해져 결과 예측이 더 어려워집니다.",
            "프리셋 템플릿을 활용하면 입력 시간을 절약할 수 있습니다.",
            "같은 사다리로 여러 번 게임하면 같은 결과가 나옵니다. 새 게임을 원하면 '다시 하기'를 눌러 사다리를 다시 생성하세요."
        ],
        fairnessTitle: "공정성 보장",
        fairnessDesc: "이 사다리타기 게임은 완전한 무작위 알고리즘을 사용합니다. 사다리의 가로선이 무작위로 배치되어 모든 참가자가 동일한 확률로 각 결과에 도달할 수 있습니다. 특히, 모든 계산이 브라우저 내에서 이루어지며 서버와 통신하지 않으므로 외부 조작이 원천적으로 불가능합니다. 누구도 결과를 예측하거나 조작할 수 없으므로 완벽하게 공정한 결정이 가능합니다.",
        privacyTitle: "개인정보 안내",
        privacyDesc: "참가자 이름과 결과 항목은 브라우저에서만 처리되며, 외부 서버로 전송되거나 저장되지 않습니다. 사다리타기 게임의 모든 데이터는 페이지를 닫으면 자동으로 삭제됩니다. 개인정보를 수집하거나 저장하지 않습니다."
    },
    en: {
        ariaLabel: "Ghost Leg Ladder Game Guide",
        section1Title: "What is Ghost Leg (Ladder Game)?",
        section1Desc: "Ghost Leg (also known as Amidakuji or Ladder Lottery) is a traditional Asian method for making fair random decisions. Participants start at the top of a ladder and move downward, following horizontal rungs when they encounter them, eventually reaching an unpredictable result. Mathematically, it uses the principle of permutations, guaranteeing each participant is matched with exactly one result with no duplicates.",
        section1Desc2: "This online Ghost Leg game lets you make fair decisions anytime, anywhere without paper and pen. Use it for lunch picks, penalty games, coffee bets, presentation order, duty assignments, and more.",
        featuresTitle: "Key Features",
        features: [
            { icon: "🎲", title: "2-20 Players", desc: "From small groups to classrooms and office teams. Automatically adjusts to match the number of participants." },
            { icon: "🏎️", title: "Dual Modes", desc: "Race mode (all players descend simultaneously) and Sequential mode (one at a time) for different experiences." },
            { icon: "⚡", title: "Popular Presets", desc: "Lunch pick, penalty game, coffee bet, turn order - start popular scenarios with one click." },
            { icon: "🔒", title: "Guaranteed Fairness", desc: "Generated with a fully random algorithm. Calculated entirely in your browser with no server communication - impossible to manipulate." }
        ],
        howToTitle: "How to Use Ghost Leg",
        howToSteps: [
            { name: "Select Mode", text: "Choose Race mode (all at once) or Sequential mode (one by one). Use preset buttons for popular scenarios." },
            { name: "Enter Players", text: "Enter participant names. Freely add or remove between 2-20 players." },
            { name: "Enter Results", text: "Enter result options. E.g., Chicken, Pizza, Winner, Loser, Buy Coffee, etc." },
            { name: "Generate & Start", text: "Click 'Generate Ladder' for a random ladder, then 'Start Game' to see results via animation." },
            { name: "Check & Share", text: "View results and share via messaging apps or social media with the share button." }
        ],
        section2Title: "When to Use Ghost Leg",
        section2Items: [
            { icon: "🍽️", title: "Choosing Lunch", desc: "\"What should we eat?\" Let the ladder decide between chicken, pizza, or noodles!" },
            { icon: "🎭", title: "Penalty Games", desc: "Fun way to select who gets the penalty in gatherings. Singing, dancing, buying drinks, etc." },
            { icon: "☕", title: "Coffee Bets", desc: "\"Who buys coffee today?\" Use the fair ladder game to decide." },
            { icon: "📋", title: "Turn Order", desc: "Presentation order, cleaning duty, meeting facilitator - decide fairly with no complaints." },
            { icon: "🎉", title: "Prize Draws", desc: "Fairly select winners for events, raffles, and gift exchanges." },
            { icon: "👩‍🏫", title: "Classroom Activities", desc: "Group formation, presenter selection, and role assignment for educational settings." }
        ],
        faqTitle: "Frequently Asked Questions",
        faqItems: [
            { q: "What is Ghost Leg (Ladder Game)?", a: "Ghost Leg (Amidakuji) is a fair random decision-making game where participants follow a ladder path downward to reach unpredictable results. Widely used in Asia for winner selection, role assignment, and penalty decisions." },
            { q: "How many players can participate?", a: "Between 2 to 20 participants. Result options automatically adjust to match the number of players." },
            { q: "Are the results fair? Can it be manipulated?", a: "Completely fair. Rungs are randomly generated and all calculations happen in your browser with no server communication, making external manipulation impossible." },
            { q: "Can I use it on mobile?", a: "Yes, responsive design optimized for PC, tablet, and mobile. Dark mode is also supported." },
            { q: "What's the difference between Race and Sequential modes?", a: "Race mode has all players descend simultaneously for excitement. Sequential mode has players take turns for suspense." },
            { q: "How do I use preset templates?", a: "Click a preset button to auto-fill results. Just enter player names and you're ready to play." },
            { q: "Can I share results?", a: "Yes, click the share button after the game to copy results for messaging apps and social media." },
            { q: "Is my data private?", a: "All data is processed in your browser only. Nothing is sent to any server. Data is automatically deleted when you close the page." }
        ],
        tipsTitle: "Ghost Leg Tips",
        tips: [
            "Mix positive (receive compliments) and negative (buy coffee) results for more thrilling games.",
            "More participants means a more complex ladder, making results harder to predict.",
            "Use preset templates to save time on setup.",
            "The same ladder gives the same results. Click 'Reset' to generate a new ladder for different outcomes."
        ],
        fairnessTitle: "Guaranteed Fairness",
        fairnessDesc: "This ladder game uses a completely random algorithm. Horizontal rungs are randomly placed, ensuring all participants have equal probability of reaching any result. All calculations are performed in your browser with no server communication, making external manipulation fundamentally impossible. No one can predict or manipulate the outcome, guaranteeing perfectly fair decisions.",
        privacyTitle: "Privacy Notice",
        privacyDesc: "Participant names and result items are processed entirely in your browser and are never sent to or stored on any external server. All ladder game data is automatically deleted when you close the page. We do not collect or store any personal information."
    }
};

export default async function LadderGamePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    setRequestLocale(locale);
    const allMessages = await getMessages({ locale });
    const toolMessages = { LadderGame: (allMessages as Record<string, unknown>).LadderGame, Common: (allMessages as Record<string, unknown>).Common };

    const seo = seoContent[locale as 'ko' | 'en'] || seoContent.ko;
    const faqSchema = generateFaqSchema(locale);
    const howToSchema = generateHowToSchema(locale);
    const webAppSchema = generateWebAppSchema(locale);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />

            <NextIntlClientProvider messages={toolMessages}>
            <LadderGameClient />
            </NextIntlClientProvider>

            <article className="seo-article" aria-label={seo.ariaLabel}>
                {/* 1. 도구 설명 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.section1Title}</h2>
                    <p className="seo-text">{seo.section1Desc}</p>
                    <p className="seo-text">{seo.section1Desc2}</p>
                </section>

                {/* 2. 주요 기능 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.featuresTitle}</h2>
                    <div className="seo-card-grid">
                        {seo.features.map((feature: { icon: string; title: string; desc: string }, index: number) => (
                            <div key={index} className="seo-card">
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{feature.icon}</div>
                                <h3 className="seo-card-title">{feature.title}</h3>
                                <p className="seo-card-desc">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. 사용법 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.howToTitle}</h2>
                    <ol className="seo-howto-list">
                        {seo.howToSteps.map((step: { name: string; text: string }, index: number) => (
                            <li key={index}>
                                <strong>{step.name}</strong> &mdash; {step.text}
                            </li>
                        ))}
                    </ol>
                </section>

                {/* 4. 활용 사례 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.section2Title}</h2>
                    <div className="seo-card-grid">
                        {seo.section2Items.map((item: { icon: string; title: string; desc: string }, index: number) => (
                            <div key={index} className="seo-card">
                                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{item.icon}</div>
                                <h3 className="seo-card-title">{item.title}</h3>
                                <p className="seo-card-desc">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. FAQ */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.faqTitle}</h2>
                    {seo.faqItems.map((faq: { q: string; a: string }, index: number) => (
                        <details key={index} className="seo-faq-item">
                            <summary>{faq.q}</summary>
                            <p>{faq.a}</p>
                        </details>
                    ))}
                </section>

                {/* 6. 팁 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.tipsTitle}</h2>
                    <ul className="seo-usecase-list">
                        {seo.tips.map((tip: string, index: number) => (
                            <li key={index}>{tip}</li>
                        ))}
                    </ul>
                </section>

                {/* 7. 공정성 보장 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.fairnessTitle}</h2>
                    <p className="seo-text">{seo.fairnessDesc}</p>
                </section>

                {/* 8. 개인정보 안내 */}
                <section className="seo-section">
                    <h2 className="seo-section-title">{seo.privacyTitle}</h2>
                    <p className="seo-text">{seo.privacyDesc}</p>
                </section>
            </article>
        </>
    );
}
