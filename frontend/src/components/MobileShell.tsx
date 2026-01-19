import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { MobileNav, type MobileTab } from "./MobileNav";
import s from "./MobileShell.module.css";

type MobileShellProps = {
  calendar: ReactNode;
  ideas: ReactNode;
  filming: ReactNode;
  data: ReactNode;
  initialTab?: MobileTab;
};

export function MobileShell({
  calendar,
  ideas,
  filming,
  data,
  initialTab = "calendar",
}: MobileShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab);

  const content = useMemo(() => {
    switch (activeTab) {
      case "ideas":
        return ideas;
      case "film":
        return filming;
      case "data":
        return data;
      case "calendar":
      default:
        return calendar;
    }
  }, [activeTab, calendar, ideas, filming, data]);

  return (
    <div className={s.shell} data-role="mobile-shell">
      <main className={s.content}>{content}</main>
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
