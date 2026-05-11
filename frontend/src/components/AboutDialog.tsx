import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  CheckIcon,
  ClipboardIcon,
  ExternalLink,
  GitPullRequestIcon,
  MailIcon,
} from "lucide-react";
import { throwErrorToast } from "./toasts/ErrorToast";
import { useRef, useState } from "react";
import { useRemoteCommit } from "@/hooks/useUpdateCheck";
import ConfettiExplosion from "react-confetti-explosion";

export default function AboutDialog() {
  const commit = import.meta.env.DEV
    ? "dev"
    : import.meta.env.VITE_COMMIT
      ? import.meta.env.VITE_COMMIT
      : "unknown";

  const {
    data: remoteCommit,
    isPending: remoteCommitPending,
    error: remoteCommitError,
  } = useRemoteCommit();

  const [localCommitCopied, setLocalCommitCopied] = useState(false);
  const [remoteCommitCopied, setRemoteCommitCopied] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLocalCopy = async () => {
    try {
      await navigator.clipboard.writeText(commit);
      setLocalCommitCopied(true);
      setTimeout(() => setLocalCommitCopied(false), 1500);
    } catch {
      throwErrorToast("Failed to copy");
      setLocalCommitCopied(false);
    }
  };

  const handleRemoteCopy = async () => {
    try {
      await navigator.clipboard.writeText(remoteCommit ?? "N/A");
      setRemoteCommitCopied(true);
      setTimeout(() => setRemoteCommitCopied(false), 1500);
    } catch {
      throwErrorToast("Failed to copy");
      setRemoteCommitCopied(false);
    }
  };

  const handleEasterEgg = () => {
    setConfetti(true);
    if (confettiTimeout.current) clearTimeout(confettiTimeout.current);
    confettiTimeout.current = setTimeout(() => setConfetti(false), 3500);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>About</DialogTitle>
        <DialogDescription>
          The Hack4Impact-UMD Application portal.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div>
          <p className="font-medium">Built from commit:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono grow text-muted-foreground" title={commit}>
              {commit.slice(0, 7)}
            </p>

            {localCommitCopied ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-green-200 hover:bg-green-200 border-green-500 text-green-800 hover:text-green-800"
              >
                <CheckIcon /> Copied!
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={handleLocalCopy}
              >
                <ClipboardIcon /> Copy hash
              </Button>
            )}
          </div>
          <p className="font-medium">Latest deployed commit:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono grow text-muted-foreground" title={commit}>
              {remoteCommitPending
                ? "Loading..."
                : remoteCommitError
                  ? "Error"
                  : remoteCommit === null
                    ? "N/A"
                    : remoteCommit.slice(0, 7)}
            </p>
            {remoteCommitCopied ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 bg-green-200 hover:bg-green-200 border-green-500 text-green-800 hover:text-green-800"
              >
                <CheckIcon /> Copied!
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={handleRemoteCopy}
              >
                <ClipboardIcon /> Copy hash
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-center gap-2 text-blue-500 underline-offset-4 [&>a:hover]:underline">
            <a
              className="flex flex-row gap-1 items-center"
              href="https://umd.hack4impact.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              Main Website
            </a>
            |
            <a
              className="flex flex-row gap-1 items-center"
              href="mailto:umd@hack4impact.org"
            >
              <MailIcon className="size-4" />
              Report an Issue
            </a>
            |
            <a
              className="flex flex-row gap-1 items-center"
              href="https://github.com/Hack4Impact-UMD/h4i-internal-application-tool"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitPullRequestIcon className="size-4" />
              GitHub
            </a>
          </div>
          <div className="flex items-center justify-center">
            {confetti && <ConfettiExplosion zIndex={1000} duration={3000} />}
            <p
              className="text-sm text-muted-foreground cursor-pointer"
              onClick={handleEasterEgg}
            >
              {confetti ? (
                <span className="font-bold text-lg">Ramy says hi! 👋</span>
              ) : (
                "Made with ❤️ by the Hack4Impact-UMD team"
              )}
            </p>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
