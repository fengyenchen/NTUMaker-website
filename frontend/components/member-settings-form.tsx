"use client";

import { FormEvent, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function MemberSettingsForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "無法儲存名稱");
      setDisplayName(data.display_name ?? "");
      setMessage("名稱已儲存");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "無法儲存名稱",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveProfile} className="mt-8">
      <label className="grid gap-2 text-sm font-bold" htmlFor="display-name">
        顯示名稱
        <input
          id="display-name"
          required
          maxLength={100}
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="input-admin"
        />
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm font-bold text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-success">
          <Check size={16} />
          {message}
        </p>
      )}
      <button
        disabled={saving || !displayName.trim() || displayName === initialDisplayName}
        className="button-25d mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-4 font-bold disabled:opacity-50"
      >
        {saving && <LoaderCircle className="animate-spin" size={17} />}
        儲存名稱
      </button>
    </form>
  );
}
