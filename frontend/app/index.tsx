import { useEffect } from "react";
import { Text, View } from "react-native";
import API from "../services/api";

export default function Index() {
  useEffect(() => {
    API.get("/")
      .then((res) => {
        console.log("Backend:", res.data);
      })
      .catch((err) => {
        console.log("Error:", err.message);
      });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Screen (Check console)</Text>
    </View>
  );
}
