import { Card } from "./reusableComponents/Card";
import { useIdeas } from "../hooks/useIdeas";
import { deleteIdeas } from "../api/deleteIdeas";
import { Tag } from "./reusableComponents/Tag";
import s from "./DisplayIdeas.module.css";
import { CloseButton } from "./reusableComponents/CloseButton";
import { Draggable } from "@fullcalendar/interaction";
import { useEffect, useRef } from "react";

export function DisplayIdeas() {
  const { ideas, error, refresh } = useIdeas();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDeleteIdeas = async (id: string) => {
    try {
      await deleteIdeas(id);
      await refresh();
    } catch (error) {
      console.error("Error deleting idea:", error);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    new Draggable(containerRef.current, {
      itemSelector: ".draggable-idea",
      eventData: (el) => {
        return {
          id: el.getAttribute("data-id")!,
          title: el.getAttribute("data-title")!,
        };
      },
    });
  }, []);

  return (
    <Card title="Display Ideas Component">
      {error && <p>{error}</p>}
      <div className={s.ideasContainer} ref={containerRef}>
        {!error &&
          ideas.map((idea) => (
            <div
              className={`${s.idea} draggable-idea`}
              key={idea.id}
              data-id={idea.id}
              data-title={idea.title}
            >
              <h3>{idea.title}</h3>
              <Tag
                color={idea.platform === "BOOKTOK" ? "blue" : "pink"}
                label={idea.platform}
              />
              <CloseButton onClick={() => handleDeleteIdeas(idea.id)} />
            </div>
          ))}
      </div>
    </Card>
  );
}
