import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
} from "../../theme";

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
    <View style={{ marginBottom: SPACING.xl, ...style }}>
      {label ? (
        <Text
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
            style={{ marginTop: multiline ? SPACING.lg : 0 }}
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
            marginLeft: icon ? SPACING.md : 0,
            paddingVertical: SPACING.lg,
            fontSize: 15,
            color: COLORS.text,
            minHeight: multiline ? 90 : undefined,
            textAlignVertical: multiline ? "top" : "center",
            ...inputStyle,
          }}
        />

        {rightText ? (
          <Pressable hitSlop={10} onPress={onRightPress}>
            <Text
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