import { ApplicantRole } from "@app-portal/shared/types";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import type { CsvRow } from "@/types/types";
import { mkConfig, generateCsv, download } from "export-to-csv";
import { throwErrorToast } from "./toasts/ErrorToast";
import { displayApplicantRoleName } from "@/utils/display";

interface ExportRoleDialogButtonProps {
  onExport: (role: ApplicantRole) => CsvRow[];
  filenamePrefix: string;
  className?: string;
}

export function ExportRoleDialogButton({
  onExport,
  filenamePrefix,
  className,
}: ExportRoleDialogButtonProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleExportRole = useCallback(
    (role: ApplicantRole) => {
      const data = onExport(role);

      if (data.length === 0) {
        throwErrorToast(
          `No ${displayApplicantRoleName(role)} applicants to export!`,
        );
        return;
      }

      const csvConfig = mkConfig({
        useKeysAsHeaders: true,
        filename: `${filenamePrefix}-${role}`,
      });

      const csv = generateCsv(csvConfig)(data);
      download(csvConfig)(csv);
      setExportDialogOpen(false);
    },
    [onExport, filenamePrefix],
  );

  return (
    <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export to CSV</DialogTitle>
          <DialogDescription>
            Select a role to export all applicants for:
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {Object.values(ApplicantRole).map((role) => (
            <Button
              key={role}
              variant="outline"
              onClick={() => handleExportRole(role)}
              className="justify-start"
            >
              {displayApplicantRoleName(role)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
