import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigate = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  }
};

export const reset = (routes: any) => {
  if (navigationRef.isReady()) {
    navigationRef.reset(routes);
  } else {
    // Retry after a short delay if not ready
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset(routes);
      }
    }, 100);
  }
};