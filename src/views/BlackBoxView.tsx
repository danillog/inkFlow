import React, { useRef, useState, useEffect } from "react";
import styled, { ThemeProvider } from "styled-components";
import DrawingCanvas from "../components/DrawingCanvas";
import TaskStack from "../components/TaskStack";
import QuickCapture from "../components/QuickCapture";
import DrawingToolbar from "../components/DrawingToolbar";
import { db, type Task, type DrawingStroke } from "../lib/db";
import { useTaskStore } from "../store/taskStore";
import { useUIStore } from "../store/uiStore";
import type { lightTheme } from "../store/uiStore";

declare module "styled-components" {
  export interface DefaultTheme extends Readonly<typeof lightTheme> {}
}
import { useTranslation } from "react-i18next";
import { useSyncStore } from "../lib/sync";
import { connectYjs, disconnectYjs, getCurrentRoomName } from "../lib/sync";

const BlackBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const MainContent = styled.div`
  display: flex;
  flex-grow: 1;
  width: 100%;
  position: relative;
  overflow: hidden;

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
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.surface};
  color: ${({ theme }) => theme.text};
  font-family: "Inter", sans-serif;
  z-index: 101;
  box-sizing: border-box;

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
  position: relative;
  flex-direction: row-reverse;

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
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: 0.9rem;
  outline: none;
  width: 120px;

  &:focus {
    border-color: #238636;
  }

  @media (max-width: 768px) {
    width: auto;
  }
`;

const ControlButton = styled.button<{ $isActive?: boolean }>`
  background-color: ${(props) =>
    props.$isActive ? "#238636" : props.theme.surface};
  color: ${({ theme }) => theme.text};
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
  border: 1px solid ${({ theme }) => theme.text};
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

const MenuButton = styled(ControlButton)`
  background-color: #30363d;
  color: #c9d1d9;
  border-color: rgba(255, 255, 255, 0.2);
`;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.surface};
  padding: 0.5rem;
  border-radius: 5px;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 100;
`;

const BlackBoxView: React.FC = () => {
  const { colors } = useUIStore();
  return (
    <ThemeProvider theme={colors}>
      <BlackBoxViewContent />
    </ThemeProvider>
  );
};
const BlackBoxViewContent: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncRoomName, setSyncRoomName] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const taskStoreRehydrate = useTaskStore.persist.rehydrate;
  const setCurrentView = useTaskStore((state) => state.setCurrentView);
  const peerCount = useSyncStore((state) => state.peerCount);
  const { theme, toggleTheme, isTaskStackOpen, toggleTaskStack } = useUIStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      alert(t("alerts.import_fail"));
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

    if (!confirm(t("alerts.import_confirm"))) {
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
        throw new Error(t("alerts.invalid_backup_file"));
      }

      await db.tasks.clear();
      await db.drawingStrokes.clear();

      await db.tasks.bulkAdd(importedData.tasks as Task[]);
      await db.drawingStrokes.bulkAdd(
        importedData.drawingStrokes as DrawingStroke[]
      );

      taskStoreRehydrate();
      useTaskStore.getState().refreshCanvas();

      alert(t("alerts.import_success"));
      console.log("Data imported successfully!");
    } catch (error) {
      console.error("Failed to import data:", error);
      alert(t("alerts.import_fail"));
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
        alert(t("alerts.sync_room_prompt"));
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
    if (!isConnected) return t("blackbox.status_offline");
    const peerText = t(
      peerCount <= 1 ? "blackbox.peer_text_one" : "blackbox.peer_text_other"
    );
    return t("blackbox.status_online", { syncRoomName, peerCount, peerText });
  };

  return (
    <BlackBoxContainer>
      <Header>
        <h1>{t("blackbox.greeting")}</h1>
        <ControlsContainer>
          <ActionButtonsWrapper>
            <MenuButton onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
              {t("blackbox.actions")}
            </MenuButton>
            {isActionMenuOpen && (
              <MenuContainer>
                <BackupButton onClick={handleExportData}>
                  {t("blackbox.export")}
                </BackupButton>
                <BackupButton onClick={handleImportClick}>
                  {t("blackbox.import")}
                </BackupButton>
              </MenuContainer>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept="application/json"
            />
            <RealityCheckButton onClick={() => setCurrentView("realitycheck")}>
              {t("blackbox.reality_check")}
            </RealityCheckButton>
            <ControlButton onClick={toggleTheme}>
              {t("blackbox.change_theme", {
                theme: theme === "dark" ? "Light" : "Dark",
              })}
            </ControlButton>
          </ActionButtonsWrapper>
          <ControlButton
            onClick={toggleTaskStack}
            style={{ alignSelf: "flex-end", marginTop: "0.5rem" }}
          >
            {isTaskStackOpen
              ? t("blackbox.collapse_tasks")
              : t("blackbox.expand_tasks")}
          </ControlButton>
          <SyncControls>
            <span>{t("blackbox.status", { status: getStatusText() })}</span>
            <SyncInput
              type="text"
              placeholder={t("blackbox.sync_room_placeholder")}
              value={syncRoomName}
              onChange={(e) => setSyncRoomName(e.target.value)}
              disabled={isConnected}
            />
            <ControlButton onClick={generateRoomName} disabled={isConnected}>
              {t("blackbox.generate")}
            </ControlButton>
            <ControlButton onClick={handleToggleSync} $isActive={isConnected}>
              {isConnected
                ? t("blackbox.disconnect")
                : t("blackbox.connect_sync")}
            </ControlButton>
            <HelpIcon onClick={() => alert(t("blackbox.sync_help"))}>
              ?
            </HelpIcon>
          </SyncControls>
        </ControlsContainer>
      </Header>
      <MainContent>
        <CanvasArea>
          <DrawingCanvas />
        </CanvasArea>
        {isTaskStackOpen && <TaskStack />}
        <QuickCapture />
        <DrawingToolbar />
      </MainContent>
    </BlackBoxContainer>
  );
};

export default BlackBoxView;
