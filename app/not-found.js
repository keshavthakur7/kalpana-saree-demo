import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-royal-cream px-6 text-center">
      <div>
        <div className="font-display text-6xl text-royal-burgundy">Kalpana Saree</div>
        <h1 className="mt-6 font-display text-4xl">Saree not found</h1>
        <p className="mt-3 text-black/60">The piece you're looking for is not available.</p>
        <Link href="/" className="mt-7 inline-block rounded-full bg-royal-burgundy px-7 py-3 text-sm text-white">
          Return home
        </Link>
      </div>
    </main>
  );
}
