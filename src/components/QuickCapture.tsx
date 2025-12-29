import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useTaskStore } from '../store/taskStore';

const QuickCaptureContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background-color: #161B22; /* Surface color from Design System */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  gap: 0.5rem;
`;

const QuickCaptureInput = styled.input`
  width: 80%;
  max-width: 600px;
  padding: 0.8rem 1rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: #0D1117; /* Background color for input */
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  outline: none;

  &::placeholder {
    color: rgba(201, 209, 217, 0.5);
  }

  &:focus {
    border-color: #238636; /* Primary color on focus */
  }
`;

const CategorySelector = styled.div`
  display: flex;
  background-color: #0D1117;
  border-radius: 20px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CategoryButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 16px;
  border: none;
  background-color: ${({ $active }) => ($active ? '#238636' : 'transparent')};
  color: #C9D1D9;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${({ $active }) => ($active ? '#238636' : 'rgba(255, 255, 255, 0.1)')};
  }
`;

const QuickCapture: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState<'personal' | 'work'>('personal');
  const addTask = useTaskStore((state) => state.addTask);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addTask(inputValue.trim(), category);
      setInputValue('');
    }
  }, [inputValue, category, addTask]);

  return (
    <QuickCaptureContainer>
      <QuickCaptureInput
        type="text"
        placeholder="Add a quick task and press Enter..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <CategorySelector>
        <CategoryButton
          $active={category === 'personal'}
          onClick={() => setCategory('personal')}
        >
          Personal
        </CategoryButton>
        <CategoryButton
          $active={category === 'work'}
          onClick={() => setCategory('work')}
        >
          Work
        </CategoryButton>
      </CategorySelector>
    </QuickCaptureContainer>
  );
};

export default QuickCapture;
