import { KeyboardAvoidingView, Platform, View,  RefreshControl, } from "react-native";
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
  bottomSpace = 0,
  refreshing = false,
  onRefresh,
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
        behavior={Platform.OS === "ios" ? "padding" : "undefined"}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ContentWrapper
          {...(scroll
            ? {
                enableOnAndroid: true,
                refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        ) : undefined,
                extraScrollHeight: 12,
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