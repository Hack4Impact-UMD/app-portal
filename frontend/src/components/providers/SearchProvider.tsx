import type { ReactNode } from "react";
import { useState } from "react";

import { SearchContext } from "@/contexts/searchContext";

export default function SearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState<string>("");

  return (
    <SearchContext.Provider
      value={{
        search: search,
        setSearch: setSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
