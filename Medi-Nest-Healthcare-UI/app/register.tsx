import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { registerApi } from "../_utils/api";
import { isValidEmail, isValidPassword } from "../_utils/validation";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

type Role = "patient" | "doctor" | "admin";

const SPECIALIZATIONS = [
  "Cardiologist", "Dermatologist", "Pediatrician", 
  "Neurologist", "Orthopedic", "Dentist", 
  "Psychiatrist", "Gynecologist", "General Physician"
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [specialization, setSpecialization] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicMapLink, setClinicMapLink] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setDocuments(prev => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.log("Upload err", err);
    }
  };

  const handleRegister = async () => {
    setError("");
    
    if (!name || !email || !password) {
      return setError("Name, email and password are required");
    }

    if (role === "doctor") {
      if (!phone) return setError("Phone is required for Doctors");
      if (!clinicAddress) return setError("Clinic Address is required to appear on the map");
      if (documents.length === 0) return setError("Please upload at least one supporting document (License/Degree)");
    }

    if (!isValidEmail(email)) return setError("Invalid email address");
    if (!isValidPassword(password)) return setError("Password must be 6+ chars with a number");

    try {
      setLoading(true);
      await registerApi(name, email, password, role, specialization, clinicName, phone, clinicAddress, clinicMapLink, documents);
      router.replace("/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Back Button Simulation */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
          <Text style={styles.backText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Medinest</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Role Toggles */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "patient" && styles.roleBtnActive]}
              onPress={() => setRole("patient")}
            >
              <Text style={[styles.roleText, role === "patient" && styles.roleTextActive]}>I'm a Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === "doctor" && styles.roleBtnActive]}
              onPress={() => setRole("doctor")}
            >
              <Text style={[styles.roleText, role === "doctor" && styles.roleTextActive]}>I'm a Doctor</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                placeholder="Your full name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                placeholder="+1 555-0000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Doctor Conditional Section */}
          {role === "doctor" && (
            <View style={styles.doctorSection}>
              <Text style={styles.label}>Doctor Information</Text>
              
              <View style={styles.specGrid}>
                {SPECIALIZATIONS.map(spec => (
                  <TouchableOpacity
                    key={spec}
                    style={[styles.specPill, specialization === spec && styles.specPillActive]}
                    onPress={() => setSpecialization(spec)}
                  >
                    <Text style={[styles.specPillText, specialization === spec && styles.specPillTextActive]}>{spec}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.formGroup, { marginTop: 15 }]}>
                <Text style={styles.label}>Clinic Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="home-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Your clinic name"
                    value={clinicName}
                    onChangeText={setClinicName}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Clinic Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Full address"
                    value={clinicAddress}
                    onChangeText={setClinicAddress}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Google Maps Link (Optional)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="link-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    placeholder="https://maps.google.com/..."
                    value={clinicMapLink}
                    onChangeText={setClinicMapLink}
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Supporting Documents</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#0eb5b5" />
                  <Text style={styles.uploadBtnText}>Upload License / Degree</Text>
                </TouchableOpacity>
                {documents.map((doc, idx) => (
                  <Text key={idx} style={styles.documentName} numberOfLines={1}>
                    📎 {doc.name}
                  </Text>
                ))}
              </View>

              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Your registration will be reviewed by admin.{"\n"}
                  You'll be able to see patients once approved.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={loading}>
            <Text style={styles.submitBtnText}>{loading ? "Creating..." : "Create Account"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")} style={{ marginTop: 20 }}>
            <Text style={styles.loginLink}>Already have an account? <Text style={{ color: "#0eb5b5" }}>Log In</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRole("admin")} style={{ marginTop: 25, alignSelf: "center" }}>
            <Text style={{ fontSize: 12, color: "#9ca3af", textDecorationLine: "underline" }}>Admin Register</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#f4f7f6"
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
    color: "#111827"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 15,
    textAlign: "center",
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center"
  },
  roleBtnActive: {
    backgroundColor: "#e6f9f9",
    borderColor: "#0eb5b5"
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280"
  },
  roleTextActive: {
    color: "#0eb5b5"
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8
  },
  inputContainer: {
    position: "relative",
    justifyContent: "center"
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    zIndex: 1
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    zIndex: 1
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 42,
    paddingRight: 40,
    fontSize: 15,
    color: "#111827"
  },
  doctorSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: "#f3f4f6"
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  specPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff"
  },
  specPillActive: {
    backgroundColor: "#0eb5b5",
    borderColor: "#0eb5b5"
  },
  specPillText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500"
  },
  specPillTextActive: {
    color: "#fff"
  },
  submitBtn: {
    backgroundColor: "#0eb5b5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  loginLink: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "500",
    fontSize: 14
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6f9f9",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#0eb5b5",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8
  },
  uploadBtnText: {
    color: "#0eb5b5",
    fontWeight: "600",
    fontSize: 14
  },
  documentName: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    paddingLeft: 4
  },
  infoBanner: {
    backgroundColor: "#e0e7ff",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10
  },
  infoBannerText: {
    color: "#4338ca",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500"
  }
});
