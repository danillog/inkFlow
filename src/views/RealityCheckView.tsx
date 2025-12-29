import React, { useMemo, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';
import { db } from '../lib/db';
import type { DailyStat } from '../lib/db';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const RealityCheckContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100vw;
  height: 100vh;
  background-color: #0D1117;
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  overflow-y: auto;
  padding: 2rem;
  box-sizing: border-box;
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
  max-height: 30vh;
  overflow-y: auto;
  width: 80%;
  max-width: 600px;
  background-color: #161B22;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;

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
  margin-top: 1rem;
  margin-bottom: 2rem;

  &:hover {
    opacity: 0.9;
  }
`;

const HeatmapWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeatmapGrid = styled.div`
  display: grid;
  grid-template-rows: repeat(7, 12px);
  grid-auto-flow: column;
  gap: 3px;
`;

const HeatmapCell = styled.div<{ $intensity: number }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => {
    if (props.$intensity === 0) return '#161B22';
    if (props.$intensity < 3) return '#0e4429';
    if (props.$intensity < 6) return '#006d32';
    if (props.$intensity < 9) return '#26a641';
    return '#39d353';
  }};
  
  &:hover {
    border: 1px solid rgba(255,255,255,0.5);
  }
`;

const RealityCheckView: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const [heatmapData, setHeatmapData] = useState<DailyStat[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await db.dailyStats.toArray();
      setHeatmapData(stats);
    };
    fetchStats();
  }, []);

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
    if (confirm('Ending the day will save your stats locally and clear all active tasks, drawings, and notes across devices. Continue?')) {
      // 1. Save stats locally before wiping
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const existingStat = await db.dailyStats.get(todayStr);
      const count = tasksCompletedToday.length + (existingStat?.count || 0);
      
      await db.dailyStats.put({
        date: todayStr,
        count: count
      });

      // 2. Clear Yjs shared types to propagate deletion to peers
      const { yTasks, yStrokes } = await import('../lib/sync');
      yTasks().clear();
      yStrokes().delete(0, yStrokes().length);
      
      // 3. Navigate back
      setCurrentView('blackbox');
    }
  };

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  // Heatmap Logic
  const daysToRender = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 365); // Last year
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  const getIntensity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const stat = heatmapData.find(s => s.date === dateStr);
    return stat ? stat.count : 0;
  };

  return (
    <RealityCheckContainer>
      <Title>Reality Check</Title>

      <StatsContainer>
        <StatItem>
          <span>{tasksCompletedToday.length}</span>
          <span>Tasks Finished</span>
        </StatItem>
        <StatItem>
          <span>{formatDuration(totalFocusTime)}</span>
          <span>Focus Time</span>
        </StatItem>
      </StatsContainer>

      {tasksCompletedToday.length > 0 ? (
        <>
          <h2>Completed Today:</h2>
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
        <p>No tasks completed today. Let's start tomorrow fresh?</p>
      )}

      <HeatmapWrapper>
        <h3 style={{ marginBottom: '1rem', opacity: 0.7 }}>Productivity Heatmap</h3>
        <HeatmapGrid>
          {daysToRender.map((day) => (
            <HeatmapCell 
              key={day.toISOString()} 
              $intensity={getIntensity(day)} 
              title={`${format(day, 'MMM do')}: ${getIntensity(day)} tasks`}
            />
          ))}
        </HeatmapGrid>
      </HeatmapWrapper>

      <ResetButton onClick={handleEndDay}>End Day & Save Stats</ResetButton>
    </RealityCheckContainer>
  );
};

export default RealityCheckView;