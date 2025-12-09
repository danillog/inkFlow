// src/components/PerformanceMonitor.tsx
import React from 'react';
import styled from 'styled-components';
import { useUIStore } from '../store/uiStore';

const MonitorContainer = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  z-index: 1000;
  pointer-events: none; // Make it non-interactive
  
  @media (max-width: 768px) {
    bottom: 80px; // Adjust for mobile toolbar
    right: 10px;
    font-size: 0.7rem;
    padding: 6px 8px;
  }
`;

const PerformanceMonitor: React.FC = () => {
  const { engineType, lastStrokePerformance } = useUIStore();

  const formattedTime = lastStrokePerformance !== null 
    ? `${lastStrokePerformance.toFixed(2)}ms` 
    : 'N/A';

  return (
    <MonitorContainer>
      Engine: {engineType.toUpperCase()} | Last stroke: {formattedTime}
    </MonitorContainer>
  );
};

export default PerformanceMonitor;
