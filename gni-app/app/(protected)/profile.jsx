import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  useCallback,
  useState,
} from "react";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";
import {
  logoutUserApi,
} from "@/services/authService";
import AppScreen from "@/components/common/AppScreen";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useResponsive } from "@/hooks/useResponsive";
import { COLORS } from "@/theme";

import {
  deactivateCurrentNotificationInstallation,
} from "@/services/notificationService";

export default function ProfileScreen() {
  const authUser = useAuthStore(
    (state) => state.user,
  );
  const logout = useAuthStore(
    (state) => state.logout,
  );
  const updateUser =
  useAuthStore(
    (state) =>
      state.updateUser,
  );

  const router = useRouter();

  const {
    isCompactPhone,
    type,
    layout,
  } = useResponsive();

  const [user, setUser] =
    useState(authUser);
 
  const [loading, setLoading] =
    useState(!authUser);
  const [refreshing, setRefreshing] =
    useState(false);

  const fetchProfile =
  useCallback(
    async (
      showLoader = true,
    ) => {
      try {
        if (
          !authUser?.id &&
          !authUser?._id
        ) {
          setLoading(false);
          return;
        }

        const userId =
          authUser?.id ||
          authUser?._id;

       if (
  showLoader &&
  !authUser
) {
  setLoading(true);
}

        const profileResponse =
          await apiClient(
            `/profile/${userId}`,
          );

        const fetchedUser =
          profileResponse?.user ||
          null;

        if (fetchedUser) {
  const normalizedUser = {
    ...fetchedUser,

    id:
      fetchedUser.id ||
      fetchedUser._id,
  };

  setUser(
    normalizedUser,
  );

  await updateUser(
    normalizedUser,
  );
}

      } catch (error) {
        console.log(
          "fetchProfile error:",
          error,
        );

        Alert.alert(
          "Unable to load profile",

          error?.message ||
            "Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      authUser?.id,
      authUser?._id,
      updateUser,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, [fetchProfile]),
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchProfile(false);
    } finally {
      setRefreshing(false);
    }
  };

 

const handleLogout = async () => {
  const userId =
    authUser?.id ||
    authUser?._id;

  const refreshToken =
    useAuthStore
      .getState()
      .refreshToken;

  try {
    /*
     * Disable this phone's notification token
     * before clearing the access token.
     */
    if (userId) {
      await deactivateCurrentNotificationInstallation(
        userId,
      );
    }
  } catch (error) {
    console.log(
      "Notification deactivation error:",
      error?.message || error,
    );
  }

  try {
    /*
     * Revoke the refresh token on the backend.
     */
    if (refreshToken) {
      await logoutUserApi(
        refreshToken,
      );
    }
  } catch (error) {
    console.log(
      "Server logout error:",
      error?.message || error,
    );
  } finally {
    /*
     * Always clear local authentication.
     */
    await logout();

    router.replace(
      "/auth/login",
    );
  }
};


  if (loading && !user) {
    return (
      <AppScreen
        centered
        scroll={false}
      >
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
        />
      </AppScreen>
    );
  }

  if (!user) {
    return (
      <AppScreen
        centered
        scroll={false}
      >
        <Text
          style={{
            textAlign: "center",
            color: "#667085",
            fontSize: type.body,
          }}
        >
          No user data found
        </Text>
      </AppScreen>
    );
  }

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

 const commonProfileFields = [
  {
    icon: "person-outline",
    label: "Name",
    value: user.name,
  },
  {
    icon: "mail-outline",
    label: "Email",
    value: user.email,
  },
  {
    icon: "call-outline",
    label: "Phone",
    value:
      user.phone ||
      user.mobile,
  },
];

let typeSpecificProfileFields = [];

if (
  user.type ===
  "student-college"
) {
  typeSpecificProfileFields = [
    {
      icon: "school-outline",
      label: "College",
      value: user.college,
    },
    {
      icon: "calendar-outline",
      label: "Year of Study",
      value: user.year,
    },
    {
      icon: "time-outline",
      label: "Joining Year",
      value:
        user.joiningyear,
    },
    {
      icon: "book-outline",
      label: "Branch",
      value:
        user.branch ||
        user.specialization,
    },
    {
      icon: "bulb-outline",
      label: "Skills / Interests",
      value: user.skills,
    },
  ];
}

if (
  user.type ===
  "jobseeker-fresher"
) {
  typeSpecificProfileFields = [
    {
      icon: "school-outline",
      label: "Degree",
      value: user.degree,
    },
    {
      icon: "calendar-outline",
      label: "Pass-out Year",
      value:
        user.passoutYear,
    },
    {
      icon: "book-outline",
      label: "Branch",
      value:
        user.branch ||
        user.specialization,
    },
    {
      icon: "bulb-outline",
      label: "Skills / Interests",
      value: user.skills,
    },
  ];
}

if (
  user.type ===
  "working-professional"
) {
  typeSpecificProfileFields = [
    {
      icon: "business-outline",
      label: "Current Company",
      value:
        user.currentCompany,
    },
    {
      icon: "briefcase-outline",
      label: "Current Role",
      value:
        user.currentRole,
    },
    {
      icon: "time-outline",
      label: "Experience",
      value: user.experience,
    },
    {
      icon: "bulb-outline",
      label: "Skills / Interests",
      value: user.skills,
    },
  ];
}

const visibleProfileFields = [
  ...commonProfileFields,
  ...typeSpecificProfileFields,
].filter((item) => {
  return (
    item.value !== undefined &&
    item.value !== null &&
    String(item.value).trim() !== ""
  );
});


  return (
    <AppScreen
      refreshing={refreshing}
      onRefresh={handleRefresh}
      maxWidth={
        layout.contentMaxWidth
      }
      bottomSpace={30}
      contentStyle={{
        paddingHorizontal:
          layout.horizontalPadding,
        paddingTop: 8,
      }}
    >
      <ScreenHeader
        title="Profile"
        subtitle="Review your account and personal information."
      />

      <View
        style={{
          marginBottom:
            isCompactPhone ? 18 : 24,
          borderRadius:
            isCompactPhone ? 22 : 28,
          backgroundColor: "#001B3D",
          padding: layout.cardPadding,
        }}
      >
        <View className="flex-row items-center">
          <View
            style={{
              width:
                isCompactPhone ? 64 : 78,
              height:
                isCompactPhone ? 64 : 78,
              marginRight:
                isCompactPhone ? 14 : 18,
              alignItems: "center",
              justifyContent: "center",
              borderRadius:
                isCompactPhone ? 20 : 24,
              backgroundColor: "#FFFFFF",
            }}
          >
            <Text
              style={{
                color: "#001B3D",
                fontSize:
                  isCompactPhone
                    ? 22
                    : 26,
                fontWeight: "800",
              }}
            >
              {initials}
            </Text>
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={2}
              style={{
                color: "#FFFFFF",
                fontSize:
                  isCompactPhone
                    ? type.cardTitle + 3
                    : type.cardTitle + 5,
                lineHeight:
                  isCompactPhone
                    ? type.cardTitle + 10
                    : type.cardTitle + 12,
                fontWeight: "800",
              }}
            >
              {user.name || "User"}
            </Text>

            <Text
              numberOfLines={2}
              style={{
                marginTop: 6,
                color: "#C7D5E5",
                fontSize: type.small,
                lineHeight:
                  type.small + 6,
              }}
            >
              {user.email ||
                "No email available"}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-6 flex-row">
        <InfoBox
          title="Status"
          value="Active"
          type={type}
          compact={isCompactPhone}
        />

        <View
          style={{
            width:
              isCompactPhone ? 10 : 14,
          }}
        />

        <InfoBox
          title="Role"
          value={
            user.type || "User"
          }
          type={type}
          compact={isCompactPhone}
        />
      </View>

      <View
        style={{
          marginBottom: 24,
          borderRadius:
            isCompactPhone ? 22 : 26,
          backgroundColor: "#FFFFFF",
          padding: layout.cardPadding,
          borderWidth: 1,
          borderColor: "#EAECF0",
        }}
      >
        <Text
          style={{
            marginBottom: 18,
            color: "#101828",
            fontSize:
              type.sectionTitle,
            fontWeight: "800",
          }}
        >
          Personal Details
        </Text>

        {visibleProfileFields.map(
  (item, index) => (
    <View key={item.label}>
      <ProfileItem
        icon={item.icon}
        label={item.label}
        value={item.value}
        type={type}
      />

      {index <
      visibleProfileFields.length -
        1 ? (
        <Divider />
      ) : null}
    </View>
  ),
)}

      </View>

      

      <Pressable
        onPress={handleLogout}
        style={{
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          borderRadius: 18,
          backgroundColor: "#FEF3F2",
          paddingHorizontal: 18,
        }}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#B42318"
        />

        <Text
          style={{
            marginLeft: 8,
            color: "#B42318",
            fontSize: type.button,
            fontWeight: "800",
          }}
        >
          Logout
        </Text>
      </Pressable>
    </AppScreen>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  type,
}) {
  return (
    <View className="flex-row items-center">
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0F7]">
        <Ionicons
          name={icon}
          size={21}
          color="#001B3D"
        />
      </View>

      <View className="flex-1">
        <Text
          style={{
            color: "#98A2B3",
            fontSize: type.small,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            marginTop: 4,
            color: "#101828",
            fontSize: type.body,
            lineHeight:
              type.body + 7,
            fontWeight: "700",
          }}
        >
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return (
    <View className="my-5 h-px bg-[#EAECF0]" />
  );
}

function InfoBox({
  title,
  value,
  type,
  compact,
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: compact
          ? 92
          : 104,
        justifyContent: "center",
        borderRadius:
          compact ? 20 : 24,
        backgroundColor: "#FFFFFF",
        padding: compact ? 15 : 18,
        borderWidth: 1,
        borderColor: "#EAECF0",
      }}
    >
      <Text
        style={{
          color: "#667085",
          fontSize: type.small,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          marginTop: 8,
          color: "#101828",
          fontSize: type.body,
          lineHeight:
            type.body + 7,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
