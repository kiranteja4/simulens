export default function NewSimulation() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10">
          <p className="text-sm text-slate-500">
            Simulation Workspace
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Create Simulation
          </h1>

          <p className="mt-2 text-slate-400">
            Choose a system to model and simulate.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-3xl">🚚</div>

            <h2 className="mt-4 text-xl font-semibold">
              Delivery & Resource Simulation
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Model vehicles, orders, queues, resources,
              delivery times and operating costs.
            </p>

            <button className="mt-6 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950">
              Select Simulation
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-6">
            <div className="text-3xl">＋</div>

            <h2 className="mt-4 text-xl font-semibold">
              More Domains
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Additional simulation domains will be supported
              as the platform evolves.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}