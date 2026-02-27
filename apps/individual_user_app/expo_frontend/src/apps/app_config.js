import { FullApp } from './FullApp';
import { RegistrationApp } from './RegistrationApp';

/**
 * APP_CONFIG
 * Acts as a "Launch Manifest" for the application.
 * Defines which component should be rendered based on the APP_MODE.
 */
export const APP_CONFIG = {
    modes: {
        // Standard full-featured application
        default: {
            component: FullApp,
            description: 'Individual User Full App'
        },
        // Pure registration tool (Pure Mode)
        registration: {
            component: RegistrationApp,
            description: 'Pure Registration Specialist Tool'
        }
    },

    // Helper to get logic for current environment
    getMode: () => process.env.EXPO_PUBLIC_APP_MODE || 'default'
};
