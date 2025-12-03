import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useTaskStore } from "../store/taskStore";
import { useUIStore } from "../store/uiStore";

const TaskStackContainer = styled.div<{ width: number }>`
  width: ${(props) => props.width}px;
  min-width: 200px; 
  max-width: 800px; 
  background-color: ${({ theme }) => theme.surface};
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  color: ${({ theme }) => theme.text};
  font-family: "Inter", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  z-index: 100;
  position: relative; 

  @media (max-width: 1024px) {
    width: 100%;
    max-height: 40%;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
  }
`;

const ResizeHandle = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  z-index: 101;
`;

const TaskCard = styled.div`
  background-color: ${({ theme }) => theme.background};
  padding: 0.8rem;
  border-radius: 8px;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  transition: all 0.3s ease-in-out;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }
`;

const TaskContent = styled.span<{ $isCompleted: boolean }>`
  flex-grow: 1;
  font-size: 0.9rem;
  margin-right: 0.5rem;
  white-space: normal; 
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: ${(props) => (props.$isCompleted ? "line-through" : "none")};
  color: ${(props) =>
    props.$isCompleted ? "rgba(201, 209, 217, 0.5)" : props.theme.text};
  transition: text-decoration 0.3s ease-in-out, color 0.3s ease-in-out;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.3rem; 
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none; 

  ${TaskCard}:hover & {
    opacity: 1;
    pointer-events: all; 
  }
`;

const RemoveButton = styled.button`
  background-color: transparent;
  border: 1px solid transparent;
  color: rgba(201, 209, 217, 0.6); 
  font-size: 0.9rem; 
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #e3342f;
    border: none;
  }
`;

const FocusButton = styled.button`
  background-color: ${({ theme }) => theme.primary}; 
  color: ${({ theme }) => theme.text};
  border: none;
  padding: 0.4rem 0.8rem; 
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600; 
  transition: background-color 0.2s, opacity 0.2s;

  &:hover {
    background-color: #2d9b40; 
    opacity: 1; 
  }
`;

const TaskStack: React.FC = () => {
  const { t } = useTranslation();
  const tasks = useTaskStore((state) => state.tasks);

  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== "completed" && b.status === "completed") {
      return -1; 
    }
    if (a.status === "completed" && b.status !== "completed") {
      return 1; 
    }
    return 0; 
  });

  const removeTask = useTaskStore((state) => state.removeTask);
  const setActiveTask = useTaskStore((state) => state.setActiveTask);
  const { colors } = useUIStore();

  const [width, setWidth] = useState(250);
  const isResizing = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth =
        window.innerWidth - e.clientX;
      setWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  return (
    <TaskStackContainer width={width} theme={colors}>
      <ResizeHandle onMouseDown={handleMouseDown} />
      <h3>{t("taskstack.title")}</h3>
      {sortedTasks.length === 0 ? (
        <p>{t("taskstack.empty_stack")}</p>
      ) : (
        sortedTasks.map((task) => (
          <TaskCard key={task.id} draggable theme={colors}>
            <TaskContent $isCompleted={task.status === "completed"} theme={colors}>
              {task.content}
            </TaskContent>
            <ActionButtons>
              <FocusButton onClick={() => setActiveTask(task.id)} theme={colors}>
                {t("taskstack.focus")}
              </FocusButton>
              <RemoveButton onClick={() => removeTask(task.id)}>{t("taskstack.remove")}</RemoveButton>
            </ActionButtons>
          </TaskCard>
        ))
      )}
    </TaskStackContainer>
  );
};

export default TaskStack;
