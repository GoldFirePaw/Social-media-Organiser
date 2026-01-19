import { DisplayIdeas } from "./components/DisplayIdeas";
import { Login } from "./components/Login";
import { ExportImport } from "./components/ExportImport";
import { IdeasProvider } from "./context/IdeasProvider";
import { CalendarView } from "./components/CalendarView";
import { FilmingQueue } from "./components/FilmingQueue";
import { MobileShell } from "./components/MobileShell";
import { WeeklyCalendarView } from "./components/WeeklyCalendarView";
import { MobileDrawer } from "./components/MobileDrawer";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DrawerView } from "./components/DrawerView";
import s from "./App.module.css";
import type { Idea } from "./api/getIdeas";
import type { CalendarEvent } from "./types/calendar";
import { useIsMobile } from "./hooks/useIsMobile";

function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined
  );
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [selectedDateIdeas, setSelectedDateIdeas] = useState<CalendarEvent[]>(
    []
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [calendarRefreshToken, setCalendarRefreshToken] = useState(0);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "danger">("success");
  const isMobile = useIsMobile();
  const bumpCalendarRefreshToken = useCallback(() => {
    setCalendarRefreshToken((token) => token + 1);
  }, []);

  const panelWidthLimits = useMemo(
    () => ({
      min: 340,
      max: 760,
    }),
    [],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: MouseEvent) => {
      const maxWidth = Math.min(panelWidthLimits.max, window.innerWidth * 0.95);
      const newWidth = window.innerWidth - event.clientX;
      setPanelWidth(Math.min(Math.max(newWidth, panelWidthLimits.min), maxWidth));
    };

    const stopResizing = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, panelWidthLimits.max, panelWidthLimits.min]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/status", {
          credentials: "include",
        });
        if (!mounted) return;
        setAuthenticated(res.ok);
      } catch {
        if (!mounted) return;
        setAuthenticated(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || !isMobile) {
      return;
    }

    const checkMobileMarkers = () => {
      const missing: string[] = [];
      if (!document.querySelector('[data-role="mobile-shell"]')) {
        missing.push("mobile-shell");
      }
      if (!document.querySelector('[data-role="mobile-nav"]')) {
        missing.push("mobile-nav");
      }
      const tabIds = ["calendar", "ideas", "film", "data"];
      tabIds.forEach((id) => {
        if (!document.querySelector(`[data-tab-id="${id}"]`)) {
          missing.push(`tab:${id}`);
        }
      });
      if (missing.length > 0) {
        console.warn(
          `[mobile-non-regression] Missing mobile layout markers: ${missing.join(
            ", "
          )}`
        );
      }
    };

    const frame = window.requestAnimationFrame(checkMobileMarkers);
    return () => window.cancelAnimationFrame(frame);
  }, [isMobile]);

  const handleEventSelect = (calendarEvent: CalendarEvent) => {
    const eventDate = calendarEvent.date ?? calendarEvent.start ?? null;
    setSelectedEvent(calendarEvent);
    setSelectedIdea(calendarEvent.idea);
    setSelectedDate(eventDate ? eventDate.slice(0, 10) : undefined);
    if (!isDrawerOpen) {
      setIsDrawerOpen(true);
    }
  };

  if (authenticated === null) {
    return <div style={{ padding: 20 }}>Checking authentication…</div>;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors here; we'll still clear local state
    } finally {
      localStorage.removeItem("sm_logged_in");
      setAuthenticated(false);
      setIsDrawerOpen(false);
      setIsPanelOpen(false);
      setStatusTone("success");
      setStatusMessage("Logged out.");
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  const handleShutdown = async () => {
    try {
      const res = await fetch("/api/shutdown", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setStatusTone("danger");
        setStatusMessage("Shutdown failed (not authorized).");
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
      setStatusTone("success");
      setStatusMessage("App is shutting down…");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusTone("danger");
      setStatusMessage("Shutdown request failed.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  if (!authenticated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ width: 360 }}>
          <Login onLogin={() => setAuthenticated(true)} />
        </div>
      </div>
    );
  }

  return (
    <IdeasProvider>
      <div
        className={s.App}
        style={
          {
            "--planner-offset":
              !isMobile && isPanelOpen ? `${panelWidth}px` : "0px",
          } as React.CSSProperties
        }
        data-layout={isMobile ? "mobile" : "desktop"}
      >
        {isMobile ? (
          <MobileShell
            calendar={
              <WeeklyCalendarView
                setSelectedDateIdeas={setSelectedDateIdeas}
                setSelectedIdea={setSelectedIdea}
                setSelectedEvent={setSelectedEvent}
                setIsDrawerOpen={setIsDrawerOpen}
                setSelectedDate={setSelectedDate}
                refreshToken={calendarRefreshToken}
              />
            }
            ideas={
              <DisplayIdeas
                scheduledPostsRefreshToken={calendarRefreshToken}
                onIdeaSelect={(idea) => {
                  setSelectedDate(undefined);
                  setSelectedDateIdeas([]);
                  setSelectedIdea(idea);
                  setSelectedEvent(null);
                  setIsDrawerOpen(true);
                }}
                onScheduleComplete={bumpCalendarRefreshToken}
              />
            }
            filming={
              <FilmingQueue refreshToken={calendarRefreshToken} variant="standalone" />
            }
            data={
              <div className={s.mobileDataPanel}>
                <ExportImport onImportComplete={bumpCalendarRefreshToken} />
                <div className={s.mobileDataActions}>
                  <button
                    type="button"
                    className={s.mobileActionButton}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  <button
                    type="button"
                    className={s.mobileActionButton}
                    onClick={handleShutdown}
                  >
                    Quit app
                  </button>
                </div>
              </div>
            }
          />
        ) : (
          <>
            <div className={s.container}>
              <div className={s.topBar}>
                <div className={s.panelToggleBar}>
                  <button
                    type="button"
                    className={s.panelToggle}
                    onClick={() => setIsPanelOpen((prev) => !prev)}
                  >
                    {isPanelOpen ? "Close planner" : "Open planner"}
                  </button>
                </div>
                <button
                  type="button"
                  className={s.logoutButton}
                  onClick={handleLogout}
                >
                  Logout
                </button>
                <button
                  type="button"
                  className={s.logoutButton}
                  onClick={handleShutdown}
                >
                  Quit app
                </button>
              </div>
              <div className={s.calendarColumn}>
                <CalendarView
                  setSelectedDateIdeas={setSelectedDateIdeas}
                  setSelectedIdea={setSelectedIdea}
                  setSelectedEvent={setSelectedEvent}
                  setIsDrawerOpen={setIsDrawerOpen}
                  setSelectedDate={setSelectedDate}
                  refreshToken={calendarRefreshToken}
                  onEventsChange={bumpCalendarRefreshToken}
                />
              </div>
            </div>
            <aside
              className={`${s.drawer} ${isPanelOpen ? s.drawerOpen : ""}`}
              style={{ width: `${panelWidth}px` }}
            >
              <div
                className={s.drawerResizeHandle}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setIsResizing(true);
                }}
                role="presentation"
              />
              <div className={s.drawerHeader}>
                <div className={s.drawerTitle}>Planner</div>
                <button
                  type="button"
                  className={s.drawerClose}
                  onClick={() => setIsPanelOpen(false)}
                  aria-label="Close planner"
                >
                  ✕
                </button>
              </div>
              <div className={s.drawerContent}>
                <ExportImport onImportComplete={bumpCalendarRefreshToken} />
                <DisplayIdeas
                  scheduledPostsRefreshToken={calendarRefreshToken}
                  onIdeaSelect={(idea) => {
                    setSelectedDate(undefined);
                    setSelectedDateIdeas([]);
                    setSelectedIdea(idea);
                    setSelectedEvent(null);
                    setIsDrawerOpen(true);
                  }}
                  onScheduleComplete={bumpCalendarRefreshToken}
                />
              </div>
            </aside>
          </>
        )}
        {isDrawerOpen &&
          (isMobile ? (
            <MobileDrawer
              setIsDrawerOpen={setIsDrawerOpen}
              setSelectedIdea={setSelectedIdea}
              setSelectedEvent={setSelectedEvent}
              date={selectedDate}
              idea={selectedIdea}
              dateIdeas={selectedDateIdeas}
              selectedEvent={selectedEvent}
              onIdeaUpdated={(updatedIdea) => {
                setSelectedIdea(updatedIdea);
                setSelectedEvent((event) =>
                  event ? { ...event, idea: updatedIdea } : null
                );
                setSelectedDateIdeas((events) =>
                  events.map((event) =>
                    event.idea.id === updatedIdea.id
                      ? { ...event, idea: updatedIdea }
                      : event
                  )
                );
                bumpCalendarRefreshToken();
              }}
              onEventUpdated={(updatedEvent) => {
                const updatedDate =
                  updatedEvent.date ?? updatedEvent.start ?? null;
                setSelectedEvent(updatedEvent);
                setSelectedIdea(updatedEvent.idea);
                setSelectedDate(
                  updatedDate ? updatedDate.slice(0, 10) : undefined
                );
                setSelectedDateIdeas((events) =>
                  events.map((event) =>
                    event.id === updatedEvent.id ? updatedEvent : event
                  )
                );
                bumpCalendarRefreshToken();
              }}
              onEventSelect={handleEventSelect}
              onEventsChange={bumpCalendarRefreshToken}
            />
          ) : (
            <DrawerView
              setIsDrawerOpen={setIsDrawerOpen}
              date={selectedDate}
              idea={selectedIdea}
              dateIdeas={selectedDateIdeas}
              selectedEvent={selectedEvent}
              plannerWidth={!isMobile && isPanelOpen ? panelWidth : 0}
              onIdeaUpdated={(updatedIdea) => {
                setSelectedIdea(updatedIdea);
                setSelectedEvent((event) =>
                  event ? { ...event, idea: updatedIdea } : null
                );
                setSelectedDateIdeas((events) =>
                  events.map((event) =>
                    event.idea.id === updatedIdea.id
                      ? { ...event, idea: updatedIdea }
                      : event
                  )
                );
                bumpCalendarRefreshToken();
              }}
              onEventUpdated={(updatedEvent) => {
                const updatedDate =
                  updatedEvent.date ?? updatedEvent.start ?? null;
                setSelectedEvent(updatedEvent);
                setSelectedIdea(updatedEvent.idea);
                setSelectedDate(
                  updatedDate ? updatedDate.slice(0, 10) : undefined
                );
                setSelectedDateIdeas((events) =>
                  events.map((event) =>
                    event.id === updatedEvent.id ? updatedEvent : event
                  )
                );
                bumpCalendarRefreshToken();
              }}
              onEventSelect={handleEventSelect}
              onEventsChange={bumpCalendarRefreshToken}
            />
          ))}
        {statusMessage && (
          <div className={`${s.statusToast} ${statusTone === "danger" ? s.danger : s.success}`}>
            {statusMessage}
          </div>
        )}
      </div>
    </IdeasProvider>
  );
}

export default App;
