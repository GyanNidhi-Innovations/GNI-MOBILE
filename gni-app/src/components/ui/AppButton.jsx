import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../theme";

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
    isDisabled
      ? COLORS.textMuted
      : variant === "secondary"
      ? COLORS.text
      : COLORS.white;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        width: "100%",
        minHeight: 56,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.xl,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        backgroundColor: isDisabled ? COLORS.border : backgroundColor,
        opacity: pressed && !isDisabled ? 0.88 : 1,

        ...(variant === "secondary"
          ? {
              borderWidth: 1,
              borderColor: COLORS.border,
            }
          : {}),

        ...style,
      })}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? COLORS.primary : COLORS.white} />
      ) : (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: TYPOGRAPHY.button,
            fontWeight: "600",
            color: textColor,
            textAlign: "center",
            ...textStyle,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}