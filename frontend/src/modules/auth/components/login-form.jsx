import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/app/hooks/use-auth";
import { loginRequest } from "@/modules/auth/api/auth-api";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    email: "admin@contasolutions.com",
    password: "ContaSolutions123*"
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (response) => {
      setSession({
        token: response.data.accessToken,
        user: response.data.user
      });

      navigate(location.state?.from?.pathname || "/", { replace: true });
    }
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <div className="w-full max-w-xl">
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-8 py-8">
          <span className="text-xs font-bold uppercase tracking-[0.28em] text-brand-cyan">Secure Access</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink">Inicia sesión en ContaSolutions</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Accede al tablero ejecutivo y a la operación contable con una experiencia diseñada para equipos profesionales.
          </p>
        </div>

        <form className="space-y-6 px-8 py-8" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="email">
              Correo corporativo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="field-input"
              placeholder="tu@contasolutions.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="field-input"
              placeholder="••••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {loginMutation.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loginMutation.error?.response?.data?.message || "No fue posible iniciar sesión."}
            </div>
          ) : null}

          <button type="submit" className="button-primary w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Validando acceso..." : "Entrar al sistema"}
          </button>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Ambiente inicial conectado al backend existente. Puedes entrar con el super admin sembrado por el `seed`.
          </div>
        </form>
      </div>
    </div>
  );
}
