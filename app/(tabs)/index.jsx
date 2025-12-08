import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDoc, getDocs, doc, query, orderBy, limit } from 'firebase/firestore';

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
        let cancelled = false;
        const loadSubs = async () => {
            try {
                setLoadingSubs(true);
                const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'), limit(12));
                const snap = await getDocs(q);
                if (cancelled) return;
                const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                // hydrate profile details if available
                const profilePromises = raw.map(async (s) => {
                    if (!s.userId) return { userPhoto: null, displayName: null };
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
                const merged = raw.map((s, idx) => ({
                    ...s,
                    userPhoto: profiles[idx]?.userPhoto || null,
                    userDisplayName: profiles[idx]?.displayName || profiles[idx]?.username || null,
                    userUsername: profiles[idx]?.username || null,
                }));
                setSubmissions(merged);
            } catch (err) {
                console.warn('Failed to load submissions', err);
                setSubsError(!user ? 'Sign in to view latest submissions.' : 'Could not load submissions.');
                setSubmissions([]);
            } finally {
                if (!cancelled) setLoadingSubs(false);
            }
        };
        loadSubs();
        return () => { cancelled = true; };
    }, [user]);

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
                                <Pressable onPress={() => router.push("/create")}>
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
            minHeight: isDesktopWeb ? 440 : 360,
            }
        ]}
    >
                    {!!subsError && !user && (
                        <Text style={{ color: '#B00020', marginBottom: 6 }}>{subsError}</Text>
                    )}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ overflow: 'visible' }}
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
                            <GameCard
                                key={s.id}
                                title={s.title}
                                year={s.year}
                                platform={s.platform}
                                completionType={s.completionType}
                                completionValue={s.completionValue}
                                playerNotes={s.playerNotes}
                                imageUrl={s.imageUrl}
                                userName={
                                    s.userDisplayName ||
                                    s.userUsername ||
                                    s.userName ||
                                    'Player'
                                }
                                userPhoto={s.userPhoto}
                                manual={s.manual}
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
