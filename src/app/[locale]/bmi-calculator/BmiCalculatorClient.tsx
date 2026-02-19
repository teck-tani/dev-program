"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, ReferenceLine
} from "recharts";

// ─── Types ──────────────────────────────────────────────
interface BmiResult {
    bmi: number;
    classification: string;
    normalWeightMin: number;
    normalWeightMax: number;
    isChild: boolean;
}

interface BmiHistoryEntry {
    id: string;
    timestamp: number;
    date: string;
    bmi: number;
    heightCm: number;
    weightKg: number;
    classification: string;
    ageMode: "adult" | "child";
    age?: number;
    gender?: "male" | "female";
}

// ─── Constants ──────────────────────────────────────────
const STORAGE_KEY = "bmi_calculator_history";
const MAX_HISTORY = 20;

const BMI_CATEGORIES = [
    { key: "underweight", min: 0, max: 18.5, color: "#3b82f6" },
    { key: "normal", min: 18.5, max: 25, color: "#22c55e" },
    { key: "overweight", min: 25, max: 30, color: "#eab308" },
    { key: "obeseClass1", min: 30, max: 35, color: "#f97316" },
    { key: "obeseClass2", min: 35, max: 40, color: "#ef4444" },
    { key: "obeseClass3", min: 40, max: 100, color: "#991b1b" },
];

const CHILD_BMI_CATEGORIES = [
    { key: "childUnderweight", color: "#3b82f6" },
    { key: "childNormal", color: "#22c55e" },
    { key: "childOverweight", color: "#eab308" },
    { key: "childObese", color: "#ef4444" },
];

// WHO BMI-for-age simplified percentile cutoffs (p5, p85, p95)
const CHILD_BMI_CUTOFFS: Record<number, { male: { p5: number; p85: number; p95: number }; female: { p5: number; p85: number; p95: number } }> = {
    2:  { male: { p5: 14.7, p85: 18.2, p95: 19.4 }, female: { p5: 14.4, p85: 18.0, p95: 19.1 } },
    3:  { male: { p5: 14.3, p85: 17.4, p95: 18.5 }, female: { p5: 14.0, p85: 17.2, p95: 18.3 } },
    4:  { male: { p5: 14.0, p85: 17.0, p95: 18.0 }, female: { p5: 13.7, p85: 16.8, p95: 18.0 } },
    5:  { male: { p5: 13.8, p85: 17.0, p95: 18.2 }, female: { p5: 13.5, p85: 16.8, p95: 18.2 } },
    6:  { male: { p5: 13.7, p85: 17.4, p95: 18.8 }, female: { p5: 13.4, p85: 17.1, p95: 18.8 } },
    7:  { male: { p5: 13.7, p85: 17.9, p95: 19.6 }, female: { p5: 13.4, p85: 17.6, p95: 19.6 } },
    8:  { male: { p5: 13.8, p85: 18.6, p95: 20.6 }, female: { p5: 13.5, p85: 18.3, p95: 20.6 } },
    9:  { male: { p5: 14.0, p85: 19.4, p95: 21.6 }, female: { p5: 13.7, p85: 19.1, p95: 21.8 } },
    10: { male: { p5: 14.2, p85: 20.1, p95: 22.7 }, female: { p5: 14.0, p85: 20.0, p95: 23.0 } },
    11: { male: { p5: 14.5, p85: 20.9, p95: 23.7 }, female: { p5: 14.4, p85: 20.8, p95: 24.1 } },
    12: { male: { p5: 15.0, p85: 21.6, p95: 24.6 }, female: { p5: 14.8, p85: 21.7, p95: 25.2 } },
    13: { male: { p5: 15.5, p85: 22.3, p95: 25.4 }, female: { p5: 15.3, p85: 22.5, p95: 26.1 } },
    14: { male: { p5: 16.1, p85: 23.0, p95: 26.0 }, female: { p5: 15.8, p85: 23.1, p95: 26.7 } },
    15: { male: { p5: 16.6, p85: 23.6, p95: 26.6 }, female: { p5: 16.3, p85: 23.5, p95: 27.1 } },
    16: { male: { p5: 17.1, p85: 24.2, p95: 27.1 }, female: { p5: 16.7, p85: 23.9, p95: 27.4 } },
    17: { male: { p5: 17.5, p85: 24.7, p95: 27.6 }, female: { p5: 17.0, p85: 24.1, p95: 27.6 } },
    18: { male: { p5: 17.8, p85: 25.0, p95: 27.8 }, female: { p5: 17.2, p85: 24.3, p95: 27.8 } },
    19: { male: { p5: 18.2, p85: 25.4, p95: 28.2 }, female: { p5: 17.4, p85: 24.5, p95: 27.9 } },
};

