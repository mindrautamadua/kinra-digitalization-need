import Image from "next/image";
import { LoginForm } from "./login-form";
import logo from "../../../public/kinra-logo.png";

export const metadata = { title: "Masuk" };

const STEPS = [
  { no: "01", title: "Kumpulkan", body: "Setiap Bagian mencatat proses dan kebutuhan digitalnya." },
  { no: "02", title: "Validasi", body: "Reviewer mengklarifikasi, wawancara, dan menilai dampak." },
  { no: "03", title: "Prioritaskan", body: "Skor terbobot menjadi roadmap inisiatif yang terukur." },
];

/** Denah kawasan bergaya blueprint yang "tergambar" lalu hidup: kavling, jalan, dan aliran data. Murni dekoratif. */
const PLOTS = [
  { x: 520, y: 40, w: 120, h: 80 },
  { x: 660, y: 40, w: 110, h: 160 },
  { x: 520, y: 140, w: 120, h: 140 },
  { x: 660, y: 220, w: 110, h: 60 },
  { x: 520, y: 320, w: 250, h: 110 },
  { x: 340, y: 40, w: 140, h: 110 },
  { x: 340, y: 170, w: 140, h: 110 },
  { x: 380, y: 480, w: 100, h: 90 },
  { x: 520, y: 480, w: 120, h: 150 },
  { x: 660, y: 480, w: 110, h: 90 },
];

// Jalur jaringan data antar-kavling; dipakai untuk garis dan paket data yang bergerak.
const NETWORK = "M500 300L580 210L715 120M580 210L645 375M500 300L410 225L410 95M500 300L580 555L715 525";
const PACKETS = [
  { path: "M500 300L580 210L715 120", dur: "4s", begin: "2s" },
  { path: "M500 300L410 225L410 95", dur: "4.6s", begin: "2.6s" },
  { path: "M500 300L580 555L715 525", dur: "5.2s", begin: "3.2s" },
  { path: "M580 210L645 375", dur: "3s", begin: "3.8s" },
];
const NODES = [
  { cx: 500, cy: 300, r: 4.5 },
  { cx: 580, cy: 210, r: 3 },
  { cx: 715, cy: 120, r: 3 },
  { cx: 645, cy: 375, r: 3 },
  { cx: 410, cy: 95, r: 3 },
  { cx: 410, cy: 225, r: 3 },
  { cx: 580, cy: 555, r: 3 },
  { cx: 715, cy: 525, r: 3 },
];

