import { useEffect, useState } from "react";
import { apiGet } from "./lib/api";

type Health = {
  ok: boolean;
  service: string;
};

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiGet<Health>("/health");
        setHealth(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-800 p-6 bg-slate-900">
        <h1 className="text-2xl font-bold mb-4">SkillCanvas Web</h1>

        {loading && <p className="text-slate-300">Checking API health...</p>}

        {!loading && error && (
          <p className="text-red-400">API error: {error}</p>
        )}

        {!loading && health && (
          <div className="space-y-2">
            <p>
              Status:{" "}
              <span className="font-semibold text-emerald-400">
                {health.ok ? "OK" : "NOT OK"}
              </span>
            </p>
            <p>Service: {health.service}</p>
          </div>
        )}
      </div>
    </main>
  );
}