const TABLE_ROWS = [
    { key: "underweight", range: "< 18.5" },
    { key: "normal", range: "18.5 - 24.9" },
    { key: "overweight", range: "25.0 - 29.9" },
    { key: "obeseClass1", range: "30.0 - 34.9" },
    { key: "obeseClass2", range: "35.0 - 39.9" },
    { key: "obeseClass3", range: "40.0 +" },
];

const CHILD_TABLE_ROWS = [
    { key: "childUnderweight", range: "< 5th" },
    { key: "childNormal", range: "5th - 84th" },
    { key: "childOverweight", range: "85th - 94th" },
    { key: "childObese", range: "≥ 95th" },
];

// ─── Helper functions ───────────────────────────────────
function getAdultClassification(bmi: number): string {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    if (bmi < 35) return "obeseClass1";
    if (bmi < 40) return "obeseClass2";
    return "obeseClass3";
}

function getChildClassification(bmi: number, age: number, gender: "male" | "female"): string {
    const ageInt = Math.max(2, Math.min(19, Math.round(age)));
    const cutoffs = CHILD_BMI_CUTOFFS[ageInt]?.[gender];
    if (!cutoffs) return "childNormal";
    if (bmi < cutoffs.p5) return "childUnderweight";
    if (bmi < cutoffs.p85) return "childNormal";
    if (bmi < cutoffs.p95) return "childOverweight";
    return "childObese";
}

function getClassificationColor(classification: string): string {
    const adult = BMI_CATEGORIES.find(c => c.key === classification);
    if (adult) return adult.color;
    const child = CHILD_BMI_CATEGORIES.find(c => c.key === classification);
    return child?.color ?? "#64748b";
}

const lbToKg = (lb: number) => lb * 0.453592;
const kgToLb = (kg: number) => kg / 0.453592;
const ftInToCm = (ft: number, inches: number) => ft * 30.48 + inches * 2.54;

