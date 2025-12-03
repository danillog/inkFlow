import React from "react";
import styled from "styled-components";
import { useUIStore } from "../store/uiStore";

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #0d1117;
`;

const TimerDisplay = styled.div`
  font-size: 3rem;
  font-family: "JetBrains Mono", monospace;
  color: #238636;
  width: 100vw;
  text-align: center;
`;

const formatTime = (time: number) => (time < 10 ? `0${time}` : time);

const FloatingPomodoro: React.FC = () => {
  const { pomodoroMinutes, pomodoroSeconds } = useUIStore();

  return (
    <Wrapper>
      <TimerDisplay>
        {formatTime(pomodoroMinutes)}:{formatTime(pomodoroSeconds)}
      </TimerDisplay>
    </Wrapper>
  );
};

export default FloatingPomodoro;
