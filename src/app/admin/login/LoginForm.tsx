"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="label text-muted">Пароль</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          className="mt-2 h-12 w-full border border-line bg-bg px-3 outline-none focus:border-fg"
        />
      </label>
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="label h-12 w-full bg-fg text-bg transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {pending ? "Проверяю…" : "Войти"}
      </button>
    </form>
  );
}
