import { Button } from "@/components/ui/button";
import useForm from "@/hooks/useForm";
import { cn } from "@/lib/utils";

/** Decorative bufo emote; the adjacent text carries the meaning. */
function Bufo({ src }: { src: string }) {
  return (
    <img src={src} alt="" aria-hidden="true" className="size-6 shrink-0" />
  );
}

export default function SaveStatusPanel({ className }: { className?: string }) {
  const { save, saveStatus } = useForm();
  const lastSaveTime =
    saveStatus.saved && saveStatus.lastSavedAt !== 0
      ? new Date(saveStatus.lastSavedAt).toLocaleTimeString()
      : null;

  return (
    <div
      className={cn(
        "flex flex-row md:flex-col items-center md:items-stretch gap-2",
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "grow md:grow-0 w-fit rounded-full py-0.5 text-sm",
          !saveStatus.saved && saveStatus.isError
            ? "bg-red-100 text-red-500"
            : "text-blue",
        )}
      >
        {!saveStatus.saved && !saveStatus.isError && saveStatus.isSaving ? (
          <p className="pulse font-bold flex flex-row items-center gap-1">
            <Bufo src="/bufo-offers-a-loading-spinner.gif" />
            Saving...
          </p>
        ) : !saveStatus.saved && saveStatus.isError ? (
          <p className="flex flex-row items-center gap-1">
            <Bufo src="/bufo-alarma.gif" />
            <span>
              Failed to save
              {lastSaveTime && ` (last save: ${lastSaveTime})`}
            </span>
          </p>
        ) : lastSaveTime ? (
          <p className="flex flex-row items-center gap-1">
            <Bufo src="/bufo-yay.gif" />
            Last save: {lastSaveTime}
          </p>
        ) : (
          <p className="flex flex-row items-center gap-1">
            <Bufo src="/bufo-offers-a-loading-spinner.gif" />
            Form not yet saved!
          </p>
        )}
      </div>
      <Button
        disabled={
          !saveStatus.saved && !saveStatus.isError && saveStatus.isSaving
        }
        className="shrink-0 cursor-pointer bg-blue disabled:bg-blue/50 disabled:cursor-wait rounded text-white"
        onClick={save}
      >
        Save application
      </Button>
    </div>
  );
}
