import { useMemo, useState } from "react";
import { Card } from "./reusableComponents/Card";
import { useIdeas } from "../hooks/useIdeas";
import { deleteIdeas } from "../api/deleteIdeas";
import { Tag } from "./reusableComponents/Tag";
import s from "./DisplayIdeas.module.css";
import { CloseButton } from "./reusableComponents/CloseButton";
import type { Idea } from "../api/getIdeas";

type DisplayIdeasProps = {
  onIdeaSelect: (idea: Idea) => void;
};

const platformFilters = [
  { label: "All", value: "ALL" },
  { label: "BookTok", value: "BOOKTOK" },
  { label: "DevTok", value: "DEVTOK" },
] as const;

type PlatformFilterValue = (typeof platformFilters)[number]["value"];

const difficultyFilters = [
  { label: "All", value: "ALL" },
  { label: "Easy (1)", value: 1 },
  { label: "Medium (2)", value: 2 },
  { label: "Hard (3)", value: 3 },
] as const;

type DifficultyFilterValue = (typeof difficultyFilters)[number]["value"];

const difficultyLabels: Record<Idea["difficulty"], string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export function DisplayIdeas({ onIdeaSelect }: DisplayIdeasProps) {
  const { ideas, error, refresh } = useIdeas();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilterValue>("ALL");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilterValue>("ALL");

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

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesPlatform =
        platformFilter === "ALL" || idea.platform === platformFilter;
      const matchesDifficulty =
        difficultyFilter === "ALL" || idea.difficulty === difficultyFilter;
      return matchesPlatform && matchesDifficulty;
    });
  }, [ideas, platformFilter, difficultyFilter]);

  return (
    <Card title="Ideas">
      {error && <p>{error}</p>}
      <div className={s.filters}>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Platform</span>
          {platformFilters.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={`${s.filterButton} ${
                platformFilter === value ? s.filterButtonActive : ""
              }`}
              onClick={() => setPlatformFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Difficulty</span>
          {difficultyFilters.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={`${s.filterButton} ${
                difficultyFilter === value ? s.filterButtonActive : ""
              }`}
              onClick={() => setDifficultyFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={s.ideasContainer} role="list">
        {!error &&
          filteredIdeas.map((idea) => (
            <div
              className={s.idea}
              key={idea.id}
              role="listitem"
              draggable
              onDragStart={(event) => handleDragStart(event, idea)}
              onClick={() => onIdeaSelect(idea)}
            >
              <div className={s.ideaText}>
                <h3>{idea.title}</h3>
                {idea.description && <p>{idea.description}</p>}
              </div>
              <div className={s.ideaMeta}>
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
                <CloseButton
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteIdeas(idea.id);
                  }}
                />
              </div>
            </div>
          ))}
        {!error && filteredIdeas.length === 0 && (
          <p className={s.emptyState}>No ideas for this filter.</p>
        )}
      </div>
    </Card>
  );
}
