import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import BlackBoxView from './views/BlackBoxView';
import SniperModeView from './views/SniperModeView';
import RealityCheckView from './views/RealityCheckView';
import LandingPageView from './views/LandingPageView';
import { useTaskStore } from './store/taskStore';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background-color: #0D1117; 
    color: #C9D1D9; 
    font-family: 'Inter', sans-serif;
  }

  #root {
    width: 100%;
    height: 100%;
  }
`;

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
`;

const AppLayout = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function MainApp() {
  const currentView = useTaskStore((state) => state.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'sniper':
        return <SniperModeView />;
      case 'realitycheck':
        return <RealityCheckView />;
      case 'blackbox':
      default:
        return <BlackBoxView />;
    }
  };

  return (
      <AppContainer>
        {renderView()}
      </AppContainer>
  );
}


function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPageView />} />
          <Route path="/app" element={
            <AppLayout>
              <MainApp />
            </AppLayout>
          } />
        </Routes>
      </Router>
    </>
  );
}

export default App;
