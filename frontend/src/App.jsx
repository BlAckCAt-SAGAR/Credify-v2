import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { gsap } from "gsap";

const API = "http://localhost:8000";

/* ─── helpers ───────────────────────────────────────────────── */
const decisionColor = d =>
  d === "APPROVE" ? "#10b981"
    : d?.includes("CONDITION") || d?.includes("REFER") ? "#f59e0b"
      : "#ef4444";

const riskColor = r =>
  ({ LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444", CRITICAL: "#b91c1c" }[r] || "#a1a1aa");

/* ─── color palette ────────────────────── */
const COLORS = {
  primary: "#ff69b4", // vibrant pink
  secondary: "#8b5cf6", // purple
  accent: "#3b82f6", // blue
  bg: "#fdfcfd",
  card: "#ffffff",
  text: "#1a1d1f",
  subtext: "#52525b",
  border: "#f1f1f5"
};

/* ─── global CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'Inter', sans-serif; background: ${COLORS.bg}; color: ${COLORS.text}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
  input::placeholder { color: #a1a1aa; }
  input:focus { outline: none; }
  button { font-family: 'Inter', sans-serif; transition: all 0.2s ease; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  /* Responsive Utilities */
  .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
  .grid { display: grid; gap: 24px; }
  
  .navbar-header {
    padding: 20px 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 1000;
    border-bottom: 1px solid ${COLORS.border};
    transition: all 0.3s ease;
  }
  .nav-logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .logo-icon { 
    width: 36px; height: 36px; background: ${COLORS.primary}; 
    border-radius: 10px; display: flex; align-items: center; 
    justify-content: center; color: #fff; font-weight: 900; font-size: 18px;
  }
  .logo-text { font-size: 22px; font-weight: 900; color: ${COLORS.text}; }
  
  .desktop-nav { display: flex; gap: 32px; align-items: center; }
  .nav-item { font-weight: 700; cursor: pointer; color: ${COLORS.text}; transition: color 0.2s; font-size: 15px; }
  .nav-item:hover, .nav-item.active { color: ${COLORS.primary}; }
  
  .mobile-toggle { display: none; }

  @media (min-width: 1024px) {
    .h1-text { font-size: 56px !important; }
    .h2-text { font-size: 40px !important; }
    .p-text { font-size: 18px !important; }
    .hero-grid { grid-template-columns: 1.2fr 1fr; align-items: center; gap: 80px; }
    .features-grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
    .dashboard-main-grid { grid-template-columns: 320px 1fr; }
    .dashboard-stats-grid { grid-template-columns: repeat(3, 1fr); }
    .dashboard-risk-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 1023px) {
    .h1-text { font-size: 40px !important; }
    .h2-text { font-size: 32px !important; }
    .p-text { font-size: 16px !important; }
    .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
    .hero-content { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .hero-btns { justify-content: center; }
    .features-grid { grid-template-columns: 1fr; gap: 20px; }
    .dashboard-main-grid { grid-template-columns: 1fr; }
    .dashboard-stats-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .dashboard-risk-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 850px) {
    .desktop-nav { display: none; }
    .mobile-toggle { 
      display: flex; background: #fff; border: 1px solid ${COLORS.border};
      border-radius: 50%; width: 48px; height: 48px; 
      align-items: center; justify-content: center; cursor: pointer;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05); z-index: 1100;
    }
    .navbar-header { padding: 16px 24px; }
  }

  @media (max-width: 480px) {
    .h1-text { font-size: 32px !important; }
    .h2-text { font-size: 26px !important; }
    .hero-stats { flex-direction: column; gap: 20px !important; align-items: center; }
  }
`;

/* ─── icons ──────────────────────────────────────────────────── */
const Icons = {
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Analysis: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Score: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Research: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Report: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )
};

/* ─── spinner ────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.1)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={COLORS.primary} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ─── buttons ────────────────────────────────────────────────── */
function PrimaryBtn({ children, onClick, disabled, loading, style = {}, secondary }) {
  const ref = useRef(null);
  const handleEnter = () => !disabled && gsap.to(ref.current, { scale: 1.03, duration: 0.15 });
  const handleLeave = () => !disabled && gsap.to(ref.current, { scale: 1, duration: 0.15 });
  return (
    <button ref={ref} onClick={onClick} disabled={disabled}
      onMouseEnter={handleEnter} onMouseLeave={handleLeave}
      style={{
        padding: "16px 32px",
        background: disabled ? "#f1f1f5" : secondary ? "#fff" : COLORS.primary,
        color: disabled ? "#a1a1aa" : secondary ? COLORS.text : "#fff",
        border: secondary ? `1px solid ${COLORS.border}` : "none",
        borderRadius: "30px", fontSize: "16px", fontWeight: "700",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled || secondary ? "none" : `0 8px 24px rgba(244, 114, 182, 0.25)`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
        ...style
      }}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ─── animated page ──────────────────────────────────────────── */
function AnimatedPage({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
  }, []);
  return <div ref={ref} style={{ width: "100%" }}>{children}</div>;
}

/* ─── card ───────────────────────────────────────────────────── */
function Card({ children, style = {}, active }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
      borderRadius: "24px", padding: "32px",
      boxShadow: active ? "0 20px 40px rgba(244, 114, 182, 0.08)" : "0 10px 30px rgba(0,0,0,0.02)",
      ...style
    }}>
      {children}
    </div>
  );
}

/* ─── score arc ──────────────────────────────────────────────── */
function ScoreArc({ score }) {
  const r = 70, cx = 90, cy = 90;
  const circ = Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#f59e0b" : score >= 50 ? "#f97316" : "#ef4444";
  return (
    <svg width="180" height="110" viewBox="0 0 180 110">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#f1f1f5" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${progress} ${circ}`} style={{ transition: "stroke-dasharray 1s ease-out" }} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={COLORS.text} fontSize="32" fontWeight="800" fontFamily="Inter">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.subtext} fontSize="11" fontFamily="Inter">out of 100</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════ */