function SitePlan() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 900">
      <defs>
        <pattern id="grid-sm" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="white" strokeOpacity="0.04" />
        </pattern>
        <pattern id="grid-lg" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#grid-sm)" />
          <path d="M100 0H0V100" fill="none" stroke="white" strokeOpacity="0.07" />
        </pattern>
        <radialGradient id="fade" cx="78%" cy="35%" r="62%">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="m">
          <rect width="800" height="900" fill="url(#fade)" />
        </mask>
        <linearGradient id="scan" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7cc4ff" stopOpacity="0" />
          <stop offset="1" stopColor="#7cc4ff" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="packet">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.4" stopColor="#7cc4ff" />
          <stop offset="1" stopColor="#7cc4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="900" fill="url(#grid-lg)" />

      <g mask="url(#m)" fill="none" stroke="#7cc4ff" strokeWidth="1.25">
        {/* jalan kawasan: tergambar lalu marka bergerak */}
        <path d="M500 0V900M0 300H800M300 460H800" strokeOpacity="0.12" strokeWidth="14" className="kn-draw" pathLength={1} style={{ ["--kn-delay" as string]: "0.1s" }} />
        <path d="M500 0V900M0 300H800M300 460H800" strokeOpacity="0.35" strokeDasharray="6 6" className="kn-flow" />

        {/* kavling: digambar bergiliran, lalu "menyala" seperti sedang dinilai */}
        {PLOTS.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="2" fill="#7cc4ff" stroke="none" className="kn-fill" style={{ ["--kn-delay" as string]: `${2 + i * 0.6}s` }} />
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="2" strokeOpacity="0.5" pathLength={1} className="kn-draw" style={{ ["--kn-delay" as string]: `${0.3 + i * 0.12}s` }} />
          </g>
        ))}

        {/* jaringan data */}
        <path d={NETWORK} strokeOpacity="0.6" pathLength={1} className="kn-draw" style={{ ["--kn-delay" as string]: "1.2s" }} />
        <g fill="#7cc4ff" stroke="none">
          {NODES.map((n, i) => (
            <g key={i}>
              <circle cx={n.cx} cy={n.cy} r={n.r} className="kn-ping" style={{ ["--kn-delay" as string]: `${1.6 + i * 0.35}s` }} />
              <circle cx={n.cx} cy={n.cy} r={n.r} />
            </g>
          ))}
        </g>
        {PACKETS.map((pk, i) => (
          <circle key={i} r="5" fill="url(#packet)" stroke="none" className="kn-packet" opacity="0">
            <animateMotion path={pk.path} dur={pk.dur} begin={pk.begin} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.55 1" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur={pk.dur} begin={pk.begin} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      {/* garis pindai */}
      <g className="kn-scan">
        <rect y="-80" width="800" height="80" fill="url(#scan)" />
        <rect width="800" height="1" fill="#7cc4ff" fillOpacity="0.2" />
      </g>
    </svg>
  );
}

const delay = (s: number) => ({ ["--kn-delay" as string]: `${s}s` }) as React.CSSProperties;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Panel merek */}
      <section className="relative hidden overflow-hidden bg-[#0a1f36] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <SitePlan />
        <div className="kn-rise relative flex items-center gap-3" style={delay(0.1)}>
          <span className="rounded-lg bg-white px-3.5 py-2.5 shadow-lg shadow-black/20">
            <Image src={logo} alt="KINRA Sei Mangkei" priority className="h-9 w-auto" />
          </span>
          <span className="text-xs font-semibold uppercase leading-relaxed tracking-[0.2em] text-white/70">
            PT Kawasan Industri
            <br />
            Nusantara
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="kn-rise font-mono text-xs uppercase tracking-[0.25em] text-[#7cc4ff]" style={delay(0.3)}>Digitalization Needs Assessment</p>
          <h1 className="kn-rise mt-4 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl" style={delay(0.45)}>
            Petakan kebutuhan digital, <span className="text-white/50">dari setiap Bagian.</span>
          </h1>
          <ol className="mt-10 space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.no} className="kn-rise" style={delay(0.7 + i * 0.12)}>
                {/* sorotan bergiliran 01 → 02 → 03 mengikuti alur assessment */}
                <div className="kn-step relative flex gap-4 pl-4" style={delay(2 + i * 3)}>
                  <span aria-hidden className="kn-step-bar absolute inset-y-0 left-0 w-0.5 rounded-full bg-[#7cc4ff]" />
                  <span className="mt-0.5 font-mono text-xs text-[#7cc4ff]">{s.no}</span>
                  <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-sm text-white/60">{s.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="kn-rise relative text-xs text-white/40" style={delay(1.1)}>© {new Date().getFullYear()} PT Kawasan Industri Nusantara · Aplikasi internal</p>
      </section>

      {/* Panel masuk */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="kn-rise w-full max-w-sm" style={delay(0.15)}>
          <div className="mb-10 lg:hidden">
            <Image src={logo} alt="KINRA Sei Mangkei" priority className="h-12 w-auto" />
            <p className="mt-3 text-sm text-muted">Digitalization Needs Assessment</p>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Selamat datang kembali</h2>
          <p className="mt-1.5 text-sm text-muted">Masuk dengan akun yang diberikan Administrator TI.</p>
          <div className="mt-8">
            <LoginForm next={sp.next} />
          </div>
          <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
            Lupa kata sandi atau akun terkunci? Hubungi Administrator TI. Akses tanpa izin dilarang dan tercatat.
          </p>
        </div>
      </section>
    </main>
  );
}
