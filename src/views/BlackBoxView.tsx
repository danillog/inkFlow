import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import DrawingCanvas from "../components/DrawingCanvas";
import TaskStack from "../components/TaskStack";
import QuickCapture from "../components/QuickCapture";
import ColorPalette from "../components/ColorPalette";
import DrawingToolbar from "../components/DrawingToolbar";
import { db, type Task, type DrawingStroke } from "../lib/db";
import { useTaskStore } from "../store/taskStore";
import { useSyncStore } from "../lib/sync";
import { connectYjs, disconnectYjs, getCurrentRoomName } from "../lib/sync";

const BlackBoxContainer = styled.div`
  display: flex;
  flex-direction: column; /* Changed to vertical layout */
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex-grow: 1;
  width: 100%;
  position: relative;
  overflow: hidden; /* Prevent child components from overflowing */

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const CanvasArea = styled.div`
  flex-grow: 1;
  position: relative;
  overflow: hidden;
`;

const Header = styled.header`
  /* position: absolute; <- Removed */
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #161b22; /* Added a background to define the header area */
  color: #c9d1d9;
  font-family: "Inter", sans-serif;
  z-index: 101;
  box-sizing: border-box; /* Ensure padding is included in width */

  h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  span {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-right: 1rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: flex-start;
    width: 100%;
  }
`;

const ActionButtonsWrapper = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const SyncControls = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
`;

const SyncInput = styled.input`
  padding: 0.4rem 0.8rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: #0d1117;
  color: #c9d1d9;
  font-size: 0.9rem;
  outline: none;
  width: 120px;

  &:focus {
    border-color: #238636;
  }

  @media (max-width: 768px) {
    width: auto; /* Allow it to fill the container */
  }
`;

const ControlButton = styled.button<{ $isActive?: boolean }>`
  background-color: ${(props) => (props.$isActive ? "#238636" : "#161B22")};
  color: #c9d1d9;
  border: 1px solid
    ${(props) => (props.$isActive ? "#238636" : "rgba(255, 255, 255, 0.2)")};
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    opacity: 0.9;
  }
`;

const BackupButton = styled(ControlButton)`
  background-color: #f778ba;
  color: #0d1117;
  border: none;
`;

const RealityCheckButton = styled(ControlButton)`
  background-color: #bb86fc;
  color: #0d1117;
  border: none;
`;

const HelpIcon = styled.span`
  display: inline-block;
  border: 1px solid #c9d1d9;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
  margin-left: 8px;
`;

const BlackBoxView: React.FC = () => {
  const greeting = "Time to organize your thoughts.";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncRoomName, setSyncRoomName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const taskStoreRehydrate = useTaskStore.persist.rehydrate;
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const peerCount = useSyncStore((state) => state.peerCount);

  useEffect(() => {
    if (getCurrentRoomName()) {
      setSyncRoomName(getCurrentRoomName()!);
      setIsConnected(true);
    }
    return () => {
      disconnectYjs();
    };
  }, []);

  const handleExportData = async () => {
    try {
      const allTasks = await db.tasks.toArray();
      const allDrawingStrokes = await db.drawingStrokes.toArray();

      const data = {
        tasks: allTasks,
        drawingStrokes: allDrawingStrokes,
        exportedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `inkflow_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("Data exported successfully!");
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Falha ao exportar dados. Verifique o console para detalhes.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "Importar dados substituirá todos os seus dados atuais. Você tem certeza?"
      )
    ) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      if (
        !importedData ||
        !Array.isArray(importedData.tasks) ||
        !Array.isArray(importedData.drawingStrokes)
      ) {
        throw new Error("Formato de arquivo de backup inválido.");
      }

      await db.tasks.clear();
      await db.drawingStrokes.clear();

      await db.tasks.bulkAdd(importedData.tasks as Task[]);
      await db.drawingStrokes.bulkAdd(
        importedData.drawingStrokes as DrawingStroke[]
      );

      taskStoreRehydrate();
      useTaskStore.getState().refreshCanvas(); // Trigger canvas refresh

      alert("Dados importados com sucesso!");
      console.log("Data imported successfully!");
    } catch (error) {
      console.error("Failed to import data:", error);
      alert(
        "Falha ao importar dados. Verifique o console para detalhes. O arquivo pode estar corrompido ou em formato inválido."
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleSync = () => {
    if (isConnected) {
      disconnectYjs();
      setIsConnected(false);
      setSyncRoomName("");
    } else {
      if (syncRoomName.trim()) {
        connectYjs(syncRoomName.trim());
        setIsConnected(true);
      } else {
        alert("Por favor, insira um nome para a sala de sincronização.");
      }
    }
  };

  const generateRoomName = () => {
    const words = ["flow", "ink", "sync", "local", "peer", "data"];
    const randomWord1 = words[Math.floor(Math.random() * words.length)];
    const randomWord2 = words[Math.floor(Math.random() * words.length)];
    const randomNumber = Math.floor(Math.random() * 900) + 100;
    setSyncRoomName(`${randomWord1}-${randomWord2}-${randomNumber}`);
  };

  const getStatusText = () => {
    if (!isConnected) return "Offline ⚡";
    const peerText = peerCount <= 1 ? "peer" : "peers";
    return `Online (${syncRoomName}) - ${peerCount} ${peerText}`;
  };

  return (
    <BlackBoxContainer>
      <Header>
        <h1>{greeting}</h1>
        <ControlsContainer>
          <ActionButtonsWrapper>
            <BackupButton onClick={handleExportData}>Exportar</BackupButton>
            <BackupButton onClick={handleImportClick}>Importar</BackupButton>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept="application/json"
            />
            <RealityCheckButton onClick={() => setCurrentView("realitycheck")}>
              Reality Check
            </RealityCheckButton>
          </ActionButtonsWrapper>
          <SyncControls>
            <span>Status: {getStatusText()}</span>
            <SyncInput
              type="text"
              placeholder="Digite um nome secreto para a sala"
              value={syncRoomName}
              onChange={(e) => setSyncRoomName(e.target.value)}
              disabled={isConnected}
            />
            <ControlButton onClick={generateRoomName} disabled={isConnected}>
              Gerar
            </ControlButton>
            <ControlButton onClick={handleToggleSync} $isActive={isConnected}>
              {isConnected ? "Desconectar" : "Conectar Sync"}
            </ControlButton>
            <HelpIcon
              onClick={() =>
                alert(
                  "Para sincronizar, outros dispositivos devem usar este mesmo Nome de Sala na mesma rede local. Qualquer pessoa com o nome da sala pode ver os dados."
                )
              }
            >
              ?
            </HelpIcon>
          </SyncControls>
        </ControlsContainer>
      </Header>
      <MainContent>
        <CanvasArea>
          <DrawingCanvas />
        </CanvasArea>
        <TaskStack />
        <QuickCapture />
        <ColorPalette />
        <DrawingToolbar />
      </MainContent>
    </BlackBoxContainer>
  );
};

export default BlackBoxView;
