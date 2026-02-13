"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "@/contexts/ThemeContext";
import ShareButton from "@/components/ShareButton";

interface BmiResult {
    bmi: number;
    classification: string;
    normalWeightMin: number;
    normalWeightMax: number;
}

const BMI_CATEGORIES = [
    { key: "underweight", min: 0, max: 18.5, color: "#3b82f6" },
    { key: "normal", min: 18.5, max: 25, color: "#22c55e" },
    { key: "overweight", min: 25, max: 30, color: "#eab308" },
    { key: "obeseClass1", min: 30, max: 35, color: "#f97316" },
    { key: "obeseClass2", min: 35, max: 40, color: "#ef4444" },
    { key: "obeseClass3", min: 40, max: 100, color: "#991b1b" },
];

function getClassification(bmi: number): string {
    if (bmi < 18.5) return "underweight";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "overweight";
    if (bmi < 35) return "obeseClass1";
    if (bmi < 40) return "obeseClass2";
    return "obeseClass3";
}

function getClassificationColor(classification: string): string {
    const cat = BMI_CATEGORIES.find(c => c.key === classification);
    return cat?.color ?? "#64748b";
}

export default function BmiCalculatorClient() {
    const t = useTranslations("BmiCalculator");
    const tInput = useTranslations("BmiCalculator.input");
    const tResult = useTranslations("BmiCalculator.result");
    const tTable = useTranslations("BmiCalculator.table");

    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [result, setResult] = useState<BmiResult | null>(null);

    const calculateBmi = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);

        if (!h || !w || h <= 0 || w <= 0) return;

        const heightM = h / 100;
        const bmi = w / (heightM * heightM);
        const classification = getClassification(bmi);
        const normalWeightMin = 18.5 * heightM * heightM;
        const normalWeightMax = 24.9 * heightM * heightM;

        setResult({
            bmi: Math.round(bmi * 100) / 100,
            classification,
            normalWeightMin: Math.round(normalWeightMin * 10) / 10,
            normalWeightMax: Math.round(normalWeightMax * 10) / 10,
        });
    };

    const handleReset = () => {
        setHeight("");
        setWeight("");
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
        if (!result) return '';
        return `⚖️ BMI ${tResult("title")}\n━━━━━━━━━━━━━━\nBMI: ${result.bmi.toFixed(2)} (${tResult(result.classification)})\n${tResult("normalRange")}: ${result.normalWeightMin} ~ ${result.normalWeightMax} ${tResult("weightUnit")}\n\n📍 teck-tani.com/bmi-calculator`;
    };

    const TABLE_ROWS = [
        { key: "underweight", range: "< 18.5" },
        { key: "normal", range: "18.5 - 24.9" },
        { key: "overweight", range: "25.0 - 29.9" },
        { key: "obeseClass1", range: "30.0 - 34.9" },
        { key: "obeseClass2", range: "35.0 - 39.9" },
        { key: "obeseClass3", range: "40.0 +" },
    ];

    return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>
            {/* Input Card */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    borderRadius: 16,
                    padding: "24px 20px",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                    marginBottom: 20,
                }}
            >
                {/* Height */}
                <div style={{ marginBottom: 16 }}>
                    <label
                        style={{
                            display: "block",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            marginBottom: 6,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {tInput("height")}
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder={tInput("heightPlaceholder")}
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#0f172a" : "#f8fafc",
                            color: isDark ? "#f1f5f9" : "#1e293b",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {/* Weight */}
                <div style={{ marginBottom: 20 }}>
                    <label
                        style={{
                            display: "block",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            marginBottom: 6,
                            color: isDark ? "#e2e8f0" : "#334155",
                        }}
                    >
                        {tInput("weight")}
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder={tInput("weightPlaceholder")}
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: 10,
                            border: `1px solid ${isDark ? "#475569" : "#cbd5e1"}`,
                            background: isDark ? "#0f172a" : "#f8fafc",
                            color: isDark ? "#f1f5f9" : "#1e293b",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

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

            {/* Result Card */}
            {result && (
                <div
                    style={{
                        background: isDark ? "#1e293b" : "#ffffff",
                        borderRadius: 16,
                        padding: "24px 20px",
                        border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                        marginBottom: 20,
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            marginBottom: 20,
                            color: isDark ? "#e2e8f0" : "#1e293b",
                            margin: "0 0 20px 0",
                        }}
                    >
                        {tResult("title")}
                    </h2>

                    {/* BMI Value */}
                    <div style={{ textAlign: "center", marginBottom: 20 }}>
                        <div
                            style={{
                                fontSize: "3rem",
                                fontWeight: 800,
                                color: getClassificationColor(result.classification),
                                lineHeight: 1.2,
                            }}
                        >
                            {result.bmi.toFixed(2)}
                        </div>
                        <div
                            style={{
                                fontSize: "0.85rem",
                                color: isDark ? "#94a3b8" : "#64748b",
                                marginTop: 4,
                            }}
                        >
                            {tResult("unit")}
                        </div>
                    </div>

                    {/* Classification Badge */}
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <span
                            style={{
                                display: "inline-block",
                                padding: "8px 24px",
                                borderRadius: 20,
                                background: getClassificationColor(result.classification) + "1a",
                                color: getClassificationColor(result.classification),
                                fontWeight: 700,
                                fontSize: "1.1rem",
                                border: `2px solid ${getClassificationColor(result.classification)}40`,
                            }}
                        >
                            {tResult(result.classification)}
                        </span>
                    </div>

                    {/* BMI Gauge Bar */}
                    <div style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                position: "relative",
                                height: 20,
                                borderRadius: 10,
                                overflow: "hidden",
                                background: isDark ? "#0f172a" : "#f1f5f9",
                            }}
                        >
                            {/* Gradient Bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "linear-gradient(to right, #3b82f6 0%, #22c55e 24%, #eab308 43%, #f97316 57%, #ef4444 71%, #991b1b 100%)",
                                    borderRadius: 10,
                                }}
                            />
                            {/* Indicator */}
                            <div
                                style={{
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
                                }}
                            />
                        </div>
                        {/* Gauge Labels */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginTop: 6,
                                fontSize: "0.7rem",
                                color: isDark ? "#64748b" : "#94a3b8",
                            }}
                        >
                            <span>10</span>
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>35</span>
                            <span>40+</span>
                        </div>
                    </div>

                    {/* Normal Weight Range */}
                    <div
                        style={{
                            padding: "14px 16px",
                            borderRadius: 10,
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            border: `1px solid ${isDark ? "#1e3a2f" : "#bbf7d0"}`,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: isDark ? "#86efac" : "#16a34a",
                                marginBottom: 4,
                            }}
                        >
                            {tResult("normalRange")}
                        </div>
                        <div
                            style={{
                                fontSize: "1.2rem",
                                fontWeight: 700,
                                color: isDark ? "#e2e8f0" : "#1e293b",
                            }}
                        >
                            {result.normalWeightMin} {tResult("to")} {result.normalWeightMax} {tResult("weightUnit")}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Button */}
            <div style={{ marginBottom: 20 }}>
                <ShareButton shareText={getShareText()} disabled={!result} />
            </div>

            {/* WHO Classification Table */}
            <div
                style={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    borderRadius: 16,
                    padding: "24px 20px",
                    border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                }}
            >
                <h2
                    style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        marginBottom: 16,
                        color: isDark ? "#e2e8f0" : "#1e293b",
                        margin: "0 0 16px 0",
                    }}
                >
                    {tTable("title")}
                </h2>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.9rem",
                    }}
                >
                    <thead>
                        <tr>
                            <th
                                style={{
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    fontWeight: 600,
                                }}
                            >
                                {tTable("category")}
                            </th>
                            <th
                                style={{
                                    textAlign: "right",
                                    padding: "10px 12px",
                                    borderBottom: `2px solid ${isDark ? "#475569" : "#e2e8f0"}`,
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    fontWeight: 600,
                                }}
                            >
                                {tTable("bmiRange")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {TABLE_ROWS.map((row) => {
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
                                    <td
                                        style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: getClassificationColor(row.key),
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontWeight: isActive ? 700 : 400,
                                                color: isActive
                                                    ? getClassificationColor(row.key)
                                                    : isDark ? "#e2e8f0" : "#334155",
                                            }}
                                        >
                                            {tTable(row.key)}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: "10px 12px",
                                            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
                                            textAlign: "right",
                                            fontWeight: isActive ? 700 : 400,
                                            color: isActive
                                                ? getClassificationColor(row.key)
                                                : isDark ? "#cbd5e1" : "#475569",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
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
