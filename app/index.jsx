import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f4f4f4",
      }}
    >
      <View style={{ width: "80%", marginBottom: 20 }}>
        <Button
          title="Zaloguj"
          onPress={() => {
            router.navigate("/login");
          }}
        />
      </View>

      <View style={{ width: "80%" }}>
        <Button
          title="Zarejestruj"
          onPress={() => {
            router.navigate("/register");
          }}
        />
      </View>
    </View>
  );
}
