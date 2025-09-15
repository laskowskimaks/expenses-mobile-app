import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Button, useTheme, Text, Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function Index() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Surface style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="finance" size={80} color={theme.colors.primary} />
          <Text variant="headlineLarge" style={styles.title}>Witaj!</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Zaloguj się lub zarejestruj, aby rozpocząć korzystanie z aplikacji monitorowania wydatków.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            icon="login"
            onPress={() => router.navigate("/login")}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Zaloguj
          </Button>

          <Button
            mode="outlined"
            icon="account-plus-outline"
            onPress={() => router.navigate("/register")}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Zarejestruj
          </Button>
        </View>
      </Surface>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
    color: theme.colors.onSurface,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "90%",
    paddingBottom: 40,
  },
  button: {
    marginTop: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});