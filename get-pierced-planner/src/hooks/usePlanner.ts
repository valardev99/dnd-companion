import { useEffect, useReducer, useRef, useState } from "react";
import { createEmptyPlan, planReducer, type PlanAction } from "@/lib/planner/reducer";
import { loadPlan, savePlan } from "@/lib/planner/storage";
import type { PlanState } from "@/lib/planner/types";

/**
 * Plan state + persistence. Renders an empty plan on the server and during
 * the first client paint, then hydrates from localStorage in an effect so
 * SSR markup and the client's first render always match.
 */
export function usePlanner(): {
  plan: PlanState;
  dispatch: React.Dispatch<PlanAction>;
  hydrated: boolean;
} {
  const [plan, dispatch] = useReducer(planReducer, undefined, createEmptyPlan);
  const [hydrated, setHydrated] = useState(false);
  const skippedFirstSave = useRef(false);

  useEffect(() => {
    const stored = loadPlan();
    if (stored) dispatch({ type: "hydrate", state: stored });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // The hydrate dispatch itself lands here once; skip writing it straight back.
    if (!skippedFirstSave.current) {
      skippedFirstSave.current = true;
      return;
    }
    savePlan(plan);
  }, [plan, hydrated]);

  return { plan, dispatch, hydrated };
}
