
import { useState, useEffect } from 'react';
import { TutorialStep } from '../types';

export const useTutorial = () => {
  const [currentStep, setCurrentStep] = useState<TutorialStep>(TutorialStep.NONE);
  
  const startTutorial = () => {
    setCurrentStep(TutorialStep.STYLES);
  };

  const nextStep = () => {
    setCurrentStep(prev => {
      switch (prev) {
        case TutorialStep.STYLES: return TutorialStep.REWARDS;
        case TutorialStep.REWARDS: return TutorialStep.GRID;
        case TutorialStep.GRID: return TutorialStep.CHALLENGE_MODAL;
        case TutorialStep.CHALLENGE_MODAL: return TutorialStep.SCORE;
        case TutorialStep.SCORE: return TutorialStep.NONE;
        default: return TutorialStep.NONE;
      }
    });
  };

  const completeTutorial = () => {
    setCurrentStep(TutorialStep.NONE);
    localStorage.setItem('bingo_tutorial_completed', 'true');
  };

  // Check if tutorial was already done on mount (optional)
  useEffect(() => {
    // Logic to resume or check completion could go here
  }, []);

  return {
    currentStep,
    setCurrentStep,
    startTutorial,
    nextStep,
    completeTutorial
  };
};
