import {
  useCallback,
} from "react";

import {
  useFocusEffect,
} from "@react-navigation/native";

import {
  disableTracking,
  enableTracking,
} from "vexo-analytics";

export default function useVexoPrivacyPause() {
  useFocusEffect(
    useCallback(
      () => {
        const pauseTracking =
          async () => {
            try {
              await disableTracking();
            } catch (error) {
              console.log(
                "Vexo disableTracking error:",
                error?.message ||
                  error,
              );
            }
          };

        void pauseTracking();

        return () => {
          const resumeTracking =
            async () => {
              try {
                await enableTracking();
              } catch (error) {
                console.log(
                  "Vexo enableTracking error:",
                  error?.message ||
                    error,
                );
              }
            };

          void resumeTracking();
        };
      },
      [],
    ),
  );
}