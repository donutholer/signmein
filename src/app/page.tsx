import Link from "next/link";

export default function Home() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-dvh grid place-items-center bg-white dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <main className="text-center space-y-8">
          {/* Logo placeholder */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 grid place-items-center">
              <svg
                className="w-8 h-8 text-neutral-600 dark:text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Product name and tagline */}
          <div className="space-y-3">
            <h1 className="text-3xl font-medium text-neutral-950 dark:text-neutral-50">
              Attendance System
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 text-balance">
              Simple, secure attendance tracking for modern classrooms
            </p>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Link
              href="/signin"
              className="inline-flex items-center px-5 py-2.5 rounded-lg font-medium border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 dark:focus-visible:ring-white focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            © {currentYear} Attendance System
          </p>
        </footer>
      </div>
    </div>
  );
}