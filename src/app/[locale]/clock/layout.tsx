import { Roboto_Mono } from 'next/font/google';
import FullscreenButton from "@/components/FullscreenButton";
import ClockSidebar from "@/components/ClockSidebar";

const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-roboto-mono',
});

export default function ClockLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <div className={`app-main-container ${robotoMono.variable}`}>
            <style jsx global>{`
                .app-main-container {
                    display: flex;
                    width: 100%;
                    min-height: 100vh;
                    background-color: #2c2c2c;
                    color: white;
                    margin: -30px 0;
                    overflow: hidden;
                    font-family: 'Noto Sans KR', sans-serif;
                }
                
                /* Timer Input Responsive Class */
                .timer-input {
                    background-color: transparent;
                    border: 1px solid #444;
                    color: #00ff9d;
                    font-size: 3rem;
                    width: 100px;
                    text-align: center;
                    border-radius: 8px;
                    padding: 10px;
                }

                /* Mobile Sidebar & Timer */
                @media (max-width: 600px) {
                    .timer-input {
                        width: 22vw;
                        font-size: 2rem;
                        padding: 5px;
                    }
                }
               
                /* Content Area */
                .content-area {
                    flex: 1;
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                /* Shared Digital Style */
                .digital-text {
                    font-family: var(--font-roboto-mono), 'Courier New', monospace;
                    font-weight: bold;
                    color: #00ff9d;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                
                /* Digital Button Style */
                .digital-btn {
                    padding: 15px 32px;
                    font-size: 1.2rem;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 700;
                    min-width: 120px;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .digital-btn:active {
                    transform: translateY(2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                .btn-green { 
                    background-color: #00b894; 
                    color: white; 
                }
                .btn-green:hover { background-color: #00a383; }

                .btn-yellow { 
                    background-color: #fdcb6e; 
                    color: #2d3436; 
                }
                .btn-yellow:hover { background-color: #e1b12c; }

                .btn-red { 
                    background-color: #ff7675; 
                    color: white; 
                }
                .btn-red:hover { background-color: #d63031; }

            `}</style>
            
            {/* Sidebar Navigation */}
            <ClockSidebar />

            {/* Main Content */}
            <div className="content-area">
                <FullscreenButton />
                {children}
            </div>
        </div>
    );
}
