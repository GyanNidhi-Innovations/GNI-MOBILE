import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function TermsAndConditionsScreen() {
  const insets =
    useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity:
                pressed ? 0.65 : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#526B93"
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 2,
          paddingBottom:
            40 + insets.bottom,
        }}
      >
        <Text style={styles.title}>
          Terms and Conditions
        </Text>


        <Section
          title="1. Purpose"
          text="The GyanNidhi mobile application provides users with access to educational information, career opportunities, events, notifications, examination-related services, professional-development resources, and other services offered by GyanNidhi Innovations."
        />

        <Section
          title="2. Acceptance of terms"
          text="By creating an account, accessing the application, or using any GyanNidhi service, you confirm that you have read, understood, and agreed to these Terms and Conditions and the Privacy Policy."
        />

        <Section
          title="3. Account registration"
          text="You must provide accurate, current, and complete information while registering. You are responsible for maintaining the confidentiality of your password and for all activities conducted through your account."
        />

        <Section
          title="4. Permitted use"
          text="The application must be used only for lawful educational, professional, career-development, examination, recruitment, event, and related purposes. Your account is intended for your personal use and must not be shared with another person."
        />

        <Section
          title="5. Prohibited conduct"
          text="You must not misuse the application, impersonate another person, submit false information, attempt unauthorised access, interfere with the application, distribute malicious code, copy protected content without permission, abuse notification or event services, or use the platform for any unlawful activity."
        />

        <Section
          title="6. Educational and employment information"
          text="GyanNidhi may display opportunities, events, courses, examinations, hiring drives. "
        />

        <Section
          title="7. Events and third-party links"
          text="Events may contain external registration links, Google Forms, Zoom links, employer pages, or other third-party services. Those services are governed by their own terms and privacy practices. GyanNidhi is not responsible for the availability or conduct of an independent third-party service."
        />

        <Section
          title="8. Notifications"
          text="You may receive service, event, course, examination, opportunity, reminder, security, and account-related notifications. Device-level notification permission may be managed through your mobile operating-system settings."
        />

        <Section
          title="9. User content and documents"
          text="When you upload a resume, profile information you confirm that you have the right to provide it and that it does not violate another person's rights or applicable law."
        />

        <Section
          title="10. Examination and validation features"
          text="Where examination, interview, premises-validation, camera, audio, image, or video functionality is used, you must follow the displayed instructions and provide the required permissions. Misrepresentation, interference, or attempted circumvention may result in termination of the relevant session or account."
        />

        <Section
          title="11. Intellectual property"
          text="The application, branding, software, design, text, graphics, and other materials owned by GyanNidhi Innovations may not be copied, modified, distributed, reverse engineered, or commercially exploited without written permission."
        />

        <Section
          title="12. Suspension and termination"
          text="GyanNidhi may restrict, suspend, or terminate access where an account violates these terms, threatens platform security, infringes another person's rights, is used fraudulently, or where suspension is required by law."
        />

        <Section
          title="13. Availability and changes"
          text="Features may be added, modified, suspended, or removed. GyanNidhi does not guarantee uninterrupted or error-free availability, although reasonable efforts will be made to maintain the service."
        />

        <Section
          title="14. Contact"
          text="Questions regarding these terms may be sent to support@gyannidhi.in or to the official contact address published by GyanNidhi Innovations."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  text,
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.body}>
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        "#FFFFFF",
    },

    header: {
      height: 72,
      justifyContent:
        "center",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#EAECF0",
      backgroundColor:
        "#FFFFFF",
    },

    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 14,
    },

    title: {
      color: "#101828",
      fontSize: 31,
      lineHeight: 39,
      fontWeight: "800",
    },

    updated: {
      marginTop: 8,
      marginBottom: 10,
      color: "#667085",
      fontSize: 13,
      lineHeight: 20,
    },

    section: {
      marginTop: 28,
    },

    sectionTitle: {
      color: "#344054",
      fontSize: 17,
      lineHeight: 25,
      fontWeight: "800",
    },

    body: {
      marginTop: 10,
      color: "#475467",
      fontSize: 16,
      lineHeight: 26,
    },
  });