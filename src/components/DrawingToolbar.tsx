import React, { useState } from "react";
import styled from "styled-components";
import { useUIStore, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness } from "../lib/sync";
import { useTranslation } from "react-i18next";
import ColorPalette from "./ColorPalette";



const tools: { name: DrawingTool; icon: string }[] = [
  { name: "pen", icon: "✍️" },
  { name: "rectangle", icon: "▭" },
  { name: "circle", icon: "⭕" },
  { name: "triangle", icon: "△" },
  { name: "pan", icon: "🖐️" },
  { name: "eraser", icon: "🧼" },
];

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
    const strokes = yStrokes.toArray();
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].clientID === awareness.clientID) {
        yStrokes.delete(i, 1);
        return;
      }
    }
  };
  
  const ToolbarContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: ${colors.surface};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  width: auto;

  @media (max-width: 768px) {
    top: auto;
    bottom: 20px;
    left: 20px;
    right: 20px;
    width: fit-content;
    max-width: 90vw;
    transform: none;
    flex-direction: row;
    align-items: center;
    overflow-x: auto;
  }
`;

const ToolButton = styled.button<{ $isSelected: boolean }>`
  background-color: ${(props) =>
    props.$isSelected ? colors.primary : "transparent"};
  color: ${colors.text};
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
    border-color: ${colors.text};
  }
`;

const ColorToolButton = styled(ToolButton)`
  border: 2px solid ${colors.text};
  background-color: ${(props) => props.color};
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
`;

const SymbolInput = styled.input`
  background-color: ${colors.background};
  color: ${colors.text};
  border: 1px solid ${colors.surface};
  border-radius: 6px;
  width: 100%;
  height: 40px;
  text-align: center;
  font-size: 1rem;
  padding: 0 8px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`;

  return (
    <ToolbarContainer>
      {tools.map((tool) => (
        <ToolButton
          key={tool.name}
          $isSelected={drawingTool === tool.name}
          onClick={() => setDrawingTool(tool.name)}
          title={tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
        >
          {tool.icon}
        </ToolButton>
      ))}
      <Separator />
      <ColorToolButton
        $isSelected={false}
        color={selectedColor}
        onClick={() => setIsColorPaletteOpen(!isColorPaletteOpen)}
      />
      {isColorPaletteOpen && (
        <ColorPalette onColorSelect={() => setIsColorPaletteOpen(false)} />
      )}
      <Separator />
      {isShapeTool && (
        <SymbolInput
          type="text"
          value={shapeText}
          onChange={(e) => setShapeText(e.target.value)}
          maxLength={100}
          placeholder="text..."
        />
      )}
      <ToolButton onClick={handleUndo} $isSelected={false} title="Undo">
        ↩️
      </ToolButton>
      <Separator />
      <ToolButton
        onClick={toggleDrawingInputMode}
        $isSelected={false}
        title={
          drawingInputMode === "pen"
            ? t("toolbar.pen_mode")
            : t("toolbar.touch_mode")
        }
      >
        {drawingInputMode === "pen" ? "🖊️" : "👆"}
      </ToolButton>
    </ToolbarContainer>
  );
};

export default DrawingToolbar;
