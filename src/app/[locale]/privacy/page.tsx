export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-400 mb-10 border-b pb-4">
        시행일: 2025년 1월 1일
      </p>

      {/* 1. 수집 항목 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          1. 수집하는 개인정보 항목
        </h2>
        <p className="leading-relaxed text-gray-600 mb-3">
          본 서비스는 회원가입 및 로그인 방식에 따라 아래와 같은 개인정보를 수집합니다.
        </p>
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left px-4 py-2 border-b">수집 방법</th>
              <th className="text-left px-4 py-2 border-b">수집 항목</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            <tr className="border-b">
              <td className="px-4 py-2">이메일 회원가입</td>
              <td className="px-4 py-2">이메일 주소, 비밀번호(암호화 저장), 닉네임</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">카카오 로그인</td>
              <td className="px-4 py-2">카카오 계정 이메일, 닉네임, 프로필 사진</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">네이버 로그인</td>
              <td className="px-4 py-2">네이버 계정 이메일, 닉네임, 프로필 사진</td>
            </tr>
            <tr>
              <td className="px-4 py-2">구글 로그인</td>
              <td className="px-4 py-2">구글 계정 이메일, 이름, 프로필 사진</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-gray-500 mt-3">
          ※ SNS 로그인 시 해당 플랫폼에서 제공하는 정보만 수집되며,
          비밀번호 등 민감정보는 수집하지 않습니다.
        </p>
      </section>

      {/* 2. 이용 목적 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          2. 개인정보의 이용 목적
        </h2>
        <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
          <li>회원 식별 및 로그인 서비스 제공</li>
          <li>서비스 이용 내역 저장 및 맞춤 서비스 제공</li>
          <li>고객 문의 및 불만 처리</li>
          <li>서비스 개선 및 신규 기능 개발</li>
          <li>광고 서비스(Google AdSense) 운영 및 광고 최적화</li>
        </ul>
      </section>

      {/* 3. 보유 및 이용 기간 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          3. 개인정보의 보유 및 이용 기간
        </h2>
        <p className="leading-relaxed text-gray-600">
          수집된 개인정보는 회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 의해
          보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 mt-3 text-sm">
          <li>전자상거래 계약 및 청약철회 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 및 분쟁 처리 기록: 3년 (전자상거래법)</li>
          <li>로그 기록: 3개월 (통신비밀보호법)</li>
        </ul>
      </section>

      {/* 4. 제3자 제공 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          4. 개인정보의 제3자 제공
        </h2>
        <p className="leading-relaxed text-gray-600 mb-3">
          본 서비스는 아래의 경우에 한해 제3자 서비스를 이용합니다.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
          <li>Google Analytics — 서비스 이용 통계 분석</li>
          <li>Google AdSense — 맞춤형 광고 제공</li>
          <li>카카오 로그인 API — 소셜 로그인 처리</li>
          <li>네이버 로그인 API — 소셜 로그인 처리</li>
          <li>Google OAuth API — 소셜 로그인 처리</li>
        </ul>
        <p className="text-sm text-gray-500 mt-3">
          ※ 각 제3자 서비스의 개인정보 처리방침은 해당 플랫폼의 방침을 따릅니다.
        </p>
      </section>

      {/* 5. 파기 절차 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          5. 개인정보의 파기 절차 및 방법
        </h2>
        <p className="leading-relaxed text-gray-600">
          개인정보는 보유 기간이 만료되거나 처리 목적이 달성된 경우 지체 없이 파기합니다.
          전자적 파일 형태로 저장된 개인정보는 복구 불가능한 방법으로 영구 삭제하며,
          종이 문서는 분쇄 또는 소각합니다.
        </p>
      </section>

      {/* 6. 쿠키 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          6. 쿠키(Cookie) 사용 안내
        </h2>
        <p className="leading-relaxed text-gray-600">
          본 서비스는 로그인 상태 유지 및 맞춤형 광고 제공을 위해 쿠키를 사용합니다.
          브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 서비스
          이용이 제한될 수 있습니다.
        </p>
      </section>

      {/* 7. 아동 보호 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          7. 아동 개인정보 보호
        </h2>
        <p className="leading-relaxed text-gray-600">
          본 서비스는 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
          만 14세 미만 아동은 회원가입이 제한됩니다.
        </p>
      </section>

      {/* 8. 이용자 권리 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          8. 이용자의 권리
        </h2>
        <p className="leading-relaxed text-gray-600">
          이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제, 처리 정지를
          요청할 수 있습니다. 요청은 아래 문의처로 연락 주시면 지체 없이 처리하겠습니다.
        </p>
      </section>

      {/* 9. 방침 변경 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          9. 개인정보처리방침 변경 안내
        </h2>
        <p className="leading-relaxed text-gray-600">
          본 방침은 법령 또는 서비스 변경에 따라 내용이 변경될 수 있으며,
          변경 시 앱 및 웹사이트 공지사항을 통해 사전 안내합니다.
        </p>
      </section>

      {/* 10. 문의 */}
      <section className="mb-4">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          10. 문의
        </h2>
        <p className="leading-relaxed text-gray-600">
          개인정보 관련 문의 및 불만 사항은 아래로 연락 주세요.
        </p>
        <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p>· 이메일: admin@teck-tani.com</p>
          <p>· 처리 기간: 접수 후 7영업일 이내</p>
        </div>
      </section>
    </main>
  );
}
