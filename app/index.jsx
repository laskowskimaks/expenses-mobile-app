import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useSQLiteContext } from "expo-sqlite";

export default function Index() {
  const router = useRouter();
  const db = useSQLiteContext();
  useDrizzleStudio(db);

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
          title="Zarejestruj i zaloguj"
          onPress={() => {
            router.navigate("/register");
          }}
        />
      </View>
    </View>
  );
}
