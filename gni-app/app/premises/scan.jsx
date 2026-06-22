import { useMemo, useState } from "react";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bootstrapExamPremises } from "../../src/services/premisesService";

export default function PremisesQRScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const frameSize = useMemo(() => {
    const base = Math.min(width * 0.72, height * 0.34);
    return Math.max(230, Math.min(base, 288));
  }, [width, height]);

  const handleScanned = async ({ data }) => {
    if (scanned) return;

    setScanned(true);

    try {
      let attempt = "";

      try {
        const parsed = JSON.parse(data);
        attempt = parsed.attempt || parsed.attemptId || "";
      } catch {
        const url = new URL(data);

        attempt =
          url.searchParams.get("attempt") ||
          url.searchParams.get("attemptId") ||
          "";
      }

      if (!attempt) {
        Alert.alert("Invalid QR", "QR must contain exam attempt ID.");
        setScanned(false);
        return;
      }

      const bootstrap = await bootstrapExamPremises(attempt);

      if (!bootstrap?.ok || !bootstrap?.room || !bootstrap?.session_id) {
        Alert.alert(
          "Invalid Exam Session",
          "Could not create premises session."
        );
        setScanned(false);
        return;
      }

      router.replace({
        pathname: "/premises/camera-validation",
        params: {
          mode: "exam",
          attempt,
          room: bootstrap.room,
          session_id: bootstrap.session_id,
        },
      });
    } catch (error) {
      Alert.alert(
        "QR Error",
        error?.message || "Could not read or bootstrap exam premises."
      );

      setScanned(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "#F6F8FB",
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-[28px] bg-[#EEF4FF]">
            <Ionicons name="camera-outline" size={34} color="#0F5EFF" />
          </View>

          <Text className="text-center text-[28px] font-bold text-[#101828]">
            Camera Permission Required
          </Text>

          <Text className="mt-4 text-center text-[15px] leading-7 text-[#667085]">
            Camera access is required to scan the exam QR code and start
            premises validation.
          </Text>

          <Pressable
            onPress={requestPermission}
            className="mt-8 rounded-[22px] bg-[#0F5EFF] px-8 py-4"
          >
            <Text className="text-[16px] font-semibold text-white">
              Allow Camera
            </Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="mt-5">
            <Text className="text-[14px] font-semibold text-[#667085]">
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        facing="back"
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleScanned}
      />

      <View className="absolute inset-0 bg-black/20" />

      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          top: insets.top + 8,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={22} color="#101828" />
          </Pressable>

          <View className="rounded-full bg-white px-4 py-2">
            <Text className="text-[12px] font-semibold text-[#101828]">
              QR Scanner
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: Math.max(insets.top + 96, height * 0.18),
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: frameSize,
            height: frameSize,
            borderRadius: 32,
            borderWidth: 4,
            borderColor: "rgba(255,255,255,0.9)",
          }}
        >
          <Corner position="topLeft" />
          <Corner position="topRight" />
          <Corner position="bottomLeft" />
          <Corner position="bottomRight" />
        </View>

        <Text className="mt-6 text-center text-[15px] font-semibold text-white">
          Place QR code inside the frame
        </Text>

        <Text className="mt-2 px-10 text-center text-[13px] leading-6 text-white/70">
          We will automatically detect the exam session and continue to
          premises validation.
        </Text>
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "white",
          borderTopLeftRadius: 34,
          borderTopRightRadius: 34,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="mb-5 flex-row items-start">
          <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF]">
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#0F5EFF"
            />
          </View>

          <View className="flex-1">
            <Text className="text-[16px] font-bold text-[#101828]">
              Secure QR Verification
            </Text>

            <Text className="mt-1 text-[13px] leading-6 text-[#667085]">
              Scan the QR shown on the exam screen to securely start the
              premises session.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setScanned(false)}
          disabled={!scanned}
          className={`rounded-[22px] px-5 py-4 ${
            scanned ? "bg-[#0F5EFF]" : "bg-[#D0D5DD]"
          }`}
        >
          <Text className="text-center text-[16px] font-semibold text-white">
            {scanned ? "Scan Again" : "Waiting for QR"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Corner({ position }) {
  const base = {
    position: "absolute",
    width: 48,
    height: 48,
    borderColor: "#0F5EFF",
  };

  const positions = {
    topLeft: {
      left: -4,
      top: -4,
      borderLeftWidth: 4,
      borderTopWidth: 4,
      borderTopLeftRadius: 32,
    },
    topRight: {
      right: -4,
      top: -4,
      borderRightWidth: 4,
      borderTopWidth: 4,
      borderTopRightRadius: 32,
    },
    bottomLeft: {
      left: -4,
      bottom: -4,
      borderLeftWidth: 4,
      borderBottomWidth: 4,
      borderBottomLeftRadius: 32,
    },
    bottomRight: {
      right: -4,
      bottom: -4,
      borderRightWidth: 4,
      borderBottomWidth: 4,
      borderBottomRightRadius: 32,
    },
  };

  return <View style={[base, positions[position]]} />;
}