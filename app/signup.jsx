import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../styles/theme';
import Footer from "../components/Footer";
import { useDevice } from "../app/_layout";
import AnimatedButton from '../components/AnimatedButton';

export default function SignupScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = () => {
        console.log({ username, email, password });
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    <Text style={[theme.title, { textAlign: "center" }]}>Create your Account</Text>
                    <View style={styles.formWrap}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                            style={styles.input}
                        />
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            secureTextEntry
                            style={styles.input}
                        />
                        <AnimatedButton title="Sign Up" onPress={handleSignup} />
                    </View>
                </View>
                {isDesktopWeb && <Footer />}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    formWrap: {
        width: "100%",
        maxWidth: 600,
        alignSelf: "center",
        backgroundColor: "#F0F0F0",
        borderWidth: 1.5,
        borderColor: "#C5C5C5",
        borderRadius: 21,
        padding: 20,
        gap: 16,
        minHeight: 400,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
    },
    label: {
        fontWeight: "700",
        fontSize: 20,
    },
    input: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 18,
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
});
