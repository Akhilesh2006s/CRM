import { createNavigationContainerRef } from '@react-navigation/native';

export const rootNavigationRef = createNavigationContainerRef<any>();

export function navigateRoot(name: string, params?: object) {
  if (rootNavigationRef.isReady()) {
    rootNavigationRef.navigate(name as never, params as never);
  }
}
