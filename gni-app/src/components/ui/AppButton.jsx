import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";

import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
} from "../../theme";

export default function AppButton({
  title,

  onPress,

  loading = false,

  disabled = false,

  variant = "primary",

  style = {},

  textStyle = {},
}) {
  const isDisabled = loading || disabled;

  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "secondary"
      ? COLORS.surface
      : COLORS.border;

  const textColor =
    variant === "secondary"
      ? COLORS.text
      : COLORS.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={{
        alignItems: "center",
        justifyContent: "center",

        borderRadius: RADIUS.xl,

        paddingVertical: SPACING.lg,

        backgroundColor: isDisabled
          ? COLORS.border
          : backgroundColor,

        ...(variant === "secondary"
          ? {
              borderWidth: 1,
              borderColor: COLORS.border,
            }
          : {}),

        ...style,
      }}
    >
      {loading ? (
        <ActivityIndicator
          color={COLORS.white}
        />
      ) : (
        <Text
          style={{
            fontSize:
              TYPOGRAPHY.button,

            fontWeight: "600",

            color: textColor,

            ...textStyle,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}