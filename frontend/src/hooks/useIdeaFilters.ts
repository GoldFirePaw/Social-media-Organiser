import { useMemo, useState } from "react";
import type { Idea } from "../api/getIdeas";

export type PlatformFilterValue = "ALL" | "BOOKTOK" | "DEVTOK";
export type DifficultyFilterValue = "ALL" | 1 | 2 | 3;
export type SortOptionValue =
  | "LAST_POSTED"
  | "LAST_POSTED_OLDEST"
  | "MOST_POSTED"
  | "LEAST_POSTED"
  | "DIFFICULTY_DESC"
  | "DIFFICULTY_ASC"
  | "TITLE_ASC";

export function useIdeaFilters(ideas: Idea[]) {
  const [platformFilter, setPlatformFilter] =
    useState<PlatformFilterValue>("ALL");
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilterValue>("ALL");
  const [sortOption, setSortOption] = useState<SortOptionValue>("TITLE_ASC");

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesPlatform =
        platformFilter === "ALL" || idea.platform === platformFilter;
      const matchesDifficulty =
        difficultyFilter === "ALL" || idea.difficulty === difficultyFilter;
      return matchesPlatform && matchesDifficulty;
    });
  }, [ideas, platformFilter, difficultyFilter]);

  const sortedIdeas = useMemo(() => {
    const copy = [...filteredIdeas];
    const getCount = (idea: Idea) => idea.scheduledPostsCount ?? 0;
    const getLastPost = (idea: Idea) => {
      if (!idea.lastScheduledPostDate) {
        return 0;
      }
      const time = new Date(idea.lastScheduledPostDate).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    copy.sort((a, b) => {
      switch (sortOption) {
        case "MOST_POSTED":
          return getCount(b) - getCount(a);
        case "LEAST_POSTED":
          return getCount(a) - getCount(b);
        case "DIFFICULTY_DESC":
          return b.difficulty - a.difficulty;
        case "DIFFICULTY_ASC":
          return a.difficulty - b.difficulty;
        case "TITLE_ASC":
          return a.title.localeCompare(b.title);
        case "LAST_POSTED_OLDEST":
          return getLastPost(a) - getLastPost(b);
        case "LAST_POSTED":
        default:
          return getLastPost(b) - getLastPost(a);
      }
    });

    return copy;
  }, [filteredIdeas, sortOption]);

  return {
    platformFilter,
    setPlatformFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortOption,
    setSortOption,
    filteredIdeas,
    sortedIdeas,
  };
}
