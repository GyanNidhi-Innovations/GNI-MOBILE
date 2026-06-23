import { useRef, useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  validateHireAIPremises,
  validateExamPremises,
  uploadExamPremisesSegment,
  startExamPremisesMerge,
  getExamPremisesLiveStatus,
  uploadHireAIPremisesChunk,
  finalizeHireAIPremisesRecording,
} from "../../src/services/premisesService";

import { startHireAIPremisesLiveStream } from "../../src/services/premisesWebRTCService";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CameraValidationScreen() {
  const cameraRef = useRef(null);
  const recordingPromiseRef = useRef(null);
  const examStatusPollRef = useRef(null);
  const autoStopTriggeredRef = useRef(false);
  const hireAiRecordingPromiseRef = useRef(null);
  const hireAiAttemptIdRef = useRef(null);
  const hireAiLiveRef = useRef(null);
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUploadStatus, setRecordingUploadStatus] = useState("");
  const [cameraMode, setCameraMode] = useState("picture");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();

  const mode = String(params.mode || "");
  const room = String(params.room || "");
  const attempt = String(params.attempt || "");
  const sessionId = String(params.session_id || "");
  const examId = String(params.examId || params.exam_id || "");
  const email = String(params.email || "");
  const candidateId = String(params.candidate_id || "");

  const validationPassed = !!result?.validated;
  const { width: windowWidth } = useWindowDimensions();

  const cameraFrameWidth = Math.max(220, Math.min(280, windowWidth * 0.78));
  const cameraFrameHeight = cameraFrameWidth * 1.5;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const switchCameraMode = async (nextMode) => {
    setIsCameraReady(false);
    setCameraMode(nextMode);
    await wait(1500);
  };

  const handleValidate = async () => {
    try {
      if (!room) {
        Alert.alert("Missing room", "Premises room is missing.");
        return;
      }

      setLoading(true);
      setResult(null);
      setRecordingUploadStatus("");

      await switchCameraMode("picture");

      if (!cameraRef.current || !isCameraReady) {
        Alert.alert("Camera not ready", "Please wait and try again.");
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });

      const imageUri = photo?.uri;

      if (!imageUri) {
        Alert.alert("Capture failed", "Could not capture image.");
        return;
      }

      let data;

      if (mode === "hireai") {
        data = await validateHireAIPremises({ room, imageUri });
      } else if (mode === "exam") {
        if (!attempt) {
          Alert.alert("Missing attempt", "Exam attempt is missing.");
          return;
        }

        data = await validateExamPremises({ attempt, room, imageUri });
      } else {
        Alert.alert("Invalid mode", "Unknown premises mode.");
        return;
      }

      setResult(data);

      if (data?.validated) {
        Alert.alert("Validation Passed", "Premises camera position is valid.");

        if (mode === "exam") {
          await switchCameraMode("video");
          await handleStartRecording();
        }
        if (mode === "hireai") {
          await switchCameraMode("video");

          const live = await startHireAIPremisesLiveStream({
            room,
            candidateId,
          });
          console.log("Starting HireAI live stream", {
            room,
            candidateId,
          });
          console.log("HireAI live stream started");

          hireAiLiveRef.current = live;

          await handleStartHireAIRecording();
        }
      } else {
        Alert.alert(
          "Validation Failed",
          data?.verdict?.notes ||
            data?.verdict?.fail_reason ||
            "Please adjust the camera and try again.",
        );
      }
    } catch (error) {
      console.log("Validation error:", error);
      Alert.alert(
        "Validation Error",
        error?.response?.data?.detail || error?.message || "Validation failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const stopExamStatusPolling = () => {
    if (examStatusPollRef.current) {
      clearInterval(examStatusPollRef.current);
      examStatusPollRef.current = null;
    }
  };

  const startExamStatusPolling = () => {
    if (mode !== "exam") return;
    if (!examId || !email) {
      console.log("Live status polling skipped: missing examId/email", {
        examId,
        email,
      });
      return;
    }

    stopExamStatusPolling();

    examStatusPollRef.current = setInterval(async () => {
      try {
        if (autoStopTriggeredRef.current) return;

        const status = await getExamPremisesLiveStatus({
          examId,
          email,
        });

        console.log("Exam live status:", status);

        if (status?.submitted || status?.examStatus === "SUBMITTED") {
          autoStopTriggeredRef.current = true;
          setRecordingUploadStatus(
            "Exam submitted. Stopping premises recording automatically...",
          );
          await handleStopRecording(true);
        }
      } catch (error) {
        console.log("Exam status polling error:", error?.message || error);
      }
    }, 5000);
  };

  const handleStartRecording = async () => {
    try {
      if (isRecording) return;

      if (!cameraRef.current) {
        setRecordingUploadStatus("Camera not ready for recording.");
        return;
      }

      if (!isCameraReady) {
        setRecordingUploadStatus("Camera is still preparing for video.");
        return;
      }

      setIsRecording(true);
      setRecordingUploadStatus(
        "Premises recording started. Record for a few seconds, then stop.",
      );

      recordingPromiseRef.current = cameraRef.current.recordAsync({
        maxDuration: 3600,
      });
      autoStopTriggeredRef.current = false;
      startExamStatusPolling();
    } catch (error) {
      console.log("Start recording error:", error);
      setIsRecording(false);
      recordingPromiseRef.current = null;
      setRecordingUploadStatus(error?.message || "Failed to start recording.");
    }
  };

  const handleStartHireAIRecording = async () => {
    try {
      if (isRecording) return;

      if (!cameraRef.current) {
        setRecordingUploadStatus("Camera not ready.");
        return;
      }

      if (!isCameraReady) {
        setRecordingUploadStatus("Camera still preparing.");
        return;
      }

      const attemptId = `${candidateId || "candidate"}_${Date.now()}`;

      hireAiAttemptIdRef.current = attemptId;

      if (!microphonePermission?.granted) {
        const micResult = await requestMicrophonePermission();

        if (!micResult?.granted) {
          Alert.alert(
            "Microphone Permission Required",
            "Please allow microphone permission to record premises video.",
          );
          return;
        }
      }
      setIsRecording(true);

      setRecordingUploadStatus("HireAI premises recording started...");

      hireAiRecordingPromiseRef.current = cameraRef.current.recordAsync({
        maxDuration: 3600,
      });
    } catch (error) {
      console.log("HireAI recording start error:", error);

      setIsRecording(false);

      setRecordingUploadStatus(error?.message || "Failed to start recording.");
    }
  };

  const handleStopRecording = async (fromAutoStop = false) => {
    if (!isRecording) return;

    stopExamStatusPolling();

    if (!fromAutoStop) {
      autoStopTriggeredRef.current = true;
    }

    try {
      setRecordingUploadStatus("Stopping recording...");

      cameraRef.current?.stopRecording?.();

      const video = await recordingPromiseRef.current;

      if (!video?.uri) {
        setRecordingUploadStatus("No video file was created.");
        return;
      }

      setRecordingUploadStatus("Uploading premises recording...");

      await uploadExamPremisesSegment({
        attempt,
        room,
        sessionId,
        videoUri: video.uri,
        segmentIndex: 1,
      });

      setRecordingUploadStatus("Recording uploaded. Starting merge...");

      const mergeResponse = await startExamPremisesMerge({
        attempt,
        room,
        sessionId,
      });

      setRecordingUploadStatus(
        `Merge queued successfully. Job ID: ${mergeResponse?.job_id}`,
      );

      console.log("Merge response:", mergeResponse);
    } catch (error) {
      console.log("Stop/upload/merge error:", error);
      setRecordingUploadStatus(
        error?.response?.data?.detail ||
          error?.message ||
          "Recording upload failed.",
      );
    } finally {
      stopExamStatusPolling();
      setIsRecording(false);
      recordingPromiseRef.current = null;
    }
  };

  const handleStopHireAIRecording = async () => {
    if (!isRecording) return;

    try {
      setRecordingUploadStatus("Stopping HireAI recording...");

      cameraRef.current?.stopRecording?.();

      const video = await hireAiRecordingPromiseRef.current;

      if (!video?.uri) {
        setRecordingUploadStatus("No recording file generated.");
        return;
      }

      setRecordingUploadStatus("Uploading HireAI recording...");

      await uploadHireAIPremisesChunk({
        candidateId,
        attemptId: hireAiAttemptIdRef.current,
        videoUri: video.uri,
        chunkIndex: 1,
      });

      setRecordingUploadStatus("Finalizing HireAI premises video...");

      const result = await finalizeHireAIPremisesRecording({
        candidateId,
        attemptId: hireAiAttemptIdRef.current,
      });

      console.log("HireAI finalize result:", result);

      setRecordingUploadStatus(
        "HireAI premises recording uploaded successfully.",
      );
    } catch (error) {
      console.log("HireAI stop/upload error:", error);

      setRecordingUploadStatus(
        error?.response?.data?.detail ||
          error?.message ||
          "HireAI upload failed.",
      );
    } finally {
      try {
        hireAiLiveRef.current?.stop?.();
      } catch {}

      hireAiLiveRef.current = null;
      setIsRecording(false);
      hireAiRecordingPromiseRef.current = null;
    }
  };

  const handleBack = () => {
    if (isRecording) {
      if (mode === "exam") {
        handleStopRecording();
      }

      if (mode === "hireai") {
        handleStopHireAIRecording();
      }

      return;
    }

    router.back();
  };

  useEffect(() => {
    return () => {
      stopExamStatusPolling();

      try {
        hireAiLiveRef.current?.stop?.();
      } catch {}

      hireAiLiveRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        cameraRef.current?.stopRecording?.();
      } catch {}
    };
  }, []);

  if (!permission) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F8FB] px-6">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-[28px] bg-[#EEF4FF]">
          <Ionicons name="camera-outline" size={34} color="#0F5EFF" />
        </View>

        <Text className="text-center text-[30px] font-bold text-[#101828]">
          Camera Permission Required
        </Text>

        <Text className="mt-4 text-center text-[15px] leading-7 text-[#667085]">
          Camera access is required for premises validation and secure
          monitoring.
        </Text>

        <Pressable
          onPress={requestPermission}
          className="mt-8 rounded-[22px] bg-[#0F5EFF] px-8 py-4"
        >
          <Text className="text-[16px] font-semibold text-white">
            Allow Camera Access
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        key={cameraMode}
        ref={cameraRef}
        facing="back"
        mode={cameraMode}
        style={StyleSheet.absoluteFillObject}
        onCameraReady={() => {
          console.log("Camera ready:", cameraMode);
          setIsCameraReady(true);
        }}
      />

      {/* DARK OVERLAY */}

      <View className="absolute inset-0 bg-black/20" />

      {/* TOP HEADER */}

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
            onPress={handleBack}
            disabled={isRecording}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={22} color="#101828" />
          </Pressable>

          <View className="rounded-full bg-white px-4 py-2">
            <Text className="text-[12px] font-semibold text-[#101828]">
              {mode === "exam" ? "Exam Validation" : "HireAI Validation"}
            </Text>
          </View>
        </View>
      </View>

      {/* CAMERA FRAME */}

      <View className="absolute left-0 right-0 top-[18%] items-center">
        <View
          className="rounded-[36px] border-4 border-white/90"
          style={{
            width: cameraFrameWidth,
            height: cameraFrameHeight,
          }}
        >
          <View className="absolute -left-1 -top-1 h-14 w-14 rounded-tl-[36px] border-l-4 border-t-4 border-[#0F5EFF]" />

          <View className="absolute -right-1 -top-1 h-14 w-14 rounded-tr-[36px] border-r-4 border-t-4 border-[#0F5EFF]" />

          <View className="absolute -bottom-1 -left-1 h-14 w-14 rounded-bl-[36px] border-b-4 border-l-4 border-[#0F5EFF]" />

          <View className="absolute -bottom-1 -right-1 h-14 w-14 rounded-br-[36px] border-b-4 border-r-4 border-[#0F5EFF]" />
        </View>

        <Text className="mt-6 text-center text-[15px] font-semibold text-white">
          Align candidate and screen inside frame
        </Text>

        <Text className="mt-2 px-10 text-center text-[13px] leading-6 text-white/70">
          Keep the candidate and laptop/exam screen clearly visible for AI
          validation.
        </Text>
      </View>

      {/* BOTTOM SHEET */}

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
        {/* VALIDATION STATUS */}

        {result && (
          <View
            className={`mb-5 rounded-[24px] p-5 ${
              result.validated ? "bg-[#ECFDF3]" : "bg-[#FEF3F2]"
            }`}
          >
            <View className="flex-row items-start">
              <View
                className={`mr-4 h-12 w-12 items-center justify-center rounded-2xl ${
                  result.validated ? "bg-[#D1FADF]" : "bg-[#FEE4E2]"
                }`}
              >
                <Ionicons
                  name={result.validated ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={result.validated ? "#039855" : "#D92D20"}
                />
              </View>

              <View className="flex-1">
                <Text
                  className={`text-[16px] font-bold ${
                    result.validated ? "text-[#027A48]" : "text-[#B42318]"
                  }`}
                >
                  {result.validated ? "Validation Passed" : "Validation Failed"}
                </Text>

                <Text className="mt-2 text-[13px] leading-6 text-[#667085]">
                  {result?.verdict?.notes ||
                    result?.verdict?.fail_reason ||
                    "No notes available."}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* RECORDING STATUS */}

        {!!recordingUploadStatus && (
          <View className="mb-5 rounded-[22px] bg-[#F2F4F7] p-4">
            <Text className="text-[13px] leading-6 text-[#667085]">
              {recordingUploadStatus}
            </Text>
          </View>
        )}

        {/* MAIN ACTION */}

        <Pressable
          onPress={handleValidate}
          disabled={loading || isRecording}
          className={`rounded-[24px] px-5 py-4 ${
            loading || isRecording ? "bg-[#D0D5DD]" : "bg-[#0F5EFF]"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View className="flex-row items-center justify-center">
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />

              <Text className="ml-2 text-[16px] font-semibold text-white">
                Capture & Validate
              </Text>
            </View>
          )}
        </Pressable>

        {/* RECORDING BUTTON */}

        {validationPassed && (
          <Pressable
            onPress={() => {
              if (mode === "exam") {
                if (isRecording) {
                  handleStopRecording();
                } else {
                  handleStartRecording();
                }
              }

              if (mode === "hireai") {
                if (isRecording) {
                  handleStopHireAIRecording();
                } else {
                  handleStartHireAIRecording();
                }
              }
            }}
            className={`mt-4 rounded-[24px] px-5 py-4 ${
              isRecording ? "bg-[#D92D20]" : "bg-[#039855]"
            }`}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons
                name={isRecording ? "stop-circle-outline" : "videocam-outline"}
                size={20}
                color="#FFFFFF"
              />

              <Text className="ml-2 text-[16px] font-semibold text-white">
                {isRecording
                  ? "Stop & Upload Recording"
                  : "Start Premises Recording"}
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}
