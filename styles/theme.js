import { StyleSheet } from "react-native";

export const theme = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: "700",
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
    }
});
