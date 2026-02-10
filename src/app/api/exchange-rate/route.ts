import { NextResponse } from 'next/server';
import { API_KEYS, API_URLS } from '@/config';

export async function GET() {
    const apiKey = API_KEYS.KOREA_EXIM;
    
    // YYYYMMDD format for today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const searchDate = `${year}${month}${day}`;

    // For debugging/fallback if today is holiday (or weekend) and returns empty array, 
    // the API might return empty. In a real app we might want to check yesterday if today is empty.
    // However, for this implementation we stick to the basic requirement.

    const url = `${API_URLS.KOREA_EXIM}?authkey=${apiKey}&searchdate=${searchDate}&data=AP01`;

    // Fallback Mock Data (User Provided)
    const mockData = [{"result":1,"cur_unit":"AED","ttb":"399.87","tts":"407.94","deal_bas_r":"403.91","bkpr":"403","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"403","kftc_deal_bas_r":"403.91","cur_nm":"아랍에미리트 디르함"},{"result":1,"cur_unit":"AUD","ttb":"984.08","tts":"1,003.97","deal_bas_r":"994.03","bkpr":"994","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"994","kftc_deal_bas_r":"994.03","cur_nm":"호주 달러"},{"result":1,"cur_unit":"BHD","ttb":"3,894.77","tts":"3,973.46","deal_bas_r":"3,934.12","bkpr":"3,934","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"3,934","kftc_deal_bas_r":"3,934.12","cur_nm":"바레인 디나르"},{"result":1,"cur_unit":"BND","ttb":"1,142.8","tts":"1,165.89","deal_bas_r":"1,154.35","bkpr":"1,154","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,154","kftc_deal_bas_r":"1,154.35","cur_nm":"브루나이 달러"},{"result":1,"cur_unit":"CAD","ttb":"1,072.76","tts":"1,094.43","deal_bas_r":"1,083.6","bkpr":"1,083","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,083","kftc_deal_bas_r":"1,083.6","cur_nm":"캐나다 달러"},{"result":1,"cur_unit":"CHF","ttb":"1,865.31","tts":"1,903","deal_bas_r":"1,884.16","bkpr":"1,884","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,884","kftc_deal_bas_r":"1,884.16","cur_nm":"스위스 프랑"},{"result":1,"cur_unit":"CNH","ttb":"208.98","tts":"213.21","deal_bas_r":"211.1","bkpr":"211","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"211","kftc_deal_bas_r":"211.1","cur_nm":"위안화"},{"result":1,"cur_unit":"DKK","ttb":"231.89","tts":"236.58","deal_bas_r":"234.24","bkpr":"234","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"234","kftc_deal_bas_r":"234.24","cur_nm":"덴마아크 크로네"},{"result":1,"cur_unit":"EUR","ttb":"1,732.24","tts":"1,767.23","deal_bas_r":"1,749.74","bkpr":"1,749","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,749","kftc_deal_bas_r":"1,749.74","cur_nm":"유로"},{"result":1,"cur_unit":"GBP","ttb":"1,984.54","tts":"2,024.63","deal_bas_r":"2,004.59","bkpr":"2,004","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"2,004","kftc_deal_bas_r":"2,004.59","cur_nm":"영국 파운드"},{"result":1,"cur_unit":"HKD","ttb":"188.82","tts":"192.63","deal_bas_r":"190.73","bkpr":"190","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"190","kftc_deal_bas_r":"190.73","cur_nm":"홍콩 달러"},{"result":1,"cur_unit":"IDR(100)","ttb":"8.76","tts":"8.93","deal_bas_r":"8.85","bkpr":"8","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"8","kftc_deal_bas_r":"8.85","cur_nm":"인도네시아 루피아"},{"result":1,"cur_unit":"JPY(100)","ttb":"940.5","tts":"959.51","deal_bas_r":"950.01","bkpr":"950","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"950","kftc_deal_bas_r":"950.01","cur_nm":"일본 옌"},{"result":1,"cur_unit":"KRW","ttb":"0","tts":"0","deal_bas_r":"1","bkpr":"1","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1","kftc_deal_bas_r":"1","cur_nm":"한국 원"},{"result":1,"cur_unit":"KWD","ttb":"4,782.67","tts":"4,879.28","deal_bas_r":"4,830.98","bkpr":"4,830","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"4,830","kftc_deal_bas_r":"4,830.98","cur_nm":"쿠웨이트 디나르"},{"result":1,"cur_unit":"MYR","ttb":"361.35","tts":"368.66","deal_bas_r":"365.01","bkpr":"365","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"365","kftc_deal_bas_r":"365.01","cur_nm":"말레이지아 링기트"},{"result":1,"cur_unit":"NOK","ttb":"146.45","tts":"149.4","deal_bas_r":"147.93","bkpr":"147","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"147","kftc_deal_bas_r":"147.93","cur_nm":"노르웨이 크로네"},{"result":1,"cur_unit":"NZD","ttb":"857.78","tts":"875.11","deal_bas_r":"866.45","bkpr":"866","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"866","kftc_deal_bas_r":"866.45","cur_nm":"뉴질랜드 달러"},{"result":1,"cur_unit":"SAR","ttb":"391.54","tts":"399.45","deal_bas_r":"395.5","bkpr":"395","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"395","kftc_deal_bas_r":"395.5","cur_nm":"사우디 리얄"},{"result":1,"cur_unit":"SEK","ttb":"160.19","tts":"163.42","deal_bas_r":"161.81","bkpr":"161","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"161","kftc_deal_bas_r":"161.81","cur_nm":"스웨덴 크로나"},{"result":1,"cur_unit":"SGD","ttb":"1,142.8","tts":"1,165.89","deal_bas_r":"1,154.35","bkpr":"1,154","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,154","kftc_deal_bas_r":"1,154.35","cur_nm":"싱가포르 달러"},{"result":1,"cur_unit":"THB","ttb":"47.19","tts":"48.14","deal_bas_r":"47.67","bkpr":"47","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"47","kftc_deal_bas_r":"47.67","cur_nm":"태국 바트"},{"result":1,"cur_unit":"USD","ttb":"1,468.56","tts":"1,498.23","deal_bas_r":"1,483.4","bkpr":"1,483","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,483","kftc_deal_bas_r":"1,483.4","cur_nm":"미국 달러"}];

    try {
        const response = await fetch(url, {
            next: { revalidate: 90 }, // Cache for 90 seconds
        });

        if (!response.ok) {
            console.warn(`API responded with status: ${response.status}. Using fallback data.`);
            return NextResponse.json(mockData);
        }

        const data = await response.json();
        
        // Check if data is empty array (common in holiday/weekend)
        if (Array.isArray(data) && data.length === 0) {
            console.warn("API returned empty array. Using fallback data.");
            return NextResponse.json(mockData);
        }
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Exchange Rate API Error, using fallback:', error);
        return NextResponse.json(mockData);
    }
}
