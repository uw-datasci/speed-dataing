import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold text-valentine-red">
        Access restricted
      </h1>
      <p className="max-w-md text-gray-600">
        This page is only available to DSC execs and admins. If you think you
        should have access, ask an organizer to update your role on
        uwdatascience.ca.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-valentine-red px-6 py-2 font-semibold text-white hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
