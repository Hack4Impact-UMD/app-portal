import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import SplitLayout, {
  MAIN_SITE_URL,
  topRightLinkClass,
} from "@/components/SplitLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { displayUserRoleName } from "@/utils/display";

export default function LandingPage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <SplitLayout
      topRight={
        <a
          href={MAIN_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={topRightLinkClass}
        >
          Main site
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </a>
      }
    >
      <div className="max-w-xl">
        <h1 className="text-5xl font-normal leading-[1.05] tracking-tight sm:text-6xl">
          {user ? "Welcome back" : "Build with us"}
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-h4i-navy/70">
          {user
            ? "Pick up where you left off."
            : "We're looking for students who want to build software that makes a real difference for nonprofits. Whether you're ready to lead a team or just starting to code, there's a role for you."}
        </p>

        <div className="mt-10 flex min-h-10 flex-col gap-3 sm:flex-row">
          {isLoading ? null : user ? (
            <>
              <Button asChild size="lg" className="sm:min-w-[200px]">
                <Link to="/login">
                  Enter {displayUserRoleName(user.role)} Home
                </Link>
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="sm:min-w-[200px]"
                onClick={logout}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="sm:min-w-[200px]">
                <Link to="/signup">Start your application</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="sm:min-w-[200px]"
              >
                <Link to="/login">Log in</Link>
              </Button>
            </>
          )}
        </div>

        {!user && !isLoading && (
          <p className="mt-4 text-sm text-h4i-navy/60">
            Already applied? Log in to continue your application or check your
            status.
          </p>
        )}
      </div>
    </SplitLayout>
  );
}
