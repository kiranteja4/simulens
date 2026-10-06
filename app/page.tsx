import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-6">
          <div className="mb-10">
            <h1 className="text-2xl font-bold">SimuLens</h1>
            <p className="mt-1 text-xs text-slate-500">
              Decision Intelligence
            </p>
          </div>

          <nav className="space-y-2">
            <div className="rounded-lg bg-slate-800 px-4 py-3 text-sm">
              Dashboard
            </div>

            <div className="px-4 py-3 text-sm text-slate-400">
              Simulations
            </div>

            <div className="px-4 py-3 text-sm text-slate-400">
              Scenarios
            </div>

            <div className="px-4 py-3 text-sm text-slate-400">
              Results
            </div>

            <div className="px-4 py-3 text-sm text-slate-400">
              History
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <section className="flex-1 p-8">

          {/* Header */}
          <header className="mb-8">
            <p className="text-sm text-slate-500">
              Simulation Workspace
            </p>

            <h2 className="mt-1 text-3xl font-bold">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-400">
              Model systems, test scenarios and optimize decisions.
            </p>
          </header>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">
                Total Simulations
              </p>

              <p className="mt-3 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">
                Active Scenarios
              </p>

              <p className="mt-3 text-3xl font-bold">
                0
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">
                Models Created
              </p>

              <p className="mt-3 text-3xl font-bold">
                0
              </p>
            </div>

          </div>

          {/* Create Simulation */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8">
            <h3 className="text-xl font-semibold">
              Start a Simulation
            </h3>

            <p className="mt-2 max-w-xl text-sm text-slate-400">
              Create a virtual model of a real-world system and explore
              what happens when conditions change.
            </p>

              <Link
  href="/simulations/new"
  className="mt-6 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
>
  + Create Simulation
</Link>

          </div>

          {/* Recent Simulations */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold">
              Recent Simulations
            </h3>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="text-sm text-slate-500">
                No simulations yet.
              </p>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
