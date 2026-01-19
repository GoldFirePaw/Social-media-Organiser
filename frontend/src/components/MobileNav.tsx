import s from "./MobileNav.module.css";

export type MobileTab = "calendar" | "ideas" | "film" | "data";

type MobileNavProps = {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
};

const tabs: Array<{ id: MobileTab; label: string }> = [
  { id: "calendar", label: "Calendar" },
  { id: "ideas", label: "Ideas" },
  { id: "film", label: "To film" },
  { id: "data", label: "Data" },
];

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className={s.nav} aria-label="Primary" data-role="mobile-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${s.tabButton} ${activeTab === tab.id ? s.tabButtonActive : ""}`}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
          data-tab-id={tab.id}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
