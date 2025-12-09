// src/components/EngineSwitch.tsx
import React from 'react';
import styled from 'styled-components';
import { useUIStore } from '../store/uiStore';

const ToolButton = styled.button<{ $isSelected: boolean }>`
  background-color: transparent;
  color: ${({ theme }) => theme.text};
  border: 1px solid transparent;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  font-size: 1.2rem;

  &:hover {
    border-color: ${({ theme }) => theme.text};
  }
`;

const EngineSwitch: React.FC = () => {
  const { engineType, setEngineType } = useUIStore();

  const handleToggle = () => {
    setEngineType(engineType === 'wasm' ? 'js' : 'wasm');
  };

  return (
    <ToolButton onClick={handleToggle} $isSelected={false} title={`Current Engine: ${engineType.toUpperCase()}`}>
      {engineType === 'wasm' ? 'WASM' : 'JS'}
    </ToolButton>
  );
};

export default EngineSwitch;
