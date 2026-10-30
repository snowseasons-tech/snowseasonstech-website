"use client";

import { useFormStatus } from "react-dom";

// Submit button that disables itself and shows a label while a Server Action runs.
export function PendingSubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
