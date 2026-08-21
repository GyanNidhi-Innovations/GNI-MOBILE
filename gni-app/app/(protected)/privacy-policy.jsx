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

export default function PrivacyPolicyScreen() {
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
          Privacy Policy
        </Text>

        <Section
          title="1. Introduction"
          text="GyanNidhi Innovations respects your privacy. This Privacy Policy explains what personal information is collected through the GyanNidhi mobile application and related services, why it is processed, how it may be shared, how it is protected, and the choices available to you."
        />

        <Section
          title="2. Information you provide"
          text="Depending on your account type, we may collect your name, email address, phone number, password, college, year of study, joining year, branch, degree, pass-out year, current company, current role, years of experience, skills, career information, resume, and information submitted through support or registration forms."
        />

        <Section
          title="3. Device and technical information"
          text="We may process your user ID, installation ID, mobile platform, device name, login and session records, application errors and security logs."
        />



        <Section
          title="4. How information is used"
          text="We use information to create and manage accounts, authenticate users, maintain profiles, deliver events and opportunities, send notifications, process resumes and interviews, provide customer support, prevent fraud, secure the platform, comply with legal requirements, and improve application reliability."
        />


        <Section
          title="5. Third-party links"
          text="The application may contain links to Google Forms, Zoom, employer websites, event organisers. "
        />

        <Section
          title="6. Information security"
          text="We use administrative, technical, and organisational safeguards intended to protect personal information."
        />

        <Section
          title="7. Data retention"
          text="Information is retained only for as long as necessary for the purposes described in this policy, legal obligations, dispute resolution, security, and enforcement. Different categories, including profiles, resumes may have different retention periods."
        />

        <Section
          title="8. Your choices and rights"
          text="Subject to applicable law, you may request access, correction, updating, withdrawal of consent, deletion, or grievance redressal. Some information may need to be retained where required by law or for legitimate security and dispute-resolution purposes."
        />

        <Section
          title="9. Account deletion"
          text="Users may request deletion of their GyanNidhi account and associated personal information through the account-deletion facility or the published support channel. Logout does not delete an account."
        />

       
        <Section
          title="10. Contact"
          text="Privacy questions, correction requests, deletion requests, and complaints may be sent to support@gyannidhi.in"
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