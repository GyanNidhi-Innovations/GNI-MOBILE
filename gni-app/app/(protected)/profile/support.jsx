import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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

const SUPPORT_EMAIL =
  "support@gyannidhi.in";

const PRIVACY_EMAIL =
  "support@gyannidhi.in";

const GRIEVANCE_EMAIL =
  "grievance@gyannidhi.in";

/*
 * Replace with your real
 * support number.
 */
const SUPPORT_PHONE =
  "+91 7396746464";

const WEBSITE_URL =
  "https://www.gyannidhi.in/";

const SUPPORT_HOURS =
  "Monday to Saturday, 8:00 AM to 4:30 PM IST";

/*
 * Replace with your real
 * office address.
 */
const OFFICE_ADDRESS =
  "Plot No 58, 1st Floor, P & T Colony, Trimulgherry, Secunderabad, Hyderabad, Telangana - 500015";

// async function openUrl(
//   url,
//   failureMessage,
// ) {
//   try {
//     const supported =
//       await Linking.canOpenURL(
//         url,
//       );

//     if (!supported) {
//       Alert.alert(
//         "Unable to open",
//         failureMessage,
//       );

//       return;
//     }

//     await Linking.openURL(
//       url,
//     );
//   } catch (error) {
//     console.log(
//       "Support link error:",
//       error?.message ||
//         error,
//     );

//     Alert.alert(
//       "Unable to open",
//       failureMessage,
//     );
//   }
// }

