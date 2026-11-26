import { useCallback, useReducer } from "react";

type ReducerState = {
  step: number;
  complete: boolean;
};

export type WizardHook = ReturnType<typeof useWizard>;

export function useWizard(steps: number) {
  function reducer(
    state: ReducerState,
    action: "complete" | "next" | "reset",
  ): ReducerState {
    switch (action) {
      case "complete":
        return state.complete ? state : { ...state, complete: true };
      case "next":
        return state.complete && state.step < steps - 1
          ? { complete: false, step: state.step + 1 }
          : state;
      case "reset":
        return { step: 0, complete: false };
    }
  }

  const [state, dispatch] = useReducer(reducer, { step: 0, complete: false });

  const next = useCallback(() => dispatch("next"), []);
  const complete = useCallback(() => dispatch("complete"), []);
  const reset = useCallback(() => dispatch("reset"), []);
  const isLast = () => steps - 1 === state.step;

  return {
    state,
    steps,
    next,
    complete,
    reset,
    isLast,
  };
}
