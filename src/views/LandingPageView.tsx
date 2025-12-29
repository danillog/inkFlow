import React from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const PageContainer = styled.div`
  background-color: #0d1117;
  color: #c9d1d9;
  font-family: "Inter", sans-serif;
  animation: ${fadeIn} 1s ease-out;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100vh;
  position: relative;
`;

const HeroSection = styled.header`
  padding: 6rem 2rem;
  text-align: center;
  background: radial-gradient(circle at 50% 50%, #161b22 0%, #0d1117 100%);
  border-bottom: 1px solid rgba(35, 134, 54, 0.2);
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  color: #e6edf3;
  margin: 0;
  font-weight: 800;
  letter-spacing: -1px;

  @media (max-width: 768px) { font-size: 2.5rem; }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #8b949e;
  margin-top: 1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) { font-size: 1.2rem; }
`;

const CTAButton = styled.button`
  background-color: #238636;
  color: #ffffff;
  border: none;
  padding: 1.2rem 3rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: 700;
  margin-top: 3rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(35, 134, 54, 0.4);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(35, 134, 54, 0.6);
    background-color: #2ea043;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 4rem 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  color: #f778ba;
  text-align: center;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) { font-size: 2rem; }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 6rem;
`;

const FeatureCard = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(35, 134, 54, 0.3);
  }

  h3 {
    color: #e6edf3;
    margin-top: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: #8b949e;
    line-height: 1.6;
    margin-bottom: 0;
  }
`;

const WorkflowSection = styled.div`
  background: #161b22;
  padding: 4rem 2rem;
  border-radius: 24px;
  margin-bottom: 6rem;
`;

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  position: relative;
`;

const Step = styled.div`
  text-align: center;
  position: relative;

  h4 {
    color: #238636;
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
    color: #c9d1d9;
  }
`;

const EngineeringFooter = styled.footer`
  text-align: center;
  padding: 4rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  .stack {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 2rem 0;
    
    span {
      background: #0d1117;
      border: 1px solid #30363d;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
    }
  }
`;

const LanguageSwitcher = styled.div`
  position: absolute;
  top: 1rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
`;

const LangBtn = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#238636' : 'transparent'};
  border: 1px solid #30363d;
  color: #c9d1d9;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  &:hover { background: ${props => props.active ? '#238636' : 'rgba(255,255,255,0.05)'}; }
`;

const LandingPageView: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleEnterApp = () => navigate("/app");

  const features = ['eisenhower', 'heatmap', 'qr_sync', 'lasso', 'magic_wand'];
  const steps = ['step1', 'step2', 'step3', 'step4'];

  return (
    <PageContainer>
      <LanguageSwitcher>
        <LangBtn active={i18n.language === 'en'} onClick={() => i18n.changeLanguage('en')}>EN</LangBtn>
        <LangBtn active={i18n.language.startsWith('pt')} onClick={() => i18n.changeLanguage('pt')}>PT</LangBtn>
      </LanguageSwitcher>

      <HeroSection>
        <HeroTitle>{t("landing.title")}</HeroTitle>
        <HeroSubtitle>{t("landing.subtitle")}</HeroSubtitle>
        <CTAButton onClick={handleEnterApp}>{t("landing.cta")}</CTAButton>
      </HeroSection>

      <ContentWrapper>
        <SectionTitle>{t("landing.new_features.title")}</SectionTitle>
        <FeatureGrid>
          {features.map(f => (
            <FeatureCard key={f}>
              <h3>
                {f === 'eisenhower' && '📊'}
                {f === 'heatmap' && '🌡️'}
                {f === 'qr_sync' && '📲'}
                {f === 'lasso' && '🕸️'}
                {f === 'magic_wand' && '✨'}
                {t(`landing.new_features.${f}.title`)}
              </h3>
              <p>{t(`landing.new_features.${f}.text`)}</p>
            </FeatureCard>
          ))}
        </FeatureGrid>

        <WorkflowSection>
          <SectionTitle style={{ color: '#e6edf3' }}>{t("landing.how_to_use.title")}</SectionTitle>
          <StepGrid>
            {steps.map(s => (
              <Step key={s}>
                <h4>{t(`landing.how_to_use.${s}.title`)}</h4>
                <p>{t(`landing.how_to_use.${s}.text`)}</p>
              </Step>
            ))}
          </StepGrid>
        </WorkflowSection>

        <EngineeringFooter>
          <h2>{t("landing.engineering_section.title")}</h2>
          <p>{t("landing.engineering_section.intro")}</p>
          <div className="stack">
            <span>{t("landing.engineering_section.tech_stack.engine")}</span>
            <span>{t("landing.engineering_section.tech_stack.arch")}</span>
            <span>{t("landing.engineering_section.tech_stack.frontend")}</span>
            <span>{t("landing.engineering_section.tech_stack.db")}</span>
            <span>{t("landing.engineering_section.tech_stack.sync")}</span>
          </div>
          <p>
            <Trans i18nKey="landing.engineering_section.explore"></Trans>{" "}
            <a href="https://github.com/danillog/inkFlow" target="_blank" rel="noopener noreferrer" style={{ color: "#F778BA", textDecoration: 'none' }}>
              GitHub
            </a>.
          </p>
        </EngineeringFooter>
      </ContentWrapper>
    </PageContainer>
  );
};

export default LandingPageView;