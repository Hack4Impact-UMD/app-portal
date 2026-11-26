import { useState } from "react";
import { useParams } from "react-router-dom";

import { BoardMembersTable } from "@/components/dor/BoardDashboard/BoardMembersTable";
import { useRows } from "@/components/dor/BoardDashboard/useRows";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import useSearch from "@/hooks/useSearch";

export default function SuperReviewerBoardDashboard() {
  const { formId } = useParams<{ formId: string }>();

  const {
    data: boardMembers,
    isPending: boardPending,
    error: boardError,
  } = useRows();

  const { search } = useSearch();

  const [statusFilter, setStatusFilter] = useState<"all">("all");

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (boardError)
    return <p>Failed to fetch board members: {boardError.message}</p>;
  if (boardPending || !boardMembers)
    return (
      <div className="flex items-center justify-center p-4 w-full h-full">
        <Spinner />
      </div>
    );

  return (
    <div>
      <div className="overflow-x-scroll flex flex-row gap-2 justify-stretch mt-4 no-scrollbar">
        <Button
          className={`h-28 min-w-40 text-white p-4 flex flex-col items-start 
					${statusFilter === "all" ? "bg-[#17476B] hover:bg-[#17476B]/90 text-[#D5E7F2]" : "bg-[#D5E7F2] hover:bg-[#D5E7F2]/90 text-[#17476B]"}`}
          onClick={() => setStatusFilter("all")}
        >
          <span className="text-3xl">{boardMembers.length}</span>
          <span className="mt-auto">Board Members</span>
        </Button>
      </div>
      <BoardMembersTable search={search} statusFilter={statusFilter} />
    </div>
  );
}
