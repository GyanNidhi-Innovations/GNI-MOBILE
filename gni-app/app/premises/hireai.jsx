import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
    <SafeAreaView
      className="flex-1 bg-[#F6F8FB]"
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={50}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 48,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 520,
              alignSelf: "center",
            }}
          >
            {/* <Pressable
              onPress={() => router.back()}
              className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="chevron-back" size={22} color="#101828" />
            </Pressable> */}

            <View className="mb-8">
              <Text className="text-[34px] font-bold leading-[42px] text-[#101828]">
                HireAI{"\n"}Premises Check
              </Text>

              <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
                Enter the candidate ID to verify the active interview session
                before starting camera validation.
              </Text>
            </View>

            <View className="mb-7 rounded-[32px] bg-[#0F5EFF] p-6">
              <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
                <Ionicons
                  name="videocam-outline"
                  size={30}
                  color="#FFFFFF"
                />
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
              <Text className="mb-3 text-[14px] font-semibold text-[#101828]">
                Candidate ID
              </Text>

              <View className="flex-row items-center rounded-[22px] bg-[#F6F8FB] px-4">
                <Ionicons name="person-outline" size={20} color="#98A2B3" />

                <TextInput
                  value={candidateId}
                  onChangeText={setCandidateId}
                  placeholder="Enter candidate ID"
                  placeholderTextColor="#98A2B3"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  className="ml-3 flex-1 py-4 text-[15px] text-[#101828]"
                />
              </View>

              <Pressable
                onPress={handleContinue}
                disabled={loading}
                className={`mt-6 rounded-[22px] px-5 py-4 ${
                  loading ? "bg-[#D0D5DD]" : "bg-[#0F5EFF]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-center text-[16px] font-semibold text-white">
                    Continue to Validation
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="mt-6 rounded-[24px] bg-white p-5">
              <View className="flex-row items-start">
                <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF]">
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#0F5EFF"
                  />
                </View>

                <Text className="flex-1 text-[13px] leading-6 text-[#667085]">
                  Keep the candidate, laptop, and interview screen clearly
                  visible during camera validation.
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}