import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function AppSubmittedCard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center justify-around w-[1000px] h-[400px] m-20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-[100px] stroke-blue"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <h3 className="text-3xl text-black">
        Your Application has been Successfully Submitted
      </h3>
      <div>
        <Button
          className="rounded-3xl pl-5 pr-5 font-semibold "
          type="button"
          onClick={() => navigate("/apply/status")}
        >
          Go to Status Page
        </Button>
        <Link
          className="cursor-pointer text-lg p-2 m-1 rounded-3xl pl-5 pr-5 font-semibold border-gray-500 border-2 w-[116px]"
          to={"/"}
        >
          Home
        </Link>
      </div>
    </div>
  );
}
