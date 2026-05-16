import { useRef, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { View, Text, Pressable, ActivityIndicator, Alert, StyleSheet } from "react-native";
import {
  validateHireAIPremises,
  validateExamPremises,
} from "../../src/services/premisesService";

export default function CameraValidationScreen() {
  const cameraRef = useRef(null);
  const params = useLocalSearchParams();

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const mode = String(params.mode || "");
  const room = String(params.room || "");
  const attempt = String(params.attempt || "");

  const handleValidate = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert("Camera not ready", "Please wait for camera to load.");
        return;
      }

      if (!room) {
        Alert.alert("Missing room", "Premises room is missing.");
        return;
      }

      setLoading(true);
      setResult(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      const imageUri = photo?.uri;

      if (!imageUri) {
        Alert.alert("Capture failed", "Could not capture image.");
        return;
      }

      let data;

      if (mode === "hireai") {
        data = await validateHireAIPremises({
          room,
          imageUri,
        });
      } else if (mode === "exam") {
        if (!attempt) {
          Alert.alert("Missing attempt", "Exam attempt is missing.");
          return;
        }

        data = await validateExamPremises({
          attempt,
          room,
          imageUri,
        });
      } else {
        Alert.alert("Invalid mode", "Unknown premises mode.");
        return;
      }

      setResult(data);

      if (data?.validated) {
        Alert.alert("Validation Passed", "Premises camera position is valid.");
      } else {
        Alert.alert(
          "Validation Failed",
          data?.verdict?.notes ||
            data?.verdict?.fail_reason ||
            "Please adjust the camera and try again.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Validation Error",
        error?.response?.data?.detail || error.message || "Validation failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-2xl font-bold text-[#001C80] mb-3">
          Camera Permission Required
        </Text>

        <Text className="text-base text-gray-600 text-center mb-6">
          Camera access is required to validate the premises setup.
        </Text>

        <Pressable
          onPress={requestPermission}
          className="bg-[#001C80] rounded-2xl px-6 py-4"
        >
          <Text className="text-white font-semibold">Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
  ref={cameraRef}
  facing="back"
  style={StyleSheet.absoluteFillObject}
/>

      <View className="absolute top-12 left-5 right-5 bg-black/60 rounded-2xl p-4">
        <Text className="text-white text-lg font-bold mb-1">
          Premises Validation
        </Text>
        <Text className="text-white/80 text-sm">
          Keep both candidate and laptop/exam screen visible in the same frame.
        </Text>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5">
        {result && (
          <View className="mb-4">
            <Text
              className={`text-base font-bold ${
                result.validated ? "text-green-700" : "text-red-600"
              }`}
            >
              {result.validated ? "Validation Passed" : "Validation Failed"}
            </Text>

            <Text className="text-gray-600 mt-1">
              {result?.verdict?.notes ||
                result?.verdict?.fail_reason ||
                "No notes available."}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleValidate}
          disabled={loading}
          className={`rounded-2xl px-5 py-4 ${
            loading ? "bg-gray-400" : "bg-[#001C80]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center text-base font-semibold">
              Capture & Validate
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="mt-3 rounded-2xl px-5 py-4 border border-gray-300"
        >
          <Text className="text-center text-base font-semibold text-gray-700">
            Back
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
