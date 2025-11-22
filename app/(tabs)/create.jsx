import { router } from 'expo-router';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function CreateScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to Details!</Text>
            <View style={styles.button}>
            <Button
            title="Go to *Detail*"
            onPress={() => router.push("/detail")}
            />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 32,
        textAlign: "center",
        marginTop: 50,
        marginBottom: 40,
    },
    body: {
        fontSize: 16,
    },
    image: {
        aspectRatio: 1,
        width: "60%",
        height: "auto",
        borderRadius: 20,
        marginLeft: "auto",
        marginRight: "auto"
    },
    button: {
        width: "200px",
        marginLeft: "auto",
        marginRight: "auto",
    }
});