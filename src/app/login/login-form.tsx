"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Field, Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  // Hitung respons agar animasi goyang diputar ulang pada setiap gagal masuk.
  const [attempt, setAttempt] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    setAttempt((n) => n + 1);
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email" required>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input id="email" name="email" type="email" autoComplete="username" required autoFocus placeholder="nama@kinra.co.id" className="h-11 pl-10" />
        </div>
      </Field>
      <Field label="Kata sandi" htmlFor="password" required>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-11 px-10" />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={showPassword}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </Field>
      {state?.error && (
        <div key={attempt} className="kn-shake">
          <FormMessage message={state.error} />
        </div>
      )}
      <SubmitButton className="group h-11 w-full" pendingText="Memeriksa…">
        Masuk
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </SubmitButton>
    </form>
  );
}
