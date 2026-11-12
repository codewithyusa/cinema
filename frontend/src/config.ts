import Constants from 'expo-constants';

// A phone can't use "localhost", so we need the PC address.
// 1. EXPO_PUBLIC_API_URL: set this to use another server (for example a deployed https one).
// 2. Expo Go: the PC address comes from the Expo dev server (hostUri).
// 3. Installed APK: there is no dev server, so we use the PC address below.
//    If your PC IP changes, update it here and rebuild the APK.
const PC_IP = '192.168.100.24';

const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? PC_IP;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:8080`;