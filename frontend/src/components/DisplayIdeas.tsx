import { useState } from "react";
import { Card } from "./reusableComponents/Card";
import { useIdeas } from "../hooks/useIdeas";
import { deleteIdeas } from "../api/deleteIdeas";
import { Tag } from "./reusableComponents/Tag";
import { AddIdeasForm } from "./AddIdeasForm";
import { useIdeaFilters, type PlatformFilterValue, type DifficultyFilterValue, type SortOptionValue } from "../hooks/useIdeaFilters";
import s from "./DisplayIdeas.module.css";
import type { Idea } from "../api/getIdeas";
import { FilmingQueue } from "./FilmingQueue";
import { useIdeaSimilarities } from "../hooks/useIdeaSimilarities";
import { useIdeaThemes, useOverusedKeywords } from "../hooks/useIdeaThemes";
import { updateIdea } from "../api/updateIdea";

type DisplayIdeasProps = {
  onIdeaSelect: (idea: Idea) => void;
  scheduledPostsRefreshToken: number;
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

export function DisplayIdeas({ onIdeaSelect, scheduledPostsRefreshToken }: DisplayIdeasProps) {
  const { ideas, error, refresh } = useIdeas();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "form" | "queue">(
    "list"
  );
  const similarIdeasMap = useIdeaSimilarities(ideas, 0.35);
  const ideaThemes = useIdeaThemes(ideas);
  const overused = useOverusedKeywords(ideas, 12);
  const {
    platformFilter,
    setPlatformFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortOption,
    setSortOption,
    sortedIdeas,
  } = useIdeaFilters(ideas);
  const [searchTerm, setSearchTerm] = useState("");
  const [themeInputs, setThemeInputs] = useState<Record<string, string>>({});
  const [themeUpdatingId, setThemeUpdatingId] = useState<string | null>(null);
  const allThemeNames = Array.from(
    new Set(
      ideas
        .flatMap((idea) => idea.themes ?? [])
        .filter((name): name is string => Boolean(name?.trim()))
    )
  ).sort((a, b) => a.localeCompare(b));

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

  const persistThemes = async (idea: Idea, nextThemes: string[]) => {
    setThemeUpdatingId(idea.id);
    try {
      const payload = {
        title: idea.title,
        description: idea.description ?? null,
        platform: idea.platform,
        status: idea.status,
        difficulty: idea.difficulty,
        themes: nextThemes,
      };
      await updateIdea(idea.id, payload);
      await refresh();
    } catch (error) {
      console.error("Failed to update themes", error);
    } finally {
      setThemeUpdatingId(null);
    }
  };

  const handleAddTheme = async (idea: Idea, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = idea.themes ?? [];
    if (current.includes(trimmed)) {
      setThemeInputs((prev) => ({ ...prev, [idea.id]: "" }));
      return;
    }
    const next = [...current, trimmed];
    await persistThemes(idea, next);
    setThemeInputs((prev) => ({ ...prev, [idea.id]: "" }));
  };

  const handleRemoveTheme = async (idea: Idea, name: string) => {
    const current = idea.themes ?? [];
    const next = current.filter((t) => t !== name);
    await persistThemes(idea, next);
  };

  const filteredIdeas = sortedIdeas.filter((idea) => {
    if (!searchTerm.trim()) return true;
    const haystack = `${idea.title} ${idea.description ?? ""}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

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
        <button
          type="button"
          className={`${s.tabButton} ${activeTab === "queue" ? s.tabActive : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          To film
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
            <div className={s.searchRow}>
              <label className={s.filterLabel} htmlFor="idea-search">
                Search
              </label>
              <input
                id="idea-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search titles or descriptions"
                className={s.searchInput}
              />
            </div>
          </>
        )}
      </div>
      <div className={s.listSummary}>
        <div>
          <p className={s.listCount}>
            {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"}
          </p>
          <p className={s.listHint}>Drag an idea to the calendar or click to open it.</p>
        </div>
      </div>
      <div className={s.ideasContainer}>
        <div className={s.ideasScroll} role="list">
          {!error &&
            filteredIdeas.map((idea) => (
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
                  {idea.description && <p className={s.ideaDescription}>{idea.description}</p>}
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
              {(() => {
                const explicitThemes = idea.themes ?? [];
                const fallbackTheme = ideaThemes.get(idea.id);
                const overusedEntry =
                  explicitThemes[0]
                    ? overused.map.get(explicitThemes[0])
                    : fallbackTheme
                      ? overused.map.get(fallbackTheme)
                      : null;
                return (
                  <div className={s.themeEditor}>
                    <div className={s.themeChips}>
                      {explicitThemes.map((theme) => (
                        <span key={theme} className={s.themeBadge}>
                          {theme}
                          <button
                            type="button"
                            aria-label={`Remove theme ${theme}`}
                            className={s.themeRemove}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveTheme(idea, theme);
                            }}
                            disabled={themeUpdatingId === idea.id}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {!explicitThemes.length && fallbackTheme && (
                        <span className={s.themeBadgeMuted}>Suggested: {fallbackTheme}</span>
                      )}
                    </div>
                    <div className={s.themeInputRow}>
                      <input
                        type="text"
                        list={`theme-suggestions-${idea.id}`}
                        value={themeInputs[idea.id] ?? ""}
                        onChange={(event) =>
                          setThemeInputs((prev) => ({ ...prev, [idea.id]: event.target.value }))
                        }
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={async (event) => {
                          event.stopPropagation();
                          if (event.key === "Enter") {
                            event.preventDefault();
                            await handleAddTheme(idea, themeInputs[idea.id] ?? "");
                          }
                        }}
                        placeholder="Add theme tag"
                        className={s.themeInput}
                        disabled={themeUpdatingId === idea.id}
                      />
                      <button
                        type="button"
                        className={s.addThemeButton}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAddTheme(idea, themeInputs[idea.id] ?? "");
                        }}
                        disabled={themeUpdatingId === idea.id}
                      >
                        Add
                      </button>
                      <datalist id={`theme-suggestions-${idea.id}`}>
                        {allThemeNames.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                    {overusedEntry && overusedEntry.ratio >= 0.2 && overusedEntry.count >= 2 && (
                      <div className={s.themeWarning}>
                        Appears {overusedEntry.count}× across ideas
                      </div>
                    )}
                  </div>
                );
              })()}
              {(() => {
                const similars = similarIdeasMap.get(idea.id) ?? [];
                if (!similars.length) return null;
                const top = similars.slice(0, 2);
                return (
                  <div className={s.similarBadge}>
                    <span className={s.similarLabel}>Possible duplicates</span>
                    <ul className={s.similarList}>
                      {top.map((entry) => (
                        <li key={entry.idea.id}>{entry.idea.title}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
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
        {!error && filteredIdeas.length === 0 && (
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
      {activeTab === "queue" && (
        <div className={s.queueTabWrapper}>
          <FilmingQueue refreshToken={scheduledPostsRefreshToken} variant="embedded" />
        </div>
      )}
    </Card>
  );
}
