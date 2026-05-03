import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import API from "../services/api";

export default function Index() {
  const [res, setRes] = useState({})
  useEffect(() => {
    API.get("/")
      .then((res) => {
        setRes(res.data)
        console.log("Backend:", res.data);
      })
      .catch((err) => {
        setRes(err.message)
        console.log("Error:", err.message);
      });
  }, []);

  return (
    <View style={{ 
    flex: 1,                 // Fill the whole screen
    justifyContent: "center", // Vertical center
    alignItems: "center",     // Horizontal center
    padding: 20              // Prevents text from hitting screen edges
  }}>
    <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
      Home Screen (Check console)
    </Text>
    
    <Text style={{ textAlign: 'center', color: '#555' }}>
      No Need to check console, it's here:
    </Text>
    
    {/* Displaying the data in a cleaner way */}
    <Text style={{ 
      marginTop: 10, 
      backgroundColor: '#f0f0f0', 
      padding: 10, 
      borderRadius: 5,
      fontFamily: 'monospace' // Makes it look like code
    }}>
      {JSON.stringify(res, null, 2)} 
    </Text>
</View>

  );
}
