"use server";

import { APIError } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export type AuthFormState = {
  error?: string;
  // Echoed back so the form keeps what the user typed after an error.
  values?: { name?: string; email?: string };
};

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email atau password salah.",
  USER_ALREADY_EXISTS: "Email sudah terdaftar. Silakan masuk.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Email sudah terdaftar. Gunakan email lain.",
  INVALID_EMAIL: "Format email tidak valid.",
  PASSWORD_TOO_SHORT: "Password minimal 8 karakter.",
  PASSWORD_TOO_LONG: "Password terlalu panjang.",
};

// Turn a Better Auth error into a message for the form. Anything unexpected is rethrown,
// so it surfaces in the error boundary and server logs instead of being hidden.
function toErrorMessage(error: unknown): string {
  if (!(error instanceof APIError)) throw error;
  const code = error.body?.code;
  return (code && ERROR_MESSAGES[code]) || "Terjadi kesalahan. Silakan coba lagi.";
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  let destination: string;
  try {
    const result = await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    destination = result.user.role === "ADMIN" ? "/admin" : "/dashboard";
  } catch (error) {
    return { error: toErrorMessage(error), values: { email } };
  }
  // redirect() works by throwing, so it must stay outside the try/catch.
  redirect(destination);
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Nama wajib diisi.", values: { name, email } };

  try {
    // Signs the new user in as well, and nextCookies() stores the session cookie.
    await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
  } catch (error) {
    return { error: toErrorMessage(error), values: { name, email } };
  }
  redirect("/dashboard");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
