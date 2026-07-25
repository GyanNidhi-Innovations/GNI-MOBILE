import { View, Text } from "react-native";

import { useResponsive } from "@/hooks/useResponsive";

export default function ScreenHeader({
  title,
  subtitle,
  compact = false,
  style,
}) {
  const {
    isCompactPhone,
    type,
  } = useResponsive();

  return (
    <View
      style={[
        {
          marginBottom: compact
            ? 18
            : isCompactPhone
              ? 20
              : 24,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#101828",
          fontSize: type.pageTitle,
          lineHeight: type.pageTitle + 7,
          fontWeight: "800",
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            marginTop: 8,
            color: "#667085",
            fontSize: type.body,
            lineHeight: type.body + 9,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
