"use client";
import { useActionState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FormMessage, SubmitButton } from "@/components/ui/form";

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, undefined);
  return (
    <Card>
      <CardBody>
        <form action={action} className="space-y-4">
          <Field label="Kata sandi saat ini" htmlFor="current" required>
            <Input id="current" name="current" type="password" autoComplete="current-password" required />
          </Field>
          <Field label="Kata sandi baru" htmlFor="password" required hint="Minimal 8 karakter, memuat huruf dan angka.">
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
          <Field label="Konfirmasi kata sandi baru" htmlFor="confirm" required>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </Field>
          <FormMessage message={state?.error} />
          <FormMessage message={state?.success} tone="success" />
          <SubmitButton className="w-full" pendingText="Menyimpan…">
            Simpan kata sandi
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
