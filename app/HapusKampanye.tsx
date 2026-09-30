"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HapusKampanye({ id, nama }: { id: number; nama: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function hapus() {
    if (!confirm(`Hapus kampanye "${nama}"?`)) return;
    setError("");
    const res = await fetch(`/api/kampanye/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal menghapus");
      return;
    }
    router.refresh();
  }

  return (
    <span>
      <button onClick={hapus} className="text-sm text-red-600 hover:underline">
        Hapus
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
