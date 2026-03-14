export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex justify-center py-12 px-4 sm:px-6">
      <main className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">개인정보처리방침</h1>
          <p className="text-sm text-gray-400">시행일: 2025년 1월 1일</p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* 1. 수집 항목 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">1</span>
            수집하는 개인정보 항목
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              본 서비스는 회원가입 및 로그인 방식에 따라 아래와 같은 개인정보를 수집합니다.
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b">수집 방법</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b">수집 항목</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5">이메일 회원가입</td>
                    <td className="px-4 py-2.5">이메일 주소, 비밀번호(암호화 저장), 닉네임</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5">카카오 로그인</td>
                    <td className="px-4 py-2.5">카카오 계정 이메일, 닉네임, 프로필 사진</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5">네이버 로그인</td>
                    <td className="px-4 py-2.5">네이버 계정 이메일, 닉네임, 프로필 사진</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">구글 로그인</td>
                    <td className="px-4 py-2.5">구글 계정 이메일, 이름, 프로필 사진</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ※ SNS 로그인 시 해당 플랫폼에서 제공하는 정보만 수집되며, 비밀번호 등 민감정보는 수집하지 않습니다.
            </p>
          </div>
        </section>

        {/* 2. 이용 목적 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">2</span>
            개인정보의 이용 목적
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>회원 식별 및 로그인 서비스 제공</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>서비스 이용 내역 저장 및 맞춤 서비스 제공</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>고객 문의 및 불만 처리</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>서비스 개선 및 신규 기능 개발</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>광고 서비스(Google AdSense) 운영 및 광고 최적화</li>
            </ul>
          </div>
        </section>

        {/* 3. 보유 및 이용 기간 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">3</span>
            개인정보의 보유 및 이용 기간
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              수집된 개인정보는 회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">전자상거래 계약 및 청약철회 기록</span>
                <span className="text-blue-600 font-semibold">5년</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">소비자 불만 및 분쟁 처리 기록</span>
                <span className="text-blue-600 font-semibold">3년</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">로그 기록</span>
                <span className="text-blue-600 font-semibold">3개월</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 제3자 제공 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">4</span>
            개인정보의 제3자 제공
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              본 서비스는 아래의 경우에 한해 제3자 서비스를 이용합니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>Google Analytics — 서비스 이용 통계 분석</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>Google AdSense — 맞춤형 광고 제공</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>카카오 로그인 API — 소셜 로그인 처리</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>네이버 로그인 API — 소셜 로그인 처리</li>
              <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">&#8226;</span>Google OAuth API — 소셜 로그인 처리</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              ※ 각 제3자 서비스의 개인정보 처리방침은 해당 플랫폼의 방침을 따릅니다.
            </p>
          </div>
        </section>

        {/* 5. 파기 절차 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">5</span>
            개인정보의 파기 절차 및 방법
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              개인정보는 보유 기간이 만료되거나 처리 목적이 달성된 경우 지체 없이 파기합니다.
              전자적 파일 형태로 저장된 개인정보는 복구 불가능한 방법으로 영구 삭제하며,
              종이 문서는 분쇄 또는 소각합니다.
            </p>
          </div>
        </section>

        {/* 6. 쿠키 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">6</span>
            쿠키(Cookie) 사용 안내
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              본 서비스는 로그인 상태 유지 및 맞춤형 광고 제공을 위해 쿠키를 사용합니다.
              브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 서비스 이용이 제한될 수 있습니다.
            </p>
          </div>
        </section>

        {/* 7. 아동 보호 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">7</span>
            아동 개인정보 보호
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              본 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
              만 14세 미만 아동은 회원가입이 제한됩니다.
            </p>
          </div>
        </section>

        {/* 8. 이용자 권리 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">8</span>
            이용자의 권리
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제, 처리 정지를
              요청할 수 있습니다. 요청은 아래 문의처로 연락 주시면 지체 없이 처리하겠습니다.
            </p>
          </div>
        </section>

        {/* 9. 방침 변경 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">9</span>
            개인정보처리방침 변경 안내
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              본 방침은 법령 또는 서비스 변경에 따라 내용이 변경될 수 있으며,
              변경 시 앱 및 웹사이트 공지사항을 통해 사전 안내합니다.
            </p>
          </div>
        </section>

        {/* 10. 문의 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold">10</span>
            문의
          </h2>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <p className="text-sm text-gray-600 mb-3">
              개인정보 관련 문의 및 불만 사항은 아래로 연락 주세요.
            </p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">개인정보 보호책임자</span>
                권득천 대표
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">이메일</span>
                admin@teck-tani.com
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">처리 기간</span>
                접수 후 7영업일 이내
              </p>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            본 개인정보처리방침은 2025년 1월 1일부터 적용됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