// ─── Component ──────────────────────────────────────────
export default function BmiCalculatorClient() {
    const tInput = useTranslations("BmiCalculator.input");
    const tResult = useTranslations("BmiCalculator.result");
    const tTable = useTranslations("BmiCalculator.table");
    const tChildTable = useTranslations("BmiCalculator.childTable");
    const tHistory = useTranslations("BmiCalculator.history");

    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Mode toggles
    const [ageMode, setAgeMode] = useState<"adult" | "child">("adult");
    const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

    // Metric inputs
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");

    // Imperial inputs
    const [heightFt, setHeightFt] = useState("");
    const [heightIn, setHeightIn] = useState("");
    const [weightLb, setWeightLb] = useState("");

    // Child inputs
    const [age, setAge] = useState("");
    const [gender, setGender] = useState<"male" | "female">("male");

    // Result
    const [result, setResult] = useState<BmiResult | null>(null);

    // History
    const [history, setHistory] = useState<BmiHistoryEntry[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Hydration
    useEffect(() => { setMounted(true); }, []);

    // Load history
    useEffect(() => {
        if (!mounted) return;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, [mounted]);

    // Chart data
    const chartData = useMemo(() => {
        return [...history]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(entry => ({ date: entry.date, bmi: entry.bmi }));
    }, [history]);

    // Save to history
    const saveToHistory = useCallback((entry: BmiHistoryEntry) => {
        setHistory(prev => {
            const updated = [entry, ...prev].slice(0, MAX_HISTORY);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    }, []);

    // Clear history
    const clearHistory = useCallback(() => {
        if (!confirm(tHistory("clearConfirm"))) return;
        setHistory([]);
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }, [tHistory]);

    // Delete single history entry
    const deleteHistoryEntry = useCallback((id: string) => {
        setHistory(prev => {
            const updated = prev.filter(e => e.id !== id);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    }, []);

    // Calculate BMI
    const calculateBmi = () => {
        let heightCm: number;
        let weightKg: number;

        if (unitSystem === "metric") {
            heightCm = parseFloat(height);
            weightKg = parseFloat(weight);
        } else {
            const ft = parseFloat(heightFt) || 0;
            const inches = parseFloat(heightIn) || 0;
            heightCm = ftInToCm(ft, inches);
            weightKg = lbToKg(parseFloat(weightLb) || 0);
        }

        if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return;

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        const bmiRounded = Math.round(bmi * 100) / 100;

        let classification: string;
        const isChild = ageMode === "child";

        if (isChild) {
            const ageVal = parseFloat(age);
            if (!ageVal || ageVal < 2 || ageVal > 19) return;
            classification = getChildClassification(bmi, ageVal, gender);
        } else {
            classification = getAdultClassification(bmi);
        }

        const normalWeightMin = Math.round(18.5 * heightM * heightM * 10) / 10;
        const normalWeightMax = Math.round(24.9 * heightM * heightM * 10) / 10;

        setResult({
            bmi: bmiRounded,
            classification,
            normalWeightMin: unitSystem === "imperial" ? Math.round(kgToLb(normalWeightMin) * 10) / 10 : normalWeightMin,
            normalWeightMax: unitSystem === "imperial" ? Math.round(kgToLb(normalWeightMax) * 10) / 10 : normalWeightMax,
            isChild,
        });

        // Save to history
        const entry: BmiHistoryEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            date: new Date().toISOString().split("T")[0],
            bmi: bmiRounded,
            heightCm: Math.round(heightCm * 10) / 10,
            weightKg: Math.round(weightKg * 10) / 10,
            classification,
            ageMode,
            ...(isChild ? { age: parseFloat(age), gender } : {}),
        };
        saveToHistory(entry);
    };

    const handleReset = () => {
        setHeight("");
        setWeight("");
        setHeightFt("");
        setHeightIn("");
        setWeightLb("");
        setAge("");
        setGender("male");
        setResult(null);
    };

    // Gauge position (BMI 10~45 range)
    const getGaugePosition = (bmi: number) => {
        const min = 10;
        const max = 45;
        const clamped = Math.max(min, Math.min(max, bmi));
        return ((clamped - min) / (max - min)) * 100;
    };

    const getShareText = () => {
        if (!result) return "";
        const cls = tResult(result.classification);
        const wu = unitSystem === "imperial" ? tResult("weightUnitLb") : tResult("weightUnit");
        let text = `⚖️ BMI ${tResult("title")}\n━━━━━━━━━━━━━━\nBMI: ${result.bmi.toFixed(2)} (${cls})`;
        if (!result.isChild) {
            text += `\n${tResult("normalRange")}: ${result.normalWeightMin} ~ ${result.normalWeightMax} ${wu}`;
        }
        text += `\n\n📍 teck-tani.com/bmi-calculator`;
        return text;
    };

    // Reusable styles
    const cardStyle: React.CSSProperties = {
        background: isDark ? "#1e293b" : "#ffffff",
        borderRadius: 16,
        padding: "24px 20px",
        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
        marginBottom: 20,
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontWeight: 600,
        fontSize: "0.9rem",
        marginBottom: 6,
        color: isDark ? "#e2e8f0" : "#334155",
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "14px 16px",
        borderRadius: 10,
        border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
        background: isDark ? "#0f172a" : "#f8fafc",
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontSize: "1.2rem",
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box" as const,
    };

    const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
        flex: 1,
        padding: "10px 12px",
        borderRadius: 8,
        border: "none",
        background: active ? "#3b82f6" : (isDark ? "#0f172a" : "#f1f5f9"),
        color: active ? "#ffffff" : (isDark ? "#94a3b8" : "#64748b"),
        fontSize: "0.85rem",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.2s",
    });

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* ─── Mode Toggle (Adult / Child) ─── */}
            <div style={{
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 10,
                background: isDark ? "#1e293b" : "#f1f5f9",
                marginBottom: 8,
            }}>
                <button onClick={() => { setAgeMode("adult"); setResult(null); }} style={toggleBtnStyle(ageMode === "adult")}>
                    {tInput("modeAdult")}
                </button>
                <button onClick={() => { setAgeMode("child"); setResult(null); }} style={toggleBtnStyle(ageMode === "child")}>
                    {tInput("modeChild")}
                </button>
            </div>

            {/* ─── Unit Toggle (Metric / Imperial) ─── */}
            <div style={{
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 10,
                background: isDark ? "#1e293b" : "#f1f5f9",
                marginBottom: 16,
            }}>
                <button onClick={() => { setUnitSystem("metric"); setResult(null); }} style={toggleBtnStyle(unitSystem === "metric")}>
                    {tInput("unitMetric")}
                </button>
                <button onClick={() => { setUnitSystem("imperial"); setResult(null); }} style={toggleBtnStyle(unitSystem === "imperial")}>
                    {tInput("unitImperial")}
                </button>
            </div>

            {/* ─── Input Card ─── */}
            <div style={cardStyle}>
                {/* Height */}
                {unitSystem === "metric" ? (
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>{tInput("height")}</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder={tInput("heightPlaceholder")}
                            style={inputStyle}
                        />
                    </div>
                ) : (
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>{tInput("heightFt")} + {tInput("heightIn")}</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={heightFt}
                                onChange={(e) => setHeightFt(e.target.value)}
                                placeholder={tInput("heightFtPlaceholder")}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                value={heightIn}
                                onChange={(e) => setHeightIn(e.target.value)}
                                placeholder={tInput("heightInPlaceholder")}
                                style={{ ...inputStyle, flex: 1 }}
                            />
                        </div>
                    </div>
                )}

                {/* Weight */}
                <div style={{ marginBottom: unitSystem === "metric" && ageMode === "adult" ? 20 : 16 }}>
                    <label style={labelStyle}>
                        {unitSystem === "metric" ? tInput("weight") : tInput("weightLb")}
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={unitSystem === "metric" ? weight : weightLb}
                        onChange={(e) => unitSystem === "metric" ? setWeight(e.target.value) : setWeightLb(e.target.value)}
                        placeholder={unitSystem === "metric" ? tInput("weightPlaceholder") : tInput("weightLbPlaceholder")}
                        style={inputStyle}
                    />
                </div>

                {/* Child: Age + Gender */}
                {ageMode === "child" && (
                    <>
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>{tInput("age")}</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder={tInput("agePlaceholder")}
                                min={2}
                                max={19}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <label style={labelStyle}>{tInput("gender")}</label>
                            <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 10, background: isDark ? "#0f172a" : "#f1f5f9" }}>
                                <button onClick={() => setGender("male")} style={toggleBtnStyle(gender === "male")}>
                                    {tInput("genderMale")}
                                </button>
                                <button onClick={() => setGender("female")} style={toggleBtnStyle(gender === "female")}>
                                    {tInput("genderFemale")}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={calculateBmi}
                        style={{
                            flex: 1,
                            padding: "14px",
                            borderRadius: 10,
                            border: "none",
                            background: "#3b82f6",
                            color: "#ffffff",
                            fontSize: "1rem",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        {tInput("calculate")}
                    </button>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: "14px 20px",
                            borderRadius: 10,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#1e293b" : "#f1f5f9",
                            color: isDark ? "#94a3b8" : "#64748b",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {tInput("reset")}
                    </button>
                </div>
            </div>

            {/* ─── Result Card ─── */}
            {result && (
                <div style={cardStyle}>
                    <h2 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: isDark ? "#e2e8f0" : "#1e293b",
                        margin: "0 0 20px 0",
                    }}>
                        {tResult("title")}
                    </h2>

                    {/* BMI Value */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div style={{
                            fontSize: "3rem",
                            fontWeight: 800,
                            color: getClassificationColor(result.classification),
                            lineHeight: 1.2,
                        }}>
                            {result.bmi.toFixed(2)}
                        </div>
                        <div style={{
                            fontSize: "0.85rem",
                            color: isDark ? "#94a3b8" : "#64748b",
                            marginTop: 4,
                        }}>
                            {tResult("unit")}
                        </div>
                    </div>

                    {/* Classification Badge */}
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <span style={{
                            display: "inline-block",
                            padding: "8px 24px",
                            borderRadius: 20,
                            background: getClassificationColor(result.classification) + "1a",
                            color: getClassificationColor(result.classification),
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            border: `2px solid ${getClassificationColor(result.classification)}40`,
                        }}>
                            {tResult(result.classification)}
                        </span>
                        {result.isChild && age && (
                            <div style={{ marginTop: 8, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                                {tResult("childInfo", { age, gender: tInput(gender === "male" ? "genderMale" : "genderFemale") })}
                            </div>
                        )}
                    </div>

                    {/* BMI Gauge Bar */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            position: "relative",
                            height: 20,
                            borderRadius: 10,
                            overflow: "hidden",
                            background: isDark ? "#0f172a" : "#f1f5f9",
                        }}>
                            <div style={{
                                position: "absolute",
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: "linear-gradient(to right, #3b82f6 0%, #22c55e 24%, #eab308 43%, #f97316 57%, #ef4444 71%, #991b1b 100%)",
                                borderRadius: 10,
                            }} />
                            <div style={{
                                position: "absolute",
                                top: -2,
                                left: `${getGaugePosition(result.bmi)}%`,
                                transform: "translateX(-50%)",
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background: "#ffffff",
                                border: `3px solid ${getClassificationColor(result.classification)}`,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                                transition: "left 0.5s ease",
                            }} />
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 6,
                            fontSize: "0.7rem",
                            color: isDark ? "#64748b" : "#94a3b8",
                        }}>
                            <span>10</span>
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>35</span>
                            <span>40+</span>
                        </div>
                    </div>

                    {/* Normal Weight Range */}
                    {!result.isChild && (
                        <div style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            border: `1px solid ${isDark ? "#1e3a2f" : "#bbf7d0"}`,
                        }}>
                            <div style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: isDark ? "#86efac" : "#16a34a",
                                marginBottom: 4,
                            }}>
                                {tResult("normalRange")}
                            </div>
                            <div style={{
                                fontSize: "1.2rem",
                                fontWeight: 700,
                                color: isDark ? "#e2e8f0" : "#1e293b",
                            }}>
                                {result.normalWeightMin} {tResult("to")} {result.normalWeightMax} {unitSystem === "imperial" ? tResult("weightUnitLb") : tResult("weightUnit")}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: 20 }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* ─── BMI Trend Chart ─── */}
            {mounted && chartData.length > 0 && (
                <div style={cardStyle}>
                    <h2 style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: isDark ? "#e2e8f0" : "#1e293b",
                        margin: "0 0 16px 0",
                    }}>
                        {tHistory("chartTitle")}
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <XAxis
                                dataKey="date"
                                tick={{ fill: isDark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                                tickFormatter={(val) => {
                                    const parts = val.split("-");
                                    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
                                }}
                                axisLine={{ stroke: isDark ? "#475569" : "#e5e7eb" }}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[10, 45]}
                                tick={{ fill: isDark ? "#94a3b8" : "#6b7280", fontSize: 11 }}
                                axisLine={{ stroke: isDark ? "#475569" : "#e5e7eb" }}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: isDark ? "#1e293b" : "white",
                                    border: isDark ? "1px solid #475569" : "1px solid #e5e7eb",
                                    borderRadius: 8,
                                    color: isDark ? "#f1f5f9" : "#374151",
                                    fontSize: "0.85rem",
                                }}
                                formatter={(value?: number) => [(value ?? 0).toFixed(2), "BMI"]}
                            />
                            <ReferenceLine y={18.5} stroke="#3b82f6" strokeDasharray="5 5" />
                            <ReferenceLine y={25} stroke="#eab308" strokeDasharray="5 5" />
                            <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" />
                            <Line
                                type="monotone"
                                dataKey="bmi"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#3b82f6" }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 16,
                        marginTop: 8,
                        fontSize: "0.75rem",
                        color: isDark ? "#94a3b8" : "#6b7280",
                    }}>
                        <span><span style={{ color: "#3b82f6" }}>---</span> 18.5</span>
                        <span><span style={{ color: "#eab308" }}>---</span> 25</span>
                        <span><span style={{ color: "#ef4444" }}>---</span> 30</span>
                    </div>
                </div>
            )}

            {/* ─── History Table ─── */}
            {mounted && history.length > 0 && (
                <div style={cardStyle}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: historyExpanded ? 12 : 0,
                    }}>
                        <button
                            onClick={() => setHistoryExpanded(!historyExpanded)}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: isDark ? "#e2e8f0" : "#1e293b",
                                fontSize: "1rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <span style={{
                                display: "inline-block",
                                transition: "transform 0.2s",
                                transform: historyExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            }}>▶</span>
                            {tHistory("title")} ({history.length} {tHistory("entries")})
                        </button>
                        <button
                            onClick={clearHistory}
                            style={{
                                background: "none",
                                border: "none",
                                padding: "4px 8px",
                                color: "#ef4444",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {tHistory("clearHistory")}
                        </button>
                    </div>

                    {historyExpanded && (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        textAlign: "left",
                                        padding: "8px 8px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{tHistory("date")}</th>
                                    <th style={{
                                        textAlign: "center",
                                        padding: "8px 8px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{tHistory("bmiValue")}</th>
                                    <th style={{
                                        textAlign: "center",
                                        padding: "8px 8px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        color: isDark ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                    }}>{tHistory("classification")}</th>
                                    <th style={{
                                        textAlign: "right",
                                        padding: "8px 4px",
                                        borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                        width: 40,
                                    }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(entry => (
                                    <tr key={entry.id}>
                                        <td style={{
                                            padding: "8px 8px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            color: isDark ? "#cbd5e1" : "#475569",
                                        }}>
                                            {entry.date}
                                        </td>
                                        <td style={{
                                            padding: "8px 8px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "center",
                                            fontWeight: 700,
                                            fontVariantNumeric: "tabular-nums",
                                            color: getClassificationColor(entry.classification),
                                        }}>
                                            {entry.bmi.toFixed(2)}
                                        </td>
                                        <td style={{
                                            padding: "8px 8px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "center",
                                            fontSize: "0.8rem",
                                            color: getClassificationColor(entry.classification),
                                        }}>
                                            {tResult(entry.classification)}
                                        </td>
                                        <td style={{
                                            padding: "8px 4px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "right",
                                        }}>
                                            <button
                                                onClick={() => deleteHistoryEntry(entry.id)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: isDark ? "#64748b" : "#94a3b8",
                                                    fontSize: "0.75rem",
                                                    cursor: "pointer",
                                                    padding: "2px 4px",
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ─── Classification Table ─── */}
            <div style={cardStyle}>
                <h2 style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: isDark ? "#e2e8f0" : "#1e293b",
                    margin: "0 0 16px 0",
                }}>
                    {ageMode === "child" ? tChildTable("title") : tTable("title")}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                        <tr>
                            <th style={{
                                textAlign: "left",
                                padding: "10px 12px",
                                borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontWeight: 600,
                            }}>
                                {ageMode === "child" ? tChildTable("category") : tTable("category")}
                            </th>
                            <th style={{
                                textAlign: "right",
                                padding: "10px 12px",
                                borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontWeight: 600,
                            }}>
                                {ageMode === "child" ? tChildTable("percentileRange") : tTable("bmiRange")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(ageMode === "child" ? CHILD_TABLE_ROWS : TABLE_ROWS).map((row) => {
                            const isActive = result?.classification === row.key;
                            return (
                                <tr
                                    key={row.key}
                                    style={{
                                        background: isActive
                                            ? (isDark ? "#1e3a5f" : "#eff6ff")
                                            : "transparent",
                                    }}
                                >
                                    <td style={{
                                        padding: "10px 12px",
                                        borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}>
                                        <span style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: getClassificationColor(row.key),
                                            flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontWeight: isActive ? 700 : 400,
                                            color: isActive
                                                ? getClassificationColor(row.key)
                                                : isDark ? "#e2e8f0" : "#334155",
                                        }}>
                                            {ageMode === "child" ? tChildTable(row.key) : tTable(row.key)}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: "10px 12px",
                                        borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                        textAlign: "right",
                                        fontWeight: isActive ? 700 : 400,
                                        color: isActive
                                            ? getClassificationColor(row.key)
                                            : isDark ? "#cbd5e1" : "#475569",
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {row.range}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
