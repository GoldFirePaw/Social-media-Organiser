import { useState } from "react";
import { Card } from "./reusableComponents/Card";
import { useIdeas } from "../hooks/useIdeas";
import { deleteIdeas } from "../api/deleteIdeas";
import { Tag } from "./reusableComponents/Tag";
import { AddIdeasForm } from "./AddIdeasForm";
import { useIdeaFilters, type PlatformFilterValue, type DifficultyFilterValue, type SortOptionValue } from "../hooks/useIdeaFilters";
import s from "./DisplayIdeas.module.css";
import type { Idea } from "../api/getIdeas";

type DisplayIdeasProps = {
  onIdeaSelect: (idea: Idea) => void;
};

const platformFilters: { label: string; value: PlatformFilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "BookTok", value: "BOOKTOK" },
  { label: "DevTok", value: "DEVTOK" },
] as const;

const difficultyFilters: { label: string; value: DifficultyFilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "Easy (1)", value: 1 },
  { label: "Medium (2)", value: 2 },
  { label: "Hard (3)", value: 3 },
] as const;

const difficultyLabels: Record<Idea["difficulty"], string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

const sortOptions: { label: string; value: SortOptionValue }[] = [
  { label: "Last posted (newest)", value: "LAST_POSTED" },
  { label: "Last posted (oldest)", value: "LAST_POSTED_OLDEST" },
  { label: "Most posted", value: "MOST_POSTED" },
  { label: "Least posted", value: "LEAST_POSTED" },
  { label: "Difficulty: hard → easy", value: "DIFFICULTY_DESC" },
  { label: "Difficulty: easy → hard", value: "DIFFICULTY_ASC" },
  { label: "Title A → Z", value: "TITLE_ASC" },
] as const;

const formatPostCount = (count?: number) => {
  const safeCount = count ?? 0;
  return `${safeCount} ${safeCount === 1 ? "post" : "posts"}`;
};

const formatLastPosted = (idea: Idea) => {
  if (!idea.lastScheduledPostDate) {
    return "Never scheduled yet";
  }
  const timestamp = new Date(idea.lastScheduledPostDate);
  return `Last posted ${timestamp.toLocaleDateString()}`;
};

export function DisplayIdeas({ onIdeaSelect }: DisplayIdeasProps) {
  const { ideas, error, refresh } = useIdeas();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const {
    platformFilter,
    setPlatformFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortOption,
    setSortOption,
    sortedIdeas,
  } = useIdeaFilters(ideas);

  const handleDeleteIdeas = async (id: string) => {
    try {
      await deleteIdeas(id);
      await refresh();
    } catch (error) {
      console.error("Error deleting idea:", error);
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    idea: Idea
  ) => {
    event.dataTransfer.setData("application/idea-id", idea.id);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Card title="Ideas">
      {error && <p>{error}</p>}
      <div className={s.tabs}>
        <button
          type="button"
          className={`${s.tabButton} ${activeTab === "list" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("list")}
        >
          Ideas
        </button>
        <button
          type="button"
          className={`${s.tabButton} ${activeTab === "form" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("form")}
        >
          Add idea
        </button>
      </div>
      {activeTab === "list" && (
        <>
      <div className={`${s.filtersPanel} ${filtersOpen ? s.filtersPanelOpen : s.filtersPanelClosed}`}>
        <button
          type="button"
          className={s.filtersToggle}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-expanded={filtersOpen}
        >
          Filters {filtersOpen ? "▴" : "▾"}
        </button>
        {filtersOpen && (
          <>
            <div className={s.filterGroup}>
              <span className={s.filterLabel}>Platform</span>
              <div className={s.filterOptions}>
                {platformFilters.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${s.filterChip} ${
                      platformFilter === value ? s.filterChipActive : ""
                    }`}
                    onClick={() => setPlatformFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.filterGroup}>
              <span className={s.filterLabel}>Difficulty</span>
              <div className={s.filterOptions}>
                {difficultyFilters.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${s.filterChip} ${
                      difficultyFilter === value ? s.filterChipActive : ""
                    }`}
                    onClick={() => setDifficultyFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.sortRow}>
              <span className={s.filterLabel}>Order by</span>
              <select
                value={sortOption}
                className={s.sortSelect}
                onChange={(event) => setSortOption(event.target.value as SortOptionValue)}
              >
                {sortOptions.map(({ label, value }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
      <div className={s.listSummary}>
        <div>
          <p className={s.listCount}>
            {sortedIdeas.length} {sortedIdeas.length === 1 ? "idea" : "ideas"}
          </p>
          <p className={s.listHint}>Drag an idea to the calendar or click to open it.</p>
        </div>
      </div>
      <div className={s.ideasContainer}>
        <div className={s.ideasScroll} role="list">
          {!error &&
            sortedIdeas.map((idea) => (
              <div
                className={s.ideaCard}
                key={idea.id}
                role="listitem"
                draggable
              onDragStart={(event) => handleDragStart(event, idea)}
              onClick={() => onIdeaSelect(idea)}
            >
              <div className={s.ideaCardHeader}>
                <div className={s.ideaText}>
                  <h3>{idea.title}</h3>
                  {idea.description && <p>{idea.description}</p>}
                </div>
                <button
                  type="button"
                  className={s.deleteButton}
                  aria-label="Delete idea"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteIdeas(idea.id);
                  }}
                >
                  &times;
                </button>
              </div>
              <div className={s.ideaMeta}>
                <div className={s.metaChips}>
                  <span className={s.postCountBadge}>
                    {formatPostCount(idea.scheduledPostsCount)}
                  </span>
                  <span
                    className={`${s.difficultyBadge} ${
                      idea.difficulty === 1
                        ? s.difficultyEasy
                        : idea.difficulty === 2
                        ? s.difficultyMedium
                        : s.difficultyHard
                    }`}
                  >
                    {difficultyLabels[idea.difficulty]}
                  </span>
                  <Tag
                    color={idea.platform === "BOOKTOK" ? "blue" : "pink"}
                    label={idea.platform}
                  />
                </div>
                <p className={s.metaHint}>{formatLastPosted(idea)}</p>
              </div>
            </div>
            ))}
        </div>
        {!error && sortedIdeas.length === 0 && (
          <p className={s.emptyState}>No ideas for this filter.</p>
        )}
      </div>
        </>
      )}
      {activeTab === "form" && (
        <div className={s.formTabWrapper}>
          <AddIdeasForm />
        </div>
      )}
    </Card>
  );
}
