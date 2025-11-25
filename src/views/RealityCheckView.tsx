import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore'; // Changed import
import { type Task } from '../lib/db'; // Import Task from db.ts

const RealityCheckContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background-color: #0D1117; /* Background color from Design System */
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #C9D1D9;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  font-size: 1.2rem;
  text-align: center;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  span {
    font-size: 2rem;
    font-weight: bold;
    color: #238636; /* Primary color */
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
  background-color: #161B22; /* Surface color */
  border-radius: 8px;
  padding: 1rem;
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
  background-color: #F778BA; /* Accent color */
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
  const removeTask = useTaskStore((state) => state.removeTask);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);

  const [completedToday, setCompletedToday] = useState<Task[]>([]);
  const [totalFocusTime, setTotalFocusTime] = useState<number>(0);

  useEffect(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const tasksCompletedToday = tasks.filter(
      (task) => task.status === 'completed' && task.completedAt && task.completedAt >= startOfToday.getTime()
    );
    setCompletedToday(tasksCompletedToday);

    setTotalFocusTime(tasksCompletedToday.length * 25);
  }, [tasks]);

  const handleEndDay = () => {
    if (confirm('Encerrar o dia removerá todas as tarefas pendentes. Deseja continuar?')) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      tasks.forEach(task => {
        if (task.status === 'pending' || task.status === 'aborted') {
          if (task.createdAt < startOfToday.getTime()) {
             removeTask(task.id);
          } else {
             removeTask(task.id);
          }
        }
      });
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
          <span>{completedToday.length}</span>
          <span>Tarefas Finalizadas</span>
        </StatItem>
        <StatItem>
          <span>{formatDuration(totalFocusTime)}</span>
          <span>Tempo em Foco</span>
        </StatItem>
      </StatsContainer>

      {completedToday.length > 0 ? (
        <>
          <h2>Tarefas Concluídas Hoje:</h2>
          <CompletedTasksList>
            {completedToday.map((task) => (
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
