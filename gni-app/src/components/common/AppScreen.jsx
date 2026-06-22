import { KeyboardAvoidingView, Platform, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { COLORS, SPACING } from "../../theme";

export default function AppScreen({
  children,
  scroll = true,
  backgroundColor = COLORS.background,
  contentStyle = {},
  keyboardOffset = 0,
  centered = false,
  maxWidth = 520,
  bottomSpace = 130,
}) {
  const insets = useSafeAreaInsets();

  const ContentWrapper = scroll ? KeyboardAwareScrollView : View;

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ContentWrapper
          {...(scroll
            ? {
                enableOnAndroid: true,
                extraScrollHeight: 40,
                keyboardShouldPersistTaps: "handled",
                showsVerticalScrollIndicator: false,
                contentContainerStyle: {
                  flexGrow: 1,
                  paddingHorizontal: SPACING.lg,
                  paddingTop: SPACING.md,
                  paddingBottom: bottomSpace + insets.bottom,
                  justifyContent: centered ? "center" : "flex-start",
                  ...contentStyle,
                },
              }
            : {})}
          style={!scroll ? { flex: 1 } : undefined}
        >
          <View
            style={{
              width: "100%",
              maxWidth,
              alignSelf: "center",
              flex: scroll && centered ? 0 : undefined,
            }}
          >
            {children}
          </View>
        </ContentWrapper>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}