function HomePage({ onStart }) {
  const heroRef = useRef(null);
  const whyRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(heroRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
    gsap.fromTo(whyRef.current.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3 });
  }, []);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      {/* Hero Section */}
      <section ref={heroRef} className="container grid hero-grid" style={{ padding: "80px 24px" }}>
        <div className="hero-content">
          <div style={{ display: "inline-block", background: "#fdf2f8", color: COLORS.primary, padding: "8px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: "700", marginBottom: "24px" }}>
            Coming soon · Credly will have mobile app soon!
          </div>
          <h1 className="h1-text" style={{ fontWeight: "900", lineHeight: 1.1, color: COLORS.text, marginBottom: "24px" }}>
            We're creating better way to <span style={{ color: COLORS.primary }}>invest for the future</span>
          </h1>
          <p className="p-text" style={{ color: COLORS.subtext, lineHeight: 1.6, marginBottom: "40px", maxWidth: "480px" }}>
            Intelligent management software to control future investment accounting. Every your funds are taken into account for need future.
          </p>
          <div className="hero-btns" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <PrimaryBtn onClick={onStart} style={{ padding: "18px 40px" }}>Discover now</PrimaryBtn>
            <PrimaryBtn secondary onClick={onStart} style={{ border: "none" }}>Learn more →</PrimaryBtn>
          </div>
          <div className="hero-stats" style={{ display: "flex", gap: "40px", marginTop: "60px" }}>
            <div>
              <div style={{ fontSize: "24px", fontWeight: "900" }}>70B <span style={{ fontSize: "14px", color: COLORS.subtext, fontWeight: "500", display: "block" }}>Llama 3 AI Engines</span></div>
            </div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: "900" }}>100% <span style={{ fontSize: "14px", color: COLORS.subtext, fontWeight: "500", display: "block" }}>Bank-Grade CAM Reports</span></div>
            </div>
          </div>
        </div>
        <div style={{ position: "relative", width: "100%" }}>
          <div style={{ width: "100%", height: "auto", minHeight: "350px", background: "linear-gradient(135deg, #fff, #fdf2f8)", borderRadius: "40px", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <img src="/1.png" alt="Illustration" style={{ width: "100%", height: "auto", maxWidth: "500px", borderRadius: "20px" }} />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ textAlign: "center", padding: "80px 24px", background: "#fff" }}>
        <div className="container">
          <h2 className="h2-text" style={{ fontWeight: "900", marginBottom: "16px" }}>Why should choose us</h2>
          <p className="p-text" style={{ color: COLORS.subtext, marginBottom: "60px" }}>Because we always think of user needs and provide the best</p>

          <div ref={whyRef} className="grid features-grid">
            <div style={{ padding: "40px", background: COLORS.bg, borderRadius: "24px" }}>
              <img src="/2.png" alt="AI" style={{ width: "100px", marginBottom: "32px" }} />
              <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "16px" }}>AI Financial Parsing</h3>
              <p style={{ color: COLORS.subtext, lineHeight: 1.6, fontSize: "15px" }}>Leverage Llama 3 70B to instantly extract complex financial data from any PDF, digital or scanned.</p>
            </div>
            <div style={{ padding: "40px", background: COLORS.bg, borderRadius: "24px" }}>
              <img src="/3.png" alt="Scoring" style={{ width: "100px", marginBottom: "32px" }} />
              <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "16px" }}>5Cs Credit Scoring</h3>
              <p style={{ color: COLORS.subtext, lineHeight: 1.6, fontSize: "15px" }}>Comprehensive risk assessment across Character, Capacity, Capital, Collateral, and Conditions.</p>
            </div>
            <div style={{ padding: "40px", background: COLORS.bg, borderRadius: "24px" }}>
              <img src="/4.png" alt="Intelligence" style={{ width: "100px", marginBottom: "32px" }} />
              <h3 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "16px" }}>Real-time Intelligence</h3>
              <p style={{ color: COLORS.subtext, lineHeight: 1.6, fontSize: "15px" }}>Live web research agent scans NCLT, court records, and news for high-speed background verification.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
