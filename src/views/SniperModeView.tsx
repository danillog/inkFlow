import React from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';
import DrawingCanvas from '../components/DrawingCanvas';
import PomodoroTimer from '../components/PomodoroTimer';

const SniperModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: #0D1117;
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  position: relative;
  background: radial-gradient(circle at 50% 50%, #161b22 0%, #0d1117 100%);
`;

const TaskTitle = styled.h1<{ $isCompleted: boolean }>`
  font-size: 2.5rem;
  font-weight: 600;
  color: #E6EDF3;
  text-align: center;
  margin-bottom: 1.5rem;
  text-decoration: ${props => props.$isCompleted ? 'line-through' : 'none'};
  opacity: ${props => props.$isCompleted ? 0.6 : 1};
  transition: all 0.3s ease;
  padding: 0 1rem;
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const ContextCanvasArea = styled.div`
  width: 90%;
  max-width: 1200px;
  height: 50vh;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background-color: rgba(13, 17, 23, 0.5);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 95%;
    height: 45vh;
  }
`;

const ActionButtonsContainer = styled.div`
  margin-top: 2rem;
  display: flex;
  gap: 1.5rem;
  z-index: 10;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 80%;
    gap: 1rem;
  }
`;

const ButtonBase = styled.button`
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:active {
    transform: scale(0.98);
  }
`;

const DoneButton = styled(ButtonBase)`
  background-color: #238636;
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 2px 8px rgba(35, 134, 54, 0.4);

  &:hover {
    background-color: #2ea043;
    box-shadow: 0 4px 12px rgba(35, 134, 54, 0.6);
  }
`;

const AbortButton = styled(ButtonBase)`
  background: transparent;
  border: 1px solid #30363d;
  color: #8b949e;

  &:hover {
    border-color: #8b949e;
    color: #c9d1d9;
    background-color: rgba(139, 148, 158, 0.1);
  }
`;

const SniperModeView: React.FC = () => {
  const activeTaskId = useTaskStore((state) => state.activeTaskId);
  const tasks = useTaskStore((state) => state.tasks);
  const setActiveTask = useTaskStore((state) => state.setActiveTask);
  const updateTask = useTaskStore((state) => state.updateTask);

  const activeTask = tasks.find((task) => task.id === activeTaskId);

  if (!activeTask) {
    return (
      <SniperModeContainer>
        <p>No active task selected.</p>
        <AbortButton onClick={() => setActiveTask(null)}>Return</AbortButton>
      </SniperModeContainer>
    );
  }

  const handleDone = () => {
    updateTask(activeTask.id, { status: 'completed', completedAt: Date.now() });
    setTimeout(() => {
      setActiveTask(null);
    }, 1000);
  };

  const handleAbort = () => {
    setActiveTask(null);
  };

  return (
    <SniperModeContainer>
      <TaskTitle $isCompleted={activeTask.status === 'completed'}>{activeTask.content}</TaskTitle>
      <PomodoroTimer />
      <div style={{ height: '1.5rem' }} />
      <ContextCanvasArea>
        <DrawingCanvas />
      </ContextCanvasArea>
      <ActionButtonsContainer>
        <DoneButton onClick={handleDone}>COMPLETE TASK</DoneButton>
        <AbortButton onClick={handleAbort}>RETURN TO BOX</AbortButton>
      </ActionButtonsContainer>
    </SniperModeContainer>
  );
};

export default SniperModeView;
