import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { collection, getDoc, doc, query, orderBy, limit, deleteDoc, onSnapshot } from 'firebase/firestore';

import { useTheme } from '../../styles/theme';
import Footer from "../../components/Footer";
import GameCard from "../../components/GameCard";
import { useDevice } from "../../app/device-context";
import { useAuth } from '../../src/auth/AuthContext';
import { db } from '../../src/firebase/firebaseConfig';

export default function HomeScreen() {
    const router = useRouter();
    const { isDesktopWeb } = useDevice();
    const { height } = useWindowDimensions();
    const theme = useTheme();
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubs, setLoadingSubs] = useState(true);
    const [subsError, setSubsError] = useState('');
    const seenIds = useRef(new Set());
    const compactHeight = height < 900;
    const heroTitleSize = Math.round((isDesktopWeb ? 32 : 24) * (compactHeight ? 0.9 : 1));
    const heroSubtitleSize = Math.round((isDesktopWeb ? 22 : 16) * (compactHeight ? 0.92 : 1));
    const sectionTitleSize = Math.round((isDesktopWeb ? 36 : 24) * (compactHeight ? 0.88 : 1));
    const scrollContentStyle = [
        theme.scrollContainer,
        { justifyContent: 'flex-start', paddingBottom: 0 },
    ];

    const styles = StyleSheet.create({
        welcomeText: {
            width: "100%",
            maxWidth: 1200,
            paddingHorizontal: 15,
            marginHorizontal: "auto",
        },
        welcomeTextLink: {
            ...theme.link,
            color: "#062dff",
            cursor: 'pointer',
            transitionProperty: 'color, transform',
            transitionDuration: '140ms',
            transitionTimingFunction: 'ease-out',
        },
        welcomeTextLinkHover: {
            color: "#001ecf",
            textDecorationColor: "#001ecf",
            transform: [{ translateY: -1 }],
        },
        gamesContainer: {
            position: "relative",
            overflow: 'hidden',
        },
        gamesFlex: {
            flexDirection: 'row',
            gap: 16,
            alignItems: 'center',
        },
        fadeRight: {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 110,
            pointerEvents: 'none',
            zIndex: 2000,
            elevation: 20,
        },
    });

    useEffect(() => {
        const isFabric = Boolean(global?.nativeFabricUIManager);
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental && !isFabric) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(15));
        setLoadingSubs(true);
        const unsubscribe = onSnapshot(
            q,
            async (snap) => {
                if (cancelled) return;
                const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                const profilePromises = raw.map(async (s) => {
                    if (!s.userId) return { userPhoto: null, displayName: null, username: null };
                    try {
                        const profileSnap = await getDoc(doc(db, 'profiles', s.userId));
                        const pdata = profileSnap.data();
                        return {
                            userPhoto: pdata?.photoData || null,
                            displayName: pdata?.displayName || pdata?.name || null,
                            username: pdata?.username || null,
                        };
                    } catch {
                        return { userPhoto: null, displayName: null, username: null };
                    }
                });
                const profiles = await Promise.all(profilePromises);
                if (cancelled) return;
                const merged = raw.map((s, idx) => ({
                    ...s,
                    userPhoto: profiles[idx]?.userPhoto || null,
                    userDisplayName: profiles[idx]?.displayName || profiles[idx]?.username || null,
                    userUsername: profiles[idx]?.username || null,
                }));
                const layoutAnim = LayoutAnimation.create(
                    320,
                    LayoutAnimation.Types.easeInEaseOut,
                    LayoutAnimation.Properties.scaleXY
                );
                LayoutAnimation.configureNext(layoutAnim);
                setSubmissions(merged);
                setSubsError('');
                setLoadingSubs(false);
            },
            (err) => {
                console.warn('Failed to load submissions', err);
                if (!cancelled) {
                    setSubsError(!user ? 'Sign in to view latest submissions.' : 'Could not load submissions.');
                    setSubmissions([]);
                    setLoadingSubs(false);
                }
            }
        );
        return () => { cancelled = true; unsubscribe(); };
    }, [user]);

    const handleDeleteSubmission = async (id, ownerId) => {
        if (!user || user.uid !== ownerId) {
            setSubsError('You can only delete your own submissions.');
            return;
        }
        try {
            await deleteDoc(doc(db, 'submissions', id));
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
            setSubsError('');
        } catch (err) {
            console.warn('Failed to delete submission', err);
            setSubsError('Could not delete this submission.');
        }
    };
    const AnimatedSubmissionCard = ({ submission, onDelete, seenIds }) => {
        const initialValue = seenIds.current.has(submission.id) ? 1 : 0;
        const anim = useRef(new Animated.Value(initialValue)).current;
        const isWeb = Platform.OS === 'web';

        useEffect(() => {
            if (!seenIds.current.has(submission.id)) {
                seenIds.current.add(submission.id);
                Animated.spring(anim, {
                    toValue: 1,
                    friction: 7,
                    tension: 90,
                    useNativeDriver: true,
                }).start();
            } else {
                anim.setValue(1);
            }
        }, [anim, seenIds, submission.id]);

        const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.78, 1],
        });
        const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [isWeb ? 12 : 28, 0],
        });

        return (
            <Animated.View
                style={{
                    transform: [{ scale }, { translateY }],
                    opacity: anim,
                }}
            >
                <GameCard
                    submissionId={submission.id}
                    gameId={submission.gameId}
                    ownerId={submission.userId}
                    onDelete={() => onDelete(submission.id, submission.userId)}
                    title={submission.title}
                    year={submission.year}
                    platform={submission.platform}
                    completionType={submission.completionType}
                    completionValue={submission.completionValue}
                    playerNotes={submission.playerNotes}
                    imageUrl={submission.imageUrl}
                    userName={
                        submission.userDisplayName ||
                        submission.userUsername ||
                        submission.userName ||
                        'Player'
                    }
                    userPhoto={submission.userPhoto}
                    manual={submission.manual}
                />
            </Animated.View>
        );
    };

    return (
        <ScrollView contentContainerStyle={scrollContentStyle}>
            <LinearGradient
                colors={['rgba(250, 218, 97, 1)', 'rgba(255, 145, 136, 1)', 'rgba(255, 90, 205, 1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={[styles.welcomeText, compactHeight && { paddingVertical: 16 }]}>
                    <Text style={[
                        theme.title,
                        {
                            marginTop: compactHeight ? 16 : 30,
                            marginBottom: compactHeight ? 12 : theme.title.marginBottom,
                            fontSize: heroTitleSize,
                            textAlign: "center",
                        }
                    ]}>
                        Welcome to LOREBoards!
                    </Text>
                    <Text style={[
                        theme.subtitle,
                        {
                            textAlign: "center",
                            fontSize: heroSubtitleSize,
                            marginBottom: compactHeight ? 18 : theme.subtitle.marginBottom,
                        }
                    ]}>
                        {user ? (
                            <>
                                Looking to add a game completion of your own?{" "}
                                <Pressable onPress={() => router.push("/submit")}>
                                    {({ hovered, pressed }) => (
                                        <Text
                                            style={[
                                                styles.welcomeTextLink,
                                                (hovered || pressed) && styles.welcomeTextLinkHover,
                                            ]}
                                        >
                                            Submit a New Entry
                                        </Text>
                                    )}
                                </Pressable>
                                .
                            </>
                        ) : (
                            <>
                                To add entries of your own, you will need{" "}
                                <Pressable onPress={() => router.push("/login")}>
                                    {({ hovered, pressed }) => (
                                        <Text
                                            style={[
                                                styles.welcomeTextLink,
                                                (hovered || pressed) && styles.welcomeTextLinkHover,
                                            ]}
                                        >
                                            Log In
                                        </Text>
                                    )}
                                </Pressable>{" "}
                                or{" "}
                                <Pressable onPress={() => router.push("/signup")}>
                                    {({ hovered, pressed }) => (
                                        <Text
                                            style={[
                                                styles.welcomeTextLink,
                                                (hovered || pressed) && styles.welcomeTextLinkHover,
                                            ]}
                                        >
                                            Create an Account
                                        </Text>
                                    )}
                                </Pressable>.
                            </>
                        )}
                    </Text>
                </View>
            </LinearGradient>
            <View style={[theme.mainContainer, compactHeight && { paddingVertical: 16 }]}>
                <Text style={[
                    theme.title,
                    {
                        marginLeft: isDesktopWeb ? "5%" : 0,
                        fontSize: sectionTitleSize,
                        marginTop: compactHeight ? 16 : undefined,
                        marginBottom: compactHeight ? 14 : undefined,
                    }
                ]}>
                    Latest Submissions:
                </Text>

                <View
                    style={[
                        styles.gamesContainer,
                        {
                            marginLeft: isDesktopWeb ? "5%" : 0,
                            width: isDesktopWeb ? '95%' : '100%',
            minHeight: isDesktopWeb ? 760 : 640,
            }
        ]}
    >
                    {!!subsError && !user && (
                        <Text style={{ color: '#B00020', marginBottom: 6 }}>{subsError}</Text>
                    )}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        nestedScrollEnabled
                        scrollEventThrottle={16}
                        style={{ overflow: 'auto' }}
                        contentContainerStyle={[
                            styles.gamesFlex,
                            {
                                paddingHorizontal: 4,
                                paddingVertical: 12,
                                overflow: 'visible',
                                minHeight: isDesktopWeb ? 260 : 220,
                                paddingRight: 40,
                            }
                        ]}
                    >
                        {submissions.length === 0 && !loadingSubs && (
                            <Text style={{ color: "#555" }}>No submissions yet.</Text>
                        )}
                        {submissions.map((s) => (
                            <AnimatedSubmissionCard
                                key={s.id}
                                submission={s}
                                onDelete={handleDeleteSubmission}
                                seenIds={seenIds}
                            />
                        ))}
                    </ScrollView>
            <LinearGradient
                pointerEvents="none"
                colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.4)',
                    'rgba(255,255,255,0.75)',
                    'rgba(255,255,255,0.9)',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.fadeRight}
            />
        </View>
    </View>
            <Footer />
        </ScrollView>
    );
}
