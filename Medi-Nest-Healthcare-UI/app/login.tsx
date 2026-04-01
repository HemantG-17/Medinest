import { Image, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { isValidEmail, isValidPassword } from "../_utils/validation";
import { loginUser, Role } from "../_utils/auth";
import { saveAuth } from "../_utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ROLE_DASHBOARD_MAP = {
  patient: "/(tabs)/home",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
} as const;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) return setError("All fields are required");
    if (!isValidEmail(email)) return setError("Invalid email address");
    if (!isValidPassword(password)) return setError("Password must be 6+ chars with a number");

    try {
      setLoading(true);
      const data = await loginUser(email, password);

      if (data.user.role !== role) {
        setLoading(false);
        return setError(`Account not found associated with the ${role} portal`);
      }

      await saveAuth(data.token, data.user);

      // Persist name and profilePic for quick access on home screen
      if (data.user.name) await AsyncStorage.setItem("name", data.user.name);
      if (data.user.profilePic) await AsyncStorage.setItem("profilePic", data.user.profilePic);

      const dashboardRoute = ROLE_DASHBOARD_MAP[data.user.role as keyof typeof ROLE_DASHBOARD_MAP];
      router.replace(dashboardRoute);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Back Button Simulation */}
        <View style={styles.backButton}>
          <Text style={styles.backText}>Sign In</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../assets/images/logo_premium.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to Medinest</Text>

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

          <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/register")} style={{ marginTop: 25 }}>
            <Text style={styles.loginLink}>Don't have an account? <Text style={{ color: "#0eb5b5" }}>Sign Up</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRole("admin")} style={{ marginTop: 25, alignSelf: "center" }}>
            <Text style={{ fontSize: 12, color: "#9ca3af", textDecorationLine: "underline" }}>Admin Login</Text>
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
    paddingBottom: 40,
    justifyContent: "center",
    flexGrow: 1
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
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
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
  }
});