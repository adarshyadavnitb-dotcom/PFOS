import { Plus, Sparkles, Loader2 } from "lucide-react";

export function ActionBar({
  onAdd,
  onGenerate,
  generating,
}: {
  onAdd: () => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <button onClick={onAdd} className="btn-primary">
        <Plus size={16} /> Quick add
      </button>
      <button onClick={onGenerate} disabled={generating} className="btn-ghost">
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? "Generating…" : "Generate insight"}
      </button>
    </div>
  );
}
