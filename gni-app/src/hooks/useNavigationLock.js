import {
  useCallback,
  useRef,
} from "react";
import {
  useFocusEffect,
} from "expo-router";

export default function useNavigationLock() {
  const navigationLockedRef =
    useRef(false);

  useFocusEffect(
    useCallback(() => {
      navigationLockedRef.current =
        false;

      return undefined;
    }, []),
  );

  const navigateOnce =
    useCallback((navigationAction) => {
      if (
        navigationLockedRef.current
      ) {
        return false;
      }

      navigationLockedRef.current =
        true;

      try {
        navigationAction();
        return true;
      } catch (error) {
        navigationLockedRef.current =
          false;

        throw error;
      }
    }, []);

  return navigateOnce;
}