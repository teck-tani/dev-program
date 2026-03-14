import { locales } from '@/navigation';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';
export const revalidate = false;

export default function AccountDeletePage() {
  return (
    <div className="min-h-screen flex justify-center py-12 px-4 sm:px-6">
      <main className="w-full max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            성경 톡톡 계정 삭제 요청
          </h1>
          <p className="text-sm text-gray-400">Bible TokTok Account Deletion Request</p>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* 안내 */}
        <section className="mb-10">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              계정 삭제를 원하시면 아래 이메일로 요청해 주세요.
            </p>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
              <div className="space-y-2.5 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">이메일</span>
                  admin@teck-tani.com
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-blue-600">처리 기간</span>
                  요청 후 7영업일 이내
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 삭제 데이터 안내 */}
        <section className="mb-10">
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <p className="text-sm text-red-700 leading-relaxed">
              ※ 계정 삭제 시 기도제목, 간증글, Q&A 내용 등 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
          </div>
        </section>

        {/* 푸터 */}
        <div className="text-center pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            teck-tani.com
          </p>
        </div>
      </main>
    </div>
  );
}
