import type { Metadata } from "next";
import Link from "next/link";

import { demoAccounts } from "@/lib/demo-accounts";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Masuk</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Daftar gratis
        </Link>
      </p>

      <LoginForm />

      <div className="mt-6 rounded-md bg-zinc-50 p-3 text-xs text-zinc-600">
        <p className="mb-2 font-medium text-zinc-700">Akun demo</p>
        <ul className="space-y-1">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <span className="font-medium">{account.label}:</span> {account.email} / {account.password}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
