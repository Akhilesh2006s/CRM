import { createNavigationContainerRef } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef<any>();

/** Navigate to any root stack screen from tabs / nested screens */
export function navigateRoot(name: string, params?: object): boolean {
  if (!rootNavigationRef.isReady()) {
    console.warn('[nav] Navigation not ready:', name);
    return false;
  }
  try {
    (rootNavigationRef as { navigate: (n: string, p?: object) => void }).navigate(name, params);
    return true;
  } catch (e) {
    console.warn('[nav] navigate failed:', name, e);
    return false;
  }
}

export function goBackRoot(): void {
  if (rootNavigationRef.isReady() && rootNavigationRef.canGoBack()) {
    rootNavigationRef.goBack();
  }
}
