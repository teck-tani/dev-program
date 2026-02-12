"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import styles from "./timer.module.css";

type AmbientType = "rain" | "cafe" | "whiteNoise" | "fire" | "ocean" | "forest";

const AMBIENT_ICONS: Record<AmbientType, string> = {
    rain: "🌧️", cafe: "☕", whiteNoise: "📻", fire: "🔥", ocean: "🌊", forest: "🌲",
};
const AMBIENT_TYPES: AmbientType[] = ["rain", "cafe", "whiteNoise", "fire", "ocean", "forest"];

function createNoise(ctx: AudioContext, type: AmbientType): { source: AudioBufferSourceNode; gain: GainNode } {
    const sampleRate = ctx.sampleRate;
    const duration = 4;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const gain = ctx.createGain();
    gain.gain.value = 0.15;

    for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        switch (type) {
            case "whiteNoise":
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                break;
            case "rain": {
                let b0 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const w = Math.random() * 2 - 1;
                    b0 = 0.98 * b0 + 0.02 * w;
                    data[i] = b0 * 3 + (Math.random() > 0.998 ? (Math.random() - 0.5) * 0.3 : 0);
                }
                break;
            }
            case "cafe":
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.3 + Math.sin(i / 800) * 0.05 + (Math.random() > 0.995 ? (Math.random() - 0.5) * 0.2 : 0);
                }
                break;
            case "fire": {
                let f0 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    f0 = 0.95 * f0 + 0.05 * (Math.random() * 2 - 1);
                    data[i] = f0 * 2 + Math.sin(i / 200 + Math.random()) * 0.1;
                }
                break;
            }
            case "ocean":
                for (let i = 0; i < bufferSize; i++) {
                    const wave = Math.sin((i / sampleRate) * Math.PI * 0.15) * 0.5 + 0.5;
                    data[i] = (Math.random() * 2 - 1) * wave * 0.8;
                }
                break;
            case "forest": {
                let b1 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    b1 = 0.99 * b1 + 0.01 * (Math.random() * 2 - 1);
                    data[i] = b1 * 2 + (Math.random() > 0.997 ? Math.sin(i / 30 + Math.random() * 100) * 0.15 : 0);
                }
                break;
            }
        }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    gain.connect(ctx.destination);
    return { source, gain };
}

export default function AmbientPlayer() {
    const t = useTranslations("Clock.Timer.ambient");
    const [active, setActive] = useState<AmbientType | null>(null);
    const [volume, setVolume] = useState(30);
    const ctxRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    const stop = useCallback(() => {
        if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current = null; }
        gainRef.current = null;
        setActive(null);
    }, []);

    const play = useCallback((type: AmbientType) => {
        stop();
        if (!ctxRef.current) ctxRef.current = new AudioContext();
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        const { source, gain } = createNoise(ctxRef.current, type);
        gain.gain.value = volume / 100 * 0.3;
        source.start();
        sourceRef.current = source;
        gainRef.current = gain;
        setActive(type);
    }, [stop, volume]);

    const toggle = useCallback((type: AmbientType) => {
        if (active === type) stop(); else play(type);
    }, [active, stop, play]);

    useEffect(() => {
        if (gainRef.current) gainRef.current.gain.value = volume / 100 * 0.3;
    }, [volume]);

    useEffect(() => { return () => { stop(); }; }, [stop]);

    return (
        <div className={styles.ambientCard}>
            <div className={styles.ambientTitle}>{t("title")}</div>
            <div className={styles.ambientGrid}>
                {AMBIENT_TYPES.map(type => (
                    <button key={type} onClick={() => toggle(type)}
                        className={`${styles.ambientBtn} ${active === type ? styles.ambientActive : ""}`}>
                        <span className={styles.ambientIcon}>{AMBIENT_ICONS[type]}</span>
                        <span className={styles.ambientLabel}>{t(type)}</span>
                    </button>
                ))}
            </div>
            {active && (
                <div className={styles.ambientVolume}>
                    <input type="range" min={0} max={100} value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className={styles.volumeSlider} />
                    <span className={styles.volumeValue}>{volume}%</span>
                </div>
            )}
        </div>
    );
}
