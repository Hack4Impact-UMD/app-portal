import { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DataWarningDialogProps = {
  open: boolean;
  onSubmit: () => void;
};

export default function DataWarningDialog({
  open,
  onSubmit,
}: DataWarningDialogProps) {
  const [buttonDisabled, setButtonDisabled] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setButtonDisabled(false);
    }, 3000);

    return () => clearTimeout(timer);
  });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Welcome to the first live run of Hack4Impact-UMD's Application
            Portal! This app is designed to autosave your responses. However, as
            this is our initial launch, there may be unforeseen issues. Back up
            your responses elsewhere (e.g. in Google Docs)... just in case!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onSubmit()}
            disabled={buttonDisabled}
          >
            {buttonDisabled ? "Read the message" : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
