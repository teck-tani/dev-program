import type { Metadata } from "next";
import LottoClient from "./LottoClient";

export const metadata: Metadata = {
    title: "로또 번호 생성기 | 로또 예상번호 추천 & 당첨 확인",
    description: "빅데이터 분석 기반의 로또 번호 생성기입니다. 역대 당첨 번호 통계와 제외수, 고정수 기능을 활용하여 나만의 행운의 번호를 조합해보세요.",
    keywords: "로또 번호 생성기, 로또 예상번호, 로또, 로또 당첨 확인, 로또 번호 추천, 로또 통계, 로또 1등, 로또 자동 생성",
    openGraph: {
        title: "로또 번호 생성기 | 행운의 번호 추천",
        description: "과학적인 통계 분석으로 제공하는 로또 예상 번호. 이번 주 1등의 주인공은 바로 당신입니다.",
        type: "website",
    },
};

export default function LottoPage() {
    return <LottoClient />;
}
