import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "react-toastify";

type SuccessToastProps = {
  message: string;
  closeToast?: () => void;
};

function SuccessToast({ message, closeToast }: SuccessToastProps) {
  return (
    <div className="bg-green-100 text-black border border-green-300 rounded-xl shadow-lg p-4 flex items-center justify-center gap-2 max-w-md z-50">
      <CheckIcon className="size-6 text-green-500" />
      <span className="flex-1 text-sm text-green-500">{message}</span>
      <XIcon
        onClick={closeToast}
        className="size-4 text-green-500 cursor-pointer"
      />
    </div>
  );
}

export function throwSuccessToast(message: string, autoClose: number = 2000) {
  toast.success(<SuccessToast message={message} />, {
    closeButton: false,
    hideProgressBar: true,
    icon: false,
    autoClose: autoClose,
  });
}
