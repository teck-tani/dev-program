"use client";

import { useState, useEffect } from "react";
import { FaExpand, FaCompress } from "react-icons/fa";

export default function ClockPage() {
    const [time, setTime] = useState({ hours: "00", minutes: "00", seconds: "00" });
    const [date, setDate] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();

            const hours = String(now.getHours()).padStart(2, "0");
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const seconds = String(now.getSeconds()).padStart(2, "0");

            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
            const dayName = dayNames[now.getDay()];

            setTime({ hours, minutes, seconds });
            setDate(`${year}년 ${month}월 ${day}일 ${dayName}요일`);
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div style={{
            margin: 0,
            padding: 0,
            backgroundColor: "#2c2c2c",
            color: "white",
            minHeight: "100vh",
            overflow: "hidden"
        }}>
            <button
                onClick={toggleFullscreen}
                style={{
                    position: "fixed",
                    top: "70px",
                    right: "10px",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "14px",
                    zIndex: 1000
                }}
            >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
                전체화면
            </button>

            <div style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                textAlign: "center"
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    marginBottom: "30px"
                }}>
                    <img src="https://flagcdn.com/w80/kr.png" alt="대한민국 국기" style={{ width: "90px", height: "auto" }} />
                    <div style={{ textAlign: "left" }}>
                        <h1 style={{ fontSize: "2.5em", margin: "0 0 2px 0", fontWeight: 700 }}>대한민국 시계</h1>
                    </div>
                </div>

                <div style={{
                    fontSize: "12em",
                    fontWeight: "bold",
                    color: "#00ff9d",
                    margin: 0,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    gap: "10px"
                }}>
                    {time.hours}:{time.minutes}
                    <span style={{ fontSize: "0.3em", color: "white", opacity: 0.9, marginTop: "20px" }}>
                        {time.seconds}
                    </span>
                </div>

                <div style={{ fontSize: "2.5em", marginTop: "30px", color: "#ffffff" }}>
                    {date}
                </div>
            </div>
        </div>
    );
}
