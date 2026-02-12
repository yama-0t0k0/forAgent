import { DeviceEventEmitter } from 'react-native';

const EVENT_NAME = 'FIRESTORE_IO_EVENT';

/**
 * Logs Firestore I/O operations for E2E testing.
 * Emits an event that can be captured by the TestLogOverlay component.
 * 
 * @param {string} action - The action type (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} collection - The target collection name
 * @param {Object} data - The data payload
 */
export const logFirestoreIO = (action, collection, data) => {
    if (__DEV__) {
        const payload = {
            action,
            collection,
            data,
            timestamp: Date.now(),
        };
        // Format for log: [FIRESTORE_IO]|ACTION|COLLECTION|JSON
        const logString = `[FIRESTORE_IO]|${action}|${collection}|${JSON.stringify(data)}`;
        console.log(logString);
        
        DeviceEventEmitter.emit(EVENT_NAME, logString);
    }
};

export const FirestoreLogger = {
    EVENT_NAME,
    log: logFirestoreIO,
};
