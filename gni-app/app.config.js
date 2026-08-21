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
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        "./google-services.json",
      softwareKeyboardLayoutMode: "resize",

        icon:
         "./assets/images/app-icon.png",

      adaptiveIcon: {
    foregroundImage:
      "./assets/images/app-icon-foreground.png",

    monochromeImage:
      "./assets/images/app-icon-monochrome.png",

    backgroundColor:
      "#FFFFFF",
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
  "expo-notifications",
  {
    icon:
      "./assets/images/notification-icon.png",

    color:
      "#001B3D",

    defaultChannel:
      "default",
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