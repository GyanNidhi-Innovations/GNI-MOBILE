import { KeyboardAvoidingView, Platform, View,  RefreshControl,ScrollView, } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { COLORS, SPACING } from "../../theme";


export default function AppScreen({
  children,
  scroll = true,
  keyboardAware = true,
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

const ContentWrapper =
  scroll
    ? keyboardAware
      ? KeyboardAwareScrollView
      : ScrollView
    : View;

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
  behavior={
    Platform.OS === "ios"
      ? "padding"
      : "height"
  }
  keyboardVerticalOffset={keyboardOffset}
>
       <ContentWrapper
  {...(scroll
    ? {

      ...(keyboardAware
        ? {
            enableOnAndroid:true,
            extraScrollHeight:12,
          }
        : {}),

        refreshControl: onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        ) : undefined,
        keyboardShouldPersistTaps:
          "handled",
        showsVerticalScrollIndicator:
          false,
        contentContainerStyle: {
          flexGrow: 1,
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom:
            bottomSpace + insets.bottom,
          justifyContent:
            centered
              ? "center"
              : "flex-start",
          ...contentStyle,
        },
      }
    : {})}
 style={{
  flex: 1,

  ...(!scroll
    ? {
        justifyContent:
          centered
            ? "center"
            : "flex-start",
      }
    : {}),
}}
>
  <View
    style={{
      width: "100%",
      maxWidth,
      alignSelf: "center",

     alignItems:
  centered
    ? "center"
    : undefined,

      flex:
        scroll && centered
          ? 0
          : undefined,
    }}
  >
            {children}
          </View>
        </ContentWrapper>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}