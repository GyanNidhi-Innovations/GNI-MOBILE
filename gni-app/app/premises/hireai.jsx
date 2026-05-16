import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getHireAIActiveInterview } from "../../src/services/premisesService";

export default function HireAIPremisesScreen() {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const value = candidateId.trim();

    if (!value) {
      Alert.alert("Required", "Please enter candidate ID.");
      return;
    }

    try {
      setLoading(true);

      const data = await getHireAIActiveInterview(value);

      if (!data?.ok || data?.active === false || !data?.room_prem) {
        Alert.alert(
          "No Active Interview",
          "No active interview found for this candidate ID.",
        );
        return;
      }

      router.push({
        pathname: "/premises/camera-validation",
        params: {
          mode: "hireai",
          candidate_id: value,
          session_id: data.session_id,
          room: data.room_prem,
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail ||
          error.message ||
          "Failed to fetch active interview.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-[#001C80] mb-3">
        HireAI Premises Check
      </Text>

      <Text className="text-base text-gray-600 mb-6">
        Enter the candidate ID to start premises validation.
      </Text>

      <TextInput
        value={candidateId}
        onChangeText={setCandidateId}
        placeholder="Enter candidate ID"
        autoCapitalize="none"
        className="border border-gray-300 rounded-2xl px-4 py-4 text-base mb-5"
      />

      <Pressable
        onPress={handleContinue}
        disabled={loading}
        className={`rounded-2xl px-5 py-4 ${loading ? "bg-gray-400" : "bg-[#001C80]"}`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center text-base font-semibold">
            Continue
          </Text>
        )}
      </Pressable>
    </View>
  );
}
