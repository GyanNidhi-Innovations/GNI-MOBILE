import { useState } from "react";
import { router } from "expo-router";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "@/components/common/AppScreen";
import AppInput from "@/components/ui/AppInput";
import AppButton from "@/components/ui/AppButton";
import { COLORS } from "@/theme";

import { bootstrapHireAIPremises } from "../../src/services/premisesService";

export default function HireAIPremisesScreen() {
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const value = candidateId.trim();

    if (!value) {
      Alert.alert("Required", "Please enter candidate ID.");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);

      const data = await bootstrapHireAIPremises(value);

      if (!data?.room_prem) {
        Alert.alert(
          "No Interview Room",
          "Could not create or fetch HireAI premises room for this candidate ID."
        );
        return;
      }

      router.push({
        pathname: "/premises/camera-validation",
        params: {
          mode: "hireai",
          candidate_id: value,
          session_id: data.session_id || "",
          room: data.room_prem,
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error?.response?.data?.detail ||
          error?.message ||
          "Failed to fetch active interview."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen
      bottomSpace={48}
      keyboardOffset={0}
      contentStyle={{
        paddingTop: 8,
      }}
    >
      <View className="mb-8">
        <Text className="text-[32px] font-bold leading-[40px] text-[#101828]">
          HireAI{"\n"}Premises Check
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
          Enter the candidate ID to verify the active interview session before
          starting camera validation.
        </Text>
      </View>

      <View className="mb-7 rounded-[32px] bg-[#0F5EFF] p-6">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
          <Ionicons name="videocam-outline" size={30} color={COLORS.white} />
        </View>

        <Text className="text-[24px] font-bold leading-8 text-white">
          Secure interview verification
        </Text>

        <Text className="mt-4 text-[14px] leading-6 text-blue-100">
          We will check if the candidate has an active HireAI room before
          opening the camera validation flow.
        </Text>
      </View>

      <View className="rounded-[30px] bg-white p-6">
        <AppInput
          label="Candidate ID"
          value={candidateId}
          onChangeText={setCandidateId}
          placeholder="Enter candidate ID"
          icon="person-outline"
          returnKeyType="done"
          onSubmitEditing={handleContinue}
          style={{
            marginBottom: 0,
          }}
        />

        <View className="mt-6">
          <AppButton
            title="Continue to Validation"
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>

      <View className="mt-6 rounded-[24px] bg-white p-5">
        <View className="flex-row items-start">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF]">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <Text className="flex-1 text-[13px] leading-6 text-[#667085]">
            Keep the candidate, laptop, and interview screen clearly visible
            during camera validation.
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}