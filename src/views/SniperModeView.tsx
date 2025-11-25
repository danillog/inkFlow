import React from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';
import DrawingCanvas from '../components/DrawingCanvas'; // Reuse DrawingCanvas
import PomodoroTimer from '../components/PomodoroTimer'; // Import PomodoroTimer

const SniperModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #0D1117; /* Background color from Design System */
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
`;

const TaskTitle = styled.h1`
  font-size: 3.2em; /* Large font size as per PRD */
  color: #C9D1D9;
  text-align: center;
  margin-bottom: 2rem;
`;

const ContextCanvasArea = styled.div`
  width: 80%; /* Adjust size as needed */
  height: 40vh; /* Adjust size as needed */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #0D1117; /* Background of canvas itself */
`;

const ActionButtonsContainer = styled.div`
  position: absolute;
  bottom: 2rem;
  display: flex;
  gap: 1rem;
`;

const DoneButton = styled.button`
  background-color: #238636; /* Primary color */
  color: #C9D1D9;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const AbortButton = styled.button`
  background: none;
  border: 1px solid rgba(201, 209, 217, 0.5); /* Ghost button style */
  color: #C9D1D9;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background-color: rgba(201, 209, 217, 0.1);
  }
`;

const SniperModeView: React.FC = () => {
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  const setActiveTask = useTaskStore((state) => state.setActiveTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const activeTask = tasks.find((task) => task.id === activeTaskId);

  if (!activeTask) {
    // Should not happen if App.tsx handles conditional rendering correctly
    return <p>No active task selected.</p>;
  }

  const handleDone = () => {
    updateTask(activeTask.id, { status: 'completed', completedAt: Date.now() });
    setActiveTask(null); // Exit Sniper Mode
  };

  const handleAbort = () => {
    setActiveTask(null); // Exit Sniper Mode
  };

  return (
    <SniperModeContainer>
      <TaskTitle>{activeTask.content}</TaskTitle>
      <PomodoroTimer /> {/* Render PomodoroTimer */}
      <ContextCanvasArea>
        <DrawingCanvas /> {/* Reusing the drawing canvas for context */}
      </ContextCanvasArea>
      <ActionButtonsContainer>
        <DoneButton onClick={handleDone}>DONE / DEPLOY</DoneButton>
        <AbortButton onClick={handleAbort}>Abort / Return to Box</AbortButton>
      </ActionButtonsContainer>
    </SniperModeContainer>
  );
};

export default SniperModeView;