import React from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';

const TaskStackContainer = styled.div`
  width: 250px;
  background-color: #161B22; /* Surface color from Design System */
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
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
  background-color: #0D1117; /* Darker background for cards */
  padding: 0.8rem;
  border-radius: 8px;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-wrap: wrap; /* Allow content to wrap */
  justify-content: space-between;
  align-items: center;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
`;

const TaskContent = styled.span`
  flex-grow: 1;
  font-size: 0.9rem;
  margin-right: 0.5rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #F778BA; /* Accent color for remove */
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    color: #BB86FC; /* Lighter accent on hover */
  }
`;

const FocusButton = styled.button`
  background-color: #238636; /* Primary color for focus */
  color: #C9D1D9;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    opacity: 0.9;
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
            <TaskContent>{task.content}</TaskContent>
            <ActionButtons>
                <FocusButton onClick={() => setActiveTask(task.id)}>Focar</FocusButton>
                <RemoveButton onClick={() => removeTask(task.id)}>X</RemoveButton>
            </ActionButtons>
          </TaskCard>
        ))
      )}
    </TaskStackContainer>
  );
};

export default TaskStack;