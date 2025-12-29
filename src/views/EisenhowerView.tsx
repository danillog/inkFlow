import React from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #0D1117;
  color: #C9D1D9;
  padding: 1rem;
  box-sizing: border-box;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background-color: rgba(255, 255, 255, 0.1); }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1rem;
  flex-grow: 1;
  min-height: 0; 
`;

const Quadrant = styled.div<{ $bg: string }>`
  background-color: ${props => props.$bg};
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow-y: auto;
  position: relative;
`;

const QuadrantTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TaskCard = styled.div`
  background-color: rgba(255, 255, 255, 0.08);
  padding: 0.8rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  cursor: grab;
  user-select: none;
  border: 1px solid transparent;

  &:hover {
    background-color: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    cursor: grabbing;
    opacity: 0.8;
  }
`;

const UnsortedContainer = styled.div`
  margin-top: 1rem;
  height: 120px;
  background-color: #161B22;
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
  display: flex;
  gap: 1rem;
  align-items: center;
  border: 1px dashed #30363d;
`;

const EisenhowerView: React.FC = () => {
  const { tasks, updateTask, setCurrentView } = useTaskStore();

  // Filter tasks that are pending
  const activeTasks = tasks.filter(t => t.status === 'pending');

  const getQuadrantTasks = (urgency: 'high' | 'low', importance: 'high' | 'low') => {
    return activeTasks.filter(t => t.urgency === urgency && t.importance === importance);
  };

  const getUnsortedTasks = () => {
    return activeTasks.filter(t => !t.urgency || !t.importance);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, urgency: 'high' | 'low', importance: 'high' | 'low') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTask(taskId, { urgency, importance });
    }
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => setCurrentView('blackbox')}>Back</BackButton>
        <Title>Prioritization Matrix</Title>
        <div style={{ width: 60 }} />
      </Header>

      <Grid>
        <Quadrant 
          $bg="#2d1a1e" // Red-ish tint
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'high', 'high')}
        >
          <QuadrantTitle>🔥 Do First (Urgent & Important)</QuadrantTitle>
          {getQuadrantTasks('high', 'high').map(task => (
            <TaskCard 
              key={task.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              {task.content}
            </TaskCard>
          ))}
        </Quadrant>

        <Quadrant 
          $bg="#1a2d1e" // Green-ish tint
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'low', 'high')}
        >
          <QuadrantTitle>📅 Schedule (Not Urgent & Important)</QuadrantTitle>
          {getQuadrantTasks('low', 'high').map(task => (
            <TaskCard 
              key={task.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              {task.content}
            </TaskCard>
          ))}
        </Quadrant>

        <Quadrant 
          $bg="#2d2d1a" // Yellow-ish tint
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'high', 'low')}
        >
          <QuadrantTitle>⚡ Delegate (Urgent & Not Important)</QuadrantTitle>
          {getQuadrantTasks('high', 'low').map(task => (
            <TaskCard 
              key={task.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              {task.content}
            </TaskCard>
          ))}
        </Quadrant>

        <Quadrant 
          $bg="#1a1e2d" // Blue-ish tint
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'low', 'low')}
        >
          <QuadrantTitle>🗑️ Delete/Later (Not Urgent & Not Important)</QuadrantTitle>
          {getQuadrantTasks('low', 'low').map(task => (
            <TaskCard 
              key={task.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              {task.content}
            </TaskCard>
          ))}
        </Quadrant>
      </Grid>

      <UnsortedContainer>
        <span style={{ writingMode: 'vertical-rl', opacity: 0.5, fontSize: 12 }}>UNSORTED</span>
        {getUnsortedTasks().map(task => (
            <TaskCard 
              key={task.id} 
              draggable 
              onDragStart={(e) => handleDragStart(e, task.id)}
              style={{ width: 200, flexShrink: 0 }}
            >
              {task.content}
            </TaskCard>
        ))}
        {getUnsortedTasks().length === 0 && <span style={{ opacity: 0.3 }}>All tasks prioritized!</span>}
      </UnsortedContainer>
    </Container>
  );
};

export default EisenhowerView;
