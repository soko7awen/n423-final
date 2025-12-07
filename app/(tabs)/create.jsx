import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { useTheme } from '../../styles/theme';
import Footer from "../../components/Footer";
import { useDevice } from "../../app/device-context";

export default function CreateScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    const [title, setTitle] = useState('');
    const [tgdbId, setTgdbId] = useState('');
    const [year, setYear] = useState('');
    const [developer, setDeveloper] = useState('');
    const [platform, setPlatform] = useState('');
    const [manualEntry, setManualEntry] = useState(false);
    const [completionType, setCompletionType] = useState('high-score');
    const [completionValue, setCompletionValue] = useState('');
    const [playerNotes, setPlayerNotes] = useState('');
    const [imageData, setImageData] = useState(null);

    const disabledFieldStyle = { backgroundColor: "#E4E4E4", borderColor: "#CFCFCF", borderWidth: 2 };

    const pickImage = async () => {
        if (!manualEntry) return;
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled || !result.assets?.length) return;

        const uri = result.assets[0].uri;
        const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 512 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipulated.base64) {
            setImageData(`data:image/jpeg;base64,${manipulated.base64}`);
        }
    };

    const renderManualToggle = (extraStyle) => (
        <Pressable style={[styles.rowTopRight, extraStyle]} onPress={() => setManualEntry((prev) => !prev)}>
            <Pressable
                style={styles.checkbox}
                onPress={() => setManualEntry((prev) => !prev)}
            >
                {manualEntry && <View style={styles.checkboxInner} />}
            </Pressable>
            <Text style={styles.checkboxLabel}>Manual Game Entry</Text>
        </Pressable>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={theme.mainContainer}>
                    {isDesktopWeb && (
                        <Text style={[theme.title, { textAlign: "center" }]}>Submit New Game Completion</Text>
                    )}

                    <View style={[styles.panel, !isDesktopWeb && styles.panelMobile]}>
                        {!isDesktopWeb && renderManualToggle(styles.rowTopRightMobile)}
                        <View style={[styles.column, !isDesktopWeb && styles.columnMobile]}>
                            <View style={styles.fieldBlock}>
                                <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Title</Text>
                                <TextInput
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Game title"
                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                    style={[styles.input, !isDesktopWeb && styles.inputMobile]}
                                />
                            </View>

                            <View style={[styles.fieldRow, { gap: 12 }, !isDesktopWeb && styles.fieldRowMobile]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>TGDB ID</Text>
                                    <TextInput
                                        value={tgdbId}
                                        onChangeText={setTgdbId}
                                        placeholder="12345"
                                        placeholderTextColor="rgba(0,0,0,0.5)"
                                        style={[styles.input, !isDesktopWeb && styles.inputMobile, !manualEntry && disabledFieldStyle]}
                                        editable={manualEntry}
                                        focusable={manualEntry}
                                    />
                                </View>
                                <View style={[{ width: 120 }, !isDesktopWeb && styles.yearMobile]}>
                                    <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Year</Text>
                                    <TextInput
                                        value={year}
                                        onChangeText={setYear}
                                        placeholder="2024"
                                        placeholderTextColor="rgba(0,0,0,0.5)"
                                        style={[styles.input, !isDesktopWeb && styles.inputMobile, !manualEntry && disabledFieldStyle]}
                                        editable={manualEntry}
                                        focusable={manualEntry}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.fieldBlock}>
                                <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Developer</Text>
                                <TextInput
                                    value={developer}
                                    onChangeText={setDeveloper}
                                    placeholder="Studio"
                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                    style={[styles.input, !isDesktopWeb && styles.inputMobile, !manualEntry && disabledFieldStyle]}
                                    editable={manualEntry}
                                    focusable={manualEntry}
                                />
                            </View>

                            <View style={styles.fieldBlock}>
                                <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Platform</Text>
                                <TextInput
                                    value={platform}
                                    onChangeText={setPlatform}
                                    placeholder="Platform"
                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                    style={[styles.input, !isDesktopWeb && styles.inputMobile, !manualEntry && disabledFieldStyle]}
                                    editable={manualEntry}
                                    focusable={manualEntry}
                                />
                            </View>

                            <Pressable
                                onPress={pickImage}
                                disabled={!manualEntry}
                                style={[
                                    styles.imageBox,
                                    !manualEntry && { backgroundColor: "#818181", borderColor: "#818181" },
                                    isDesktopWeb ? styles.imageDesktop : styles.imageMobile,
                                ]}
                            >
                                {manualEntry ? (
                                    imageData ? (
                                        <Image source={{ uri: imageData }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.placeholder}>
                                            <Ionicons name="image-outline" size={42} color="#666" />
                                            <Text style={styles.placeholderText}>Tap to add image</Text>
                                        </View>
                                    )
                                ) : (
                                    <View style={styles.disabledPlaceholder}>
                                        <Ionicons name="close-circle" size={80} color="#f2f2f2" />
                                    </View>
                                )}
                            </Pressable>
                        </View>

                        <View style={[styles.column, !isDesktopWeb && styles.columnMobile]}>
                            {isDesktopWeb && renderManualToggle()}

                            <View style={styles.completionGroup}>
                                <Text style={[styles.label, styles.labelTight, !isDesktopWeb && styles.labelMobile]}>Completion</Text>
                                <View style={[styles.fieldRow, { alignItems: 'center', gap: 10 }, !isDesktopWeb && styles.fieldRowMobile]}>
                                    <View style={styles.switcher}>
                                        <Pressable
                                            onPress={() => setCompletionType('high-score')}
                                            style={[
                                                styles.switchBtn,
                                                { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
                                                completionType === 'high-score' && styles.switchBtnActiveGreen,
                                            ]}
                                        >
                                            <Text style={[styles.switchText, completionType === 'high-score' && styles.switchTextActive]}>
                                                High Score
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => setCompletionType('progress')}
                                            style={[
                                                styles.switchBtn,
                                                { borderTopRightRadius: 10, borderBottomRightRadius: 10, borderLeftWidth: 0 },
                                                completionType === 'progress' && styles.switchBtnActiveOrange,
                                            ]}
                                        >
                                            <Text style={[styles.switchText, completionType === 'progress' && styles.switchTextActive]}>
                                                Progress
                                            </Text>
                                        </Pressable>
                                    </View>
                                    <TextInput
                                        value={completionValue}
                                        onChangeText={setCompletionValue}
                                        placeholder="Completion"
                                        placeholderTextColor="rgba(0,0,0,0.5)"
                                        style={[styles.input, styles.inputTight, !isDesktopWeb && styles.inputMobile, { flex: 1 }]}
                                    />
                                </View>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, styles.notesLabel, !isDesktopWeb && styles.labelMobile]}>Player notes</Text>
                                <View style={styles.textareaContainer}>
                                    <TextInput
                                        value={playerNotes}
                                        onChangeText={setPlayerNotes}
                                        placeholder="Add your notes..."
                                        placeholderTextColor="rgba(0,0,0,0.5)"
                                        multiline
                                        style={[styles.input, styles.textarea, !isDesktopWeb && styles.inputMobile]}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
                {isDesktopWeb && <Footer />}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    panel: {
        width: "100%",
        maxWidth: 1100,
        alignSelf: "center",
        backgroundColor: "#F0F0F0",
        borderWidth: 1.5,
        borderColor: "#C5C5C5",
        borderRadius: 21,
        padding: 16,
        minHeight: 620,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        flexDirection: "row",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 20,
    },
    panelMobile: {
        padding: 12,
        minHeight: undefined,
        flexDirection: 'column',
        gap: 12,
    },
    column: {
        flex: 1,
        gap: 4,
        minWidth: 280,
    },
    columnMobile: {
        minWidth: "100%",
        width: "100%",
        gap: 12,
    },
    fieldBlock: {
        gap: 6,
    },
    fieldRow: {
        flexDirection: 'row',
    },
    fieldRowMobile: {
        flexWrap: 'wrap',
        gap: 8,
    },
    label: {
        fontWeight: "700",
        fontSize: 20,
        marginBottom: 8,
    },
    labelMobile: {
        fontSize: 18,
    },
    labelTight: {
        marginBottom: 4,
    },
    input: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 18,
        borderWidth: 1,
        borderColor: "#D0D0D0",
        marginBottom: 8,
    },
    inputMobile: {
        fontSize: 16,
    },
    inputTight: {
        marginBottom: 0,
    },
    imageBox: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#D0D0D0",
        backgroundColor: "#EDEDED",
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    imageDesktop: {
        width: 245,
        aspectRatio: 7 / 5,
        alignSelf: 'flex-start',
    },
    imageMobile: {
        width: "100%",
        aspectRatio: 7 / 5,
        minHeight: 150,
    },
    previewImage: {
        width: "100%",
        height: "100%",
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    placeholderText: {
        color: "#666",
        fontSize: 18,
    },
    disabledPlaceholder: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTopRight: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },
    rowTopRightMobile: {
        marginBottom: 4,
    },
    checkbox: {
        height: 22,
        width: 22,
        borderWidth: 2,
        borderColor: "#555",
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxInner: {
        height: 12,
        width: 12,
        backgroundColor: "#555",
        borderRadius: 3,
    },
    checkboxLabel: {
        fontSize: 22,
        fontWeight: '400',
        userSelect: 'none',
    },
    switcher: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: "#C5C5C5",
        borderRadius: 10,
        overflow: 'hidden',
    },
    switchBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f2f2f2',
        borderRightWidth: 1,
        borderRightColor: "#C5C5C5",
        minWidth: 110,
        alignItems: 'center',
    },
    switchBtnActiveGreen: {
        backgroundColor: "#60E54E",
    },
    switchBtnActiveOrange: {
        backgroundColor: "#E5954E",
    },
    switchText: {
        fontSize: 16,
        fontWeight: '600',
        color: "#444",
        userSelect: 'none',
    },
    switchTextActive: {
        color: "#fff",
    },
    completionGroup: {
        gap: 6,
    },
    notesLabel: {
        marginTop: 32,
        marginBottom: 8,
    },
    textarea: {
        minHeight: 140,
        textAlignVertical: 'top',
        flex: 1,
    },
    textareaContainer: {
        flex: 1,
        minHeight: 180,
    },
});
