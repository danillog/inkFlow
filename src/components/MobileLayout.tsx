import React, { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import DrawingCanvas from './DrawingCanvas';
import DrawingToolbar from './DrawingToolbar';
import TaskStack from './TaskStack';
import QuickCapture from './QuickCapture';
import SniperModeView from '../views/SniperModeView';
import RealityCheckView from '../views/RealityCheckView';
import { db, type Task, type DrawingStroke } from '../lib/db';
import { useTaskStore } from '../store/taskStore';
import { useUIStore } from '../store/uiStore';
import type { lightTheme } from '../store/uiStore';
import { useTranslation } from 'react-i18next';
import { useSyncStore } from '../lib/sync';
import { connectYjs, disconnectYjs, getCurrentRoomName } from '../lib/sync';


declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Readonly<typeof lightTheme> {}
}

const MobileLayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
`;

const TabBar = styled.div`
  display: flex;
  justify-content: space-around;
  background-color: #161B22;
  padding: 0.5rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  order: 2;
  width: 100%;
`;

const TabButton = styled.button<{ $active: boolean }>`
  background-color: transparent;
  border: none;
  color: ${({ $active }) => ($active ? '#238636' : '#C9D1D9')};
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
`;

const TabContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
  order: 1;
`;

const CanvasTabContainer = styled.div`
    height: 100%;
    width: 100%;
    position: relative;
`;

const TasksTabContainer = styled.div`
    padding: 1rem;
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const SettingsTabContainer = styled.div`
    padding: 1rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: stretch;
`;

const ActionButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
`;

const SyncControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
`;

const SyncInput = styled.input`
  padding: 0.8rem 1rem;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #238636;
  }
`;

const ControlButton = styled.button<{ $isActive?: boolean }>`
  background-color: ${(props) =>
    props.$isActive ? '#238636' : props.theme.surface};
  color: ${({ theme }) => theme.text};
  border: 1px solid
    ${(props) => (props.$isActive ? '#238636' : 'rgba(255, 255, 255, 0.2)')};
  padding: 0.8rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

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


type Tab = 'Canvas' | 'Tasks' | 'Settings';

const MobileLayoutContent: React.FC = () => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [syncRoomName, setSyncRoomName] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const currentView = useTaskStore((state) => state.currentView);
    const setCurrentView = useTaskStore((state) => state.setCurrentView);
    const peerCount = useSyncStore((state) => state.peerCount);
    const { theme, toggleTheme } = useUIStore();
    const [activeTab, setActiveTab] = useState<Tab>('Canvas');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (getCurrentRoomName()) {
            setSyncRoomName(getCurrentRoomName()!);
            setIsConnected(true);
        }
    }, []);

    const handleExportData = async () => {
        try {
            const allTasks = await db.tasks.toArray();
            const allDrawingStrokes = await db.drawingStrokes.toArray();
            const data = { tasks: allTasks, drawingStrokes: allDrawingStrokes, exportedAt: new Date().toISOString() };
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inkflow_backup_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export data:', error);
            alert(t('alerts.import_fail'));
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm(t('alerts.import_confirm'))) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            const fileContent = await file.text();
            const importedData = JSON.parse(fileContent);

            if (!importedData || !Array.isArray(importedData.tasks) || !Array.isArray(importedData.drawingStrokes)) {
                throw new Error(t('alerts.invalid_backup_file'));
            }

            const { yTasks, yStrokes } = await import('../lib/sync');

            // Clear current data
            yTasks().clear();
            yStrokes().delete(0, yStrokes().length);

            // Import new data
            const tasks = importedData.tasks as Task[];
            tasks.forEach(task => yTasks().set(task.id, task));
            
            const strokes = importedData.drawingStrokes as DrawingStroke[];
            if (strokes.length > 0) {
                yStrokes().push(strokes);
            }

            useTaskStore.getState().refreshCanvas();
            alert(t('alerts.import_success'));
        } catch (error) {
            console.error('Failed to import data:', error);
            alert(t('alerts.import_fail'));
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleToggleSync = () => {
        if (isConnected) {
            disconnectYjs();
            setIsConnected(false);
            setSyncRoomName('');
        } else {
            if (syncRoomName.trim()) {
                connectYjs(syncRoomName.trim());
                setIsConnected(true);
            } else {
                alert(t('alerts.sync_room_prompt'));
            }
        }
    };

    const generateRoomName = () => {
        const words = ['flow', 'ink', 'sync', 'local', 'peer', 'data'];
        const randomWord1 = words[Math.floor(Math.random() * words.length)];
        const randomWord2 = words[Math.floor(Math.random() * words.length)];
        const randomNumber = Math.floor(Math.random() * 900) + 100;
        setSyncRoomName(`${randomWord1}-${randomWord2}-${randomNumber}`);
    };

    const getStatusText = () => {
        if (!isConnected) return t('blackbox.status_offline');
        const peerText = t(peerCount <= 1 ? 'blackbox.peer_text_one' : 'blackbox.peer_text_other');
        return t('blackbox.status_online', { syncRoomName, peerCount, peerText });
    };

    if (currentView === 'sniper') {
      return <SniperModeView />;
    }

    if (currentView === 'realitycheck') {
      return <RealityCheckView />;
    }

  return (
    <MobileLayoutContainer>
      <TabContent>
        {activeTab === 'Canvas' && (
            <CanvasTabContainer>
                <DrawingCanvas />
                <DrawingToolbar />
            </CanvasTabContainer>
        )}
        {activeTab === 'Tasks' && (
            <TasksTabContainer>
                <TaskStack />
                <QuickCapture />
            </TasksTabContainer>
        )}
        {activeTab === 'Settings' && (
            <SettingsTabContainer>
                <h2>{t("blackbox.greeting")}</h2>
                <ControlsContainer>
                  <ActionButtonsWrapper>
                      <BackupButton onClick={handleExportData}>
                          {t("blackbox.export")}
                      </BackupButton>
                      <BackupButton onClick={handleImportClick}>
                          {t("blackbox.import")}
                      </BackupButton>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} accept="application/json" />
                      <RealityCheckButton onClick={() => setCurrentView("realitycheck")}>
                          {t("blackbox.reality_check")}
                      </RealityCheckButton>
                      <ControlButton onClick={toggleTheme}>
                          {t("blackbox.change_theme", { theme: theme === "dark" ? "Light" : "Dark" })}
                      </ControlButton>
                  </ActionButtonsWrapper>
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
                          {isConnected ? t("blackbox.disconnect") : t("blackbox.connect_sync")}
                      </ControlButton>
                      <HelpIcon onClick={() => alert(t("blackbox.sync_help"))}>?</HelpIcon>
                  </SyncControls>
                </ControlsContainer>
            </SettingsTabContainer>
        )}
      </TabContent>
      <TabBar>
        <TabButton $active={activeTab === 'Canvas'} onClick={() => setActiveTab('Canvas')}>
          Canvas
        </TabButton>
        <TabButton $active={activeTab === 'Tasks'} onClick={() => setActiveTab('Tasks')}>
          Tasks
        </TabButton>
        <TabButton $active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')}>
          Settings
        </TabButton>
      </TabBar>
    </MobileLayoutContainer>
  );
};

const MobileLayout: React.FC = () => {
    const { colors } = useUIStore();
    return (
        <ThemeProvider theme={colors}>
            <MobileLayoutContent />
        </ThemeProvider>
    )
}

export default MobileLayout;