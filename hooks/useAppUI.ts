
import React, { useState } from 'react';
import { AppView } from '../types';
import { gameService } from '../services/gameService';

export const useAppUI = (setAppView: (view: AppView) => void) => {
  // Modals Visibility
  const [showTutorial, setShowTutorial] = useState(false); // Used for Rewards
  const [showLegends, setShowLegends] = useState(false);   // New: Used for Rules/Legends
  const [showBadge, setShowBadge] = useState(false);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  
  // Master Login Form
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [masterCodeInput, setMasterCodeInput] = useState('');
  const [masterLoginError, setMasterLoginError] = useState(false);
  const [isVerifyingMaster, setIsVerifyingMaster] = useState(false);

  // --- Actions ---

  const handleMasterLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingMaster) return;

    setIsVerifyingMaster(true);
    setMasterLoginError(false);

    try {
      // Secure server-side check
      const isValid = await gameService.verifyMasterCode(masterCodeInput.toUpperCase());
      
      if (isValid) {
        setShowMasterLogin(false);
        setMasterCodeInput('');
        setAppView(AppView.MASTER_DASHBOARD);
      } else {
        setMasterLoginError(true);
        // Haptic feedback for error
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } catch (err) {
      setMasterLoginError(true);
    } finally {
      setIsVerifyingMaster(false);
    }
  };

  return {
    state: {
      showTutorial,
      showLegends,
      showBadge,
      isAvatarSelectorOpen,
      showMasterLogin,
      masterCodeInput,
      masterLoginError,
      isVerifyingMaster
    },
    actions: {
      setShowTutorial,
      setShowLegends,
      setShowBadge,
      setIsAvatarSelectorOpen,
      setShowMasterLogin,
      setMasterCodeInput,
      handleMasterLoginSubmit
    }
  };
};
