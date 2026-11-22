import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import SplitLayout, { topRightLinkClass } from "@/components/SplitLayout";

import ResetPassCard from "./ResetPassCard";

export default function ResetPass() {
  return (
    <SplitLayout
      topRight={
        <Link to="/" className={topRightLinkClass}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Home
        </Link>
      }
    >
      <ResetPassCard />
    </SplitLayout>
  );
}
