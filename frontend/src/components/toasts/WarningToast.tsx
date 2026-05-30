import { TriangleAlert, XIcon } from "lucide-react";
import { toast } from "react-toastify";

function WarningToast({
  message,
  closeToast,
}: {
  message: string;
  closeToast?: () => void;
}) {
  return (
    <div className="bg-[#FEF9C3] text-black border border-amber-500 rounded-xl shadow-lg p-4 flex items-center gap-2 max-w-md z-50">
      <TriangleAlert className="size-6 text-amber-500" />
      <span className="flex-1 text-sm text-amber-700">{message}</span>
      <XIcon
        onClick={closeToast}
        className="size-4 text-amber-500 cursor-pointer"
      />
    </div>
  );
}

export function throwWarningToast(message: string) {
  toast.warn(<WarningToast message={message} />, {
    closeButton: false,
    hideProgressBar: true,
    icon: false,
  });
}