export default function SupportScreen() {
  const {
    width,
  } = useWindowDimensions();

  const isSmallPhone =
    width < 375;

  const insets =
    useSafeAreaInsets();

  // const openSupportEmail =
  //   () => {
  //     const subject =
  //       encodeURIComponent(
  //         "GyanNidhi Mobile App Support",
  //       );

  //     const body =
  //       encodeURIComponent(
  //         [
  //           "Hello GyanNidhi Support,",
  //           "",
  //           "I need help with:",
  //           "",
  //           "Registered email:",
  //           "Phone number:",
  //           "Issue description:",
  //           "",
  //           "Regards,",
  //         ].join("\n"),
  //       );

  //     openUrl(
  //       `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,

  //       `Please email us at ${SUPPORT_EMAIL}.`,
  //     );
  //   };

  // const openPrivacyEmail =
  //   () => {
  //     const subject =
  //       encodeURIComponent(
  //         "Privacy or Data Request",
  //       );

  //     openUrl(
  //       `mailto:${PRIVACY_EMAIL}?subject=${subject}`,

  //       `Please email us at ${PRIVACY_EMAIL}.`,
  //     );
  //   };

  // const openGrievanceEmail =
  //   () => {
  //     const subject =
  //       encodeURIComponent(
  //         "Grievance Submission",
  //       );

  //     openUrl(
  //       `mailto:${GRIEVANCE_EMAIL}?subject=${subject}`,

  //       `Please email us at ${GRIEVANCE_EMAIL}.`,
  //     );
  //   };

  // const callSupport =
  //   () => {
  //     const cleanPhone =
  //       SUPPORT_PHONE.replace(
  //         /[^\d+]/g,
  //         "",
  //       );

  //     openUrl(
  //       `tel:${cleanPhone}`,

  //       `Please call us at ${SUPPORT_PHONE}.`,
  //     );
  //   };

  // const openWebsite =
  //   () => {
  //     openUrl(
  //       WEBSITE_URL,

  //       `Please visit ${WEBSITE_URL}.`,
  //     );
  //   };

  return (
    <SafeAreaView
      edges={["top"]}
      style={
        styles.safeArea
      }
    >
      <View
        style={[
          styles.header,

          {
            minHeight:
              isSmallPhone
                ? 58
                : 66,

            paddingHorizontal:
              isSmallPhone
                ? 10
                : 14,
          },
        ]}
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={12}
          style={({
            pressed,
          }) => [
            styles.backButton,

            {
              width:
                isSmallPhone
                  ? 39
                  : 44,

              height:
                isSmallPhone
                  ? 39
                  : 44,

              opacity:
                pressed
                  ? 0.65
                  : 1,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={
              isSmallPhone
                ? 23
                : 26
            }
            color="#101828"
          />
        </Pressable>

        <Text
          style={[
            styles.headerTitle,

            {
              fontSize:
                isSmallPhone
                  ? 16
                  : 18,
            },
          ]}
        >
          Help & Support
        </Text>

        <View
          style={{
            width:
              isSmallPhone
                ? 39
                : 44,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingHorizontal:
            isSmallPhone
              ? 13
              : 18,

          paddingTop:
            isSmallPhone
              ? 15
              : 22,

          paddingBottom:
            40 +
            insets.bottom,
        }}
      >
        <View
          style={[
            styles.heroCard,

            {
              borderRadius:
                isSmallPhone
                  ? 19
                  : 24,

              paddingHorizontal:
                isSmallPhone
                  ? 17
                  : 22,

              paddingVertical:
                isSmallPhone
                  ? 21
                  : 28,
            },
          ]}
        >
          <View
            style={[
              styles.heroIcon,

              {
                width:
                  isSmallPhone
                    ? 50
                    : 60,

                height:
                  isSmallPhone
                    ? 50
                    : 60,

                borderRadius:
                  isSmallPhone
                    ? 16
                    : 20,
              },
            ]}
          >
            <Ionicons
              name="headset-outline"
              size={
                isSmallPhone
                  ? 25
                  : 30
              }
              color="#001B3D"
            />
          </View>

          <Text
            style={[
              styles.heroTitle,

              {
                marginTop:
                  isSmallPhone
                    ? 13
                    : 17,

                fontSize:
                  isSmallPhone
                    ? 20
                    : 24,

                lineHeight:
                  isSmallPhone
                    ? 27
                    : 31,
              },
            ]}
          >
            How can we help?
          </Text>

          <Text
            style={[
              styles.heroBody,

              {
                fontSize:
                  isSmallPhone
                    ? 12.5
                    : 14,

                lineHeight:
                  isSmallPhone
                    ? 19
                    : 22,
              },
            ]}
          >
            Contact GyanNidhi
            Innovations for account,
            registration, notification,
            event, profile, examination,
            or technical support.
          </Text>
        </View>

        <SectionTitle
          small={
            isSmallPhone
          }
        >
          Contact Support
        </SectionTitle>

        <View
          style={[
            styles.card,

            {
              borderRadius:
                isSmallPhone
                  ? 18
                  : 22,

              paddingHorizontal:
                isSmallPhone
                  ? 13
                  : 16,
            },
          ]}
        >
          <ContactInfoRow
  title="Email Support"
  value={SUPPORT_EMAIL}
  small={isSmallPhone}
/>

<Divider />

<ContactInfoRow
  title="Call Support"
  value={SUPPORT_PHONE}
  small={isSmallPhone}
/>

<Divider />

<ContactInfoRow
  title="Website"
  value={WEBSITE_URL}
  small={isSmallPhone}
/>
        </View>

        <SectionTitle
          small={
            isSmallPhone
          }
        >
          Privacy and Complaints
        </SectionTitle>

        <View
          style={[
            styles.card,

            {
              borderRadius:
                isSmallPhone
                  ? 18
                  : 22,

              paddingHorizontal:
                isSmallPhone
                  ? 13
                  : 16,
            },
          ]}
        >
          <ContactInfoRow
  title="Privacy Requests"
  value={PRIVACY_EMAIL}
  small={isSmallPhone}
/>

<Divider />

{/* <ContactInfoRow
  title="Grievance Contact"
  value={GRIEVANCE_EMAIL}
  small={isSmallPhone}
/> */}
        </View>

        <SectionTitle
          small={
            isSmallPhone
          }
        >
          Company Information
        </SectionTitle>

        <View
          style={[
            styles.card,

            {
              borderRadius:
                isSmallPhone
                  ? 18
                  : 22,

              paddingHorizontal:
                isSmallPhone
                  ? 13
                  : 16,
            },
          ]}
        >
          <ContactInfoRow
  title="Support Hours"
  value={SUPPORT_HOURS}
  small={isSmallPhone}
/>

<Divider />

<ContactInfoRow
  title="Office Address"
  value={OFFICE_ADDRESS}
  small={isSmallPhone}
/>
        </View>

        <View
          style={[
            styles.responseCard,

            {
              borderRadius:
                isSmallPhone
                  ? 15
                  : 18,

              padding:
                isSmallPhone
                  ? 13
                  : 16,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={
              isSmallPhone
                ? 19
                : 22
            }
            color="#175CD3"
          />

          <Text
            style={[
              styles.responseText,

              {
                marginLeft:
                  isSmallPhone
                    ? 8
                    : 10,

                fontSize:
                  isSmallPhone
                    ? 12
                    : 13,

                lineHeight:
                  isSmallPhone
                    ? 18
                    : 20,
              },
            ]}
          >
            Include your registered
            email, phone number, and a
            clear description of the
            issue.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  children,
  small,
}) {
  return (
    <Text
      style={[
        styles.sectionTitle,

        {
          marginTop:
            small
              ? 21
              : 27,

          marginBottom:
            small
              ? 8
              : 11,

          fontSize:
            small
              ? 16
              : 18,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function ContactInfoRow({
  title,
  value,
  small,
}) {
  return (
    <View
      style={{
        width: "100%",

        minHeight:
          small ? 60 : 70,

        justifyContent: "center",

        paddingVertical:
          small ? 10 : 12,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: "#101828",

          fontSize:
            small ? 14 : 16,

          lineHeight:
            small ? 19 : 22,

          fontWeight: "700",
        }}
      >
        {title}
      </Text>

      <Text
        selectable
        style={{
          marginTop: 4,

          color: "#667085",

          fontSize:
            small ? 12 : 13,

          lineHeight:
            small ? 17 : 19,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return (
    <View
      style={{
        height: 1,

        marginLeft: 40,

        backgroundColor:
          "#EAECF0",
      }}
    />
  );
}
const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        "#F8FAFC",
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      borderBottomWidth: 1,

      borderBottomColor:
        "#EAECF0",

      backgroundColor:
        "#FFFFFF",
    },

    backButton: {
      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius: 13,

      backgroundColor:
        "#F2F4F7",
    },

    headerTitle: {
      color:
        "#101828",

      fontWeight:
        "800",
    },

    heroCard: {
      alignItems:
        "center",

      backgroundColor:
        "#001B3D",
    },

    heroIcon: {
      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",
    },

    heroTitle: {
      color:
        "#FFFFFF",

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    heroBody: {
      marginTop: 9,

      color:
        "#D0DCE8",

      textAlign:
        "center",
    },

    sectionTitle: {
      color:
        "#101828",

      fontWeight:
        "800",
    },

    card: {
      overflow:
        "hidden",

      borderWidth: 1,

      borderColor:
        "#EAECF0",

      backgroundColor:
        "#FFFFFF",
    },

    row: {
      flexDirection:
        "row",

      alignItems:
        "center",
    },

    rowContent: {
      flex: 1,

      paddingRight: 8,
    },

    rowTitle: {
      color:
        "#101828",

      fontWeight:
        "700",
    },

    rowValue: {
      color:
        "#667085",
    },

    divider: {
      height: 1,

      backgroundColor:
        "#EAECF0",
    },

    responseCard: {
      marginTop: 22,

      flexDirection:
        "row",

      alignItems:
        "flex-start",

      borderWidth: 1,

      borderColor:
        "#B2CCFF",

      backgroundColor:
        "#EFF8FF",
    },

    responseText: {
      flex: 1,

      color:
        "#344054",
    },

    legalRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      borderWidth: 1,

      borderColor:
        "#EAECF0",

      backgroundColor:
        "#FFFFFF",
    },
  });