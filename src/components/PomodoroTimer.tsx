import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../store/uiStore';
import FloatingPomodoro from './FloatingPomodoro';

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
  onTimerEnd?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onTimerEnd }) => {
  const { t } = useTranslation();
  const {
    pomodoroDuration,
    pomodoroMinutes,
    pomodoroSeconds,
    isPomodoroActive,
    isPomodoroFloating,
    setPomodoroDuration,
    setPomodoroTime,
    setIsPomodoroActive,
    togglePomodoroFloating,
  } = useUIStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPomodoroActive) {
      intervalRef.current = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroTime(pomodoroMinutes, pomodoroSeconds - 1);
        } else if (pomodoroMinutes > 0) {
          setPomodoroTime(pomodoroMinutes - 1, 59);
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPomodoroActive(false);
          onTimerEnd?.();
          // Reset to initial state after finishing
          setPomodoroTime(pomodoroDuration, 0);
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
  }, [isPomodoroActive, pomodoroMinutes, pomodoroSeconds, onTimerEnd, pomodoroDuration, setPomodoroTime, setIsPomodoroActive]);

  useEffect(() => {
    const openPipWindow = async () => {
      if ('documentPictureInPicture' in window && isPomodoroFloating) {
        try {
          const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
            width: 250,
            height: 150,
          });

          pipWindowRef.current = pipWindow;
          
          const container = document.createElement('div');
          pipContainerRef.current = container;
          pipWindow.document.body.append(container);

          [...document.styleSheets].forEach((styleSheet) => {
            try {
              const cssRules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
              const style = document.createElement('style');
              style.textContent = cssRules;
              pipWindow.document.head.appendChild(style);
            } catch (e) {
              console.warn('Could not copy stylesheet:', e);
            }
          });

          pipWindow.addEventListener('pagehide', () => {
            togglePomodoroFloating();
          });

        } catch (error) {
          console.error('Failed to open Picture-in-Picture window:', error);
          togglePomodoroFloating(); // Toggle back if it fails
        }
      }
    };

    if (isPomodoroFloating && !pipWindowRef.current) {
      openPipWindow();
    } else if (!isPomodoroFloating && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
  }, [isPomodoroFloating, togglePomodoroFloating]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPomodoroActive && !isPomodoroFloating) {
          togglePomodoroFloating();
        }
      } else {
        if (isPomodoroFloating) {
          togglePomodoroFloating();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPomodoroActive, isPomodoroFloating, togglePomodoroFloating]);

  const handleStart = () => {
    setPomodoroTime(pomodoroDuration, 0);
    setIsPomodoroActive(true);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPomodoroActive(false);
    setPomodoroTime(pomodoroDuration, 0);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(1, parseInt(e.target.value, 10));
    setPomodoroDuration(newDuration);
  };

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  return (
    <Wrapper>
      <TimerDisplay>
        {formatTime(pomodoroMinutes)}:{formatTime(pomodoroSeconds)}
      </TimerDisplay>
      <Controls>
        {!isPomodoroActive ? (
          <>
            <InputGroup>
              <label htmlFor="duration">{t('pomodoro.duration_label')}</label>
              <input
                id="duration"
                type="number"
                value={pomodoroDuration}
                onChange={handleDurationChange}
                min="1"
              />
            </InputGroup>
            <Button onClick={handleStart}>{t('pomodoro.start_button')}</Button>
          </>
        ) : (
          <Button onClick={handleReset}>{t('pomodoro.reset_button')}</Button>
        )}
      </Controls>
      {pipContainerRef.current && createPortal(<FloatingPomodoro />, pipContainerRef.current)}
    </Wrapper>
  );
};

export default PomodoroTimer;

