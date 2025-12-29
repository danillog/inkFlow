import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';
import { db } from '../lib/db';

const RealityCheckContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: #0D1117;
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #C9D1D9;

  @media (max-width: 768px) {
    font-size: 1.8rem;
    text-align: center;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  font-size: 1.2rem;
  text-align: center;

  @media (max-width: 768px) {
    gap: 1.5rem;
    flex-direction: column;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    font-size: 2rem;
    font-weight: bold;
    color: #238636;
  }
`;

const CompletedTasksList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 40vh;
  overflow-y: auto;
  width: 80%;
  max-width: 600px;
  background-color: #161B22;
  border-radius: 8px;
  padding: 1rem;

  @media (max-width: 768px) {
    width: 90%;
  }
`;

const CompletedTaskItem = styled.li`
  background-color: #0D1117;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;

  &:last-child {
    margin-bottom: 0;
  }

  span:first-child {
    font-weight: bold;
    color: #238636;
  }

  span:last-child {
    font-size: 0.8rem;
    opacity: 0.7;
  }
`;

const ResetButton = styled.button`
  background-color: #F778BA;
  color: #0D1117;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  margin-top: 3rem;

  &:hover {
    opacity: 0.9;
  }
`;

const RealityCheckView: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);

  const startOfToday = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const tasksCompletedToday = useMemo(() => {
    return tasks.filter(
      (task) => task.status === 'completed' && task.completedAt && task.completedAt >= startOfToday.getTime()
    );
  }, [tasks, startOfToday]);

  const totalFocusTime = useMemo(() => {
    return tasksCompletedToday.length * 25;
  }, [tasksCompletedToday]);

  const handleEndDay = async () => {
    if (confirm('Ending the day will clear all tasks, drawings, and notes across all synchronized devices. Do you wish to continue?')) {
      const { yTasks, yStrokes } = await import('../lib/sync');
      
      // Clear Yjs shared types to propagate deletion to peers
      yTasks().clear();
      yStrokes().delete(0, yStrokes().length);
      
      // Local cleanup will happen via Yjs observers in YjsSynchronizer
      setCurrentView('blackbox');
    }
  };

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  return (
    <RealityCheckContainer>
      <Title>Reality Check: Seu Dia de Produtividade</Title>

      <StatsContainer>
        <StatItem>
          <span>{tasksCompletedToday.length}</span>
          <span>Tarefas Finalizadas</span>
        </StatItem>
        <StatItem>
          <span>{formatDuration(totalFocusTime)}</span>
          <span>Tempo em Foco</span>
        </StatItem>
      </StatsContainer>

      {tasksCompletedToday.length > 0 ? (
        <>
          <h2>Tarefas Concluídas Hoje:</h2>
          <CompletedTasksList>
            {tasksCompletedToday.map((task) => (
              <CompletedTaskItem key={task.id}>
                <span>{task.content}</span>
                <span>{task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}</span>
              </CompletedTaskItem>
            ))}
          </CompletedTasksList>
        </>
      ) : (
        <p>Nenhuma tarefa concluída hoje. Que tal começar uma amanhã?</p>
      )}

      <ResetButton onClick={handleEndDay}>Encerrar Dia & Limpar Cache</ResetButton>
    </RealityCheckContainer>
  );
};

export default RealityCheckView;
