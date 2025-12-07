import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { useDevice } from "../../app/device-context";
import { useAuth } from '../../src/auth/AuthContext';
import { db, auth } from '../../src/firebase/firebaseConfig';

export default function ProfileScreen() {
    const { isDesktopWeb } = useDevice();
    const router = useRouter();
    const { signOut, user, loading } = useAuth();
    const [photoData, setPhotoData] = useState(null);

    useEffect(() => {
        if (isDesktopWeb) {
            router.replace('/');
        }
    }, [isDesktopWeb, router]);

    useFocusEffect(() => {
        if (!isDesktopWeb && !loading && !user) {
            router.replace('/');
            setTimeout(() => router.push('/login'), 0);
        }
    });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) {
                setPhotoData(null);
                return;
            }
            try {
                const snap = await getDoc(doc(db, 'profiles', user.uid));
                const data = snap.data();
                setPhotoData(data?.photoData || user.photoURL || null);
            } catch {
                setPhotoData(user?.photoURL || null);
            }
        };
        loadProfile();
    }, [user]);

    const handlePickImage = async () => {
        if (!auth.currentUser) return;
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            aspect: [1, 1],
        });
        if (result.canceled || !result.assets?.length) return;

        const uri = result.assets[0].uri;
        try {
            const manipulated = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 128 } }],
                { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            if (!manipulated.base64) return;
            const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
            await setDoc(doc(db, 'profiles', auth.currentUser.uid), { photoData: dataUrl }, { merge: true });
            setPhotoData(dataUrl);
            if (dataUrl.length < 1900) {
                await updateProfile(auth.currentUser, { photoURL: dataUrl });
            }
        } catch (e) {
            console.warn('Failed to update profile photo', e);
        }
    };

    if (isDesktopWeb || loading || !user) return null;

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';

    return (
        <View style={styles.container}>
            <View style={styles.profileHeader}>
                <Pressable onPress={handlePickImage}>
                    {photoData
                        ? <Image source={{ uri: photoData }} style={styles.avatar} />
                        : <Ionicons name="person-circle-outline" size={72} color="#444" />}
                    <Text style={styles.changePhotoText}>Change photo</Text>
                </Pressable>
                <Text style={styles.name}>{displayName}</Text>
            </View>
            <View style={styles.topList}>
                <Pressable style={styles.listItem} onPress={() => router.push('/search')}>
                    <Text style={styles.listText}>View Completions</Text>
                </Pressable>
            </View>
            <Pressable style={styles.logoutBtn} onPress={signOut}>
                <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 30,
        justifyContent: 'space-between',
    },
    profileHeader: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 4,
    },
    changePhotoText: {
        fontSize: 14,
        color: '#0066CC',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        width: '100%',
    },
    topList: {
        gap: 12,
    },
    listItem: {
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#dcdcdc',
        borderRadius: 14,
        backgroundColor: '#f7f7f7',
    },
    listText: {
        fontSize: 18,
        fontWeight: '600',
    },
    logoutBtn: {
        paddingVertical: 16,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#E5954E',
        borderWidth: 2,
        borderColor: '#66380F',
        alignItems: 'center',
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
