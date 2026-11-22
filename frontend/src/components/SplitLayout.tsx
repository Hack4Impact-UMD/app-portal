import { Github, Instagram, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  loggedInMessages,
  loggedOutMessages,
  pickWeightedMessage,
} from "@/utils/welcomeMessages";

export const MAIN_SITE_URL = "https://umd.hack4impact.org/";

const SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/hack4impactumd/",
    label: "Instagram",
    Icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/company/hack4impact-umd",
    label: "LinkedIn",
    Icon: Linkedin,
  },
  { href: "https://github.com/Hack4Impact-UMD", label: "GitHub", Icon: Github },
];

function useWelcomeMessage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionKey = user
      ? "landingMessageLoggedIn"
      : "landingMessageLoggedOut";

    let savedMessage: string | null = null;
    try {
      savedMessage = sessionStorage.getItem(sessionKey);
    } catch (err) {
      console.error("failed to read session storage");
      console.error(err);
    }

    if (savedMessage) {
      setMessage(savedMessage);
    } else {
      const messages = user ? loggedInMessages : loggedOutMessages;
      const newMessage = pickWeightedMessage(messages);

      setMessage(newMessage);
      try {
        sessionStorage.setItem(sessionKey, newMessage);
      } catch (err) {
        console.error("failed to read session storage");
        console.error(err);
      }
    }
  }, [user]);

  return message;
}

interface SplitLayoutProps {
  /** Shown in the top-right corner of the content column on desktop. */
  topRight?: ReactNode;
  children: ReactNode;
}

/**
 * Two-column page shell for the public pages (landing, log in, sign up): a
 * navy-tinted member photo with the logo, welcome message and social links on
 * the left, and the page's content on the right. On phones the photo becomes
 * a band above the content.
 */
export default function SplitLayout({ topRight, children }: SplitLayoutProps) {
  const { isLoading } = useAuth();
  const message = useWelcomeMessage();

  return (
    <div className="flex min-h-[100svh] flex-col bg-white lg:h-[100svh] lg:flex-row lg:overflow-hidden">
      {/* Photo column */}
      <section className="relative isolate flex min-h-[28svh] flex-col justify-between overflow-hidden bg-h4i-navy px-6 py-6 text-white sm:px-10 lg:w-2/5 lg:px-16 lg:py-8">
        <img
          src="landing-members.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center] grayscale"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-h4i-navy/70"
        />
        <a
          href={MAIN_SITE_URL}
          className="w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-h4i-navy"
        >
          <img
            src="h4i_logo_white.svg"
            alt="Hack4Impact-UMD"
            className="h-[27px] w-auto"
          />
        </a>

        <div className="mt-8 flex items-center justify-between gap-4 text-sm text-white/80">
          <span>{isLoading ? "Hacking and impacting..." : message}</span>
          <ul aria-label="Social media" className="flex items-center gap-1">
            {SOCIAL_LINKS.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.75}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Content column: scrolls on its own if a form is taller than the screen */}
      <section className="flex flex-1 flex-col px-6 py-10 text-h4i-navy sm:px-10 lg:overflow-y-auto lg:px-24 lg:py-8">
        <div className="hidden h-9 shrink-0 items-center justify-end lg:flex">
          {topRight}
        </div>

        <div className="flex flex-1 flex-col justify-center lg:py-8">
          {children}
        </div>
      </section>
    </div>
  );
}

/** Small text link for the top-right corner of {@link SplitLayout}. */
export const topRightLinkClass =
  "inline-flex items-center gap-1 rounded-sm text-base font-bold text-h4i-navy/70 transition-colors hover:text-h4i-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-h4i-navy focus-visible:ring-offset-4";
