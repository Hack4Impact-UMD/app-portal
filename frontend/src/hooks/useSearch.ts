import { useContext } from "react";

import { SearchContext } from "@/contexts/searchContext";

export default function useSearch() {
  return useContext(SearchContext);
}
