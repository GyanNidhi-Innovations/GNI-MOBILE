import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PremisesHomeScreen() {
  return (
    <View className="flex-1 bg-[#F6F8FB] px-5 pt-8">
      {/* HEADER */}

      <View className="mb-10">
        <Text className="text-[34px] font-bold leading-[42px] text-[#101828]">
          Premises
          {"\n"}
          Verification
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
          Use your mobile device as a secure premises
          camera for exams and HireAI interviews.
        </Text>
      </View>

      {/* HERO CARD */}

      <View className="mb-8 overflow-hidden rounded-[32px] bg-[#0F5EFF] p-6">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] bg-white/20">
          <Ionicons
            name="shield-checkmark-outline"
            size={30}
            color="#FFFFFF"
          />
        </View>

        <Text className="text-[28px] font-bold leading-9 text-white">
          Smart Camera Validation
        </Text>

        <Text className="mt-4 text-[15px] leading-7 text-blue-100">
          AI powered room verification with secure
          monitoring and automated validation.
        </Text>
      </View>

      {/* OPTIONS */}

      <View className="flex-1">
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

      {/* FOOTER */}

      <View className="pb-10">
        <Text className="text-center text-[12px] leading-5 text-[#98A2B3]">
          Ensure candidate and laptop screen are
          visible clearly before validation.
        </Text>
      </View>
    </View>
  );
}

function PremisesOptionCard({
  title,
  subtitle,
  icon,
  onPress,
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 rounded-[30px] bg-white p-6"
    >
      <View className="flex-row items-center">
        <View className="mr-5 h-16 w-16 items-center justify-center rounded-[24px] bg-[#EEF4FF]">
          <Ionicons
            name={icon}
            size={28}
            color="#0F5EFF"
          />
        </View>

        <View className="flex-1">
          <Text className="text-[20px] font-bold text-[#101828]">
            {title}
          </Text>

          <Text className="mt-2 text-[14px] leading-6 text-[#667085]">
            {subtitle}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#98A2B3"
        />
      </View>
    </Pressable>
  );
}