import React from 'react';
import styled from 'styled-components';
import { useUIStore, AppColors } from '../store/uiStore';

const PaletteContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: ${AppColors.surface};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
`;

const ColorSwatch = styled.div<{ color: string; $isSelected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  cursor: pointer;
  border: 2px solid ${(props) => (props.$isSelected ? AppColors.primary : 'transparent')};
  transition: transform 0.1s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const ColorPalette: React.FC = () => {
  const { selectedColor, setSelectedColor } = useUIStore();
  
  // Define a list of colors to display in the palette
  const paletteColors = [
    AppColors.text,
    AppColors.accent,
    AppColors.secondaryAccent,
    AppColors.primary,
    '#E84D4D', // Red
    '#51A8E8', // Blue
  ];

  return (
    <PaletteContainer>
      {paletteColors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          $isSelected={selectedColor === color}
          onClick={() => setSelectedColor(color)}
        />
      ))}
    </PaletteContainer>
  );
};

export default ColorPalette;
