import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { signupUserApi } from "../../src/services/authService";

const joiningYearOptions = Array.from({ length: 27 }, (_, i) =>
  String(2000 + i),
);
const passOutYearOptions = Array.from({ length: 31 }, (_, i) =>
  String(2000 + i),
);

const branchOptions = [
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

const degreeOptions = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
];

const experienceOptions = ["0-1", "2-3", "3-5", "5+"];

export default function SignupScreen() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
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
    passOutYear: "",

    currentCompany: "",
    currentRole: "",
    experience: "",
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedBranchValue =
    form.branch === "Others" ? form.customBranch : form.branch;

  const acceptedResumeTypes = useMemo(
    () => [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    [],
  );

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) return;

      const mimeType = file.mimeType || "";
      const fileSize = file.size || 0;

      if (!acceptedResumeTypes.includes(mimeType)) {
        Alert.alert("Validation", "Please upload PDF, DOC, or DOCX only");
        return;
      }

      if (fileSize > 5 * 1024 * 1024) {
        Alert.alert("Validation", "Resume size must be less than 5MB");
        return;
      }

      setResumeFile(file);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to pick resume");
    }
  };

  const validateStep1 = () => {
    if (!form.type) {
      Alert.alert("Validation", "Please select registration type");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { name, email, phone, password, confirmPassword } = form;

    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Validation", "Please fill all required fields");
      return false;
    }

    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      Alert.alert("Validation", "Name should contain only letters and spaces");
      return false;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert("Validation", "Enter a valid email");
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert("Validation", "Phone number must be exactly 10 digits");
      return false;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        "Validation",
        "Password must be 8+ chars and include uppercase, lowercase, number, and special character",
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    const type = form.type;

    if (
      (type === "student-college" || type === "jobseeker-fresher") &&
      !selectedBranchValue.trim()
    ) {
      Alert.alert("Validation", "Please select or enter your branch");
      return false;
    }

    if (type === "student-college") {
      if (!form.college.trim()) {
        Alert.alert("Validation", "College name is required");
        return false;
      }

      if (!/[a-zA-Z]/.test(form.college)) {
        Alert.alert("Validation", "College name must contain letters");
        return false;
      }

      if (!form.year) {
        Alert.alert("Validation", "Please select year of study");
        return false;
      }

      if (!form.joiningyear) {
        Alert.alert("Validation", "Please select joining year");
        return false;
      }

      if (!form.skills.trim()) {
        Alert.alert("Validation", "Skills / interests are required");
        return false;
      }
    }

    if (type === "jobseeker-fresher") {
      if (!form.degree) {
        Alert.alert("Validation", "Please select degree");
        return false;
      }

      if (!form.passOutYear) {
        Alert.alert("Validation", "Please select pass-out year");
        return false;
      }

      if (!form.skills.trim()) {
        Alert.alert("Validation", "Skills / interests are required");
        return false;
      }

      if (!resumeFile) {
        Alert.alert("Validation", "Resume is required");
        return false;
      }
    }

    if (type === "working-professional") {
      if (!form.currentCompany.trim()) {
        Alert.alert("Validation", "Current company is required");
        return false;
      }

      if (!form.currentRole.trim()) {
        Alert.alert("Validation", "Current role is required");
        return false;
      }

      if (!form.experience) {
        Alert.alert("Validation", "Please select years of experience");
        return false;
      }

      if (!form.skills.trim()) {
        Alert.alert("Validation", "Skills / interests are required");
        return false;
      }

      if (!resumeFile) {
        Alert.alert("Validation", "Resume is required");
        return false;
      }
    }

    if (/\d/.test(form.skills)) {
      Alert.alert("Validation", "Numbers are not allowed in skills");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSignup = async () => {
    if (!validateStep1()) return;
    if (!validateStep2()) return;
    if (!validateStep3()) return;

    try {
      setLoading(true);

      const payload = {
        type: form.type,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,

        college: form.college.trim(),
        year: form.year,
        joiningyear:
          form.type === "jobseeker-fresher"
            ? form.passOutYear
            : form.joiningyear,
        branch: selectedBranchValue.trim(),
        skills: form.skills.trim(),

        degree: form.degree,
        currentCompany: form.currentCompany.trim(),
        currentRole: form.currentRole.trim(),
        experience: form.experience,

        resume: resumeFile || null,
      };

      const response = await signupUserApi(payload);

      if (response?.success) {
        Alert.alert("Success", "Signup successful");
        router.replace("/(protected)/home");
      } else {
        Alert.alert("Signup Failed", response?.message || "Try again");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Unable to signup");
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (label, value, onValueChange, items, placeholder) => (
      <View className="mb-4">
        <Text className="mb-2 text-[13px] font-semibold text-[#101828]">
          {label}
        </Text>

        <View className="h-[58px] justify-center rounded-[22px] border border-[#5587eb] bg-white px-2">
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            dropdownIconColor="#667085"
            style={{
              color: "#101828",
              height: 58,
            }}
          >
            <Picker.Item label={placeholder} value="" color="#98A2B3" />
          
            {items.map((item) => (
              <Picker.Item key={item} label={item} value={item} color="#101828" />
            ))}
          </Picker>
        </View>
      </View>
   );

  const renderStepIndicator = () => {
    const labels = ["Type", "Basic", "Details", "Review"];
    return (
      <View className="mb-6 flex-row items-center justify-between">
        {labels.map((label, index) => {
          const current = index + 1;
          const active = current === step;
          const done = current < step;

          return (
            <View key={label} className="flex-1 items-center">
              <View
                className={`h-11 w-11 items-center justify-center rounded-full ${
                  done || active ? "bg-[#0F5EFF]" : "bg-[#D0D5DD]"
                }`}
              >
                <Text className="font-bold text-white">{current}</Text>
              </View>
              <Text
                className={`mt-3 text-[12px] font-medium ${active ? "text-[#0F5EFF]" : "text-[#98A2B3]"}`}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderStep1 = () => (
    <View>
      <Text className="mb-4 text-xl font-semibold text-black">
        Select Registration Type
      </Text>

      {renderPicker(
        "Registration Type *",
        form.type,
        (v) =>
          setForm((prev) => ({
            ...prev,
            type: v,
            branch: "",
            customBranch: "",
            college: "",
            year: "",
            joiningyear: "",
            degree: "",
            passOutYear: "",
            currentCompany: "",
            currentRole: "",
            experience: "",
            skills: "",
          })),
        ["student-college", "jobseeker-fresher", "working-professional"],
        "Select registration type",
      )}
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text className="mb-4 text-xl font-semibold text-black">
        Basic Details
      </Text>

      <TextInput
        placeholder="Full Name"
        value={form.name}
        onChangeText={(v) =>
          handleChange("name", v.replace(/[^a-zA-Z\s]/g, ""))
        }
        className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
        placeholderTextColor="#667085"
      />

      <TextInput
        placeholder="Email"
        value={form.email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(v) => handleChange("email", v)}
        className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
        placeholderTextColor="#667085"
      />

      <TextInput
        placeholder="Phone Number"
        value={form.phone}
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={(v) => handleChange("phone", v.replace(/\D/g, ""))}
        className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
        placeholderTextColor="#667085"
      />

      <TextInput
        placeholder="Password"
        value={form.password}
        secureTextEntry
        onChangeText={(v) => handleChange("password", v)}
        className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
        placeholderTextColor="#667085"
      />

      <TextInput
        placeholder="Confirm Password"
        value={form.confirmPassword}
        secureTextEntry
        onChangeText={(v) => handleChange("confirmPassword", v)}
        className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
        placeholderTextColor="#667085"
      />
    </View>
  );

  const renderStep3 = () => {
    if (form.type === "student-college") {
      return (
        <View>
          <Text className="mb-4 text-xl font-semibold text-black">
            Student Details
          </Text>

          <TextInput
            placeholder="College Name"
            value={form.college}
            onChangeText={(v) =>
              handleChange("college", v.replace(/[^a-zA-Z\s]/g, ""))
            }
            className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
            placeholderTextColor="#667085"
          />

          {renderPicker(
            "Year of Study *",
            form.year,
            (v) => handleChange("year", v),
            ["1st Year", "2nd Year", "3rd Year", "4th Year"],
            "Select year",
          )}

          {renderPicker(
            "Joining Year *",
            form.joiningyear,
            (v) => handleChange("joiningyear", v),
            joiningYearOptions,
            "Select joining year",
          )}

          {renderPicker(
            "Branch / Specialization *",
            form.branch,
            (v) => handleChange("branch", v),
            branchOptions,
            "Select branch",
          )}

          {form.branch === "Others" && (
            <TextInput
              placeholder="Enter your branch"
              value={form.customBranch}
              onChangeText={(v) =>
                handleChange("customBranch", v.replace(/[^a-zA-Z\s]/g, ""))
              }
              className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
              placeholderTextColor="#667085"
            />
          )}

          <TextInput
            placeholder="Skills / Interests"
            value={form.skills}
            multiline
            onChangeText={(v) =>
              handleChange("skills", v.replace(/[0-9]/g, ""))
            }
            className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
            placeholderTextColor="#667085"
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />

          <Pressable
            onPress={pickResume}
            className="mb-4 rounded-[24px] border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-5 py-5"
          >
            <Text className="text-center text-gray-700">
              {resumeFile?.name
                ? `Resume: ${resumeFile.name}`
                : "Upload Resume (Optional)"}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (form.type === "jobseeker-fresher") {
      return (
        <View>
          <Text className="mb-4 text-xl font-semibold text-black">
            Fresher Details
          </Text>

          <Pressable
            onPress={pickResume}
            className="mb-4 rounded-[24px] border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-5 py-5"
          >
            <Text className="text-center text-[#667085]">
              {resumeFile?.name
                ? `Resume: ${resumeFile.name}`
                : "Upload Resume *"}
            </Text>
          </Pressable>

          {renderPicker(
            "Degree *",
            form.degree,
            (v) => handleChange("degree", v),
            degreeOptions,
            "Select degree",
          )}

          {renderPicker(
            "Pass-out Year *",
            form.passOutYear,
            (v) => handleChange("passOutYear", v),
            passOutYearOptions,
            "Select pass-out year",
          )}

          {renderPicker(
            "Branch / Specialization *",
            form.branch,
            (v) => handleChange("branch", v),
            branchOptions,
            "Select branch",
          )}

          {form.branch === "Others" && (
            <TextInput
              placeholder="Enter your branch"
              value={form.customBranch}
              onChangeText={(v) =>
                handleChange("customBranch", v.replace(/[^a-zA-Z\s]/g, ""))
              }
              className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
              placeholderTextColor="#667085"
            />
          )}

          <TextInput
            placeholder="Skills / Interests"
            value={form.skills}
            multiline
            onChangeText={(v) =>
              handleChange("skills", v.replace(/[0-9]/g, ""))
            }
            className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
            placeholderTextColor="#667085"
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
        </View>
      );
    }

    return (
      <View>
        <Text className="mb-4 text-xl font-semibold text-black">
          Professional Details
        </Text>

        <TextInput
          placeholder="Current Company"
          value={form.currentCompany}
          onChangeText={(v) => handleChange("currentCompany", v)}
          className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
          placeholderTextColor="#667085"
        />

        <TextInput
          placeholder="Current Role"
          value={form.currentRole}
          onChangeText={(v) => handleChange("currentRole", v)}
          className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
          placeholderTextColor="#667085"
        />

        {renderPicker(
          "Years of Experience *",
          form.experience,
          (v) => handleChange("experience", v),
          experienceOptions,
          "Select experience",
        )}

        <TextInput
          placeholder="Skills / Interests"
          value={form.skills}
          multiline
          onChangeText={(v) =>
            handleChange("skills", v.replace(/[0-9]/g, ""))
          }
          className="mb-4 rounded-[22px] border border-[#D0D5DD] bg-[#F9FAFB] px-5 py-4 text-[15px] text-[#101828]"
          placeholderTextColor="#667085"
          style={{ minHeight: 90, textAlignVertical: "top" }}
        />

        <Pressable
          onPress={pickResume}
          className="mb-4 rounded-[24px] border border-dashed border-[#D0D5DD] bg-[#F9FAFB] px-5 py-5"
        >
          <Text className="text-center text-[#667085]">
            {resumeFile?.name ? `Resume: ${resumeFile.name}` : "Upload Resume *"}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderStep4 = () => (
    <View>
      <Text className="mb-4 text-xl font-semibold text-black">
        Review Details
      </Text>

      <View className="rounded-[28px] bg-white p-6">
        <Text className="mb-2 text-gray-800">Type: {form.type}</Text>
        <Text className="mb-2 text-gray-800">Name: {form.name}</Text>
        <Text className="mb-2 text-gray-800">Email: {form.email}</Text>
        <Text className="mb-2 text-gray-800">Phone: {form.phone}</Text>

        {form.type === "student-college" && (
          <>
            <Text className="mb-2 text-gray-800">College: {form.college}</Text>
            <Text className="mb-2 text-gray-800">Year: {form.year}</Text>
            <Text className="mb-2 text-gray-800">
              Joining Year: {form.joiningyear}
            </Text>
            <Text className="mb-2 text-gray-800">
              Branch: {selectedBranchValue}
            </Text>
            <Text className="mb-2 text-gray-800">Skills: {form.skills}</Text>
          </>
        )}

        {form.type === "jobseeker-fresher" && (
          <>
            <Text className="mb-2 text-gray-800">Degree: {form.degree}</Text>
            <Text className="mb-2 text-gray-800">
              Pass-out Year: {form.passOutYear}
            </Text>
            <Text className="mb-2 text-gray-800">
              Branch: {selectedBranchValue}
            </Text>
            <Text className="mb-2 text-gray-800">Skills: {form.skills}</Text>
            <Text className="mb-2 text-gray-800">
              Resume: {resumeFile?.name || "Not selected"}
            </Text>
          </>
        )}

        {form.type === "working-professional" && (
          <>
            <Text className="mb-2 text-gray-800">
              Current Company: {form.currentCompany}
            </Text>
            <Text className="mb-2 text-gray-800">
              Current Role: {form.currentRole}
            </Text>
            <Text className="mb-2 text-gray-800">
              Experience: {form.experience}
            </Text>
            <Text className="mb-2 text-gray-800">Skills: {form.skills}</Text>
            <Text className="mb-2 text-gray-800">
              Resume: {resumeFile?.name || "Not selected"}
            </Text>
          </>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-[#F6F8FB]"
      contentContainerStyle={{ padding: 24 }}
    >
      <View className="mb-8">
  <Text className="text-[36px] font-bold leading-[44px] text-[#101828]">
    Create
    {"\n"}
    Account
  </Text>

  <Text className="mt-4 text-[15px] leading-7 text-[#667085]">
    Join GyanNidhi and access events, placements,
    HireAI interviews, and smart verification tools.
  </Text>
</View>

      {renderStepIndicator()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <View className="mt-6 flex-row justify-between">
        {step > 1 ? (
          <Pressable
            onPress={handleBack}
            className="rounded-[22px] border border-[#D0D5DD] bg-white px-6 py-4"
          >
            <Text className="font-semibold text-gray-700">Back</Text>
          </Pressable>
        ) : (
          <View />
        )}

        {step < 4 ? (
          <Pressable
            onPress={handleNext}
            className="rounded-[22px] bg-[#0F5EFF] px-6 py-4"
          >
            <Text className="font-semibold text-white">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSignup}
            disabled={loading}
            className="rounded-[22px] bg-[#0F5EFF] px-6 py-4"
          >
            <Text className="font-semibold text-white">
              {loading ? "Creating..." : "Submit"}
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => router.push("/auth/login")}>
        <Text className="mt-8 text-center text-[14px] font-semibold text-[#0F5EFF]">
          Already have an account? Login
        </Text>
      </Pressable>
    </ScrollView>
  );
}