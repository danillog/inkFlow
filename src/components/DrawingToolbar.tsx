import React from "react";
import styled from "styled-components";
import { useUIStore, AppColors, type DrawingTool } from "../store/uiStore";
import { yStrokes, awareness } from "../lib/sync";

const ToolbarContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: ${AppColors.surface};
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
`;

const ToolButton = styled.button<{ $isSelected: boolean }>`
  background-color: ${(props) =>
    props.$isSelected ? AppColors.primary : "transparent"};
  color: ${AppColors.text};
  border: 1px solid transparent;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    border-color: ${AppColors.text};
  }
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
`;

const SymbolInput = styled.input`
  background-color: ${AppColors.background};
  color: ${AppColors.text};
  border: 1px solid ${AppColors.surface};
  border-radius: 6px;
  width: 40px;
  height: 40px;
  text-align: center;
  font-size: 1.5rem;
  padding: 0;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${AppColors.primary};
  }
`;

const tools: { name: DrawingTool; icon: string }[] = [
  { name: "pen", icon: "✍️" },
  { name: "rectangle", icon: "▭" },
  { name: "circle", icon: "⭕" },
  { name: "triangle", icon: "△" },
  { name: "pan", icon: "🖐️" },
  { name: "eraser", icon: "🧼" },
];

const DrawingToolbar: React.FC = () => {
  const { drawingTool, setDrawingTool, shapeText, setShapeText } = useUIStore();
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
      {isShapeTool && (
        <SymbolInput
          type="text"
          value={shapeText}
          onChange={(e) => setShapeText(e.target.value.slice(0, 2))}
          maxLength={2}
          placeholder="?"
        />
      )}
      <ToolButton onClick={handleUndo} $isSelected={false} title="Undo">
        ↩️
      </ToolButton>
    </ToolbarContainer>
  );
};

export default DrawingToolbar;
