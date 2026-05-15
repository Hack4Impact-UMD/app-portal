import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import Loading from "@/components/Loading";
import { AcceptanceConfirmationTable } from "@/components/dor/AcceptanceConfirmationDashboard";
import useSearch from "@/hooks/useSearch";
import { useAllDecisionConfirmationsForForm } from "@/hooks/useDecisionConfirmation";

export default function AcceptanceConfirmationDashboard() {
  const { formId } = useParams<{ formId: string }>();
  const [decisionFilter, setDecisionFilter] = useState<
    "all" | "accepted" | "denied"
  >("all");
  const { search } = useSearch();

  const {
    data: confirmations,
    isPending,
    error,
  } = useAllDecisionConfirmationsForForm(formId ?? "");

  const numAccepted = useMemo(
    () => confirmations?.filter((c) => c.status === "accepted").length,
    [confirmations],
  );

  if (!formId) return <p>No formId found! The URL is probably malformed.</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;
  if (isPending || !confirmations) return <Loading />;

  return (
    <div>
      {/* Role Filter Buttons */}
      <div className="overflow-x-scroll flex flex-row gap-2 items-center min-h-28 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
            ${
              decisionFilter === "all"
                ? "bg-[#4A280D] hover:bg-[#4A280D]/90 text-[#F1D5C4]"
                : "bg-[#F1D5C4] hover:bg-[#F1D5C4]/90 text-[#4A280D]"
            }`}
          onClick={() => setDecisionFilter("all")}
        >
          <span className="text-3xl">{confirmations.length}</span>
          <span className="mt-auto">Total Confirmations</span>
        </Button>
        <Button
          className={`h-28  min-w-40 p-4 flex flex-col items-start 
					${decisionFilter !== "accepted" ? "bg-[#DCEBDD] hover:bg-[#DCEBDD]/90 text-[#1D3829]" : "bg-[#1D3829] hover:bg-[#1D3829]/90 text-[#DCEBDD]"}`}
          onClick={() => setDecisionFilter("accepted")}
        >
          <span className="text-3xl">{numAccepted}</span>
          <span className="mt-auto">Accepted</span>
        </Button>
        <Button
          className={`h-28 min-w-40 p-4 flex flex-col items-start 
					${decisionFilter !== "denied" ? "bg-[#FBDED9] hover:bg-[#FBDED9]/90 text-[#5D1615]" : "bg-[#5D1615] hover:bg-[#5D1615]/90 text-[#FBDED9]"}`}
          onClick={() => setDecisionFilter("denied")}
        >
          <span className="text-3xl">
            {confirmations.length - (numAccepted ?? 0)}
          </span>
          <span className="mt-auto">Denied</span>
        </Button>
      </div>

      {/* Table Component */}
      <AcceptanceConfirmationTable
        confirmations={confirmations}
        formId={formId}
        search={search}
        decisionFilter={decisionFilter}
      />
    </div>
  );
}
