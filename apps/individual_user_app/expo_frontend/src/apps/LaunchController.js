import React from 'react';
import { APP_CONFIG } from './app_config';

/**
 * LaunchController
 * Responsible for selecting the root application component based on the environment configuration.
 * This decouples the "Switching Logic" from the main App.js entry point.
 */
export const LaunchController = () => {
    const mode = APP_CONFIG.getMode();
    console.log(`[LaunchController] Current Mode: ${mode}`);
    const SelectedApp = APP_CONFIG.modes[mode]?.component || APP_CONFIG.modes.default.component;

    if (!SelectedApp) {
        console.error(`Invalid APP_MODE: ${mode}. Falling back to default.`);
    }

    return <SelectedApp />;
};
