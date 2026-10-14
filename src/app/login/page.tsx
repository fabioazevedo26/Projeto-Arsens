"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import Image from "next/image";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <Image 
              src="/logo.png.jpeg" 
              alt="ARSENS Logo" 
              width={100}
              height={100}
              className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-4">
            Acesso ao Sistema
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Acesso restrito. Insira suas credenciais.
          </p>
        </div>

        <form action={formAction} className="space-y-6 mt-8">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300"
            >
              Usuário
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Senha
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-200 text-sm text-center">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 flex justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
