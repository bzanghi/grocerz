import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Family Groceries</h1>
        <p className="mt-2 text-zinc-500">
          Collaborative, mobile-first grocery lists for families.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/login">
          <Button className="h-12 w-full rounded-lg bg-[#10B981] text-white hover:bg-[#0EA371]">
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button
            variant="outline"
            className="h-12 w-full rounded-lg border-[#F59E0B] text-[#F59E0B] hover:bg-[#FFF7ED]"
          >
            Create account
          </Button>
        </Link>
      </div>
    </main>
  );
}
