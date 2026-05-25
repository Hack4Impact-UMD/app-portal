import { mkConfig, generateCsv, download } from "export-to-csv";

import type { CsvRow } from "@/types/types";

import { throwErrorToast } from "./toasts/ErrorToast";
import { Button } from "./ui/button";

interface CsvButtonProps {
  data: CsvRow[];
  filename?: string;
  label?: string;
  className?: string;
}

export function ExportButton({
  data,
  filename = "h4i",
  label = "Export as CSV",
  className = "self-end",
}: CsvButtonProps) {
  const handleDownload = () => {
    if (data.length === 0) {
      throwErrorToast("No data to export!");
      return;
    }

    const csvConfig = mkConfig({
      useKeysAsHeaders: true,
      filename,
    });

    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  return (
    <Button className={className} onClick={handleDownload}>
      {label}
    </Button>
  );
}
