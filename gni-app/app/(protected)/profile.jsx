import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <View style={{ padding: 20 }}>
        
        {/* Header */}
        <Text style={{ fontSize: 26, fontWeight: "bold" }}>
          Profile
        </Text>

        {/* Profile Card */}
        <View style={card}>
          <ProfileItem label="Name" value={user.name} />
          <ProfileItem label="Email" value={user.email} />
          <ProfileItem label="Phone" value={user.phone} />
          <ProfileItem label="College" value={user.college} />
        </View>

        {/* 🔥 LOGOUT BUTTON (PUT HERE) */}
        <Pressable
          onPress={() => {
            logout();
            router.replace("/auth/login");
          }}
          style={{
            marginTop: 20,
            backgroundColor: "#e53935",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Logout
          </Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}
function ProfileItem({ label, value }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: "gray", fontSize: 12 }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: "500" }}>
        {value || "-"}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 12,
      }}
    />
  );
}

const card = {
  backgroundColor: "white",
  padding: 16,
  borderRadius: 12,
  marginTop: 20,
  elevation: 3,
};