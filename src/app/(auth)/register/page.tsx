import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Daftar akun</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Masuk
        </Link>
      </p>
      <RegisterForm />
    </>
  );
}
