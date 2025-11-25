import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PageContainer = styled.div`
  background-color: #0D1117;
  color: #C9D1D9;
  font-family: 'Inter', sans-serif;
  padding: 2rem 4rem;
  animation: ${fadeIn} 1s ease-out;
  max-width: 1000px;
  margin: auto;
  text-align: center;
`;

const Header = styled.header`
  padding: 2rem 0;
  border-bottom: 1px solid #238636;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  color: #C9D1D9;
  margin: 0;
  font-weight: 800;
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #F778BA; /* Accent color */
  margin-top: 0.5rem;
`;

const CTAButton = styled.button`
  background-color: #238636;
  color: #FFFFFF;
  border: none;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 2rem;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 20px rgba(35, 134, 54, 0.4);
  }
`;

const Section = styled.section`
  padding: 4rem 0;
  text-align: left;
  
  h2 {
    font-size: 2.5rem;
    color: #F778BA;
    border-bottom: 2px solid #238636;
    padding-bottom: 0.5rem;
    display: inline-block;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #C9D1D9;
    max-width: 80ch;
  }
`;

const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;

  span {
    background-color: #161B22;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    font-family: 'JetBrains Mono', monospace;
  }
`;

const LandingPageView: React.FC = () => {
    const navigate = useNavigate();

    const handleEnterApp = () => {
        navigate('/app');
    };

  return (
    <PageContainer>
      <Header>
        <HeroTitle>Pare de Planejar. Comece a Executar.</HeroTitle>
        <HeroSubtitle>O Anti-Todo List para Super-Pensadores.</HeroSubtitle>
        <CTAButton onClick={handleEnterApp}>
          Try InkFlow (No Login Required)
        </CTAButton>
      </Header>

      <Section>
        <h2>A Dor: Paralisia por Análise</h2>
        <p>
          Você é um criador. Um desenvolvedor. Sua mente gera ideias mais rápido do que você consegue anotá-las. 
          Mas as ferramentas tradicionais te forçam a um ciclo vicioso: listas infinitas, backlogs assustadores e a procrastinação que vem com a sobrecarga. 
          Cada nova ideia se torna uma dívida. A dopamina barata das redes sociais parece mais atraente do que encarar a montanha de tarefas que você mesmo criou.
        </p>
      </Section>

      <Section>
        <h2>A Solução: Black Box ➔ Sniper Mode</h2>
        <p>
          InkFlow quebra esse ciclo com um método de dois passos.
          <br/><br/>
          <strong>1. Black Box:</strong> Um canvas infinito para capturar tudo — código, esboços, ideias — sem atrito. Sem julgamento. Apenas flua.
          <br/><br/>
          <strong>2. Sniper Mode:</strong> Arraste UMA tarefa da sua pilha para o modo de foco total. Um timer Pomodoro te protege, e um canvas de contexto mantém as informações relevantes à mão. Nada mais existe. Apenas você e a sua missão.
        </p>
      </Section>

      <Section style={{ textAlign: 'center' }}>
        <h2>Engineering Showcase</h2>
        <p style={{ maxWidth: '100%' }}>
          InkFlow foi construído com performance e privacidade como pilares.
          <br/>
          <strong>"Por que C++ para desenhar na web?"</strong> Para atingir latência zero. A engine de desenho é escrita em C++ e compilada para WebAssembly, garantindo que a sua caneta digital seja uma extensão do seu pensamento, não um obstáculo.
        </p>
        <TechStack style={{ justifyContent: 'center' }}>
          <span>C++ Wasm Engine</span>
          <span>Local-First Architecture</span>
          <span>React & TypeScript</span>
          <span>IndexedDB</span>
          <span>Y.js (P2P Sync)</span>
        </TechStack>
        <p style={{ marginTop: '2rem' }}>
          Explore o código e a arquitetura no <a href="https://github.com/DanilloGomes/inkFlow" target="_blank" rel="noopener noreferrer" style={{ color: '#F778BA' }}>GitHub</a>.
        </p>
      </Section>

    </PageContainer>
  );
};

export default LandingPageView;
