import { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, deleteDoc } from 'firebase/firestore';

import { useTheme } from '../styles/theme';
import Footer from "../components/Footer";
import GameCard from "../components/GameCard";
import { useDevice } from "../app/device-context";
import { db } from '../src/firebase/firebaseConfig';
import { useAuth } from '../src/auth/AuthContext';

export default function SearchScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const getParam = (key) => {
        const value = params[key];
        return Array.isArray(value) ? value[0] : (value || '');
    };
    const initialQuery = getParam('query');
    const initialUser = getParam('user');
    const initialGameId = getParam('gameId');
    const initialIgdbId = '';
    const [queryText, setQueryText] = useState(initialQuery);
    const [userQuery, setUserQuery] = useState(initialUser);
    const [gameIdParam, setGameIdParam] = useState(initialGameId);
    const [igdbIdParam, setIgdbIdParam] = useState(initialIgdbId);
    const [sortOption, setSortOption] = useState('newest');
    const [showParameters, setShowParameters] = useState(Boolean(initialUser));
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        const q = getParam('query');
        const u = getParam('user');
        const g = getParam('gameId');
        if (typeof q === 'string') setQueryText(q);
        if (typeof u === 'string') {
            setUserQuery(u);
            if (u.trim()) setShowParameters(true);
        }
        if (typeof g === 'string') setGameIdParam(g);
    }, [params.query, params.user, params.gameId]);

    useEffect(() => {
        let cancelled = false;
        const loadSubmissions = async () => {
            try {
                setLoading(true);
                setError('');
                const q = query(
                    collection(db, 'submissions'),
                    orderBy('createdAt', 'desc'),
                    limit(120),
                );
                const snap = await getDocs(q);
                if (cancelled) return;
                const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
                const profilePromises = raw.map(async (s) => {
                    if (!s.userId) return null;
                    try {
                        const profileSnap = await getDoc(doc(db, 'profiles', s.userId));
                        return profileSnap.data() || null;
                    } catch {
                        return null;
                    }
                });
                const profiles = await Promise.all(profilePromises);
                const merged = raw.map((s, idx) => {
                    const profile = profiles[idx];
                    const displayName = profile?.displayName || profile?.username || s.userName || '';
                    return {
                        ...s,
                        userPhoto: profile?.photoData || s.userPhoto || null,
                        userDisplayName: displayName,
                        userUsername: profile?.username || s.userUsername || '',
                    };
                });
                setSubmissions(merged);
            } catch (err) {
                console.warn('Failed to load submissions', err);
                setError('Could not load submissions right now.');
                setSubmissions([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadSubmissions();
        return () => { cancelled = true; };
    }, []);

    const handleDeleteSubmission = async (id, ownerId) => {
        if (!user || user.uid !== ownerId) {
            setDeleteError('You can only delete your own submissions.');
            return;
        }
        try {
            await deleteDoc(doc(db, 'submissions', id));
            setSubmissions((prev) => prev.filter((s) => s.id !== id));
            setDeleteError('');
        } catch (err) {
            console.warn('Failed to delete submission', err);
            setDeleteError('Could not delete this submission.');
        }
    };

    const results = useMemo(() => {
        const text = queryText.trim().toLowerCase();
        const userText = userQuery.trim().toLowerCase();
        const gameIdFilter = (gameIdParam || '').trim();
        const toMillis = (ts) => {
            if (!ts) return 0;
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (ts.seconds != null) return (ts.seconds * 1000) + Math.round((ts.nanoseconds || 0) / 1e6);
            if (typeof ts === 'number') return ts;
            return 0;
        };
        const sorters = {
            newest: (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt),
            oldest: (a, b) => toMillis(a.createdAt) - toMillis(b.createdAt),
            titleAZ: (a, b) => (a.title || '').localeCompare(b.title || ''),
            titleZA: (a, b) => (b.title || '').localeCompare(a.title || ''),
            platformAZ: (a, b) => (a.platform || '').localeCompare(b.platform || ''),
        };

        const filtered = submissions.filter((s) => {
            const haystack = [
                s.title,
                s.platform,
                s.developer,
                s.year,
                s.completionType,
                s.completionValue,
                s.playerNotes,
            ].filter(Boolean).join(' ').toLowerCase();
            const userHaystack = [
                s.userDisplayName,
                s.userUsername,
                s.userName,
            ].filter(Boolean).join(' ').toLowerCase();
            const matchesQuery = !text || haystack.includes(text);
            const matchesUser = !userText || userHaystack.includes(userText);
            const matchesGameId = !gameIdFilter || s.gameId === gameIdFilter;
            return matchesQuery && matchesUser && matchesGameId;
        });

        const sorter = sorters[sortOption] || sorters.newest;
        return [...filtered].sort(sorter);
    }, [queryText, userQuery, sortOption, submissions]);

    const sortOptions = [
        { key: 'newest', label: 'Newest' },
        { key: 'oldest', label: 'Oldest' },
        { key: 'titleAZ', label: 'Title A-Z' },
        { key: 'titleZA', label: 'Title Z-A' },
        { key: 'platformAZ', label: 'Platform A-Z' },
    ];

    const clearGameIdFilter = () => {
        setGameIdParam('');
        router.replace('/search');
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={theme.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={theme.mainContainer}>
                    <View style={[styles.panel, { minHeight: isDesktopWeb ? 620 : undefined }]}>
                        <View style={[
                            styles.searchRow,
                            !isDesktopWeb && { flexDirection: 'column', alignItems: 'stretch' },
                        ]}>
                            <Text style={styles.searchLabel}>Search:</Text>
                            <TextInput
                                value={queryText}
                                onChangeText={setQueryText}
                                placeholder="Search titles, platforms, companies, notes..."
                                placeholderTextColor="rgba(0,0,0,0.5)"
                                style={[
                                    styles.searchInput,
                                    !isDesktopWeb && { width: '100%' },
                                ]}
                                returnKeyType="search"
                            />
                            <Pressable onPress={() => setShowParameters((prev) => !prev)}>
                                {({ hovered, pressed }) => (
                                    <Text style={[
                                        styles.parametersLink,
                                        (hovered || pressed) && styles.parametersLinkHover,
                                    ]}>
                                        Search Parameters
                                    </Text>
                                )}
                            </Pressable>
                        </View>

                        {showParameters && (
                            <View style={styles.parametersBox}>
                                {!!gameIdParam && (
                                    <View style={styles.filterRow}>
                                        <Text style={styles.parametersLabel}>Active game filter</Text>
                                        <Pressable
                                            onPress={clearGameIdFilter}
                                            style={({ hovered, pressed }) => [
                                                styles.filterPill,
                                                (hovered || pressed) && styles.filterPillHover,
                                            ]}
                                        >
                                            <Text style={styles.filterPillText}>
                                                gameId: {gameIdParam}
                                            </Text>
                                            <Text style={styles.filterPillClear}>×</Text>
                                        </Pressable>
                                    </View>
                                )}
                                <Text style={styles.parametersLabel}>Filter by user</Text>
                                <TextInput
                                    value={userQuery}
                                    onChangeText={setUserQuery}
                                    placeholder="Display name or username"
                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                    style={styles.input}
                                    returnKeyType="search"
                                />
                                <Text style={[styles.parametersLabel, { marginTop: 6 }]}>Sort</Text>
                                <View style={styles.sortRow}>
                                    {sortOptions.map((option) => {
                                        const active = sortOption === option.key;
                                        return (
                                            <Pressable
                                                key={option.key}
                                                onPress={() => setSortOption(option.key)}
                                                style={[
                                                    styles.sortPill,
                                                    active && styles.sortPillActive,
                                                ]}
                                            >
                                                <Text style={[
                                                    styles.sortPillText,
                                                    active && styles.sortPillTextActive,
                                                ]}>
                                                    {option.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <Text style={styles.helperText}>
                                    Searches match game title, platform, year, developer, notes, and completion details.
                                </Text>
                            </View>
                        )}

                        <Text style={styles.resultsLabel}>Results:</Text>

                        <View style={styles.resultsBox}>
                            {loading && (
                                <View style={styles.statusRow}>
                                    <ActivityIndicator size="small" color="#333" />
                                    <Text style={styles.statusText}>Loading submissions…</Text>
                                </View>
                            )}
                            {!!error && !loading && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                            {!!deleteError && !loading && (
                                <Text style={styles.errorText}>{deleteError}</Text>
                            )}
                            {!loading && !error && (
                                <>
                                    <Text style={styles.countText}>
                                        Showing {results.length} of {submissions.length} submissions
                                    </Text>
                                    <View style={[
                                        styles.cardsWrap,
                                        !isDesktopWeb && { justifyContent: 'center' },
                                    ]}>
                                        {results.map((s) => (
                                            <GameCard
                                                key={s.id}
                                                submissionId={s.id}
                                                gameId={s.gameId}
                                                ownerId={s.userId}
                                                onDelete={() => handleDeleteSubmission(s.id, s.userId)}
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
                                        {results.length === 0 && (
                                            <Text style={styles.emptyText}>
                                                No matches. Try a different search term or sort option.
                                            </Text>
                                        )}
                                    </View>
                                </>
                            )}
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
        padding: 20,
        gap: 14,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        marginTop: 30,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchLabel: {
        fontWeight: "800",
        fontSize: 20,
    },
    searchInput: {
        flex: 1,
        minWidth: 260,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    parametersLink: {
        color: "#0066CC",
        textDecorationLine: "underline",
        fontWeight: "600",
    },
    parametersLinkHover: {
        color: "#003d99",
    },
    parametersBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#D6D6D6",
        padding: 14,
        gap: 8,
    },
    parametersLabel: {
        fontWeight: "700",
        fontSize: 16,
    },
    filterRow: {
        gap: 8,
        marginBottom: 8,
    },
    filterPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#E8F0FE',
        borderColor: '#C5D6FF',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    filterPillHover: {
        backgroundColor: '#dbe7ff',
    },
    filterPillText: {
        fontWeight: '700',
        color: '#1a3c84',
    },
    filterPillClear: {
        fontWeight: '800',
        color: '#1a3c84',
    },
    input: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#D0D0D0",
    },
    sortRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 2,
    },
    sortPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#E8EBF5",
        borderWidth: 1,
        borderColor: "#CCD2E4",
    },
    sortPillActive: {
        backgroundColor: "#2F5CF0",
        borderColor: "#1E3CB8",
    },
    sortPillText: {
        color: "#1E2A4A",
        fontWeight: "700",
    },
    sortPillTextActive: {
        color: "#FFFFFF",
    },
    helperText: {
        fontSize: 13,
        color: "#444",
        marginTop: 2,
    },
    resultsLabel: {
        fontWeight: "800",
        fontSize: 17,
    },
    resultsBox: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#DADADA",
        padding: 14,
        minHeight: 260,
        gap: 8,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    statusText: {
        fontSize: 15,
        color: "#333",
    },
    errorText: {
        color: "#B00020",
        fontWeight: "600",
    },
    countText: {
        color: "#444",
        fontSize: 13,
    },
    cardsWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        marginTop: 6,
    },
    emptyText: {
        fontSize: 15,
        color: "#555",
        marginTop: 10,
    },
});
