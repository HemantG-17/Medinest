import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { applyDoctor } from "../../_utils/api";

export default function ApplyDoctor() {
  const [specialization, setSpecialization] = useState("");
  const [fees, setFees] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicMapLink, setClinicMapLink] = useState("");

  const [profilePic, setProfilePic] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // 📸 PICK IMAGE
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0]);
    }
  };

  // 📄 PICK DOCUMENT
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
    });

    if (result.assets) {
      setDocuments(result.assets);
    }
  };

  // 🚀 SUBMIT
  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      formData.append("specialization", specialization);
      formData.append("fees", fees);
      formData.append("phone", phone);
      formData.append("clinicAddress", clinicAddress);
      formData.append("clinicMapLink", clinicMapLink);

      // 🔥 PROFILE PIC
      if (profilePic) {
        formData.append("profilePic", {
          uri: profilePic.uri,
          type: "image/jpeg",
          name: "profile.jpg",
        } as any);
      }

      // 🔥 DOCUMENTS
      documents.forEach((doc, i) => {
        formData.append("documents", {
          uri: doc.uri,
          type: "application/pdf",
          name: `doc${i}.pdf`,
        } as any);
      });

      await applyDoctor(formData);

      alert("✅ Application submitted!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        Apply as Doctor
      </Text>

      {/* INPUTS */}
      <TextInput
        placeholder="Specialization"
        value={specialization}
        onChangeText={setSpecialization}
        style={styles.input}
      />

      <TextInput
        placeholder="Fees"
        value={fees}
        onChangeText={setFees}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />

      <TextInput
        placeholder="Clinic Address"
        value={clinicAddress}
        onChangeText={setClinicAddress}
        style={styles.input}
      />

      <TextInput
        placeholder="Google Maps Link"
        value={clinicMapLink}
        onChangeText={setClinicMapLink}
        style={styles.input}
      />

      {/* PROFILE PIC */}
      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Text>Upload Profile Picture</Text>
      </TouchableOpacity>

      {profilePic && (
        <Image
          source={{ uri: profilePic.uri }}
          style={{ width: 100, height: 100, marginTop: 10 }}
        />
      )}

      {/* DOCUMENTS */}
      <TouchableOpacity style={styles.btn} onPress={pickDocument}>
        <Text>Upload Documents</Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 10 }}>
        {documents.length} documents selected
      </Text>

      {/* SUBMIT */}
      <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Submit Application
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  btn: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
  },
  submit: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
  },
};