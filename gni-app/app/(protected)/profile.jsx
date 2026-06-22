import { useCallback, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/apiClient";

import AppScreen from "@/components/common/AppScreen";

import {
  COLORS,
} from "@/theme";

export default function ProfileScreen() {
  const authUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const [user, setUser] = useState(authUser);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndEvents = useCallback(async () => {
    try {
      if (!authUser?.id && !authUser?._id) {
        setLoading(false);
        return;
      }

      const userId = authUser?.id || authUser?._id;

      setLoading(true);

      const [profileRes, eventsRes] = await Promise.all([
        apiClient(`/profile/${userId}`),
        apiClient(`/events/registered/${userId}`),
      ]);

      const fetchedUser = profileRes?.user || null;
      const fetchedEvents = eventsRes?.events || [];

      setUser(fetchedUser);
      setRegisteredEvents(fetchedEvents);

      if (fetchedUser) {
        setAuth({
          user: {
            ...fetchedUser,
            id: fetchedUser.id || fetchedUser._id,
          },
          token: useAuthStore.getState().token,
        });
      }
    } catch (error) {
      console.log("fetchProfileAndEvents error:", error);
      Alert.alert("Error", error?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, authUser?._id]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileAndEvents();
    }, [fetchProfileAndEvents])
  );

  const handleOpenEvent = (event) => {
    if (!event?._id) return;

    router.push({
      pathname: "/(protected)/events/[id]",
      params: {
        id: event._id,
        source: "profile",
      },
    });
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

if (loading) {
  return (
    <AppScreen centered scroll={false}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </AppScreen>
  );
}

if (!user) {
  return (
    <AppScreen centered scroll={false}>
      <Text className="text-center text-[16px] text-[#667085]">
        No user data found
      </Text>
    </AppScreen>
  );
}

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

return (
<AppScreen
  bottomSpace={140}
  contentStyle={{
    paddingTop: 8,
  }}
>
      <View className="mb-7">
        <Text className="text-[32px] font-bold text-[#101828]">Profile</Text>
        <Text className="mt-2 text-[15px] leading-6 text-[#667085]">
          Manage your account and registered events.
        </Text>
      </View>

      <View className="mb-6 rounded-[30px] bg-[#0F5EFF] p-6">
        <View className="flex-row items-center">
          <View className="mr-5 h-20 w-20 items-center justify-center rounded-[28px] bg-white">
            <Text className="text-[26px] font-bold text-[#0F5EFF]">
              {initials}
            </Text>
          </View>

          <View className="flex-1">
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-[22px] font-bold text-white"
          >
            {user.name || "User"}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-2 text-[14px] text-blue-100"
          >
            {user.email || "No email"}
          </Text>
          </View>
        </View>
      </View>

      <View className="mb-6 flex-row gap-4">
        <InfoBox title="Status" value="Active" />
        <InfoBox title="Role" value={user.type || "User"} />
      </View>

      <View className="mb-6 rounded-[28px] bg-white p-5">
        <Text className="mb-5 text-[20px] font-bold text-[#101828]">
          Personal Details
        </Text>

        <ProfileItem icon="person-outline" label="Name" value={user.name} />
        <Divider />
        <ProfileItem icon="mail-outline" label="Email" value={user.email} />
        <Divider />
        <ProfileItem icon="call-outline" label="Phone" value={user.phone} />
        <Divider />
        <ProfileItem
          icon="school-outline"
          label="College"
          value={user.college}
        />
        <Divider />
        <ProfileItem icon="book-outline" label="Branch" value={user.branch} />
      </View>

      <View className="mb-6">
        <Text className="mb-5 text-[20px] font-bold text-[#101828]">
          Registered Events
        </Text>

        {registeredEvents.length === 0 ? (
          <View className="rounded-[28px] bg-white p-6">
            <Text className="text-[14px] text-[#667085]">
              No registered events yet
            </Text>
          </View>
        ) : (
          registeredEvents.map((event) => (
            <Pressable
              key={event._id}
              onPress={() => handleOpenEvent(event)}
              className="mb-4 rounded-[28px] bg-white p-5"
            >
              <View className="flex-row items-start">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#0F5EFF"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-[#101828]">
                    {event.title || "Untitled Event"}
                  </Text>

                  <Text className="mt-2 text-[14px] text-[#667085]">
                    {event.date
                      ? new Date(event.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </Text>

                  <Text className="mt-1 text-[14px] text-[#667085]">
                    {event.location || "Online"}
                  </Text>

                  <Text className="mt-3 text-[12px] font-semibold text-[#0F5EFF]">
                    View details
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Pressable
        onPress={handleLogout}
        className="rounded-[24px] bg-[#FEF3F2] px-5 py-4"
      >
        <View className="flex-row items-center justify-center">
          <Ionicons name="log-out-outline" size={20} color="#B42318" />
          <Text className="ml-2 text-[15px] font-semibold text-[#B42318]">
            Logout
          </Text>
        </View>
      </Pressable>
</AppScreen>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF]">
        <Ionicons name={icon} size={20} color="#0F5EFF" />
      </View>

      <View className="flex-1">
        <Text className="text-[12px] font-medium text-[#98A2B3]">
          {label}
        </Text>
        <Text className="mt-1 text-[15px] font-semibold text-[#101828]">
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="my-5 h-px bg-[#EAECF0]" />;
}

function InfoBox({ title, value }) {
  return (
    <View className="flex-1 rounded-[24px] bg-white p-5">
      <Text className="text-[13px] text-[#667085]">{title}</Text>
      <Text className="mt-3 text-[15px] font-bold text-[#101828]">
        {value}
      </Text>
    </View>
  );
}