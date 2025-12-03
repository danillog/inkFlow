import React from 'react';
import styled from 'styled-components';
import { useUIStore } from '../store/uiStore';

interface ColorPaletteProps {
  onColorSelect?: () => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ onColorSelect }) => {
  const { selectedColor, setSelectedColor, colors } = useUIStore();
  
  const PaletteContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: ${colors.surface};
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 100;
  `;

  const ColorSwatch = styled.div<{ color: string; $isSelected: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: ${(props) => props.color};
    cursor: pointer;
    border: 2px solid ${(props) => (props.$isSelected ? colors.primary : 'transparent')};
    transition: transform 0.1s ease-in-out;

    &:hover {
      transform: scale(1.1);
    }
  `;
  
  const paletteColors = [
    colors.text,
    colors.accent,
    colors.secondaryAccent,
    colors.primary,
    '#E84D4D', // Red
    '#51A8E8', // Blue
  ];

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    onColorSelect?.();
  };

  return (
    <PaletteContainer>
      {paletteColors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          $isSelected={selectedColor === color}
          onClick={() => handleColorClick(color)}
        />
      ))}
    </PaletteContainer>
  );
};

export default ColorPalette;

