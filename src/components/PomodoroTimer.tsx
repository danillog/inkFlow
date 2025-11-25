import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const TimerContainer = styled.div`
  font-size: 2.5rem;
  font-family: 'JetBrains Mono', monospace; /* Monospaced font for timer */
  color: #238636; /* Primary color for timer */
  margin-bottom: 2rem;
`;

interface PomodoroTimerProps {
  initialMinutes?: number;
  onTimerEnd?: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ initialMinutes = 25, onTimerEnd }) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer ended
          clearInterval(intervalRef.current!);
          setIsActive(false);
          onTimerEnd?.();
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
  }, [isActive, minutes, seconds, onTimerEnd]);

  // Start timer automatically when component mounts, or when task becomes active
  useEffect(() => {
      setIsActive(true);
  }, []);


  const formatTime = (time: number) => time < 10 ? `0${time}` : time;

  return (
    <TimerContainer>
      {formatTime(minutes)}:{formatTime(seconds)}
    </TimerContainer>
  );
};

export default PomodoroTimer;
