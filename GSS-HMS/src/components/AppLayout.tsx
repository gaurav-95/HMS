import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { GuidedTour } from "@/components/GuidedTour";

export function AppLayout() {
  const [tourActive, setTourActive] = useState(false);

  const startTour = useCallback(() => setTourActive(true), []);

  useEffect(() => {
    window.addEventListener("gss-start-tour", startTour);
    return () => window.removeEventListener("gss-start-tour", startTour);
  }, [startTour]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
      <GuidedTour active={tourActive} onEnd={() => setTourActive(false)} />
    </div>
  );
}
