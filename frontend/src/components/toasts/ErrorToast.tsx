import { CircleAlert, XIcon } from "lucide-react";
import { toast } from "react-toastify";

type ErrorToastProps = {
  message: string;
  closeToast?: () => void;
};

function ErrorToast({ message, closeToast }: ErrorToastProps) {
  return (
    <div className="bg-red-100 text-red-800 border border-red-300 rounded-xl shadow-lg p-4 flex items-center gap-2 max-w-md z-50">
      <CircleAlert className="size-6" />
      <div className="flex-1 text-sm">{message}</div>
      <XIcon onClick={closeToast} className="size-4 cursor-pointer" />
    </div>
  );
}

export function throwErrorToast(message: string): void {
  toast.error(<ErrorToast message={message} />, {
    icon: false,
    closeButton: false,
    hideProgressBar: true,
  });
}
