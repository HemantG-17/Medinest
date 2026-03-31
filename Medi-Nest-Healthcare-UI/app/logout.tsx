import { useEffect } from "react";
import { router } from "expo-router";
// import { logoutUser } from "../_utils/auth";

export default function Logout() {
  useEffect(() => {
    // logoutUser();
    router.replace("/login");
  }, []);

  return null;
}
