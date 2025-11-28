import type { Metadata } from "next";
import SpecialCharactersClient from "./SpecialCharactersClient";

export const metadata: Metadata = {
    title: "이모지 모음 | 특수문자 이모티콘 복사 붙여넣기 | Tani DevTool",
    description: "인스타그램, 페이스북, 블로그에서 사용할 수 있는 다양한 이모지와 특수문자 모음입니다. 클릭 한 번으로 간편하게 복사해서 붙여넣기 하세요. 하트, 표정, 동물 등 카테고리별 제공.",
    keywords: "이모지 모음, 이모티콘 복사, 특수문자 모음, 인스타 이모지, 하트 이모티콘, 표정 이모지, 귀여운 특수문자, 이모지 복사 붙여넣기",
    openGraph: {
        title: "이모지 모음 | 클릭해서 복사하는 이모티콘",
        description: "SNS와 블로그를 꾸며줄 수천 가지 이모지 모음. 클릭하면 바로 복사됩니다.",
        type: "website",
    },
};

export default function SpecialCharactersPage() {
    return <SpecialCharactersClient />;
}
