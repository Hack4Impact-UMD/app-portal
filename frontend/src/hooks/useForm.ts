import { useContext } from "react";

import { FormContext } from "@/contexts/formContext";

export default function useForm() {
  return useContext(FormContext);
}
