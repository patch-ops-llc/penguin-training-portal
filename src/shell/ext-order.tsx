"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Registry = {
  register: (id: string, el: HTMLElement) => void;
  unregister: (id: string) => void;
  orderFor: (id: string) => number;
};

const ExtOrderContext = createContext<Registry | null>(null);

export function ExtOrderProvider({ children }: { children: React.ReactNode }) {
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const [, bump] = useState(0);
  const scheduleBump = useCallback(() => bump((v) => v + 1), []);

  const registry: Registry = {
    register: (id, el) => {
      nodesRef.current.set(id, el);
      scheduleBump();
    },
    unregister: (id) => {
      nodesRef.current.delete(id);
      scheduleBump();
    },
    orderFor: (id) => {
      const sorted = [...nodesRef.current.entries()]
        .map(([extId, node]) => {
          const r = node.getBoundingClientRect();
          return { extId, top: r.top, left: r.left };
        })
        .sort((a, b) => a.top - b.top || a.left - b.left);
      const idx = sorted.findIndex((x) => x.extId === id);
      return idx >= 0 ? idx + 1 : 0;
    },
  };

  useEffect(() => {
    const onReflow = () => scheduleBump();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [scheduleBump]);

  return <ExtOrderContext.Provider value={registry}>{children}</ExtOrderContext.Provider>;
}

export function useExtOrder(id: string, pinRef: React.RefObject<HTMLElement | null>) {
  const ctx = useContext(ExtOrderContext);

  useEffect(() => {
    const el = pinRef.current;
    if (!ctx || !el) return;
    ctx.register(id, el);
    return () => ctx.unregister(id);
  }, [ctx, id, pinRef]);

  return ctx?.orderFor(id) ?? 0;
}