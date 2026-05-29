import { PermissionRole } from "@app-portal/shared/constants";
import { HomeIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { useAuth } from "@/hooks/useAuth";
import { displayUserRoleName } from "@/utils/display";

import NavProfile from "./NavProfile";

function Navbar({ className }: { className?: string }) {
  const { isLoading, isAuthed, user } = useAuth();

  return (
    <div
      className={twMerge(
        "z-50 flex flex-row w-full py-4 px-8 justify-center items-center bg-lightgray/70 backdrop-blur-sm h-16",
        className,
      )}
    >
      <div className="flex items-center flex-row h-full max-w-5xl w-full">
        <div className="flex gap-2 items-center">
          <NavLink className="hidden sm:block" to="/">
            <img
              className="w-52"
              src="/h4i_umd_logo.png"
              alt="hack4impact-UMD"
            />
          </NavLink>
          <span className="text-blue font-bold text-lg sm:hidden block">
            <img className="w-7" src="/h4i-logo.png" alt="hack4impact-UMD" />
          </span>
          {user?.role && user.role !== PermissionRole.Applicant && (
            <>
              <span className="font-light sm:mb-1">
                | {displayUserRoleName(user.role)}
              </span>
            </>
          )}
        </div>
        <div className="ml-auto flex flex-row items-center">
          <NavLink
            to="/"
            className="border-r border-solid border-gray-400 pr-1"
          >
            <HomeIcon className="w-8 h-8 text-black cursor-pointer hover:bg-darkgray/5 rounded-md p-1 transition-colors" />
          </NavLink>
          {!isLoading && isAuthed && user && (
            <NavProfile user={user} className="hover:bg-darkgray/5 ml-1" />
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
