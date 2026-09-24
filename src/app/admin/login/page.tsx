import { redirect } from "next/navigation";
import { isAdminConfigured } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Вход" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="font-display text-sm font-medium tracking-[0.28em]">ANUBIS</p>
        <h1 className="mt-8 text-2xl font-semibold">Вход в админку</h1>
        {isAdminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-6 border border-line bg-surface p-4 text-sm leading-relaxed">
            Пароль администратора ещё не задан. Добавьте переменную <code>ADMIN_PASSWORD</code> (минимум 8
            символов) в Vercel → Settings → Environment Variables и сделайте Redeploy.
          </p>
        )}
      </div>
    </main>
  );
}
