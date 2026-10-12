import Image from "next/image";
import { LoginForm } from "./login-form";
import logo from "../../../public/kinra-logo.png";

export const metadata = { title: "Masuk" };

const STEPS = [
  { no: "01", title: "Kumpulkan", body: "Setiap Bagian mencatat proses dan kebutuhan digitalnya." },
  { no: "02", title: "Validasi", body: "Reviewer mengklarifikasi, wawancara, dan menilai dampak." },
  { no: "03", title: "Prioritaskan", body: "Skor terbobot menjadi roadmap inisiatif yang terukur." },
];

/** Denah kawasan bergaya blueprint: grid halus + kavling. Murni dekoratif. */
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
        <radialGradient id="fade" cx="85%" cy="25%" r="55%">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="m">
          <rect width="800" height="900" fill="url(#fade)" />
        </mask>
      </defs>
      <rect width="800" height="900" fill="url(#grid-lg)" />
      <g mask="url(#m)" fill="none" stroke="#7cc4ff" strokeWidth="1.25">
        {/* jalan utama */}
        <path d="M500 300H800M500 0V460" strokeOpacity="0.35" strokeDasharray="6 6" />
        {/* kavling */}
        <g strokeOpacity="0.45">
          <rect x="520" y="40" width="120" height="80" rx="2" />
          <rect x="660" y="40" width="110" height="160" rx="2" />
          <rect x="520" y="140" width="120" height="140" rx="2" />
          <rect x="520" y="320" width="250" height="110" rx="2" />
          <rect x="660" y="220" width="110" height="60" rx="2" />
        </g>
        <g fill="#7cc4ff" stroke="none">
          <rect x="520" y="140" width="120" height="140" rx="2" fillOpacity="0.08" />
          <rect x="520" y="320" width="250" height="110" rx="2" fillOpacity="0.05" />
        </g>
        {/* titik node */}
        <g fill="#7cc4ff" stroke="none">
          <circle cx="500" cy="300" r="4" />
          <circle cx="580" cy="210" r="3" fillOpacity="0.8" />
          <circle cx="715" cy="120" r="3" fillOpacity="0.6" />
          <circle cx="645" cy="375" r="3" fillOpacity="0.6" />
        </g>
        <path d="M500 300L580 210L715 120M580 210L645 375" strokeOpacity="0.6" />
      </g>
    </svg>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Panel merek */}
      <section className="relative hidden overflow-hidden bg-[#0a1f36] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <SitePlan />
        <div className="relative flex items-center gap-3">
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
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#7cc4ff]">Digitalization Needs Assessment</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            Petakan kebutuhan digital, <span className="text-white/50">dari setiap Bagian.</span>
          </h1>
          <ol className="mt-10 space-y-5">
            {STEPS.map((s) => (
              <li key={s.no} className="flex gap-4">
                <span className="mt-0.5 font-mono text-xs text-[#7cc4ff]">{s.no}</span>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-sm text-white/60">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} PT Kawasan Industri Nusantara · Aplikasi internal</p>
      </section>

      {/* Panel masuk */}
      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
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
