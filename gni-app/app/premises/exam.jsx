import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "@/components/common/AppScreen";
import { COLORS } from "@/theme";

export default function ExamPremisesScreen() {
  return (
    <AppScreen
      bottomSpace={40}
      contentStyle={{
        paddingTop: 8,
      }}
    >
      <View className="mb-6">
        <Text className="text-[32px] font-bold leading-[40px] text-[#101828]">
          Exam{"\n"}Premises Check
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
          Scan the exam QR code for faster setup. The app will detect the
          attempt and premises session details automatically.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push("/premises/scan")}
        className="mb-7 rounded-[32px] bg-[#0F5EFF] p-6"
      >
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
          <Ionicons name="qr-code-outline" size={30} color={COLORS.white} />
        </View>

        <Text className="text-[24px] font-bold text-white">Scan Exam QR</Text>

        <Text className="mt-3 text-[14px] leading-6 text-blue-100">
          Recommended method. Opens the camera scanner and continues to premises
          validation after QR detection.
        </Text>

        <View className="mt-5 flex-row items-center">
          <Text className="mr-2 text-[14px] font-semibold text-white">
            Open scanner
          </Text>

          <Ionicons name="arrow-forward" size={17} color={COLORS.white} />
        </View>
      </Pressable>

      <View className="mt-auto rounded-[24px] bg-white p-5">
        <View className="flex-row items-start">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF]">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <Text className="flex-1 text-[13px] leading-6 text-[#667085]">
            During validation, keep the candidate and exam screen clearly
            visible in the same camera frame.
          </Text>
        </View>
      </View>
    </AppScreen>
  );
}