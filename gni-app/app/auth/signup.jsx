import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  signupUserApi,
  loginUserApi,
} from "../../src/services/authService";

import { useAuthStore } from "../../src/stores/authStore";
import AppScreen from "../../src/components/common/AppScreen";
import AppInput from "../../src/components/ui/AppInput";
import { COLORS, SPACING, RADIUS } from "../../src/theme";

// Copy the website's existing colleges file to:
// gni-app/src/data/colleges.js
// It must export: export const colleges = [...];
import { colleges } from "../../src/data/colleges";

const ACCOUNT_TYPES = [
  {
    label: "Student",
    value: "student-college",
  },
  {
    label: "Job Seeker - Fresher",
    value: "jobseeker-fresher",
  },
  {
    label: "Working Professional",
    value: "working-professional",
  },
];

const YEAR_OF_STUDY_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

const JOINING_YEAR_START =
  2021;

const CURRENT_YEAR =
  new Date().getFullYear();

const JOINING_YEAR_OPTIONS =
  Array.from(
    {
      length:
        CURRENT_YEAR -
        JOINING_YEAR_START +
        1,
    },
    (_, index) =>
      String(
        JOINING_YEAR_START +
          index,
      ),
  );

const PASSOUT_YEAR_OPTIONS = Array.from({ length: 31 }, (_, index) =>
  String(2000 + index),
);

const BRANCH_OPTIONS = [
  "CSE",
  "CSE-AIML",
  "CSE-AIDS",
  "IT",
  "IOT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "Others",
];

const DEGREE_OPTIONS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
];

const EXPERIENCE_OPTIONS = [
  { label: "0-1 years (Fresher)", value: "0-1" },
  { label: "2-3 years", value: "2-3" },
  { label: "3-5 years", value: "3-5" },
  { label: "5+ years", value: "5+" },
];

const INITIAL_FORM = {
  type: "student-college",

  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",

  college: "",
  year: "",
  joiningyear: "",
  branch: "",
  customBranch: "",
  skills: "",

  degree: "",
  passoutYear: "",

  currentCompany: "",
  currentRole: "",
  experience: "",
};

function FieldError({ message }) {
  if (!message) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: -10,
        marginBottom: SPACING.lg,
      }}
    >
      <Ionicons
        name="alert-circle-outline"
        size={16}
        color="#D92D20"
        style={{ marginTop: 1, marginRight: 6 }}
      />
      <Text
        style={{
          flex: 1,
          color: "#D92D20",
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {message}
      </Text>
    </View>
  );
}

