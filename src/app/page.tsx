import ToolCard from "@/components/ToolCard";
import { FaBarcode, FaCalculator, FaClock, FaSmile, FaDice, FaMoneyBillWave, FaSpellCheck, FaExchangeAlt, FaPiggyBank, FaPercent, FaUserClock } from "react-icons/fa";

export default function Home() {
    return (
        <div className="container">
            <div className="intro-section">
                <h1 className="tools-heading">편리한 웹 도구 모음</h1>
                <p>
                    Tani DevTool은 일상생활과 업무에 필요한 다양한 웹 도구를 무료로 제공합니다. 계산기, 시계, 이모지 모음 등 필요한 도구를 한 곳에서 간편하게 사용해보세요.
                </p>
                <p>
                    모든 도구는 PC와 모바일에서 모두 편리하게 사용할 수 있으며, 인터넷만 연결되어 있다면 언제 어디서나 접근 가능합니다.
                </p>
            </div>

            <div className="tools-container" id="toolsContainer">
                <ToolCard href="/barcode" icon={<FaBarcode />} title="바코드생성기" />
                <ToolCard href="/calculator" icon={<FaCalculator />} title="계산기" />
                <ToolCard href="/clock" icon={<FaClock />} title="대한민국 시계" />
                <ToolCard href="/special-characters" icon={<FaSmile />} title="이모지 모음" />
                <ToolCard href="/lotto" icon={<FaDice />} title="로또번호 AI추천" />
                <ToolCard href="/pay-cal" icon={<FaMoneyBillWave />} title="월급계산기" />
                <ToolCard href="/spell-checker" icon={<FaSpellCheck />} title="맞춤법 검사기" />
                <ToolCard href="/money-converter" icon={<FaExchangeAlt />} title="환율계산기" />
                <ToolCard href="/severance-calculator" icon={<FaPiggyBank />} title="퇴직금계산기" />
                <ToolCard href="/interest-calculator" icon={<FaPercent />} title="이자계산기" />
                <ToolCard href="/korean-age-calculator" icon={<FaUserClock />} title="만나이 계산기" />
            </div>

            <section className="popular-tools">
                <div className="container">
                    <h2>인기 웹 도구</h2>
                    <div className="tools-container">
                        <ToolCard href="/calculator" icon={<FaCalculator />} title="계산기" />
                        <ToolCard href="/clock" icon={<FaClock />} title="대한민국 시계" />
                        <ToolCard href="/special-characters" icon={<FaSmile />} title="이모지 모음" />
                    </div>
                </div>
            </section>
        </div>
    );
}
