import React, { useState, useEffect, useRef } from 'react';
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
    isPomodoroActive,
    isPomodoroFloating,
    pomodoroExpectedEndTime,
    setPomodoroDuration,
    setIsPomodoroActive,
    togglePomodoroFloating,
    setPomodoroStartTime,
    setPomodoroExpectedEndTime,
  } = useUIStore();
  
  const [minutes, setMinutes] = useState(pomodoroDuration);
  const [seconds, setSeconds] = useState(0);
  const [showPipPortal, setShowPipPortal] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null); // New state variable

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pipWindowRef = useRef<Window | null>(null);
  const pipContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPomodoroActive && pomodoroExpectedEndTime) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingTime = pomodoroExpectedEndTime - now;
        if (remainingTime > 0) {
          setMinutes(Math.floor((remainingTime / 1000 / 60) % 60));
          setSeconds(Math.floor((remainingTime / 1000) % 60));
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsPomodoroActive(false);
          onTimerEnd?.();
          setMinutes(pomodoroDuration);
          setSeconds(0);
          setPomodoroStartTime(null);
          setPomodoroExpectedEndTime(null);
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
  }, [isPomodoroActive, pomodoroExpectedEndTime, onTimerEnd, pomodoroDuration, setIsPomodoroActive, setPomodoroStartTime, setPomodoroExpectedEndTime]);

  useEffect(() => {
    // When pomodoroExpectedEndTime changes from outside (e.g., sync), update local state
    if (!isPomodoroActive && pomodoroExpectedEndTime) {
      const now = Date.now();
      const remainingTime = pomodoroExpectedEndTime - now;
      if (remainingTime > 0) {
        // Defer state updates to avoid cascading renders
        setTimeout(() => {
          setMinutes(Math.floor((remainingTime / 1000 / 60) % 60));
          setSeconds(Math.floor((remainingTime / 1000) % 60));
          setIsPomodoroActive(true); // Activate timer based on synced state
        }, 0);
      } else {
        setTimeout(() => {
          setMinutes(pomodoroDuration);
          setSeconds(0);
        }, 0);
      }
    }
  }, [pomodoroExpectedEndTime, isPomodoroActive, pomodoroDuration, setIsPomodoroActive]);


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

  useEffect(() => {
    const openPipWindow = async () => {
      if ('documentPictureInPicture' in window && isPomodoroFloating && !pipWindowRef.current) {
        try {
          const pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 250,
            height: 150,
          });

          pipWindowRef.current = pipWindow;
          
          const container = document.createElement('div');
          pipContainerRef.current = container;
          pipWindow.document.body.append(container);
          
          setTimeout(() => { // Defer state updates
            setPortalContainer(container);
            setShowPipPortal(true);
          }, 0);

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

    if (isPomodoroFloating) {
      openPipWindow();
    } else if (!isPomodoroFloating && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setTimeout(() => { // Defer state updates
        setPortalContainer(null);
        setShowPipPortal(false);
      }, 0);
    }
  }, [isPomodoroFloating, togglePomodoroFloating]);


  const handleStart = () => {
    const now = Date.now();
    const endTime = now + pomodoroDuration * 60 * 1000;
    setPomodoroStartTime(now);
    setPomodoroExpectedEndTime(endTime);
    setIsPomodoroActive(true);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPomodoroActive(false);
    setMinutes(pomodoroDuration);
    setSeconds(0);
    setPomodoroStartTime(null);
    setPomodoroExpectedEndTime(null);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(1, parseInt(e.target.value, 10));
    setPomodoroDuration(newDuration);
  };

  const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

  return (
    <Wrapper>
      <TimerDisplay>
        {formatTime(minutes)}:{formatTime(seconds)}
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
      {showPipPortal && portalContainer && createPortal(<FloatingPomodoro minutes={minutes} seconds={seconds}/>, portalContainer)}
    </Wrapper>
  );
};

export default PomodoroTimer;
