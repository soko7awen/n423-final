import { StyleSheet } from "react-native";
import { useDevice } from "../app/_layout";

export function useTheme() {
  const { isDesktopWeb } = useDevice();

  return StyleSheet.create({
    scrollContainer: {
      backgroundColor: "#FFF",
      flexGrow: 1,
      justifyContent: "space-between",
    },
    mainContainer: {
      padding: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: "700",
      marginTop: isDesktopWeb ? 40 : 10,
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: "500",
      marginBottom: 30,
      opacity: 0.85,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      marginBottom: 20,
    },
    link: {
      color: "#00AAFF",
      textDecorationLine: "underline",
    },
  });
}
