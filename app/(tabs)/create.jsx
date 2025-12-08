import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, Pressable, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { collection, query, orderBy, startAt, endAt, limit, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';

import { useTheme } from '../../styles/theme';
import Footer from "../../components/Footer";
import { useDevice } from "../../app/device-context";
import { useAuth } from '../../src/auth/AuthContext';
import { db } from '../../src/firebase/firebaseConfig';

export default function CreateScreen() {
    const router = useRouter();
    const { isDesktopWeb } = useDevice();
    const { user } = useAuth();
    const theme = useTheme();
    const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

    const [title, setTitle] = useState('');
    const [tgdbId, setTgdbId] = useState('');
    const [year, setYear] = useState('');
    const [developer, setDeveloper] = useState('');
    const [platform, setPlatform] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [selectedReleases, setSelectedReleases] = useState([]);
    const [platformOptions, setPlatformOptions] = useState([]);
    const [manualEntry, setManualEntry] = useState(false);
    const [completionType, setCompletionType] = useState('high-score');
    const [completionValue, setCompletionValue] = useState('');
    const [playerNotes, setPlayerNotes] = useState('');
    const [imageData, setImageData] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [localResults, setLocalResults] = useState([]);
    const [remoteResults, setRemoteResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [titleLocked, setTitleLocked] = useState(false);
    const [metadataLocked, setMetadataLocked] = useState(false);
    const titleInputRef = useRef(null);
    const [titleFieldLayout, setTitleFieldLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const skipNextSearch = useRef(false);
    const [loreGameId, setLoreGameId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
    const [showManualPlatformDropdown, setShowManualPlatformDropdown] = useState(false);
    const [manualAddMode, setManualAddMode] = useState(false);
    const [newPlatformText, setNewPlatformText] = useState('');
    const [platformSearchResults, setPlatformSearchResults] = useState([]);
    const [platformSearchLoading, setPlatformSearchLoading] = useState(false);
    const [platformSearchError, setPlatformSearchError] = useState('');
    const allPlatformNames = useMemo(() => {
        const names = [];
        const addName = (val) => {
            if (!val || typeof val !== 'string') return;
            const trimmed = val.trim();
            if (trimmed && !names.includes(trimmed)) names.push(trimmed);
        };
        platformOptions.forEach(addName);
        selectedReleases.forEach((r) => addName(r?.name || ''));
        selectedPlatforms.forEach(addName);
        addName(platform);
        return names;
    }, [platform, platformOptions, selectedPlatforms, selectedReleases]);

    const shouldShowSuggestions = !manualEntry && !titleLocked && title.trim().length >= 2 && (searchLoading || searchError || searchResults.length > 0);
    const hasMeasuredTitle = Number.isFinite(titleFieldLayout.width) && titleFieldLayout.width > 0;
    const platformChoices = useMemo(() => {
        const seen = new Set();
        return platformOptions.filter((p) => {
            if (!p || seen.has(p)) return false;
            seen.add(p);
            return true;
        });
    }, [platformOptions]);

    const dedupeReleases = (list) => {
        const byName = new Map();
        (list || []).forEach((r) => {
            if (!r?.name) return;
            const existing = byName.get(r.name);
            const candidateDate = r.date || null;
            if (!existing || (candidateDate && (!existing.date || candidateDate < existing.date))) {
                byName.set(r.name, { name: r.name, date: candidateDate });
            }
        });
        return Array.from(byName.values()).sort(
            (a, b) => (a.date || Number.MAX_SAFE_INTEGER) - (b.date || Number.MAX_SAFE_INTEGER)
        );
    };
    const normalizePlatformNames = (releases = [], platforms = [], fallbackPlatform = '') => {
        const names = [];
        const addName = (value) => {
            if (!value || typeof value !== 'string') return;
            value.split(',').map((part) => part.trim()).filter(Boolean).forEach((name) => {
                if (!names.includes(name)) names.push(name);
            });
        };

        (releases || []).forEach((r) => addName(r?.name || ''));

        if (Array.isArray(platforms)) {
            platforms.forEach((p) => addName(typeof p === 'string' ? p : ''));
        } else if (typeof platforms === 'string') {
            addName(platforms);
        }

        addName(fallbackPlatform);
        return names;
    };
    const missingFields = useMemo(() => {
        const missing = [];
        if (!title.trim()) missing.push('title');
        if (!year.trim()) missing.push('year');
        if (!developer.trim()) missing.push('developer');
        if (!platform.trim()) missing.push('platform');
        if (!completionValue.trim()) missing.push('completion');
        if (!playerNotes.trim()) missing.push('player notes');
        if (!user) missing.push('sign-in');
        return missing;
    }, [completionValue, developer, platform, playerNotes, title, user, year]);
    const isSubmitDisabled = submitting || missingFields.length > 0;

    const disabledFieldStyle = { backgroundColor: "#E4E4E4", borderColor: "#CFCFCF", borderWidth: 1 };

    const updateTitleLayout = () => {
        requestAnimationFrame(() => {
            if (titleInputRef.current?.measureInWindow) {
                titleInputRef.current.measureInWindow((x, y, width, height) => {
                    if (Number.isFinite(x) && Number.isFinite(y)) {
                        setTitleFieldLayout({ x, y, width, height });
                    }
                });
            }
        });
    };

    const toggleManualEntry = () => {
        setManualEntry((prev) => {
            const next = !prev;
            if (next) {
                setTgdbId('');
                setSearchResults([]);
                setSearchError('');
                setTitleLocked(false);
                setMetadataLocked(false);
                setSelectedReleases([]);
                setSelectedPlatforms([]);
                setPlatformOptions([]);
                setLoreGameId('');
            } else {
                skipNextSearch.current = true;
                setTitle('');
                setTgdbId('');
                setYear('');
                setDeveloper('');
                setPlatform('');
                setCompletionValue('');
                setPlayerNotes('');
                setImageData(null);
                setSearchResults([]);
                setSearchError('');
                setTitleLocked(false);
                setLoreGameId('');
                setLocalResults([]);
                setRemoteResults([]);
                setMetadataLocked(false);
                setSelectedReleases([]);
                setSelectedPlatforms([]);
                setPlatformOptions([]);
            }
            setShowPlatformDropdown(false);
            setPlatformSearchResults([]);
            setPlatformSearchError('');
            setPlatformSearchLoading(false);
            setShowManualPlatformDropdown(false);
            setManualAddMode(false);
            setNewPlatformText('');
            return next;
        });
    };

    useEffect(() => {
        if (manualEntry) {
            setLocalResults([]);
            return;
        }

        const cleanedTitle = title.trim().toLowerCase();
        if (!cleanedTitle || cleanedTitle.length < 2) {
            setLocalResults([]);
            return;
        }

        let cancelled = false;
        const fetchLocal = async () => {
            try {
                const q = query(
                    collection(db, 'games'),
                    orderBy('titleLower'),
                    startAt(cleanedTitle),
                    endAt(`${cleanedTitle}\uf8ff`),
                    limit(6)
                );
                const snap = await getDocs(q);
                if (cancelled) return;
                const mapped = snap.docs.map((d) => {
                    const data = d.data() || {};
                    return {
                        id: d.id,
                        loreId: d.id,
                        igdbId: data.igdbId || '',
                        title: data.title || '',
                        year: data.year || '',
                        developer: data.developer || '',
                        platform: data.platform || '',
                        imageUrl: data.imageUrl || '',
                        source: 'lore',
                        manual: data.source === 'manual' || data.manual === true,
                        platforms: Array.isArray(data.platforms) ? data.platforms : [],
                        updatedAt: data.updatedAt,
                    };
                });
                mapped.sort((a, b) => {
                    const aManual = a.manual ? 1 : 0;
                    const bManual = b.manual ? 1 : 0;
                    if (aManual !== bManual) return bManual - aManual;
                    return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
                });
                setLocalResults(mapped);
            } catch (err) {
                console.warn('Failed to fetch local games', err);
                if (!cancelled) setLocalResults([]);
            }
        };

        fetchLocal();
        return () => {
            cancelled = true;
        };
    }, [db, manualEntry, title]);

    useEffect(() => {
        if (manualEntry) {
            setSearchResults([]);
            setRemoteResults([]);
            setSearchError('');
            setSearchLoading(false);
            return;
        }

        if (skipNextSearch.current) {
            skipNextSearch.current = false;
            setSearchResults([]);
            setRemoteResults([]);
            setSearchError('');
            setSearchLoading(false);
            return;
        }

        const cleanedTitle = title.trim();
        if (!cleanedTitle || cleanedTitle.length < 2) {
            setSearchResults([]);
            setSearchError('');
            return;
        }

        const controller = new AbortController();
        const delay = setTimeout(async () => {
            setSearchLoading(true);
            setSearchError('');
            try {
                const params = new URLSearchParams({
                    search: cleanedTitle,
                    limit: '6',
                });
                const endpoint = apiBase
                    ? `${apiBase.replace(/\/$/, '')}/api/igdb/games?${params.toString()}`
                    : `/api/igdb/games?${params.toString()}`;
                const response = await fetch(endpoint, {
                    signal: controller.signal,
                });

                const contentType = response.headers.get('content-type') || '';
                if (!response.ok) {
                    const text = await response.text().catch(() => '');
                    throw new Error(text || 'Search failed');
                }

                if (!contentType.toLowerCase().includes('application/json')) {
                    const text = await response.text().catch(() => '');
                    throw new Error(text || 'Unexpected response from /api/igdb/games. Make sure the serverless function is running (e.g., via `vercel dev`).');
                }

                const data = await response.json();
                const games = Array.isArray(data?.games) ? data.games : [];
                const normalized = games.map((game) => ({
                    id: game.id ?? '',
                    igdbId: game.id ?? '',
                    title: game.title,
                    year: game.year || '',
                    developer: game.developer || '',
                    platform: game.platform || '',
                    imageUrl: game.imageUrl || '',
                    source: 'igdb',
                    platforms: Array.isArray(game.platforms) ? game.platforms : [],
                    releases: Array.isArray(game.releases) ? game.releases : [],
                }));

                setRemoteResults(normalized);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error(err);
                const message = (err?.message || '').trim();
                setSearchError(message || 'Could not fetch games. Try again.');
            } finally {
                setSearchLoading(false);
            }
        }, 450);

        return () => {
            clearTimeout(delay);
            controller.abort();
        };
    }, [title]);

    useEffect(() => {
        if (manualEntry) {
            setSearchResults([]);
            return;
        }
        const combined = [...localResults];
        remoteResults.forEach((remote) => {
            const already = combined.some(
                (local) =>
                    (local.igdbId && remote.igdbId && String(local.igdbId) === String(remote.igdbId)) ||
                    (local.title && remote.title && local.title.toLowerCase() === remote.title.toLowerCase())
            );
            if (!already) combined.push(remote);
        });
        setSearchResults(combined);
    }, [localResults, manualEntry, remoteResults]);

    useEffect(() => {
        if (!selectedPlatforms.length) {
            if (platform) setPlatform('');
            setSelectedReleases([]);
            return;
        }
        setPlatform((prev) => (prev && selectedPlatforms.includes(prev) ? prev : selectedPlatforms[0]));
    }, [platform, selectedPlatforms]);

    useEffect(() => {
        if (!showManualPlatformDropdown && !showPlatformDropdown) {
            setPlatformSearchResults([]);
            setPlatformSearchError('');
            setPlatformSearchLoading(false);
            return;
        }

        const cleaned = newPlatformText.trim();
        if (!cleaned || cleaned.length < 2) {
            setPlatformSearchResults([]);
            setPlatformSearchError('');
            setPlatformSearchLoading(false);
            return;
        }

        const controller = new AbortController();
        const delay = setTimeout(async () => {
            setPlatformSearchLoading(true);
            setPlatformSearchError('');
            try {
                const params = new URLSearchParams({
                    search: cleaned,
                    limit: '8',
                });
                const endpoint = apiBase
                    ? `${apiBase.replace(/\/$/, '')}/api/igdb/platforms?${params.toString()}`
                    : `/api/igdb/platforms?${params.toString()}`;
                const response = await fetch(endpoint, { signal: controller.signal });
                const contentType = response.headers.get('content-type') || '';
                if (!response.ok) {
                    const text = await response.text().catch(() => '');
                    throw new Error(text || 'Platform search failed');
                }
                if (!contentType.toLowerCase().includes('application/json')) {
                    const text = await response.text().catch(() => '');
                    throw new Error(text || 'Unexpected response from /api/igdb/platforms.');
                }
                const data = await response.json();
                const platforms = Array.isArray(data?.platforms) ? data.platforms : [];
                setPlatformSearchResults(platforms);
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error(err);
                const message = (err?.message || '').trim();
                setPlatformSearchError(message || 'Could not fetch platforms.');
            } finally {
                setPlatformSearchLoading(false);
            }
        }, 350);

        return () => {
            clearTimeout(delay);
            controller.abort();
        };
    }, [apiBase, newPlatformText, showManualPlatformDropdown, showPlatformDropdown]);

    const ensureLoreGameRecord = async (game, releasesArg = []) => {
        try {
            if (game?.loreId) {
                setLoreGameId(game.loreId);
                return game.loreId;
            }
            const releases = dedupeReleases(
                releasesArg.length
                    ? releasesArg
                    : selectedReleases.length
                        ? selectedReleases
                        : allPlatformNames.length
                            ? allPlatformNames.map((name) => ({ name, date: null }))
                            : []
            );

            const payload = {
                title: (game?.title || title || '').trim(),
                titleLower: (game?.title || title || '').trim().toLowerCase(),
                year: game?.year || year || '',
                developer: game?.developer || developer || '',
                platform: releases[0]?.name || '',
                platforms: releases.length ? releases.map((r) => r.name) : allPlatformNames,
                releases,
                imageUrl: game?.imageUrl || imageData || '',
                source: game?.source === 'igdb' ? 'igdb' : 'manual',
                igdbId: game?.igdbId ? String(game.igdbId) : tgdbId || '',
                manual: game?.source !== 'igdb',
                updatedAt: serverTimestamp(),
            };

            if (payload.source === 'igdb' && payload.igdbId) {
                const ref = doc(db, 'games', `igdb_${payload.igdbId}`);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                    payload.createdAt = serverTimestamp();
                }
                await setDoc(ref, payload, { merge: true });
                setLoreGameId(ref.id);
                return ref.id;
            }

            const created = await addDoc(collection(db, 'games'), {
                ...payload,
                source: 'manual',
                manual: true,
                createdAt: serverTimestamp(),
            });
            setLoreGameId(created.id);
            return created.id;
        } catch (err) {
            console.warn('Failed to persist lore game', err);
            return '';
        }
    };

    const handleSelectGame = async (game) => {
        skipNextSearch.current = true;
        setTitle(game.title || title);
        const igdbIdentifier = game?.igdbId ? String(game.igdbId) : game?.source === 'igdb' && game?.id ? String(game.id) : '';
        setTgdbId(igdbIdentifier);
        setYear(game.year || '');
        setDeveloper(game.developer || '');
        const releases = dedupeReleases(game.releases);
        const platformNames = normalizePlatformNames(releases, game.platforms, game.platform);
        const normalizedReleases = releases.length
            ? releases
            : platformNames.map((name) => ({ name, date: null }));

        setPlatform(platformNames[0] || '');
        setSelectedReleases(normalizedReleases);
        setPlatformOptions(platformNames);
        setSelectedPlatforms(platformNames.length ? [platformNames[0]] : []);
        setImageData(game.imageUrl || null);
        setSearchResults([]);
        setRemoteResults([]);
        setLocalResults([]);
        setSearchLoading(false);
        setSearchError('');
        setTitleLocked(true);
        setMetadataLocked(true);
        setShowPlatformDropdown(false);
        const loreId = await ensureLoreGameRecord(game, normalizedReleases);
        if (!loreId) setLoreGameId('');
    };

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

    const validateForm = () => {
        const missing = [];
        if (!title.trim()) missing.push('title');
        if (!year.trim()) missing.push('year');
        if (!developer.trim()) missing.push('developer');
        if (!platform.trim()) missing.push('platform');
        if (!completionValue.trim()) missing.push('completion');
        if (!playerNotes.trim()) missing.push('player notes');
        if (!user) missing.push('sign in');
        if (missing.length) {
            setSubmitError(`Please fill ${missing.join(', ')}${missing.includes('sign in') ? ' (sign in required).' : '.'}`);
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        setSubmitError('');
        setSubmitSuccess('');
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const cleanedTitle = title.trim();
            const releases = selectedReleases.length
                ? dedupeReleases(selectedReleases)
                : allPlatformNames.length
                    ? dedupeReleases(allPlatformNames.map((name) => ({ name, date: null })))
                    : [];

            const baseGame = {
                title: cleanedTitle,
                titleLower: cleanedTitle.toLowerCase(),
                year: year.trim(),
                developer: developer.trim(),
                platform: releases[0]?.name || '',
                platforms: releases.length ? releases.map((r) => r.name) : allPlatformNames,
                releases,
                imageUrl: imageData || '',
                igdbId: tgdbId || '',
                source: manualEntry || !tgdbId ? 'manual' : 'igdb',
                manual: manualEntry || !tgdbId,
                updatedAt: serverTimestamp(),
            };

            let gameId = loreGameId;
            if (!gameId) {
                if (baseGame.source === 'igdb' && baseGame.igdbId) {
                    const ref = doc(db, 'games', `igdb_${baseGame.igdbId}`);
                    const snap = await getDoc(ref);
                    if (!snap.exists()) baseGame.createdAt = serverTimestamp();
                    await setDoc(ref, baseGame, { merge: true });
                    gameId = ref.id;
                } else {
                    const created = await addDoc(collection(db, 'games'), {
                        ...baseGame,
                        source: 'manual',
                        manual: true,
                        createdAt: serverTimestamp(),
                    });
                    gameId = created.id;
                }
                setLoreGameId(gameId);
            } else {
                await setDoc(doc(db, 'games', gameId), baseGame, { merge: true });
            }

            await addDoc(collection(db, 'submissions'), {
                gameId,
                userId: user?.uid || 'anonymous',
                title: cleanedTitle,
                titleLower: cleanedTitle.toLowerCase(),
                year: year.trim(),
                developer: developer.trim(),
                platform: platform.trim(),
                imageUrl: imageData || '',
                igdbId: tgdbId || '',
                completionType,
                completionValue: completionValue.trim(),
                playerNotes: playerNotes.trim(),
                source: baseGame.source,
                manual: baseGame.manual,
                createdAt: serverTimestamp(),
            });

            setSubmitSuccess('Submission saved to LOREBoards.');
            router.replace('/');
        } catch (err) {
            console.error(err);
            setSubmitError(err?.message || 'Could not submit. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderManualToggle = (extraStyle) => (
        <Pressable style={[styles.rowTopRight, extraStyle]} onPress={toggleManualEntry}>
            <Pressable
                style={styles.checkbox}
                onPress={toggleManualEntry}
            >
                {manualEntry && <View style={styles.checkboxInner} />}
            </Pressable>
            <Text style={styles.checkboxLabel}>Manual Game Entry</Text>
        </Pressable>
    );

    useEffect(() => {
        if (shouldShowSuggestions) {
            updateTitleLayout();
        }
    }, [shouldShowSuggestions]);

    return (
        <View style={{ flex: 1 }} pointerEvents="box-none">
            <Modal
                transparent
                visible={shouldShowSuggestions && hasMeasuredTitle}
                animationType="none"
                onRequestClose={() => {}}
                statusBarTranslucent
            >
                <View pointerEvents="box-none" style={styles.suggestionsOverlay}>
                    {shouldShowSuggestions && (
                        <View
                            pointerEvents="box-none"
                            style={[
                                styles.searchResultsBox,
                                styles.searchResultsBoxPortal,
                                {
                                    top: titleFieldLayout.y + titleFieldLayout.height,
                                    left: titleFieldLayout.x,
                                    width: titleFieldLayout.width,
                                },
                            ]}
                        >
                            {searchLoading && (
                                <View style={styles.searchStatusRow}>
                                    <ActivityIndicator size="small" color="#333" />
                                    <Text style={styles.searchStatusText}>Searching TheGamesDB…</Text>
                                </View>
                            )}
                            {!!searchError && (
                                <Text style={styles.searchErrorText}>{searchError}</Text>
                            )}
                            {!searchLoading && !searchError && searchResults.map((game) => (
                            <Pressable
                                key={`${game.id}-${game.title}`}
                                style={styles.searchResult}
                                onPress={() => handleSelectGame(game)}
                            >
                                {game.source === 'lore' && (
                                    <View style={styles.loreBadge}>
                                        <Text style={styles.loreBadgeText}>
                                            LOREBoards{game.manual ? ' • Manual' : ''}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.searchResultTitleRow}>
                                    <Text style={styles.searchResultTitle}>{game.title}</Text>
                                </View>
                                <Text style={styles.searchResultMetaText}>
                                    {[game.platform, game.year].filter(Boolean).join(' • ') || 'No extra details'}
                                </Text>
                            </Pressable>
                        ))}
                            {!searchLoading && !searchError && searchResults.length === 0 && (
                                <Text style={styles.searchResultEmpty}>No matches yet.</Text>
                            )}
                        </View>
                    )}
                </View>
            </Modal>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={theme.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={theme.mainContainer}>
                        {isDesktopWeb && (
                            <Text style={[theme.title, { textAlign: "center" }]}>Submit New Game Completion</Text>
                        )}

                        {/*
                          Wrap the columns so we can raise the left column above the right when suggestions are visible.
                        */}
                        <View style={[styles.panel, !isDesktopWeb && styles.panelMobile]}>
                            {!isDesktopWeb && renderManualToggle(styles.rowTopRightMobile)}
                            <View
                                style={[
                                    styles.column,
                                    !isDesktopWeb && styles.columnMobile,
                                    (shouldShowSuggestions || showPlatformDropdown || showManualPlatformDropdown) ? styles.columnElevated : null,
                                ]}
                            >
                            <View style={styles.fieldBlock}>
                                <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Title</Text>
                                <View style={styles.titleInputWrapper}>
                                    <TextInput
                                        ref={titleInputRef}
                                        value={title}
                                        onChangeText={setTitle}
                                        placeholder="Game title"
                                        placeholderTextColor="rgba(0,0,0,0.5)"
                                        style={[
                                            styles.input,
                                            !isDesktopWeb && styles.inputMobile,
                                            titleLocked && disabledFieldStyle,
                                        ]}
                                        editable={!titleLocked}
                                        focusable={!titleLocked}
                                        onLayout={updateTitleLayout}
                                        onFocus={updateTitleLayout}
                                    />
                                    {titleLocked && (
                                        <Pressable style={styles.editButton} onPress={() => {
                                            setTitleLocked(false);
                                            setSearchResults([]);
                                            setSearchError('');
                                        }}>
                                            <Text style={styles.editButtonText}>Search another game</Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                                <View style={[styles.fieldRow, { gap: 12 }, !isDesktopWeb && styles.fieldRowMobile]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>IGDB ID</Text>
                                        <TextInput
                                            value={tgdbId}
                                            onChangeText={setTgdbId}
                                            placeholder="0000"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            style={[styles.input, !isDesktopWeb && styles.inputMobile, disabledFieldStyle]}
                                            editable={false}
                                            focusable={false}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>LOREBoards ID</Text>
                                        <TextInput
                                            value={loreGameId}
                                            onChangeText={setLoreGameId}
                                            placeholder="0000"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            style={[styles.input, !isDesktopWeb && styles.inputMobile, disabledFieldStyle]}
                                            editable={false}
                                            focusable={false}
                                        />
                                    </View>
                                    <View style={[{ width: 120 }, !isDesktopWeb && styles.yearMobile]}>
                                        <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Year</Text>
                                        <TextInput
                                            value={year}
                                            onChangeText={setYear}
                                            placeholder="2000"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            style={[
                                                styles.input,
                                                !isDesktopWeb && styles.inputMobile,
                                                (!manualEntry || metadataLocked) && disabledFieldStyle,
                                            ]}
                                            editable={manualEntry && !metadataLocked}
                                            focusable={manualEntry && !metadataLocked}
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
                                    style={[
                                        styles.input,
                                        !isDesktopWeb && styles.inputMobile,
                                        (!manualEntry || metadataLocked) && disabledFieldStyle,
                                    ]}
                                    editable={manualEntry && !metadataLocked}
                                    focusable={manualEntry && !metadataLocked}
                                />
                            </View>

                            <View style={[
                                styles.fieldBlock,
                                (showPlatformDropdown || showManualPlatformDropdown) && styles.platformFieldOpen,
                            ]}>
                                <Text style={[styles.label, !isDesktopWeb && styles.labelMobile]}>Platform</Text>
                                {!manualEntry && platformChoices.length > 0 ? (
                                    <View style={[
                                        styles.platformSelectWrapper,
                                        showPlatformDropdown && styles.platformSelectWrapperOpen,
                                    ]}>
                                        <Pressable
                                            style={[
                                                styles.platformSelect,
                                                showPlatformDropdown && styles.platformSelectOpen,
                                            ]}
                                            onPress={() => {
                                                setShowPlatformDropdown((prev) => {
                                                    const next = !prev;
                                                    if (!next) {
                                                        setNewPlatformText('');
                                                    }
                                                    return next;
                                                });
                                                setManualAddMode(false);
                                            }}
                                        >
                                            <Text style={styles.platformSelectText}>
                                                {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'Select platform'}
                                            </Text>
                                            <Ionicons
                                                name={showPlatformDropdown ? "chevron-up" : "chevron-down"}
                                                size={18}
                                                color="#555"
                                            />
                                        </Pressable>
                                        {showPlatformDropdown && (
                                            <View style={styles.platformDropdown}>
                                                <TextInput
                                                    value={newPlatformText}
                                                    onChangeText={setNewPlatformText}
                                                    placeholder="Search for newC platform"
                                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                                    style={styles.platformSearchInput}
                                                />
                                                {platformSearchLoading && (
                                                    <View style={styles.platformSuggestionStatusRow}>
                                                        <ActivityIndicator size="small" color="#333" />
                                                        <Text style={styles.platformSuggestionStatusText}>Searching IGDB…</Text>
                                                    </View>
                                                )}
                                                {!!platformSearchError && (
                                                    <Text style={styles.platformSuggestionError}>{platformSearchError}</Text>
                                                )}
                                                {!platformSearchLoading && !platformSearchError && platformSearchResults.map((p) => (
                                                    <Pressable
                                                        key={p.id || p.name}
                                                        style={styles.platformSuggestionRow}
                                                        onPress={() => {
                                                            const name = p.name || '';
                                                            if (!name) return;
                                                            setNewPlatformText('');
                                                            setPlatformOptions((prev) => prev.includes(name) ? prev : [...prev, name]);
                                                            setSelectedPlatforms([name]);
                                                            setSelectedReleases((prev) => {
                                                                const filtered = prev.filter((r) => r.name !== name);
                                                                return [...filtered, { name, date: null }];
                                                            });
                                                            setPlatform(name);
                                                            setShowPlatformDropdown(false);
                                                        }}
                                                    >
                                                        <Text style={styles.platformSuggestionName}>{p.name}</Text>
                                                        <Text style={styles.platformSuggestionMeta}>
                                                            {[p.abbreviation, p.generation ? `Gen ${p.generation}` : ''].filter(Boolean).join(' • ')}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                                {!platformSearchLoading && !platformSearchError && platformSearchResults.length === 0 && (
                                                    <Text style={styles.platformSuggestionEmpty}>No matches yet.</Text>
                                                )}
                                                {platformChoices.map((p) => (
                                                    <Pressable
                                                        key={p}
                                                        style={[
                                                            styles.platformOption,
                                                            selectedPlatforms.includes(p) && styles.platformOptionActive,
                                                        ]}
                                                        onPress={() => {
                                                            const existingRelease = selectedReleases.find((r) => r.name === p);
                                                            setSelectedPlatforms([p]);
                                                            setSelectedReleases((prev) => {
                                                                const filtered = prev.filter((r) => r.name !== p);
                                                                return existingRelease ? [...filtered, existingRelease] : [...filtered, { name: p, date: null }];
                                                            });
                                                            setPlatform(p);
                                                            setShowPlatformDropdown(false);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.platformOptionText,
                                                                selectedPlatforms.includes(p) && styles.platformOptionTextActive,
                                                            ]}
                                                        >
                                                            {p}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <View style={styles.manualPlatformRow}>
                                        <Pressable
                                            style={[
                                                styles.platformSelect,
                                                showManualPlatformDropdown && styles.platformSelectOpen,
                                            ]}
                                            onPress={() => {
                                                setShowManualPlatformDropdown((prev) => {
                                                    const next = !prev;
                                                    if (!next) {
                                                        setNewPlatformText('');
                                                    }
                                                    return next;
                                                });
                                                setManualAddMode(false);
                                            }}
                                        >
                                            <Text style={styles.platformSelectText}>
                                                {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'Select platform'}
                                            </Text>
                                            <Ionicons
                                                name={showManualPlatformDropdown ? "chevron-up" : "chevron-down"}
                                                size={18}
                                                color="#555"
                                            />
                                        </Pressable>
                                        {showManualPlatformDropdown && (
                                            <View style={styles.platformDropdown}>
                                                <TextInput
                                                    value={newPlatformText}
                                                    onChangeText={setNewPlatformText}
                                                    placeholder="Search platform"
                                                    placeholderTextColor="rgba(0,0,0,0.5)"
                                                    style={[styles.platformSearchInput]}
                                                />
                                                {platformSearchLoading && (
                                                    <View style={styles.platformSuggestionStatusRow}>
                                                        <ActivityIndicator size="small" color="#333" />
                                                        <Text style={styles.platformSuggestionStatusText}>Searching IGDB…</Text>
                                                    </View>
                                                )}
                                                {!!platformSearchError && (
                                                    <Text style={styles.platformSuggestionError}>{platformSearchError}</Text>
                                                )}
                                                {!platformSearchLoading && !platformSearchError && platformSearchResults.map((p) => (
                                                    <Pressable
                                                        key={p.id || p.name}
                                                        style={styles.platformSuggestionRow}
                                                        onPress={() => {
                                                            const name = p.name || '';
                                                            if (!name) return;
                                                            setNewPlatformText('');
                                                            setPlatformOptions((prev) => prev.includes(name) ? prev : [...prev, name]);
                                                            setSelectedPlatforms([name]);
                                                            setSelectedReleases((prev) => {
                                                                const filtered = prev.filter((r) => r.name !== name);
                                                                return [...filtered, { name, date: null }];
                                                            });
                                                            setPlatform(name);
                                                            setShowManualPlatformDropdown(false);
                                                        }}
                                                    >
                                                        <Text style={styles.platformSuggestionName}>{p.name}</Text>
                                                        <Text style={styles.platformSuggestionMeta}>
                                                            {[p.abbreviation, p.generation ? `Gen ${p.generation}` : ''].filter(Boolean).join(' • ')}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                                {!platformSearchLoading && !platformSearchError && platformSearchResults.length === 0 && (
                                                    <Text style={styles.platformSuggestionEmpty}>No matches yet.</Text>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                )}
                                {manualAddMode ? (
                                    <View style={styles.manualAddRow}>
                                        <TextInput
                                            value={newPlatformText}
                                            onChangeText={setNewPlatformText}
                                            placeholder="Enter custom platform"
                                            placeholderTextColor="rgba(0,0,0,0.5)"
                                            style={[styles.input, !isDesktopWeb && styles.inputMobile, { marginBottom: 4 }]}
                                        />
                                        <View style={styles.manualAddActions}>
                                            <Pressable
                                                style={[styles.addPlatformBtn, styles.addPlatformBtnSecondary]}
                                                onPress={() => {
                                                    setManualAddMode(false);
                                                    setNewPlatformText('');
                                                }}
                                            >
                                                <Text style={styles.addPlatformBtnTextSecondary}>Cancel</Text>
                                            </Pressable>
                                            <Pressable
                                                style={styles.addPlatformBtn}
                                                onPress={() => {
                                                    const trimmed = newPlatformText.trim();
                                                    if (!trimmed) return;
                                                    setPlatformOptions((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed]);
                                                    setSelectedPlatforms([trimmed]);
                                                    setSelectedReleases((prev) => {
                                                        const filtered = prev.filter((r) => r.name !== trimmed);
                                                        return [...filtered, { name: trimmed, date: null }];
                                                    });
                                                    setPlatform(trimmed);
                                                    setManualAddMode(false);
                                                    setShowManualPlatformDropdown(false);
                                                    setShowPlatformDropdown(false);
                                                }}
                                            >
                                                <Text style={styles.addPlatformBtnText}>Add</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                ) : (
                                    <Pressable
                                        style={[styles.addPlatformBtn, { alignSelf: 'flex-start' }]}
                                        onPress={() => {
                                            setManualAddMode(true);
                                            setShowManualPlatformDropdown(false);
                                            setShowPlatformDropdown(false);
                                        }}
                                    >
                                        <Text style={styles.addPlatformBtnText}>Add custom platform</Text>
                                    </Pressable>
                                )}
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
                                {imageData ? (
                                    <Image source={{ uri: imageData }} style={styles.previewImage} />
                                ) : manualEntry ? (
                                    <View style={styles.placeholder}>
                                        <Ionicons name="image-outline" size={42} color="#666" />
                                        <Text style={styles.placeholderText}>Tap to add image</Text>
                                    </View>
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
                            <View style={styles.submitRow}>
                                {!!submitError && <Text style={styles.submitError}>{submitError}</Text>}
                                {!!submitSuccess && !submitError && <Text style={styles.submitSuccess}>{submitSuccess}</Text>}
                                <Pressable
                                    style={[
                                        styles.submitButton,
                                        isSubmitDisabled && styles.submitButtonDisabled,
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitDisabled}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit Completion</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
                {isDesktopWeb && <Footer />}
            </ScrollView>
        </KeyboardAvoidingView>
        </View>
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
        minHeight: 520,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 6,
        flexDirection: "row",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 20,
        overflow: 'visible',
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
        overflow: 'visible',
    },
    columnElevated: {
        position: 'relative',
        zIndex: 1500,
    },
    suggestionsOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 3000,
        pointerEvents: 'box-none',
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
    titleInputWrapper: {
        position: 'relative',
        zIndex: 999,
    },
    imageBox: {
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#D0D0D0",
        backgroundColor: "#EDEDED",
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        flexDirection: 'column',
        position: 'relative',
    },
    imageDesktop: {
        width: 130,
        aspectRatio: 2 / 3,
        alignSelf: 'flex-start',
    },
    imageMobile: {
        width: "100%",
        aspectRatio: 2 / 3,
        minHeight: 140,
    },
    previewImage: {
        width: "100%",
        height: "100%",
        resizeMode: 'cover',
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: "100%",
        height: "100%",
        gap: 8,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    placeholderText: {
        color: "#666",
        fontSize: 18,
        textAlign: 'center',
    },
    disabledPlaceholder: {
        flex: 1,
        width: "100%",
        height: "100%",
        alignItems: 'center',
        justifyContent: 'center',
    },
    platformChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    platformChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#C5C5C5",
        backgroundColor: "#fff",
    },
    platformChipActive: {
        borderColor: "#1f4b99",
        backgroundColor: "#dfe7ff",
    },
    platformChipText: {
        fontWeight: '600',
        color: "#333",
    },
    platformChipTextActive: {
        color: "#1f4b99",
    },
    platformFieldOpen: {
        zIndex: 2500,
        elevation: 16,
    },
    platformSelectWrapper: {
        position: 'relative',
    },
    platformSelectWrapperOpen: {
        zIndex: 1200,
        elevation: 12,
    },
    platformSelect: {
        width: "100%",
        padding: 12,
        backgroundColor: "#FFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D0D0D0",
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    platformSelectOpen: {
        borderColor: "#1f4b99",
    },
    platformSelectText: {
        fontSize: 16,
        color: "#222",
    },
    platformDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D0D0D0",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 12,
        zIndex: 1200,
    },
    platformOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    platformOptionActive: {
        backgroundColor: "#dfe7ff",
    },
    platformOptionText: {
        fontSize: 16,
        color: "#333",
    },
    platformOptionTextActive: {
        fontWeight: '700',
        color: "#1f4b99",
    },
    manualPlatformRow: {
        gap: 6,
        position: 'relative',
    },
    addPlatformBtn: {
        alignSelf: 'flex-start',
        backgroundColor: "#1f4b99",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    addPlatformBtnText: {
        color: "#fff",
        fontWeight: '700',
    },
    addPlatformBtnSecondary: {
        backgroundColor: "#e2e2e2",
        borderWidth: 1,
        borderColor: "#c6c6c6",
    },
    addPlatformBtnTextSecondary: {
        color: "#333",
        fontWeight: '700',
    },
    platformSuggestionBox: {
        width: "100%",
        marginTop: 4,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D0D0D0",
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    platformSuggestionStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    platformSuggestionStatusText: {
        fontSize: 14,
        color: "#444",
    },
    platformSuggestionError: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        color: "#B00020",
        fontWeight: '600',
    },
    platformSuggestionRow: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    platformSuggestionName: {
        fontSize: 15,
        fontWeight: '700',
        color: "#222",
    },
    platformSuggestionMeta: {
        fontSize: 13,
        color: "#555",
        marginTop: 2,
    },
    platformSuggestionEmpty: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        color: "#666",
    },
    platformSearchInput: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        fontSize: 15,
        color: "#222",
    },
    manualAddRow: {
        gap: 6,
        marginTop: 6,
        width: "100%",
    },
    manualAddActions: {
        flexDirection: 'row',
        gap: 8,
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
        marginTop: 20,
        marginBottom: 8,
    },
    textarea: {
        minHeight: 140,
        textAlignVertical: 'top',
        flex: 1,
    },
    textareaContainer: {
        flex: 1,
        minHeight: 140,
    },
    searchResultsBox: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D0D0D0",
        borderRadius: 10,
        paddingVertical: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchResultsBoxPortal: {
        position: 'absolute',
        elevation: 16,
        zIndex: 2000,
        maxHeight: 320,
        overflow: 'hidden',
    },
    searchResult: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E6E6E6",
        gap: 2,
        position: 'relative',
    },
    searchResultTitle: {
        fontWeight: '700',
        fontSize: 16,
        color: "#222",
    },
    searchResultTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    searchResultMetaText: {
        fontSize: 14,
        color: "#555",
    },
    loreBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "#f7f7f7",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#b8b8b8",
        zIndex: 10,
    },
    loreBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: "#444",
    },
    searchResultEmpty: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        color: "#666",
    },
    searchStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    searchStatusText: {
        fontSize: 14,
        color: "#333",
    },
    searchErrorText: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        color: "#B00020",
        fontWeight: '600',
    },
    editButton: {
        alignSelf: 'flex-end',
        marginTop: -4,
        marginBottom: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: "#dfe7ff",
    },
    editButtonText: {
        color: "#1f4b99",
        fontWeight: '700',
        fontSize: 14,
    },
    submitRow: {
        width: "100%",
        alignSelf: 'stretch',
        marginTop: 'auto',
        gap: 8,
    },
    submitButton: {
        backgroundColor: "#1f4b99",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: "#8fa6d4",
    },
    submitButtonText: {
        color: "#fff",
        fontWeight: '800',
        fontSize: 18,
    },
    submitError: {
        color: "#B00020",
        fontWeight: '700',
    },
    submitSuccess: {
        color: "#0a7d1a",
        fontWeight: '700',
    },
});
