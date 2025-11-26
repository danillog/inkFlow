import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #161b22;
  border-radius: 8px;
`;

const TimerDisplay = styled.div`
  font-size: 2.5rem;
  font-family: 'JetBrains Mono', monospace;
  color: #238636;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Button = styled.button`
  background-color: #238636;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;

  &:hover {
    opacity: 0.9;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  
  label {
    font-size: 0.9rem;
    color: #c9d1d9;
  }

  input {
    width: 60px;
    padding: 0.5rem;
    border-radius: 5px;
    border: 1px solid #30363d;
    background-color: #0d1117;
    color: #c9d1d9;
    text-align: center;
    font-family: 'JetBrains Mono', monospace;
  }
`;

interface PomodoroTimerProps {
  initialMinutes?: number;
  onTimerEnd?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ initialMinutes = 25, onTimerEnd }) => {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(initialMinutes);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(s => s - 1);
        } else if (minutes > 0) {
          setMinutes(m => m - 1);
          setSeconds(59);
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsActive(false);
          onTimerEnd?.();
          // Reset to initial state after finishing
          setMinutes(duration);
          setSeconds(0);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, minutes, seconds, onTimerEnd, duration]);

  const handleStart = () => {
    setMinutes(duration);
    setSeconds(0);
    setIsActive(true);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setMinutes(duration);
    setSeconds(0);
  };

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  return (
    <Wrapper>
      <TimerDisplay>
        {formatTime(minutes)}:{formatTime(seconds)}
      </TimerDisplay>
      <Controls>
        {!isActive ? (
          <>
            <InputGroup>
              <label htmlFor="duration">{t('pomodoro.duration_label')}</label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value, 10)))}
                min="1"
              />
            </InputGroup>
            <Button onClick={handleStart}>{t('pomodoro.start_button')}</Button>
          </>
        ) : (
          <Button onClick={handleReset}>{t('pomodoro.reset_button')}</Button>
        )}
      </Controls>
    </Wrapper>
  );
};

export default PomodoroTimer;
