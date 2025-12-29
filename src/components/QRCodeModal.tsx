import React from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background-color: #161B22;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
`;

const Title = styled.h2`
  color: #C9D1D9;
  margin: 0;
  font-size: 1.5rem;
`;

const Instructions = styled.p`
  color: #8b949e;
  text-align: center;
  margin: 0;
  max-width: 250px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255,255,255,0.1);
  }
`;

interface QRCodeModalProps {
  roomName: string;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ roomName, onClose }) => {
  const url = `${window.location.origin}/app?room=${roomName}`;

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>Pair Device</Title>
        <div style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
            <QRCodeSVG value={url} size={200} />
        </div>
        <Instructions>
          Scan this code with your mobile device to instantly join room <strong>{roomName}</strong>
        </Instructions>
        <CloseButton onClick={onClose}>Close</CloseButton>
      </ModalContent>
    </Overlay>
  );
};

export default QRCodeModal;