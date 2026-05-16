import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function PremisesHomeScreen() {
  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-[#001C80] mb-3">
        Premises Check
      </Text>

      <Text className="text-base text-gray-600 mb-8">
        Use your phone as a premises camera for HireAI interviews or exams.
      </Text>

      <Pressable
        onPress={() => router.push("/premises/hireai")}
        className="bg-[#001C80] rounded-2xl px-5 py-4 mb-4"
      >
        <Text className="text-white text-center text-base font-semibold">
          HireAI Premises Check
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/premises/exam")}
        className="bg-orange-500 rounded-2xl px-5 py-4"
      >
        <Text className="text-white text-center text-base font-semibold">
          Exam Premises Check
        </Text>
      </Pressable>
    </View>
  );
}