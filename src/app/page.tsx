import OneTapComponent from "@/components/GoogleOneTap";
import { createClient } from "@utils/supabase/server";
import Link from "next/link";
// import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {data.user ? (
          <div className="flex flex-col gap-4 items-center">
            <h1 className="text-2xl font-semibold text-gray-400">
              Welcome,{" "}
              {data.user.email
                ? data.user.email.split("@")[0]
                : data.user.user_metadata.full_name}
              !
            </h1>
          </div>
        ) : (
          <>
            <OneTapComponent />
            <Link
              href="/signin"
              className="inline-flex text-gray-800 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium shadow-sm hover:shadow transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign in with Google
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
