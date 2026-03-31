import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { signupUserApi } from "../../services/authService";

export default function SignupScreen() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // 🔹 Validation functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  };

  const handleSignup = async () => {
    const { fullName, email, mobile, password, confirmPassword } = form;

    // Required fields
    if (!fullName || !email || !password) {
      Alert.alert("Validation", "Full name, email and password are required");
      return;
    }

    // Name validation
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      Alert.alert("Validation", "Name should contain only letters");
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      Alert.alert("Validation", "Enter a valid email");
      return;
    }

    // Phone validation
    if (mobile && mobile.length !== 10) {
      Alert.alert("Validation", "Phone must be 10 digits");
      return;
    }

    // Password validation
    if (!validatePassword(password)) {
      Alert.alert(
        "Validation",
        "Password must be 8+ chars, include upper, lower, and number"
      );
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await signupUserApi({
        fullName,
        email,
        mobile,
        password
      });

      if (response.success) {
        Alert.alert("Success", "Signup successful");
        router.replace("/auth/login");
      } else {
        Alert.alert("Signup Failed", response.message || "Try again");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to signup");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6">
      <Text className="mb-2 text-center text-3xl font-bold text-black">
        Create Account
      </Text>

      <Text className="mb-6 text-center text-gray-500">
        Join GyanNidhi
      </Text>

      {/* Name */}
      <TextInput
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(v) => handleChange("fullName", v)}
        className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        value={form.email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(v) => handleChange("email", v)}
        className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
      />

      {/* Mobile */}
      <TextInput
        placeholder="Mobile Number"
        value={form.mobile}
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={(v) => handleChange("mobile", v.replace(/\D/g, ""))}
        className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        value={form.password}
        secureTextEntry
        onChangeText={(v) => handleChange("password", v)}
        className="mb-3 rounded-xl border border-gray-300 px-4 py-3"
      />

      {/* Confirm Password */}
      <TextInput
        placeholder="Confirm Password"
        value={form.confirmPassword}
        secureTextEntry
        onChangeText={(v) => handleChange("confirmPassword", v)}
        className="mb-4 rounded-xl border border-gray-300 px-4 py-3"
      />

      {/* Button */}
      <Pressable
        onPress={handleSignup}
        disabled={loading}
        className="items-center rounded-xl bg-blue-600 py-3"
      >
        <Text className="text-white text-base font-semibold">
          {loading ? "Creating..." : "Sign Up"}
        </Text>
      </Pressable>

      {/* Login link */}
      <Pressable onPress={() => router.push("/auth/login")}>
        <Text className="mt-5 text-center text-blue-600">
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  );
}