import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../theme";

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  rightText,
  onRightPress,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType = "done",
  blurOnSubmit,
  onSubmitEditing,
  multiline = false,
  style = {},
  inputStyle = {},
}) {
  return (
    <View style={{ width: "100%", marginBottom: SPACING.xl, ...style }}>
      {label ? (
        <Text
          numberOfLines={1}
          style={{
            marginBottom: SPACING.sm,
            fontSize: TYPOGRAPHY.tiny,
            fontWeight: "600",
            color: COLORS.text,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          width: "100%",
          minHeight: multiline ? 112 : 56,
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.inputBackground,
          paddingHorizontal: SPACING.lg,
        }}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={COLORS.icon}
            style={{
              marginTop: multiline ? SPACING.lg : 0,
              flexShrink: 0,
            }}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={onSubmitEditing}
          multiline={multiline}
          style={{
            flex: 1,
            minWidth: 0,
            marginLeft: icon ? SPACING.md : 0,
            paddingVertical: multiline ? SPACING.md : 0,
            fontSize: 15,
            color: COLORS.text,
            minHeight: multiline ? 96 : 54,
            textAlignVertical: multiline ? "top" : "center",
            ...inputStyle,
          }}
        />

        {rightText ? (
          <Pressable
            hitSlop={10}
            onPress={onRightPress}
            style={{
              marginLeft: SPACING.sm,
              alignSelf: multiline ? "flex-start" : "center",
              marginTop: multiline ? SPACING.lg : 0,
              flexShrink: 0,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontSize: TYPOGRAPHY.tiny,
                fontWeight: "600",
                color: COLORS.primary,
              }}
            >
              {rightText}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}