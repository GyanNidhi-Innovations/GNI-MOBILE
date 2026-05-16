import { useState } from "react";
import { router } from "expo-router";
import { View, Text, TextInput, Pressable, Alert } from "react-native";

export default function ExamPremisesScreen() {
  const [attempt, setAttempt] = useState("");
  const [room, setRoom] = useState("");
  const [sessionId, setSessionId] = useState("");

  const handleContinue = () => {
    if (!attempt.trim() || !room.trim() || !sessionId.trim()) {
      Alert.alert(
        "Required",
        "Please enter attempt, room, and session ID. QR scanner will be added after manual flow works."
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
      },
    });
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-[#001C80] mb-3">
        Exam Premises Check
      </Text>

      <Text className="text-base text-gray-600 mb-6">
        For now, enter QR values manually. We will add QR scanner after validation works.
      </Text>

      <TextInput
        value={attempt}
        onChangeText={setAttempt}
        placeholder="Attempt ID"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        className="border border-gray-300 rounded-2xl px-4 py-4 text-base mb-4 text-black bg-white"
      />
      
      <TextInput
        value={room}
        onChangeText={setRoom}
        placeholder="Room, e.g. premises-xxxx-prem"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        className="border border-gray-300 rounded-2xl px-4 py-4 text-base mb-4 text-black bg-white"
      />
      
      <TextInput
        value={sessionId}
        onChangeText={setSessionId}
        placeholder="Session ID"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        className="border border-gray-300 rounded-2xl px-4 py-4 text-base mb-5 text-black bg-white"
      />

      <Pressable
        onPress={handleContinue}
        className="bg-orange-500 rounded-2xl px-5 py-4"
      >
        <Text className="text-white text-center text-base font-semibold">
          Continue to Camera
        </Text>
      </Pressable>
    </View>
  );
}