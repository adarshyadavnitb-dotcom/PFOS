import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Modal } from "./Modal";

export function ConnectModal({
  onClose,
  onSubmit,
  connecting,
  error,
}: {
  onClose: () => void;
  onSubmit: (token: string) => void;
  connecting: boolean;
  error?: string;
}) {
  const [token, setToken] = useState("");

  return (
    <Modal
      title="Connect your data"
      subtitle="Switch from demo data to your live finances"
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-violet-500/10 p-3 text-xs text-slate-600 dark:text-slate-300">
          <ShieldCheck size={28} className="shrink-0 text-violet-500" />
          <p>
            Your access token stays in this browser and is sent only to your own n8n API. The public
            demo never sees your real numbers.
          </p>
        </div>

        <div>
          <label className="label">Access token</label>
          <input
            className="input font-mono"
            type="password"
            placeholder="Paste your dashboard token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && token.trim() && onSubmit(token.trim())}
          />
          {error && <p className="mt-2 text-xs font-medium text-rose-500">{error}</p>}
        </div>

        <button
          disabled={!token.trim() || connecting}
          onClick={() => onSubmit(token.trim())}
          className="btn-primary w-full justify-center"
        >
          {connecting ? <Loader2 size={16} className="animate-spin" /> : null}
          {connecting ? "Connecting…" : "Connect"}
        </button>
      </div>
    </Modal>
  );
}
