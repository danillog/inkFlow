import React from "react";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";

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
  background-color: #0d1117;
  color: #c9d1d9;
  font-family: "Inter", sans-serif;
  padding: 2rem 4rem;
  animation: ${fadeIn} 1s ease-out;
  max-width: 1000px;
  margin: auto;
  text-align: center;

  @media (max-width: 768px) {
    padding: 1rem 2rem;
  }
`;

const Header = styled.header`
  padding: 2rem 0;
  border-bottom: 1px solid #238636;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  color: #c9d1d9;
  margin: 0;
  font-weight: 800;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  color: #f778ba; /* Accent color */
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CTAButton = styled.button`
  background-color: #238636;
  color: #ffffff;
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
    color: #f778ba;
    border-bottom: 2px solid #238636;
    padding-bottom: 0.5rem;
    display: inline-block;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #c9d1d9;
    max-width: 80ch;
  }

  @media (max-width: 768px) {
    padding: 2.5rem 0;
    h2 {
      font-size: 2rem;
    }
    p {
      font-size: 1rem;
    }
  }
`;

const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;

  span {
    background-color: #161b22;
    padding: 0.5rem 1rem;
    border-radius: 5px;
    font-family: "JetBrains Mono", monospace;
  }
`;

const BenefitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  text-align: left;
`;

const BenefitCard = styled.div`
  background: #161b22;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #238636;
  h3 {
    margin-top: 0;
    color: #c9d1d9;
  }
  p {
    font-size: 1rem;
    line-height: 1.6;
  }
`;

const LanguageSwitcherContainer = styled.div`
  padding: 1rem;
  text-align: center;
`;

const LanguageButton = styled.button`
  background: none;
  border: 1px solid #238636;
  color: #c9d1d9;
  padding: 0.5rem 1rem;
  margin: 0 0.5rem;
  cursor: pointer;
  border-radius: 5px;
  font-size: 0.9rem;

  &.active {
    background: #238636;
    color: #fff;
  }
`;

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <LanguageSwitcherContainer>
      <LanguageButton
        onClick={() => changeLanguage("en")}
        className={i18n.language === "en" ? "active" : ""}
      >
        English
      </LanguageButton>
      <LanguageButton
        onClick={() => changeLanguage("pt")}
        className={i18n.language.startsWith("pt") ? "active" : ""}
      >
        Português
      </LanguageButton>
    </LanguageSwitcherContainer>
  );
};

const LandingPageView: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleEnterApp = () => {
    navigate("/app");
  };

  const benefits = [
    "infinite_space",
    "collaboration",
    "non_destructive",
    "integrated_tools",
    "eco_friendly",
  ];

  return (
    <PageContainer>
      <LanguageSwitcher />
      <Header>
        <HeroTitle>{t("landing.title")}</HeroTitle>
        <HeroSubtitle>{t("landing.subtitle")}</HeroSubtitle>
        <CTAButton onClick={handleEnterApp}>{t("landing.cta")}</CTAButton>
      </Header>

      <Section>
        <h2>{t("landing.pain_section.title")}</h2>
        <p>{t("landing.pain_section.text")}</p>
      </Section>

      <Section>
        <h2>{t("landing.solution_section.title")}</h2>
        <p
          dangerouslySetInnerHTML={{
            __html: t("landing.solution_section.text"),
          }}
        />
      </Section>

      <Section>
        <h2 style={{ textAlign: "center", display: "block" }}>
          {t("landing.benefits_over_paper.title")}
        </h2>
        <BenefitGrid>
          {benefits.map((benefit) => (
            <BenefitCard key={benefit}>
              <h3>{t(`landing.benefits_over_paper.${benefit}.title`)}</h3>
              <p>{t(`landing.benefits_over_paper.${benefit}.text`)}</p>
            </BenefitCard>
          ))}
        </BenefitGrid>
      </Section>

      <Section style={{ textAlign: "center" }}>
        <h2>{t("landing.engineering_section.title")}</h2>
        <p style={{ maxWidth: "100%" }}>
          {t("landing.engineering_section.intro")}
          <br />
          <strong>{t("landing.engineering_section.question")}</strong>{" "}
          {t("landing.engineering_section.answer")}
        </p>
        <TechStack>
          <span>{t("landing.engineering_section.tech_stack.engine")}</span>
          <span>{t("landing.engineering_section.tech_stack.arch")}</span>
          <span>{t("landing.engineering_section.tech_stack.frontend")}</span>
          <span>{t("landing.engineering_section.tech_stack.db")}</span>
          <span>{t("landing.engineering_section.tech_stack.sync")}</span>
        </TechStack>
        <p style={{ marginTop: "2rem" }}>
          <Trans i18nKey="landing.engineering_section.explore"></Trans>{" "}
          <a
            href="https://github.com/danillog/inkFlow"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#F778BA" }}
          >
            GitHub
          </a>
          .
        </p>
      </Section>
    </PageContainer>
  );
};

export default LandingPageView;
