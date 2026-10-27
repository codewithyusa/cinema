import Constants from 'expo-constants';

// The server runs on your PC. A phone can't use "localhost", so we reuse the
// PC address that Expo already knows (for example 192.168.100.24).
// In the browser it falls back to localhost.
// To use another server later, set EXPO_PUBLIC_API_URL.
const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:8080`;