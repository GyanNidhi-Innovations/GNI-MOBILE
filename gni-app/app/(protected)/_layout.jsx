import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  ActivityIndicator,
  View,
} from "react-native";

import {
  Redirect,
  Stack,
  useRouter,
} from "expo-router";

import * as Notifications from "expo-notifications";

import { useAuthStore } from "@/stores/authStore";

import {
  getUnreadNotificationCount,
  markNotificationCampaignOpened,
  registerForFcmNotifications,
  subscribeToPushTokenChanges,
} from "@/services/notificationService";

import { COLORS } from "@/theme";

export default function ProtectedLayout() {
  const user =
    useAuthStore(
      (state) => state.user,
    );

  const token =
    useAuthStore(
      (state) => state.token,
    );

  const authLoading =
    useAuthStore(
      (state) =>
        state.authLoading,
    );

  const userId =
    user?.id ||
    user?._id;

  const router =
    useRouter();

  const handledNotificationResponsesRef =
    useRef(
      new Set(),
    );

  const setUnreadNotificationCount =
    useAuthStore(
      (state) =>
        state.setUnreadNotificationCount,
    );

  const refreshUnreadCount =
    useCallback(
      async () => {
        try {
          if (!userId) {
            setUnreadNotificationCount(
              0,
            );

            return;
          }

          const response =
            await getUnreadNotificationCount(
              userId,
            );

          setUnreadNotificationCount(
            response?.count ||
              0,
          );
        } catch (error) {
          if (__DEV__) {
            console.warn(
              "refreshUnreadCount error:",
              error?.message ||
                error,
            );
          }
        }
      },
      [
        userId,
        setUnreadNotificationCount,
      ],
    );

  useEffect(() => {
    void refreshUnreadCount();
  }, [
    refreshUnreadCount,
  ]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    registerForFcmNotifications(
      userId,
    ).catch((error) => {
      if (__DEV__) {
        console.warn(
          "Notification registration failed:",
          error?.message ||
            error,
        );
      }
    });

    const openNotificationDestination =
      (data = {}) => {
        switch (
          data.screen
        ) {
          case "events": {
            if (
              data.eventId
            ) {
              router.navigate({
                pathname:
                  "/event/[id]",

                params: {
                  id:
                    String(
                      data.eventId,
                    ),

                  source:
                    "notification",
                },
              });
            } else {
              router.navigate(
                "/events",
              );
            }

            break;
          }

          /*
           * There is currently no Courses
           * route in this mobile app.
           *
           * Do not navigate to a route that
           * does not exist. Open Alerts
           * instead.
           */
          case "courses":
            router.navigate(
              "/notifications",
            );
            break;

          case "calendar":
            router.navigate(
              "/calendar",
            );
            break;

          case "profile":
            router.navigate(
              "/profile",
            );
            break;

          case "notifications":
            router.navigate(
              "/notifications",
            );
            break;

          default:
            router.replace(
              "/home",
            );
            break;
        }
      };

    const handleNotificationResponse =
      async (
        response,
      ) => {
        const request =
          response
            ?.notification
            ?.request;

        const responseKey =
          String(
            request
              ?.identifier ||
              response
                ?.actionIdentifier ||
              "",
          );

        if (
          responseKey &&
          handledNotificationResponsesRef
            .current
            .has(
              responseKey,
            )
        ) {
          return;
        }

        if (
          responseKey
        ) {
          handledNotificationResponsesRef
            .current
            .add(
              responseKey,
            );
        }

        const data =
          request
            ?.content
            ?.data ||
          {};

        const campaignId =
          String(
            data.campaignId ||
              "",
          ).trim();

        if (
          campaignId
        ) {
          try {
            await markNotificationCampaignOpened(
              campaignId,
            );
          } catch (error) {
            /*
             * Analytics failure must never
             * block notification navigation.
             */
            if (__DEV__) {
              console.warn(
                "mark notification opened error:",
                error?.message ||
                  error,
              );
            }
          }
        }

        openNotificationDestination(
          data,
        );

        void refreshUnreadCount();
      };

    const pushTokenSubscription =
      subscribeToPushTokenChanges(
        userId,
      );

    const receivedSubscription =
      Notifications
        .addNotificationReceivedListener(
          () => {
            void refreshUnreadCount();
          },
        );

    const responseSubscription =
      Notifications
        .addNotificationResponseReceivedListener(
          (
            response,
          ) => {
            void handleNotificationResponse(
              response,
            );
          },
        );

    const initialResponse =
      Notifications
        .getLastNotificationResponse();

    if (
      initialResponse
        ?.notification
    ) {
      void handleNotificationResponse(
        initialResponse,
      ).finally(() => {
        Notifications
          .clearLastNotificationResponse();
      });
    }

    return () => {
      pushTokenSubscription
        .remove();

      receivedSubscription
        .remove();

      responseSubscription
        .remove();
    };
  }, [
    userId,
    router,
    refreshUnreadCount,
  ]);

  if (
    authLoading
  ) {
    return (
      <View
        style={{
          flex: 1,
          alignItems:
            "center",
          justifyContent:
            "center",
          backgroundColor:
            "#FFFFFF",
        }}
      >
        <ActivityIndicator
          size="small"
          color={
            COLORS.primary
          }
        />
      </View>
    );
  }

  if (
    !user ||
    !token
  ) {
    return (
      <Redirect
        href="/auth/login"
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown:
          false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
      />

      <Stack.Screen
        name="event/[id]"
      />

      <Stack.Screen
        name="support"
      />

      <Stack.Screen
        name="privacy-policy"
      />

      <Stack.Screen
        name="terms-and-conditions"
      />
    </Stack>
  );
}
