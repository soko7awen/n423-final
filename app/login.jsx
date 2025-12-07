import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase/firebaseConfig';
import { useAuth } from '../src/auth/AuthContext';
import { useTheme } from '../styles/theme';
import Footer from "../components/Footer";
import { useDevice } from "../app/device-context";
import AnimatedButton from '../components/AnimatedButton';

export default function LoginScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();
    const router = useRouter();
    const { user, loading } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            router.replace('/');
        }
    }, [user, router]);

    const goToSignup = () => {
        router.replace('/signup');
    };

    const handleLogin = async () => {
        if (submitting || loading) return;
        setError('');

        if (!username.trim() || !password) {
            setError('Please enter your username/email and password.');
            return;
        }

        try {
            setSubmitting(true);
            const identifier = username.trim();
            let emailToUse = identifier;

            if (!identifier.includes('@')) {
                const usernameKey = identifier.toLowerCase();
                const docRef = doc(db, 'usernames', usernameKey);
                const snap = await getDoc(docRef);
                if (!snap.exists()) {
                    throw new Error('Username not found. Please check your username or try your email instead.');
                }
                const data = snap.data();
                if (!data?.email) {
                    throw new Error('Username lookup missing email. Try logging in with your email.');
                }
                emailToUse = data.email;
            }

            await signInWithEmailAndPassword(auth, emailToUse, password);
        } catch (e) {
            if (e?.code === 'permission-denied') {
                setError('Username lookup is blocked by Firestore rules. Please log in with your email or allow public read on usernames.');
            } else {
                setError(e.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    {isDesktopWeb && (
                        <Text style={[theme.title, { textAlign: "center" }]}>Log In</Text>
                    )}

                    <View style={styles.formWrap}>
                        <View style={styles.formFields}>
                            <Text style={styles.label}>Username/Email</Text>
                            <TextInput
                                value={username}
                            onChangeText={setUsername}
                            placeholder="Username or email"
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onSubmitEditing={handleLogin}
                            style={styles.input}
                        />

                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            placeholderTextColor="rgba(0,0,0,0.5)"
                            secureTextEntry
                            returnKeyType="go"
                            onSubmitEditing={handleLogin}
                            style={styles.input}
                        />

                            {!!error && <Text style={styles.error}>{error}</Text>}
                            <Text style={styles.helperText}>
                                Don't already have an account?{" "}
                                <Text style={styles.link} onPress={goToSignup}>Sign up</Text>
                            </Text>
                        </View>
                        <AnimatedButton title={submitting ? "Logging in..." : "Login"} onPress={handleLogin} />
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
        maxWidth: 900,
        alignSelf: "center",
        backgroundColor: "#F0F0F0",
        borderWidth: 1.5,
        borderColor: "#C5C5C5",
        borderRadius: 21,
        padding: 20,
        minHeight: 620,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        justifyContent: "space-between",
    },
    formFields: {
        gap: 16,
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
    error: {
        color: "#B00020",
        fontWeight: "600",
        marginTop: 6,
        marginBottom: 2,
    },
    helperText: {
        marginTop: 6,
        fontSize: 14,
    },
    link: {
        color: "#0066CC",
        textDecorationLine: "underline",
    },
});
