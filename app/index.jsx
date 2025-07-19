import { useRouter } from "expo-router";
import { Button, View, StyleSheet } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Button
          title="Zaloguj"
          onPress={() => {
            router.navigate("/login");
          }}
        />
      </View>

      <View style={styles.buttonWrapper}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  buttonWrapper: {
    width: "80%",
    marginBottom: 20,
  },
});
