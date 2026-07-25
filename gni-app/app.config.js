export default {
  expo: {
    name: "GyanNidhi",
    slug: "gni-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/app-icon.png",
    scheme: "gniapp",
    userInterfaceStyle: "automatic",
    newArchEnabled:true,

    ios: {
      supportsTablet: true,
    },

    android: {
      googleServicesFile:"./google-services.json",
      softwareKeyboardLayoutMode: "resize",

      permissions: ["CAMERA", "RECORD_AUDIO"],
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/app-icon.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.gyannidhi.mobile",
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-camera",
        {
          cameraPermission: "Allow GyanNidhi to access your camera.",
          microphonePermission:
            "Allow GyanNidhi to record premises video.",
        },
      ],

      [
  "expo-notifications",
  {
    icon: "./assets/images/gyan-icon.png",
    color: "#ffffff",
    defaultChannel: "default",
  },
],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#ffffff",
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      eas: {
        projectId: "c19580eb-329f-4442-ab77-21a800dfc39c",
      },
    },
  },
};