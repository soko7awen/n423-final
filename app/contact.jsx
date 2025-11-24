import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useState, useRef } from 'react';

import { useTheme } from '../styles/theme';
import { useDevice } from "../app/_layout";

import Footer from "../components/Footer";
import AnimatedButton from '../components/AnimatedButton';


export default function ContactScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        console.log("Contact?");
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    <Text style={[theme.title, { textAlign: "center" }]}>
                        Reach Out To Us!
                    </Text>

                    <View style={styles.formWrap}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Your Name"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Your Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />

                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Your Message"
                            multiline
                            style={[styles.input, styles.textarea]}
                        />
                        <AnimatedButton title="Contact" onPress={handleSubmit} />
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
        gap: 16,
        minHeight: 620,
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
    textarea: {
        height: 220,
        textAlignVertical: "top",
    },
    button: {
        width: "100%",
        maxWidth: 330,
        backgroundColor: "#60E54E",
        borderWidth: 2,
        borderColor: "#19660F",
        paddingVertical: 16,
        borderRadius: 12,
        alignSelf: "center",
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#19660F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "600",
    },
});
