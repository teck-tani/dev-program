export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>

      <p className="text-sm text-gray-500 mb-8">
        시행일: 2025년 1월 1일
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">1. 수집하는 개인정보 항목</h2>
        <p>본 서비스는 별도의 개인정보를 수집하지 않습니다.
        다만, 광고 서비스(Google AdSense) 운영을 위해 쿠키 및 사용 데이터가 수집될 수 있습니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">2. 개인정보의 이용 목적</h2>
        <p>수집된 데이터는 서비스 개선 및 광고 최적화 목적으로만 사용됩니다.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">3. 제3자 제공</h2>
        <p>Google Analytics, Google AdSense 등 제3자 서비스가 사용됩니다.
        자세한 내용은 Google 개인정보처리방침을 참고하세요.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">4. 문의</h2>
        <p>이메일: admin@teck-tani.com</p>
      </section>
    </main>
  );
}
