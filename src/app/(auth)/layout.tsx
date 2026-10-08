// (auth) is a route group: the parentheses keep "auth" out of the URL, so pages here are
// /login and /register. It only exists to share this centered card layout.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</div>
    </main>
  );
}
