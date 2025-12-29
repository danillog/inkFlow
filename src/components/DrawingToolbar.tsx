import React, { useState } from "react";
import styled from "styled-components";
import { useUIStore, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness } from "../lib/sync";
import { useTranslation } from "react-i18next";
import ColorPalette from "./ColorPalette";
import EngineSwitch from "./EngineSwitch";

const tools: { name: DrawingTool; icon: string }[] = [
  { name: "pen", icon: "✍️" },
  { name: "rectangle", icon: "▭" },
  { name: "circle", icon: "⭕" },
  { name: "triangle", icon: "△" },
  { name: "pan", icon: "🖐️" },
  { name: "eraser", icon: "🧼" },
];

const ToolbarContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: ${({ theme }) => theme.surface};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  width: 56px;

  @media (max-width: 768px) {
    top: auto;
    bottom: 0;
    left: 0;
    transform: none;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: flex-start;
    width: 100%;
    overflow-x: auto;
    padding: 8px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0;
    box-shadow: none;
  }
`;

const ToolButton = styled.button<{ $isSelected: boolean }>`
  background-color: ${(props) =>
    props.$isSelected ? props.theme.primary : "transparent"};
  color: ${({ theme }) => theme.text};
  border: 1px solid transparent;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  font-size: 1.2rem;

  &:hover {
    border-color: ${({ theme }) => theme.text};
  }
`;

const ColorToolButton = styled(ToolButton)`
  border: 2px solid ${({ theme }) => theme.text};
  background-color: ${(props) => props.color};
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const InputContainer = styled.div`
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 8px;
  z-index: 100;

  @media (max-width: 768px) {
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    margin-left: 0;
  }
`;

const SymbolInput = styled.input`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  border: 1px solid ${({ theme }) => theme.surface};
  border-radius: 6px;
  width: 150px;
  height: 40px;
  text-align: center;
  font-size: 1rem;
  padding: 0 8px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
  }
`;

const PaletteContainerWrapper = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  z-index: 101;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const DrawingToolbar: React.FC = () => {
  const {
    drawingTool,
    setDrawingTool,
    shapeText,
    setShapeText,
    drawingInputMode,
    toggleDrawingInputMode,
    selectedColor,
    colors,
  } = useUIStore();
  const { t } = useTranslation();
  const [isColorPaletteOpen, setIsColorPaletteOpen] = useState(false);

  const isShapeTool =
    drawingTool === "rectangle" ||
    drawingTool === "circle" ||
    drawingTool === "triangle";

  const handleUndo = () => {
    if (!awareness) return;
    const strokes = yStrokes().toArray();
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].clientID === awareness().clientID) {
        yStrokes().delete(i, 1);
        return;
      }
    }
  };
  
  return (
    <>
      <ToolbarContainer theme={colors}>
        {tools.map((tool) => (
          <ToolButton
            key={tool.name}
            $isSelected={drawingTool === tool.name}
            onClick={() => setDrawingTool(tool.name)}
            title={tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
            theme={colors}
          >
            {tool.icon}
          </ToolButton>
        ))}
        <Separator />
        <ColorToolButton
          $isSelected={false}
          color={selectedColor}
          onClick={() => setIsColorPaletteOpen(!isColorPaletteOpen)}
          theme={colors}
        />
        {isColorPaletteOpen && (
          <PaletteContainerWrapper>
            <ColorPalette onColorSelect={() => setIsColorPaletteOpen(false)} />
          </PaletteContainerWrapper>
        )}
        <Separator />
        <ToolButton onClick={handleUndo} $isSelected={false} title="Undo" theme={colors}>
          ↩️
        </ToolButton>
        <Separator />
        <EngineSwitch />
        <Separator />
        <ToolButton
          onClick={toggleDrawingInputMode}
          $isSelected={false}
          title={
            drawingInputMode === "pen"
              ? t("toolbar.pen_mode")
              : t("toolbar.touch_mode")
          }
          theme={colors}
        >
          {drawingInputMode === "pen" ? "🖊️" : "👆"}
        </ToolButton>
      </ToolbarContainer>
      {isShapeTool && (
        <InputContainer>
          <SymbolInput
            type="text"
            value={shapeText}
            onChange={(e) => setShapeText(e.target.value)}
            maxLength={100}
            placeholder="text..."
            theme={colors}
          />
        </InputContainer>
      )}
    </>
  );
};

export default DrawingToolbar;