function DashboardPage({ results, companyName, onGoAnalysis }) {
  const hasData = !!(results.score || results.analyze || results.upload);

  if (!hasData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>📊</div>
        <h2 style={{ fontSize: "28px", fontWeight: "800", color: COLORS.text, marginBottom: "12px" }}>No Analysis Yet</h2>
        <p style={{ fontSize: "16px", color: COLORS.subtext, marginBottom: "32px", maxWidth: "400px", lineHeight: 1.6 }}>Run a full appraisal analysis to see real-time financial data, credit scores, and risk signals here.</p>
        <PrimaryBtn onClick={onGoAnalysis} style={{ width: "auto", padding: "16px 40px" }}>
          Start Analysis →
        </PrimaryBtn>
      </div>
    );
  }

  const score = results.score;
  const analyze = results.analyze;
  const research = results.research;
  const fins = analyze?.financials || {};

  const parseSummary = (text) => {
    if (!text) return { riskLevel: "", findings: [], summary: "" };
    const riskMatch = text.match(/RISK LEVEL:\s*(\w+)/i);
    const riskLevel = riskMatch ? riskMatch[1] : "";
    const findings = [];
    const findingsMatch = text.match(/KEY FINDINGS:(.+?)(?:\d+\.\s*SUMMARY:|SUMMARY:|$)/is);
    if (findingsMatch) {
      findingsMatch[1].split(/\*/).filter(s => s.trim()).forEach(f => findings.push(f.trim()));
    }
    const summaryMatch = text.match(/SUMMARY:(.+)/is);
    const summary = summaryMatch ? summaryMatch[1].trim() : text;
    return { riskLevel, findings, summary };
  };

  const parsed = research ? parseSummary(research.summary) : null;

  return (
    <AnimatedPage>
      <div className="grid dashboard-main-grid" style={{ marginBottom: "24px" }}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>Credit Quality</div>
          <div style={{ fontSize: "64px", fontWeight: "900", lineHeight: 1, color: COLORS.text, letterSpacing: "-3px" }}>{score?.score ?? "—"}</div>
          <div style={{ fontSize: "14px", color: COLORS.subtext, marginTop: "6px", marginBottom: "16px" }}>out of 100</div>
          {score && (
            <>
              <div style={{ fontSize: "20px", fontWeight: "900", color: decisionColor(score.decision), marginBottom: "12px" }}>{score.decision}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                <div style={{ padding: "6px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>Grade: {score.grade}</div>
                <div style={{ padding: "6px 14px", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>{score.interest_rate}</div>
              </div>
              <div style={{ marginTop: "12px", padding: "8px 16px", background: "#fdf2f8", border: "1px solid #fbcfe8", borderRadius: "8px", fontSize: "13px", color: COLORS.primary, fontWeight: "700" }}>
                ₹{score.suggested_loan_limit_crore} Cr limit
              </div>
            </>
          )}
        </Card>

        <Card>
          <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <Icons.Analysis /> Financial Highlights
            {companyName && <span style={{ marginLeft: "auto", fontSize: "13px", color: COLORS.subtext, fontWeight: "600", padding: "4px 12px", background: COLORS.bg, borderRadius: "8px" }}>{companyName}</span>}
          </h3>
          <div className="grid dashboard-stats-grid">
            {[
              { label: "Revenue", value: fins.revenue || fins.Revenue || "—", color: "#fdf2f8" },
              { label: "Profit", value: fins.profit || fins.Profit || "—", color: "#f0f9ff" },
              { label: "EBITDA", value: fins.ebitda || fins.EBITDA || "—", color: "#f5f3ff" },
              { label: "Net Worth", value: fins.net_worth || fins["Net Worth"] || "—", color: "#fdf2fb" },
              { label: "Debt", value: fins.total_debt || fins["Total Debt"] || "—", color: "#fff7f0" },
              { label: "Assets", value: fins.total_assets || fins["Total Assets"] || "—", color: "#f0fdf4" },
            ].map(item => (
              <div key={item.label} style={{ background: item.color, padding: "20px", borderRadius: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", opacity: 0.6, textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: "18px", fontWeight: "900" }}>{item.value === "null" ? "—" : item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid dashboard-risk-grid" style={{ marginBottom: "24px" }}>
        <Card>
          <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px", color: "#ef4444" }}>⚠ Red Flags</h3>
          {score?.red_flags?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {score.red_flags.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px", background: "#fff5f5", borderRadius: "12px", border: "1px solid #fee2e2" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", marginTop: "7px", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "#991b1b", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: COLORS.subtext, fontSize: "14px" }}>{score ? "✓ No major red flags detected" : "Run analysis to see risk signals"}</p>
          )}
        </Card>

        <Card>
          <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px", color: "#22c55e" }}>✓ Positive Signals</h3>
          {score?.positive_signals?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {score.positive_signals.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "14px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #dcfce7" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", marginTop: "7px", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", color: "#166534", lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: COLORS.subtext, fontSize: "14px" }}>{score ? "No positive signals found" : "Run analysis to see signals"}</p>
          )}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Icons.Research /> Web Intelligence Report
          {research && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: "700", color: riskColor(parsed?.riskLevel || research.risk_level), background: `${riskColor(parsed?.riskLevel || research.risk_level)}12`, border: `1px solid ${riskColor(parsed?.riskLevel || research.risk_level)}30` }}>
              <span style={{ width: "6px", height: "6px", background: riskColor(parsed?.riskLevel || research.risk_level), borderRadius: "50%", display: "inline-block" }} />
              {parsed?.riskLevel || research.risk_level}
            </span>
          )}
        </h3>
        {research ? (
          <div>
            {parsed.findings.length > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: "800", color: "#92400e", marginBottom: "12px" }}>🔎 Key Findings</h4>
                {parsed.findings.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f59e0b", marginTop: "7px", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#78350f", lineHeight: 1.6 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "20px", marginBottom: "16px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "800", color: COLORS.text, marginBottom: "10px" }}>📋 Summary</h4>
              <p style={{ fontSize: "14px", color: COLORS.subtext, lineHeight: 1.7 }}>{parsed.summary}</p>
            </div>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>🔍</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#0369a1" }}>{research.sources?.length || 0} external sources analysed</span>
            </div>
          </div>
        ) : (
          <p style={{ color: COLORS.subtext, fontSize: "14px" }}>Run analysis to see web research results</p>
        )}
      </Card>
    </AnimatedPage>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Step1Upload({ files, setFiles, onNext, loading, result }) {
  return (
    <AnimatedPage>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "#fdf2f8", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: COLORS.primary }}>
          <Icons.Upload />
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "12px" }}>Upload Documents</h2>
        <p style={{ color: COLORS.subtext, marginBottom: "40px" }}>Select up to 5 documents (PDF or Excel files: Annual Report, GST Filing, ITR, Financial Statements, ALM).</p>

        <label style={{ display: "block", border: `2px dashed ${COLORS.border}`, borderRadius: "24px", padding: "40px", cursor: "pointer", transition: "all 0.3s", background: files && files.length > 0 ? "#fdf2f8" : "transparent" }}>
          <input type="file" accept=".pdf,.xlsx" multiple onChange={e => setFiles(Array.from(e.target.files))} style={{ display: "none" }} />
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>{files && files.length > 0 ? "📃" : "📁"}</div>
          <div style={{ fontSize: "18px", fontWeight: "800" }}>{files && files.length > 0 ? `${files.length} file(s) selected` : "Choose PDFs, Excel files or drag them here"}</div>
          {files && files.length > 0 && (
            <div style={{ fontSize: "14px", color: COLORS.primary, marginTop: "12px", fontWeight: "600", display: "flex", flexDirection: "column", gap: "4px" }}>
              {files.map((f, i) => <span key={i}>{f.name}</span>)}
            </div>
          )}
          <p style={{ fontSize: "14px", color: COLORS.subtext, marginTop: "12px" }}>Max total size 100MB</p>
        </label>

        {result && <div style={{ marginTop: "24px", color: "#10b981", fontWeight: "700" }}>Successfully extracted {result.characters_extracted} characters!</div>}
        <div style={{ marginTop: "40px" }}>
          <PrimaryBtn onClick={onNext} disabled={!files || files.length === 0 || loading} loading={loading} style={{ margin: "0 auto" }}>
            {loading ? "Processing..." : result ? "Continue →" : "Upload Documents"}
          </PrimaryBtn>
        </div>
      </div>
    </AnimatedPage>
  );
}

function Step2Analyze({ borrowerProfile, officerNotes, setOfficerNotes, onNext, loading, result }) {
  return (
    <AnimatedPage>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "#f0f9ff", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: "#0ea5e9" }}>
          <Icons.Analysis />
        </div>

        <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "8px" }}>Borrower Detected</h2>
        <p style={{ color: COLORS.subtext, marginBottom: "32px" }}>We've automatically identified the entity from your documents.</p>

        {borrowerProfile && (
          <Card style={{ textAlign: "left", marginBottom: "40px", background: "#f8fafc", border: `1px solid ${COLORS.primary}40` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase" }}>Company Name</label>
                <div style={{ fontSize: "18px", fontWeight: "800", color: COLORS.text }}>{borrowerProfile.company_name}</div>
              </div>
              {borrowerProfile.cin && (
                <div>
                  <label style={{ fontSize: "10px", fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase" }}>CIN</label>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: COLORS.text }}>{borrowerProfile.cin}</div>
                </div>
              )}
              {borrowerProfile.sector && (
                <div>
                  <label style={{ fontSize: "10px", fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase" }}>Sector</label>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: COLORS.text }}>{borrowerProfile.sector}</div>
                </div>
              )}
              {borrowerProfile.location && (
                <div>
                  <label style={{ fontSize: "10px", fontWeight: "800", color: COLORS.subtext, textTransform: "uppercase" }}>Location</label>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: COLORS.text }}>{borrowerProfile.location}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "16px", textAlign: "left" }}>Add Officer Notes</h3>
        <textarea
          placeholder="Enter site visit notes, management interaction, or primary insights here..."
          value={officerNotes}
          onChange={e => setOfficerNotes(e.target.value)}
          style={{
            width: "100%",
            padding: "20px 24px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            fontSize: "16px",
            fontWeight: "500",
            marginBottom: "32px",
            minHeight: "150px",
            fontFamily: "inherit",
            resize: "vertical"
          }}
        />

        <PrimaryBtn onClick={onNext} disabled={loading} loading={loading} style={{ margin: "0 auto" }}>
          {loading ? "Analyzing Financials..." : result ? "Continue →" : "Start Full Analysis"}
        </PrimaryBtn>
      </div>
    </AnimatedPage>
  );
}

function Step3Score({ onNext, loading, result }) {
  const scoreRef = useRef(null);
  useEffect(() => {
    if (result && scoreRef.current) gsap.fromTo(scoreRef.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" });
  }, [result]);
  return (
    <AnimatedPage>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "#f5f3ff", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: COLORS.secondary }}>
          <Icons.Score />
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "12px" }}>Appraisal Engine</h2>
        <p style={{ color: COLORS.subtext, marginBottom: "40px" }}>Scores the company across the 5 Cs of Credit.</p>
        {!result && (
          <>
            <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, borderRadius: "24px", marginBottom: "40px" }}>
              <p style={{ color: COLORS.subtext, fontSize: "14px" }}>Ready to calculate score</p>
            </div>
            <PrimaryBtn onClick={onNext} disabled={loading} loading={loading} style={{ margin: "0 auto" }}>
              {loading ? "Calculating..." : "Generate Score"}
            </PrimaryBtn>
          </>
        )}
        {result && (
          <div ref={scoreRef} style={{ textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", background: COLORS.bg, borderRadius: "20px", padding: "36px", marginBottom: "20px" }}>
              <div style={{ textAlign: "center", paddingRight: "32px", borderRight: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: "64px", fontWeight: "900", lineHeight: 1, color: COLORS.text, letterSpacing: "-3px" }}>{result.score}</div>
                <div style={{ fontSize: "14px", color: COLORS.subtext, marginTop: "6px" }}>out of 100</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "24px", fontWeight: "900", color: decisionColor(result.decision), marginBottom: "16px" }}>{result.decision}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ padding: "8px 16px", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}>Grade: {result.grade}</div>
                  <div style={{ padding: "8px 16px", background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: "8px", fontSize: "14px", fontWeight: "600" }}>{result.interest_rate}</div>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", marginBottom: "28px" }}>
              {result.red_flags?.length > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #fee2e2", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontWeight: "800", color: "#ef4444", marginBottom: "14px" }}>⚠ Red Flags</div>
                  {result.red_flags.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", marginTop: "7px", flexShrink: 0 }} />
                      <span style={{ fontSize: "14px", color: "#991b1b", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.positive_signals?.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "16px", padding: "24px" }}>
                  <div style={{ fontWeight: "800", color: "#22c55e", marginBottom: "14px" }}>✓ Positive Signals</div>
                  {result.positive_signals.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", marginTop: "7px", flexShrink: 0 }} />
                      <span style={{ fontSize: "14px", color: "#166534", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <PrimaryBtn onClick={onNext} style={{ margin: "0 auto" }}>Continue →</PrimaryBtn>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}

function Step4Research({ onNext, loading, result }) {
  const parseSummary = (text) => {
    if (!text) return { riskLevel: "", findings: [], summary: "" };
    const riskMatch = text.match(/RISK LEVEL:\s*(\w+)/i);
    const riskLevel = riskMatch ? riskMatch[1] : "";
    const findings = [];
    const findingsMatch = text.match(/KEY FINDINGS:(.+?)(?:\d+\.\s*SUMMARY:|SUMMARY:|$)/is);
    if (findingsMatch) {
      findingsMatch[1].split(/\*/).filter(s => s.trim()).forEach(f => findings.push(f.trim()));
    }
    const summaryMatch = text.match(/SUMMARY:(.+)/is);
    const summary = summaryMatch ? summaryMatch[1].trim() : text;
    return { riskLevel, findings, summary };
  };

  const parsed = result ? parseSummary(result.summary) : null;

  return (
    <AnimatedPage>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "#fff7ed", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: "#f97316" }}>
          <Icons.Research />
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "12px" }}>Web Research</h2>
        <p style={{ color: COLORS.subtext, marginBottom: "40px" }}>AI agent scans news and filings in real-time.</p>
        {!result && (
          <>
            <div style={{ height: "150px", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, borderRadius: "24px", marginBottom: "40px" }}>
              <p style={{ color: COLORS.subtext, fontSize: "14px" }}>Ready for background check</p>
            </div>
            <PrimaryBtn onClick={onNext} disabled={loading} loading={loading} style={{ margin: "0 auto" }}>
              {loading ? "Searching..." : "Start Research"}
            </PrimaryBtn>
          </>
        )}
        {result && (
          <div style={{ textAlign: "left" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: "100px", fontWeight: "700", fontSize: "14px", color: riskColor(parsed.riskLevel || result.risk_level), background: `${riskColor(parsed.riskLevel || result.risk_level)}12`, border: `1px solid ${riskColor(parsed.riskLevel || result.risk_level)}30`, marginBottom: "24px" }}>
              <span style={{ width: "8px", height: "8px", background: riskColor(parsed.riskLevel || result.risk_level), borderRadius: "50%", display: "inline-block" }} />
              Risk Level: {parsed.riskLevel || result.risk_level}
            </div>
            {parsed.findings.length > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#92400e", marginBottom: "16px" }}>🔎 Key Findings</h4>
                {parsed.findings.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f59e0b", marginTop: "7px", flexShrink: 0 }} />
                    <span style={{ fontSize: "14px", color: "#78350f", lineHeight: 1.6 }}>{f}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "16px", padding: "24px", marginBottom: "20px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "800", color: COLORS.text, marginBottom: "12px" }}>📋 Summary</h4>
              <p style={{ fontSize: "15px", color: COLORS.subtext, lineHeight: 1.8 }}>{parsed.summary}</p>
            </div>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "16px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>🔍</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#0369a1" }}>{result.sources?.length || 0} external sources analysed</span>
            </div>
            <PrimaryBtn onClick={onNext} style={{ margin: "0 auto" }}>Continue →</PrimaryBtn>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}

function Step5Report({ onDownload, loading, companyName }) {
  return (
    <AnimatedPage>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", background: "#f0fdf4", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", color: "#22c55e" }}>
          <Icons.Report />
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "12px" }}>Ready for Export</h2>
        <p style={{ color: COLORS.subtext, marginBottom: "40px" }}>Download your Professional Credit Appraisal Memo.</p>
        <Card style={{ marginBottom: "40px", display: "flex", gap: "20px", alignItems: "center", textAlign: "left" }}>
          <div style={{ fontSize: "40px" }}>📄</div>
          <div>
            <div style={{ fontWeight: "800" }}>CAM_{companyName || "Company"}.docx</div>
            <div style={{ fontSize: "12px", color: COLORS.subtext }}>Word Document · Appraisal Memo</div>
          </div>
        </Card>
        <PrimaryBtn onClick={onDownload} disabled={loading} loading={loading} style={{ margin: "0 auto" }}>
          {loading ? "Generating..." : "Download Memo"}
        </PrimaryBtn>
      </div>
    </AnimatedPage>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [appTab, setAppTab] = useState("analysis");
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [officerNotes, setOfficerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState({});
  const [borrowerProfile, setBorrowerProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const post = async (url, data) => {
    setError(""); setLoading(true);
    try { const res = await axios.post(API + url, data); return res.data; }
    catch (e) { setError(e.response?.data?.detail || e.message); return null; }
    finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (results.upload) { setStep(1); return; }
    if (!files || files.length === 0) return;
    const form = new FormData();
    files.forEach(f => form.append("files", f));
    const data = await post("/upload", form);
    if (data) {
      setResults(r => ({ ...r, upload: data }));
      if (data.borrower_profile) {
        setBorrowerProfile(data.borrower_profile);
        setCompanyName(data.borrower_profile.company_name);
      }
      setStep(1);
    }
  };

  const handleAnalyze = async () => {
    if (results.analyze) { setStep(2); return; }
    const form = new FormData();
    if (officerNotes) form.append("officer_notes", officerNotes);
    const data = await post("/analyze", form);
    if (data) {
      setResults(r => ({ ...r, analyze: data }));
      setStep(2);
    }
  };

  const handleScore = async () => {
    if (results.score) { setStep(3); return; }
    const data = await post("/score", {});
    if (data) setResults(r => ({ ...r, score: data }));
  };

  const handleResearch = async () => {
    if (results.research) { setStep(4); return; }
    const data = await post("/research", {});
    if (data) setResults(r => ({ ...r, research: data }));
  };

  const handleDownload = async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.post(API + "/generate-cam", {}, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url; a.download = `CAM_${companyName}.docx`; a.click();
    } catch { setError("Download failed."); }
    finally { setLoading(false); }
  };

  const renderContent = () => {
    if (page === "home") return <HomePage onStart={() => { setPage("app"); setAppTab("analysis"); }} />;
    if (appTab === "dashboard") return <DashboardPage results={results} companyName={companyName} onGoAnalysis={() => setAppTab("analysis")} />;

    const steps = [
      <Step1Upload key={0} files={files} setFiles={setFiles} onNext={handleUpload} loading={loading} result={results.upload} />,
      <Step2Analyze key={1} borrowerProfile={borrowerProfile} officerNotes={officerNotes} setOfficerNotes={setOfficerNotes} onNext={handleAnalyze} loading={loading} result={results.analyze} />,
      <Step3Score key={2} onNext={handleScore} loading={loading} result={results.score} />,
      <Step4Research key={3} onNext={handleResearch} loading={loading} result={results.research} />,
      <Step5Report key={4} onDownload={handleDownload} loading={loading} companyName={companyName} />,
    ];

    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px", justifyContent: "center", padding: "0 20px" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ flex: 1, maxWidth: "40px", height: "6px", borderRadius: "10px", background: i <= step ? COLORS.primary : COLORS.border, transition: "all 0.3s" }} />
          ))}
        </div>
        <Card style={{ padding: "24px" }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: COLORS.subtext, cursor: "pointer", fontSize: "14px", fontWeight: "700", marginBottom: "24px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Step {step}
            </button>
          )}
          {steps[step]}
        </Card>
      </div>
    );
  };

  const NavLink = ({ label, onClick, active }) => (
    <div
      onClick={() => { onClick(); setMenuOpen(false); }}
      style={{
        fontSize: "32px",
        fontWeight: "800",
        color: active ? COLORS.primary : COLORS.text,
        cursor: "pointer",
        padding: "20px 0",
        transition: "all 0.3s ease",
        textAlign: "center"
      }}
      onMouseEnter={e => e.currentTarget.style.color = COLORS.primary}
      onMouseLeave={e => e.currentTarget.style.color = active ? COLORS.primary : COLORS.text}
    >
      {label}
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Responsive Navbar */}
        <header className="navbar-header">
          <div className="nav-logo" onClick={() => { setPage("home"); setMenuOpen(false); }}>
            <div className="logo-icon">C</div>
            <span className="logo-text">Credly</span>
          </div>

          {/* Desktop Links */}
          <nav className="desktop-nav">
            <span className={`nav-item ${page === "home" ? "active" : ""}`} onClick={() => setPage("home")}>Home</span>
            <span className={`nav-item ${page === "app" && appTab === "dashboard" ? "active" : ""}`} onClick={() => { setPage("app"); setAppTab("dashboard"); }}>Dashboard</span>
            <span className={`nav-item ${page === "app" && appTab === "analysis" ? "active" : ""}`} onClick={() => { setPage("app"); setAppTab("analysis"); }}>Analysis</span>
          </nav>

          {/* Mobile Toggle */}
          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </button>
        </header>

        {/* 50vh Dropdown Menu (Only shown when mobile-toggle is present) */}
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: menuOpen ? "50vh" : "0",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          zIndex: 900,
          overflow: "hidden",
          transition: "height 0.6s cubic-bezier(0.85, 0, 0.15, 1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: menuOpen ? `1px solid ${COLORS.border}` : "none",
          boxShadow: menuOpen ? "0 40px 100px rgba(0,0,0,0.1)" : "none"
        }}>
          <div style={{
            opacity: menuOpen ? 1 : 0,
            transform: menuOpen ? "translateY(0)" : "translateY(-20px)",
            transition: "all 0.5s ease 0.3s",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <NavLink label="Home" onClick={() => setPage("home")} active={page === "home"} />
            <NavLink label="Dashboard" onClick={() => { setPage("app"); setAppTab("dashboard"); }} active={page === "app" && appTab === "dashboard"} />
            <NavLink label="Analysis" onClick={() => { setPage("app"); setAppTab("analysis"); }} active={page === "app" && appTab === "analysis"} />
          </div>
        </div>

        <main style={{ flex: 1, padding: page === "home" ? 0 : "40px 24px" }}>
          {renderContent()}
          {error && <div style={{ textAlign: "center", marginTop: "40px", color: "#ef4444", fontWeight: "600", padding: "0 20px" }}>⚠ {error}</div>}
        </main>
      </div>
    </>
  );
}