function SectionTitle({ title }) {
  return (
    <View
      style={{
        marginTop: SPACING.md,
        marginBottom: SPACING.xl,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: "#EAECF0",
      }}
    >
      <Text
        style={{
          color: "#101828",
          fontSize: 18,
          lineHeight: 24,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </View>
  );
}





function PickerField({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  error,
  mode = "dialog",
}) {
  return (
    <View style={{ marginBottom: SPACING.xl }}>
      <Text
        style={{
          marginBottom: SPACING.sm,
          color: "#101828",
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>

      <View
        style={{
          minHeight: 56,
          justifyContent: "center",
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: error ? "#D92D20" : "#D0D5DD",
          backgroundColor: "#F9FAFB",
          overflow: "hidden",
        }}
      >
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          mode={mode}
          dropdownIconColor="#667085"
          style={{
            height: 56,
            color: value ? "#101828" : "#667085",
          }}
        >
         <Picker.Item
  label={placeholder}
  value=""
    enabled={value === ""}
/>

          {options.map((option) => {
            const item =
              typeof option === "string"
                ? { label: option, value: option }
                : option;

            return (
              <Picker.Item
                key={item.value}
                label={`   ${item.label}`}
                value={item.value}
              />
            );
          })}
        </Picker>
      </View>

      {error ? (
        <Text
          style={{
            marginTop: SPACING.sm,
            color: "#D92D20",
            fontSize: 12,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function CollegeSearchField({ value, onChange, error }) {
  const [open, setOpen] = useState(false);

  const filteredColleges = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    return colleges
      .filter((college) => college.toLowerCase().includes(query))
      .slice(0, 20);
  }, [value]);

  const handleTextChange = (text) => {
    // Same basic restriction as the website form.
    const cleaned = text.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ");
    onChange(cleaned);
    setOpen(true);
  };

  return (
    <View style={{ marginBottom: SPACING.xl, zIndex: 20 }}>
      <Text
        style={{
          marginBottom: SPACING.sm,
          color: "#101828",
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        College Name *
      </Text>

      <View
        style={{
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: SPACING.lg,
          borderRadius: RADIUS.xl,
          borderWidth: 1,
          borderColor: error ? "#D92D20" : "#D0D5DD",
          backgroundColor: "#F9FAFB",
        }}
      >
        <Ionicons name="search-outline" size={20} color="#667085" />

        <TextInput
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setOpen(true)}
          placeholder="Search your college"
          placeholderTextColor="#667085"
          autoCapitalize="words"
          autoCorrect={false}
          style={{
            flex: 1,
            minHeight: 54,
            marginLeft: SPACING.md,
            color: "#101828",
            fontSize: 15,
          }}
        />

        {value ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#98A2B3" />
          </Pressable>
        ) : null}
      </View>

     {open && value.trim().length > 0 ? (
  <View
    style={{
      marginTop: SPACING.sm,
      maxHeight: 280,
      borderWidth: 1,
      borderColor: "#D0D5DD",
      borderRadius: RADIUS.lg,
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
    }}
  >
    {filteredColleges.length > 0 ? (
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator
        persistentScrollbar
        keyboardShouldPersistTaps="handled"
        fadingEdgeLength={24}
        contentContainerStyle={{
          paddingVertical: SPACING.sm,
        }}
      >
        {filteredColleges.map((college, index) => (
  <View key={`${college}-${index}`}>
    <Pressable
      onPress={() => {
        onChange(college);
        setOpen(false);
      }}
      style={({ pressed }) => ({
        marginHorizontal: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        paddingVertical: 14,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: "#EAECF0",
        backgroundColor: pressed
          ? "#EFF4FF"
          : "#FFFFFF",
      })}
    >
      <Text
        style={{
          color: "#344054",
          fontSize: 14,
          lineHeight: 21,
          fontWeight: "500",
        }}
      >
        {college}
      </Text>
    </Pressable>

    {index <
    filteredColleges.length - 1 ? (
      <View style={{ height: 12 }} />
    ) : null}
  </View>
))}
      </ScrollView>
    ) : (
      <View style={{ padding: SPACING.lg }}>
        <Text
          style={{
            color: "#344054",
            fontSize: 14,
            fontWeight: "600",
          }}
        >
          College not found
        </Text>

        <Text
          style={{
            marginTop: 4,
            color: "#667085",
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Your entered college name will be used as a custom value.
        </Text>
      </View>
    )}
  </View>
) : null}

      {error ? (
        <Text
          style={{
            marginTop: SPACING.sm,
            color: "#D92D20",
            fontSize: 12,
          }}
        >
          {error}
        </Text>
      ) : (
        <Text
          style={{
            marginTop: SPACING.sm,
            color: "#667085",
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Start typing to search. A custom college name is also accepted.
        </Text>
      )}
    </View>
  );
}

export default function SignupScreen() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

 

  const selectedBranch =
    form.branch === "Others" ? form.customBranch.trim() : form.branch;

  const clearError = (key) => {
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  const handleChange = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    clearError(key);
  };

  const handleTypeChange = (type) => {
    setForm((previous) => ({
      ...INITIAL_FORM,
      type,
      name: previous.name,
      email: previous.email,
      phone: previous.phone,
      password: previous.password,
      confirmPassword: previous.confirmPassword,
    }));
    setErrors({});
  };

  const handleNameChange = (value) => {
    const cleaned = value
      .replace(/[^a-zA-Z\s]/g, "")
      .replace(/\s+/g, " ");

    setForm((previous) => ({ ...previous, name: cleaned }));

    if (cleaned !== value) {
      setErrors((previous) => ({
        ...previous,
        name: "Name can contain only letters and spaces",
      }));
    } else {
      clearError("name");
    }
  };

  const handlePhoneChange = (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    setForm((previous) => ({ ...previous, phone: cleaned }));

    if (cleaned.length > 0 && cleaned.length < 10) {
      setErrors((previous) => ({
        ...previous,
        phone: "Phone number must contain exactly 10 digits",
      }));
    } else {
      clearError("phone");
    }
  };

  const handleSkillsChange = (value) => {
    const containsNumber = /[0-9]/.test(value);
    const cleaned = value.replace(/[0-9]/g, "");

    setForm((previous) => ({ ...previous, skills: cleaned }));

    if (containsNumber) {
      setErrors((previous) => ({
        ...previous,
        skills: "Numbers are not allowed in skills or interests",
      }));
    } else {
      clearError("skills");
    }
  };

  const getPasswordErrors = (password) => {
    const problems = [];

    if (password.length < 8) problems.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) problems.push("one uppercase letter");
    if (!/[a-z]/.test(password)) problems.push("one lowercase letter");
    if (!/\d/.test(password)) problems.push("one number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
      problems.push("one special character");
    }

    return problems;
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!ACCOUNT_TYPES.some((item) => item.value === form.type)) {
      nextErrors.type = "Select a registration type";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Full name must contain at least 2 characters";
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.phone) {
      nextErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      nextErrors.phone = "Phone number must contain exactly 10 digits";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    } else {
      const passwordProblems = getPasswordErrors(form.password);
      if (passwordProblems.length > 0) {
        nextErrors.password = `Password must include ${passwordProblems.join(
          ", ",
        )}`;
      }
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (form.type === "student-college") {
      if (!form.college.trim()) {
        nextErrors.college = "College name is required";
      }
      if (!form.year) {
        nextErrors.year = "Year of study is required";
      }
      if (!form.joiningyear) {
        nextErrors.joiningyear = "Joining year is required";
      }
      if (!selectedBranch) {
        nextErrors.branch = "Branch or specialization is required";
      } else if (selectedBranch.length < 2) {
        nextErrors.branch = "Branch must contain at least 2 characters";
      }
      if (!form.skills.trim()) {
        nextErrors.skills = "Skills or interests are required";
      }
    }

    if (form.type === "jobseeker-fresher") {
      if (!form.degree) {
        nextErrors.degree = "Degree is required";
      }
      if (!form.passoutYear) {
        nextErrors.passoutYear = "Pass-out year is required";
      }
      if (!selectedBranch) {
        nextErrors.branch = "Branch or specialization is required";
      } else if (selectedBranch.length < 2) {
        nextErrors.branch = "Branch must contain at least 2 characters";
      }
      if (!form.skills.trim()) {
        nextErrors.skills = "Skills or interests are required";
      }
    }

    if (form.type === "working-professional") {
      if (!form.currentCompany.trim()) {
        nextErrors.currentCompany = "Current company is required";
      }
      if (!form.currentRole.trim()) {
        nextErrors.currentRole = "Current role is required";
      }
      if (!form.experience) {
        nextErrors.experience = "Years of experience is required";
      }
      if (!form.skills.trim()) {
        nextErrors.skills = "Skills or interests are required";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      const firstMessage = Object.values(nextErrors)[0];
      Alert.alert("Check your details", firstMessage);
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    const common = {
      type: form.type,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
      password: form.password,
      skills: form.skills.trim(),
    };

    if (form.type === "student-college") {
      return {
        ...common,
        college: form.college.trim(),
        year: form.year,
        joiningyear: form.joiningyear,
        branch: selectedBranch,
      };
    }

    if (form.type === "jobseeker-fresher") {
      return {
        ...common,
        degree: form.degree,
        passoutYear: form.passoutYear,
        branch: selectedBranch,
      };
    }

    return {
      ...common,
      currentCompany: form.currentCompany.trim(),
      currentRole: form.currentRole.trim(),
      experience: form.experience,
    };
  };

  const handleSignup = async () => {
    if (loading || !validateForm()) return;

    try {
      setLoading(true);

      const signupResponse = await signupUserApi(buildPayload());

      if (!signupResponse?.success) {
        throw new Error(signupResponse?.message || "Registration failed");
      }

      // The signup endpoint currently creates the user but does not return a JWT.
      // Log in immediately with the same credentials to obtain the token and the
      // server-stored user.type, then persist both through the existing auth store.
      const loginResponse = await loginUserApi({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!loginResponse?.success) {
        Alert.alert(
          "Account created",
          "Your account was created, but automatic login failed. Please log in manually.",
          [
            {
              text: "Go to Login",
              onPress: () => router.replace("/auth/login"),
            },
          ],
        );
        return;
      }

     const accessToken =
  loginResponse.accessToken ||
  loginResponse.data?.accessToken ||
  null;

const refreshToken =
  loginResponse.refreshToken ||
  loginResponse.data?.refreshToken ||
  null;

const responseUser =
  loginResponse.user ||
  loginResponse.data?.user ||
  null;

if (
  !accessToken ||
  !refreshToken ||
  !responseUser
) {
  throw new Error(
    "Login succeeded without complete authentication data",
  );
}

const authenticatedUser = {
  ...responseUser,

  type:
    responseUser.type ||
    form.type,
};

await setAuth({
  user: authenticatedUser,
  accessToken,
  refreshToken,
});

      router.replace("/(protected)/home");
    } catch (error) {
      Alert.alert(
        "Registration failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create your account",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen
      bottomSpace={48}
      contentStyle={{ paddingTop: SPACING.xl }}
      maxWidth={560}
    >
      <View style={{ marginBottom: SPACING.xxl }}>
        <Text
          style={{
            color: "#101828",
            fontSize: 28,
            lineHeight: 34,
            fontWeight: "800",
          }}
        >
          Create Account
        </Text>
        <Text
          style={{
            marginTop: SPACING.sm,
            color: "#667085",
            fontSize: 15,
            lineHeight: 23,
          }}
        >
          Choose your account type and complete the relevant details below.
        </Text>
      </View>

      <View
        style={{
           paddingVertical: SPACING.lg,
          borderRadius: RADIUS.xl,
          backgroundColor: "#FFFFFF",
        }}
      >
      <PickerField
  label="Registration Type *"
  value={form.type}
  placeholder="Select registration type"
  options={ACCOUNT_TYPES}
  onValueChange={handleTypeChange}
  error={errors.type}
/>
       

        <SectionTitle title="Basic Details" />

        <AppInput
          label="Full Name *"
          icon="person-outline"
          placeholder="Enter your full name"
          value={form.name}
          onChangeText={handleNameChange}
          autoCapitalize="words"
          style={{ marginBottom: errors.name ? SPACING.sm : SPACING.xl }}
        />
        <FieldError message={errors.name} />

        <AppInput
          label="Email *"
          icon="mail-outline"
          placeholder="youremail@example.com"
          value={form.email}
          onChangeText={(value) => handleChange("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ marginBottom: errors.email ? SPACING.sm : SPACING.xl }}
        />
        <FieldError message={errors.email} />

        <AppInput
          label="Phone Number *"
          icon="call-outline"
          placeholder="Enter 10-digit phone number"
          value={form.phone}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          style={{ marginBottom: errors.phone ? SPACING.sm : SPACING.xl }}
        />
        <FieldError message={errors.phone} />

        <AppInput
          label="Password *"
          icon="lock-closed-outline"
          placeholder="Create a strong password"
          value={form.password}
          onChangeText={(value) => handleChange("password", value)}
          secureTextEntry={!showPassword}
          rightText={showPassword ? "Hide" : "Show"}
          onRightPress={() => setShowPassword((previous) => !previous)}
          style={{ marginBottom: errors.password ? SPACING.sm : SPACING.xl }}
        />
        <FieldError message={errors.password} />

        <Text
          style={{
            marginTop: -8,
            marginBottom: SPACING.xl,
            color: "#667085",
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          Use at least 8 characters with uppercase, lowercase, number and special
          character.
        </Text>

        <AppInput
          label="Confirm Password *"
          icon="shield-checkmark-outline"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChangeText={(value) => handleChange("confirmPassword", value)}
          secureTextEntry={!showConfirmPassword}
          rightText={showConfirmPassword ? "Hide" : "Show"}
          onRightPress={() =>
            setShowConfirmPassword((previous) => !previous)
          }
          style={{
            marginBottom: errors.confirmPassword ? SPACING.sm : SPACING.xl,
          }}
        />
        <FieldError message={errors.confirmPassword} />

        {form.type === "student-college" ? (
          <>
            <SectionTitle title="Academic Details" />

            <CollegeSearchField
              value={form.college}
              onChange={(value) => handleChange("college", value)}
              error={errors.college}
            />

            <PickerField
              label="Year of Study *"
              value={form.year}
              placeholder="Select year of study"
              options={YEAR_OF_STUDY_OPTIONS}
              onValueChange={(value) => handleChange("year", value)}
              error={errors.year}
            />

            <PickerField
              label="Joining Year *"
              value={form.joiningyear}
              placeholder="Select joining year"
              options={JOINING_YEAR_OPTIONS}
              onValueChange={(value) => handleChange("joiningyear", value)}
              error={errors.joiningyear}
            />

            <PickerField
              label="Branch / Specialization *"
              value={form.branch}
              placeholder="Select branch"
              options={BRANCH_OPTIONS}
              onValueChange={(value) => {
                handleChange("branch", value);
                if (value !== "Others") {
                  handleChange("customBranch", "");
                }
              }}
              error={errors.branch}
            />

            {form.branch === "Others" ? (
              <>
                <AppInput
                  label="Enter Branch / Specialization *"
                  icon="school-outline"
                  placeholder="Enter your branch"
                  value={form.customBranch}
                  onChangeText={(value) =>
                    handleChange(
                      "customBranch",
                      value.replace(/[^a-zA-Z\s]/g, ""),
                    )
                  }
                  autoCapitalize="words"
                  style={{
                    marginBottom: errors.branch ? SPACING.sm : SPACING.xl,
                  }}
                />
                <FieldError message={errors.branch} />
              </>
            ) : null}

            <SectionTitle title="Skills & Interests" />

            <AppInput
              label="Skills / Interests *"
              icon="bulb-outline"
              placeholder="Example: React, Python, PCB Design"
              value={form.skills}
              onChangeText={handleSkillsChange}
              multiline
              style={{ marginBottom: errors.skills ? SPACING.sm : SPACING.xl }}
            />
            <FieldError message={errors.skills} />
          </>
        ) : null}

        {form.type === "jobseeker-fresher" ? (
          <>
            <SectionTitle title="Education Details" />

            <PickerField
              label="Degree *"
              value={form.degree}
              placeholder="Select degree"
              options={DEGREE_OPTIONS}
              onValueChange={(value) => handleChange("degree", value)}
              error={errors.degree}
            />

            <PickerField
              label="Pass-out Year *"
              value={form.passoutYear}
              placeholder="Select pass-out year"
              options={PASSOUT_YEAR_OPTIONS}
              onValueChange={(value) => handleChange("passoutYear", value)}
              error={errors.passoutYear}
            />

            <PickerField
              label="Branch / Specialization *"
              value={form.branch}
              placeholder="Select branch"
              options={BRANCH_OPTIONS}
              onValueChange={(value) => {
                handleChange("branch", value);
                if (value !== "Others") {
                  handleChange("customBranch", "");
                }
              }}
              error={errors.branch}
            />

            {form.branch === "Others" ? (
              <>
                <AppInput
                  label="Enter Branch / Specialization *"
                  icon="school-outline"
                  placeholder="Enter your branch"
                  value={form.customBranch}
                  onChangeText={(value) =>
                    handleChange(
                      "customBranch",
                      value.replace(/[^a-zA-Z\s]/g, ""),
                    )
                  }
                  autoCapitalize="words"
                  style={{
                    marginBottom: errors.branch ? SPACING.sm : SPACING.xl,
                  }}
                />
                <FieldError message={errors.branch} />
              </>
            ) : null}

            <SectionTitle title="Skills & Interests" />

            <AppInput
              label="Skills / Interests *"
              icon="bulb-outline"
              placeholder="Example: JavaScript, React, Python"
              value={form.skills}
              onChangeText={handleSkillsChange}
              multiline
              style={{ marginBottom: errors.skills ? SPACING.sm : SPACING.xl }}
            />
            <FieldError message={errors.skills} />
          </>
        ) : null}

               {form.type === "working-professional" ? (
          <>
            <SectionTitle title="Professional Information" />

            <AppInput
              label="Current Company *"
              icon="business-outline"
              placeholder="Enter company name"
              value={form.currentCompany}
              onChangeText={(value) => handleChange("currentCompany", value)}
              autoCapitalize="words"
              style={{
                marginBottom: errors.currentCompany
                  ? SPACING.sm
                  : SPACING.xl,
              }}
            />
            <FieldError message={errors.currentCompany} />

            <AppInput
              label="Current Role *"
              icon="briefcase-outline"
              placeholder="Enter your current role"
              value={form.currentRole}
              onChangeText={(value) => handleChange("currentRole", value)}
              autoCapitalize="words"
              style={{
                marginBottom: errors.currentRole
                  ? SPACING.sm
                  : SPACING.xl,
              }}
            />
            <FieldError message={errors.currentRole} />

            <PickerField
              label="Years of Experience *"
              value={form.experience}
              placeholder="Select experience"
              options={EXPERIENCE_OPTIONS}
              onValueChange={(value) => handleChange("experience", value)}
              error={errors.experience}
            />

            <SectionTitle title="Skills & Interests" />

            <AppInput
              label="Skills / Interests *"
              icon="bulb-outline"
              placeholder="Example: Project Management, AWS, FinTech"
              value={form.skills}
              onChangeText={handleSkillsChange}
              multiline
              style={{
                marginBottom: errors.skills
                  ? SPACING.sm
                  : SPACING.xl,
              }}
            />
            <FieldError message={errors.skills} />
          </>
        ) : null}
      </View>

{/* Actions outside the white registration form */}
<View
  style={{
    width: "100%",
    alignItems: "center",
    marginBottom: 30,
  }}
>
   <Text
    style={{
      width: "100%",
      marginBottom: 16,
      color: "#667085",
      fontSize: 12,
      lineHeight: 19,
      textAlign: "center",
    }}
  >
    By clicking Register, you agree to
    GyanNidhi Innovations&apos;{" "}

    <Text
      onPress={() =>
        router.push(
          "/auth/terms-and-conditions",
        )
      }
      style={{
        color: "#0F5EFF",
        fontWeight: "700",
      }}
    >
      Terms & Conditions
    </Text>

    {" "}and{" "}

    <Text
      onPress={() =>
        router.push(
          "/auth/privacy-policy",
        )
      }
      style={{
        color: "#0F5EFF",
        fontWeight: "700",
      }}
    >
      Privacy Policy
    </Text>
    .
  </Text>
  
  {/* Blue Register button */}
  <View
    style={{
      width: "88%",
      height: 50,
      backgroundColor: "#022670",
      borderRadius: 14,
      overflow: "hidden",
    }}
  >
    <Pressable
      disabled={loading}
      onPress={handleSignup}
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
     {loading ? (
  <View
    style={{
      width: "100%",
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <ActivityIndicator
      size="small"
      color="#FFFFFF"
    />
  </View>
) : (
  <Text
    style={{
      width: "100%",
      height: 50,
      lineHeight: 50,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
      textAlignVertical: "center",
      includeFontPadding: false,
    }}
  >
    Register
  </Text>
)}
    </Pressable>
  </View>

  {/* Gap between Register and login */}
  <View style={{ height: 24 }} />

  <Pressable
    disabled={loading}
    onPress={() => router.replace("/auth/login")}
    style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
    }}
  >
    <Text
      style={{
        color: "#667085",
        fontSize: 14,
        textAlign: "center",
      }}
    >
      Already have an account?{" "}
      <Text
        style={{
          color: "#0F5EFF",
          fontWeight: "700",
        }}
      >
        Log in
      </Text>
    </Text>
  </Pressable>
</View>

   </AppScreen>
  );
}
