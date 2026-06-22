import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import AppScreen from "@/components/common/AppScreen";
import { COLORS } from "@/theme";

export default function PremisesHomeScreen() {
  return (
    <AppScreen
      bottomSpace={40}
      contentStyle={{
        paddingTop: 8,
      }}
    >
      <View className="mb-7">
        <Text className="text-[32px] font-bold leading-[40px] text-[#101828]">
          Premises{"\n"}Verification
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
          Use your mobile device as a secure premises camera for exams and
          HireAI interviews.
        </Text>
      </View>

      <View className="mb-8 overflow-hidden rounded-[32px] bg-[#0F5EFF] p-6">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color={COLORS.white}
          />
        </View>

        <Text className="text-[26px] font-bold leading-9 text-white">
          Smart Camera Validation
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-blue-100">
          AI powered room verification with secure monitoring and automated
          validation.
        </Text>
      </View>

      <View>
        <PremisesOptionCard
          title="HireAI Interview"
          subtitle="Validate candidate interview setup"
          icon="person-outline"
          onPress={() => router.push("/premises/hireai")}
        />

        <PremisesOptionCard
          title="Exam Validation"
          subtitle="Start exam premises verification"
          icon="document-text-outline"
          onPress={() => router.push("/premises/exam")}
        />
      </View>

      <View className="mt-auto pt-4">
        <Text className="text-center text-[12px] leading-5 text-[#98A2B3]">
          Ensure candidate and laptop screen are visible clearly before
          validation.
        </Text>
      </View>
    </AppScreen>
  );
}

function PremisesOptionCard({ title, subtitle, icon, onPress }) {
  return (
    <Pressable onPress={onPress} className="mb-5 rounded-[30px] bg-white p-6">
      <View className="flex-row items-center">
        <View className="mr-5 h-14 w-14 items-center justify-center rounded-[22px] bg-[#EEF4FF]">
          <Ionicons name={icon} size={26} color={COLORS.primary} />
        </View>

        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-[18px] font-bold text-[#101828]"
          >
            {title}
          </Text>

          <Text
            numberOfLines={2}
            className="mt-2 text-[14px] leading-6 text-[#667085]"
          >
            {subtitle}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#98A2B3" />
      </View>
    </Pressable>
  );
}