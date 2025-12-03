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
  gap: 1rem;
  color: #C9D1D9;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const QuickCapture: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [category, setCategory] = useState<'personal' | 'work'>('personal'); // Corrected type
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
        <RadioLabel>
          <input
            type="radio"
            name="category"
            value="personal"
            checked={category === 'personal'}
            onChange={() => setCategory('personal')}
          />
          Personal
        </RadioLabel>
        <RadioLabel>
          <input
            type="radio"
            name="category"
            value="work"
            checked={category === 'work'}
            onChange={() => setCategory('work')}
          />
          Work
        </RadioLabel>
      </CategorySelector>
    </QuickCaptureContainer>
  );
};

export default QuickCapture;
