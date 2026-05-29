import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import {
  DropdownMenuGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { clearQueryCache } from "@/config/query";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile } from "@/types/types";

import AboutDialog from "./AboutDialog";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type NavProfileProps = {
  user: UserProfile;
  className?: string;
};

export default function NavProfile({ user, className = "" }: NavProfileProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Dialog>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={twMerge(
              "flex px-2 bg-transparent flex-row gap-2",
              className,
            )}
          >
            <Avatar className="rounded-full size-8">
              <AvatarFallback className="bg-gray-300 text-sm">
                {user.firstName.charAt(0).toUpperCase()}
                {user.lastName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-light">{user.firstName}</span>
            {open ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-50" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Profile</DropdownMenuLabel>
            <Link to={"/profile"}>
              <DropdownMenuItem className="cursor-pointer">
                Edit Profile
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Advanced</DropdownMenuLabel>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  onClick={async () => {
                    await clearQueryCache();
                  }}
                  className="cursor-pointer"
                >
                  Clear Cache
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  This can fix issues with stale data or abnormally long loading
                  times. Refreshing after clearing is recommended.
                </p>
              </TooltipContent>
            </Tooltip>
            <a href="mailto:umd@hack4impact.org">
              <DropdownMenuItem className="cursor-pointer">
                Report an Issue
              </DropdownMenuItem>
            </a>
            <DialogTrigger asChild>
              <DropdownMenuItem
                variant="default"
                className="cursor-pointer"
                onSelect={() => setOpen(false)}
              >
                About
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={logout}
              variant="destructive"
              className="cursor-pointer"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <AboutDialog />
    </Dialog>
  );
}
