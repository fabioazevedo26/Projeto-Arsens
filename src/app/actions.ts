"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    (await cookies()).set("session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    // Após o login, a primeira tela é o painel público; o técnico fica a um clique
    // ("Acesso para Pesquisadores" -> /login -> middleware redireciona para /dashboard).
    redirect("/");
  }

  return { error: "Credenciais inválidas. Tente novamente." };
}

export async function logout() {
  (await cookies()).delete("session");
  redirect("/"); // volta ao painel público
}
