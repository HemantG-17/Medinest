# Medi-Nest: Smart Healthcare Platform

![Medi-Nest Logo](Medi-Nest-Healthcare-UI/assets/images/logo-premium.png)

**Medi-Nest** is a full-stack, AI-integrated healthcare system designed to streamline patient-doctor interactions, appointment scheduling, and preliminary medical diagnostics.

---

## 🚀 Navigation

This is a monorepo containing both the Frontend and Backend services:
1.  **[Frontend (React Native/Expo)](Medi-Nest-Healthcare-UI/)**
2.  **[Backend (Node.js/Express)](Medi-Nest-Backend/)**

---

## ✨ Key Features

### 🏥 For Patients
- **Location-Aware Feed**: Instantly find the nearest doctors based on your device GPS.
- **AI Symptom Checker**: Chat with **MediBot** for preliminary health insights and specialist recommendations.
- **Secure Booking**: Managed appointment cycle with 6-digit OTP visit verification.
- **Premium UI**: Modern, glassmorphic design built with Expo and React Native.

### 👨‍⚕️ For Doctors
- **Appointment Management**: Seamlessly approve or reject incoming patient requests.
- **OTP Verification**: Securely complete consultations by verifying patient-provided codes.
- **Profile Customization**: Manage clinic details, fees, and specialization.

### 🛡️ For Administrators
- **Doctor Verification**: Review and approve professional licenses and clinic details.
- **AI Training**: "Teach" the AI system by resolving unrecognized patient queries.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo Router, Ionicons, AsyncStorage.
- **Backend**: Node.js, Express.js, JWT Auth, Multer (Cloudinary).
- **Database**: MongoDB (Mongoose).
- **Payment**: Razorpay Integration.
- **Storage**: Cloudinary for medical documents and profile pictures.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Expo Go app on your mobile device (for testing)

### 2. Setup Backend
```bash
cd Medi-Nest-Backend
npm install
# Create a .env file with your MONGO_URI and PORT
npm run dev
```

### 3. Setup Frontend
```bash
cd Medi-Nest-Healthcare-UI
npm install
# Create a .env file with your EXPO_PUBLIC_API_URL
npx expo start
```

---

## 📄 Documentation
For a deeper dive into the methodology and implementation of this project, refer to the **[Research Paper](C:/Users/groha/.gemini/antigravity/brain/a39c7124-ea75-4d7c-8a3f-7ea302c72b07/research_paper.md)** created for this platform.

---

frontend:https://medinest-ecru.vercel.app/login
backend:https://medi-nest-backend.onrender.com

---
**Developed by Hemant Gupta**


