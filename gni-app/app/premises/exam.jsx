import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ExamPremisesScreen() {
  const [attempt, setAttempt] = useState("");
  const [room, setRoom] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [examId, setExamId] = useState("");
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    if (
      !attempt.trim() ||
      !room.trim() ||
      !sessionId.trim() ||
      !examId.trim() ||
      !email.trim()
    ) {
      Alert.alert(
        "Required",
        "Please enter attempt, room, session ID, exam ID, and email, or scan the exam QR."
      );
      return;
    }

    router.push({
      pathname: "/premises/camera-validation",
      params: {
        mode: "exam",
        attempt: attempt.trim(),
        room: room.trim(),
        session_id: sessionId.trim(),
        examId: examId.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F6F8FB]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: 40,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="mb-8 h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color="#101828" />
        </Pressable>

        <View className="mb-8">
          <Text className="text-[34px] font-bold leading-[42px] text-[#101828]">
            Exam
            {"\n"}
            Premises Check
          </Text>

          <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
            Scan the exam QR code for faster setup, or enter session details
            manually to continue camera validation.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/premises/scan")}
          className="mb-7 rounded-[32px] bg-[#0F5EFF] p-6"
        >
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
            <Ionicons name="qr-code-outline" size={30} color="#FFFFFF" />
          </View>

          <Text className="text-[24px] font-bold text-white">
            Scan Exam QR
          </Text>

          <Text className="mt-3 text-[14px] leading-6 text-blue-100">
            Recommended method. Automatically detects attempt and premises
            session details.
          </Text>

          <View className="mt-5 flex-row items-center">
            <Text className="mr-2 text-[14px] font-semibold text-white">
              Open scanner
            </Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </View>
        </Pressable>

        {/* <View className="mb-5 flex-row items-center">
          <View className="h-px flex-1 bg-[#D0D5DD]" />
          <Text className="mx-4 text-[13px] font-medium text-[#98A2B3]">
            Or enter manually
          </Text>
          <View className="h-px flex-1 bg-[#D0D5DD]" />
        </View> */}

        {/* <View className="rounded-[30px] bg-white p-6">
          <ModernInput
            label="Attempt ID"
            value={attempt}
            onChangeText={setAttempt}
            placeholder="Enter attempt ID"
            icon="document-text-outline"
          />

          <ModernInput
            label="Room"
            value={room}
            onChangeText={setRoom}
            placeholder="premises-xxxx-prem"
            icon="business-outline"
          />

          <ModernInput
            label="Session ID"
            value={sessionId}
            onChangeText={setSessionId}
            placeholder="Enter session ID"
            icon="key-outline"
          />

          <ModernInput
            label="Exam ID"
            value={examId}
            onChangeText={setExamId}
            placeholder="Enter exam ID"
            icon="reader-outline"
          />

          <ModernInput
            label="Candidate Email"
            value={email}
            onChangeText={setEmail}
            placeholder="candidate@example.com"
            icon="mail-outline"
            keyboardType="email-address"
          />

          <Pressable
            onPress={handleContinue}
            className="mt-2 rounded-[22px] bg-[#0F5EFF] px-5 py-4"
          >
            <Text className="text-center text-[16px] font-semibold text-white">
              Continue to Camera
            </Text>
          </Pressable>
        </View> */}

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
              During validation, keep the candidate and exam screen clearly
              visible in the same camera frame.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ModernInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-[13px] font-semibold text-[#101828]">
        {label}
      </Text>

      <View className="flex-row items-center rounded-[22px] bg-[#F6F8FB] px-4">
        <Ionicons name={icon} size={20} color="#98A2B3" />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#98A2B3"
          autoCapitalize="none"
          keyboardType={keyboardType}
          className="ml-3 flex-1 py-4 text-[15px] text-[#101828]"
        />
      </View>
    </View>
  );
}