import React from "react";
import styled from "styled-components";
import { useTaskStore } from "../store/taskStore";
import { AppColors } from "../store/uiStore";

const TaskStackContainer = styled.div`
  width: 250px;
  background-color: #161b22; /* Surface color from Design System */
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  color: #c9d1d9;
  font-family: "Inter", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  z-index: 100;

  @media (max-width: 1024px) {
    width: 100%;
    max-height: 40%;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
  }
`;

const TaskCard = styled.div`
  background-color: #0d1117; /* Darker background for cards */
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 80px); /* Adjusted for smaller buttons */
  text-decoration: ${(props) => (props.$isCompleted ? "line-through" : "none")};
  color: ${(props) =>
    props.$isCompleted ? "rgba(201, 209, 217, 0.5)" : AppColors.text};
  transition: text-decoration 0.3s ease-in-out, color 0.3s ease-in-out;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.3rem; /* Reduced gap */
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none; /* Make buttons non-interactive when hidden */

  ${TaskCard}:hover & {
    opacity: 1;
    pointer-events: all; /* Make buttons interactive on hover */
  }
`;

const RemoveButton = styled.button`
  background-color: transparent;
  border: 1px solid transparent;
  color: rgba(201, 209, 217, 0.6); /* More subtle default color */
  font-size: 0.9rem; /* Smaller font size */
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
  background-color: ${AppColors.primary}; /* Primary color for focus */
  color: ${AppColors.text};
  border: none;
  padding: 0.4rem 0.8rem; /* Adjusted padding */
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600; /* Bolder font */
  transition: background-color 0.2s, opacity 0.2s;

  &:hover {
    background-color: #2d9b40; /* Slightly darker primary on hover */
    opacity: 1; /* Remove explicit opacity change, rely on background */
  }
`;

const TaskStack: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const removeTask = useTaskStore((state) => state.removeTask);
  const setActiveTask = useTaskStore((state) => state.setActiveTask);

  return (
    <TaskStackContainer>
      <h3>The Stack</h3>
      {tasks.length === 0 ? (
        <p>Your stack is empty. Add a task!</p>
      ) : (
        tasks.map((task) => (
          <TaskCard key={task.id} draggable>
            <TaskContent $isCompleted={task.status === "completed"}>
              {task.content}
            </TaskContent>
            <ActionButtons>
              <FocusButton onClick={() => setActiveTask(task.id)}>
                Focar
              </FocusButton>
              <RemoveButton onClick={() => removeTask(task.id)}>X</RemoveButton>
            </ActionButtons>
          </TaskCard>
        ))
      )}
    </TaskStackContainer>
  );
};

export default TaskStack;
