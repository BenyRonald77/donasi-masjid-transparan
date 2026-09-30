"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TutupPanel({
  kampanyeId,
  terkunci,
  hash,
  ditutupPada,
}: {
  kampanyeId: number;
  terkunci: boolean;
  hash: string | null;
  ditutupPada: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function tutup() {
    if (!confirm("Tutup periode kampanye? Setelah ditutup, donasi dan pengeluaran baru akan ditolak dan laporan dikunci dengan hash.")) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(`/api/kampanye/${kampanyeId}/tutup`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal menutup periode");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (terkunci)
    return (
      <div className="rounded border border-slate-300 bg-slate-100 p-4">
        <p className="font-bold text-slate-700">🔒 PERIODE TERKUNCI</p>
        {ditutupPada && <p className="mt-1 text-sm text-slate-500">Ditutup pada: {ditutupPada}</p>}
        {hash && (
          <p className="mt-1 break-all font-mono text-xs text-slate-600">
            SHA-256: {hash}
          </p>
        )}
      </div>
    );

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm text-amber-800">
        Penutupan periode mengunci kampanye: donasi dan pengeluaran baru akan ditolak,
        dan laporan disegel dengan hash SHA-256.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button onClick={tutup} disabled={loading}
        className="mt-2 rounded bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
        {loading ? "Menutup..." : "Tutup Periode Kampanye"}
      </button>
    </div>
  );
}
