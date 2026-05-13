import { useParams } from "react-router-dom";
import Loading from "../../../components/Loading";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import useSearch from "@/hooks/useSearch";
import { useAllBoardMembers } from "@/hooks/useBoardMembers";
import { BoardMembersTable } from "@/components/dor/BoardDashboard/BoardMembersTable";

export default function SuperReviewerBoardDashboard() {
  const { formId } = useParams<{ formId: string }>();

  const {
    data: boardMembers,
    isPending: boardPending,
    error: boardError,
  } = useAllBoardMembers();

  const { search } = useSearch();

  const [statusFilter, setStatusFilter] = useState<"all">("all");

  if (!formId) return <p>No formId found! The url is probably malformed.</p>;
  if (boardError)
    return <p>Failed to fetch board members: {boardError.message}</p>;
  if (boardPending || !boardMembers) return <Loading />;

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
      <BoardMembersTable
        boardMembers={boardMembers}
        search={search}
        statusFilter={statusFilter}
      />
    </div>
  );
}
