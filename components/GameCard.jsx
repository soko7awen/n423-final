import { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable, Animated, Easing, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useDevice } from "../app/device-context";
import { useAuth } from '../src/auth/AuthContext';

export default function GameCard({
    submissionId,
    gameId,
    title,
    year,
    platform,
    completionType,
    completionValue,
    playerNotes,
    imageUrl,
    userName,
    userPhoto,
    manual,
    onDelete,
    ownerId,
}) {
    const router = useRouter();
    const { isDesktopWeb } = useDevice();
    const { user } = useAuth();

    const infoTextNumberOfLines = 3;
    const infoTextLineHeight = isDesktopWeb ? 18 : 16;
    const infoTextMaxHeight = infoTextLineHeight * infoTextNumberOfLines;
    const expandedNotesMaxHeight = isDesktopWeb ? 230 : 190;
    const reservedNotesSpace = Math.max(expandedNotesMaxHeight - infoTextMaxHeight, 0) + 12;
    const statusLabel = completionType === 'progress' ? 'Progress' : 'High Score';
    const statusColor = completionType === 'progress' ? '#E5954E' : '#60E54E';
    const [isNotesHovered, setIsNotesHovered] = useState(false);
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const isExpanded = isDesktopWeb ? (isCardHovered || isNotesHovered) : notesOpen;
    const handleCardHoverIn = () => { if (isDesktopWeb) setIsCardHovered(true); };
    const handleCardHoverOut = () => { if (isDesktopWeb) setIsCardHovered(false); };
    const handleNotesPressIn = () => { if (isDesktopWeb) setIsNotesHovered(true); };
    const handleNotesPressOut = () => { if (isDesktopWeb) setIsNotesHovered(false); };
    const handleNotesToggle = () => {
        if (!isDesktopWeb) setNotesOpen((prev) => !prev);
    };
    const handleCardPress = () => {
        if (!isDesktopWeb && notesOpen) setNotesOpen(false);
    };

    const [fullNotesHeight, setFullNotesHeight] = useState(infoTextMaxHeight);
    const notesHeightAnim = useRef(new Animated.Value(infoTextMaxHeight)).current;

    useEffect(() => {
        const targetHeight = isExpanded
            ? Math.min(fullNotesHeight, expandedNotesMaxHeight)
            : infoTextMaxHeight;
        Animated.timing(notesHeightAnim, {
            toValue: targetHeight,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [isExpanded, fullNotesHeight, expandedNotesMaxHeight, infoTextMaxHeight, notesHeightAnim]);

    const handleNotesMeasure = (event) => {
        const height = event?.nativeEvent?.layout?.height;
        if (height && height > fullNotesHeight) {
            setFullNotesHeight(height);
        }
    };
    useEffect(() => {
        if (isDesktopWeb) setNotesOpen(false);
    }, [isDesktopWeb]);

    const getWebSweetAlert = () => {
        if (Platform.OS !== 'web') return null;
        try {
            // eslint-disable-next-line global-require
            return require('sweetalert');
        } catch (err) {
            console.warn('SweetAlert unavailable', err);
            return null;
        }
    };

    const confirmDelete = () => {
        const swalAlert = getWebSweetAlert();
        if (swalAlert) {
            return swalAlert({
                title: 'Delete submission',
                text: 'Are you sure you want to delete this submission?',
                icon: 'warning',
                buttons: ['Cancel', 'Delete'],
                dangerMode: true,
            }).catch((err) => {
                console.warn('SweetAlert delete confirm failed, falling back to native alert', err);
                return false;
            });
        }

        return new Promise((resolve) => {
            Alert.alert('Delete submission', 'Are you sure you want to delete this submission?', [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]);
        });
    };

    const showDeleteResult = async (success) => {
        const swalAlert = getWebSweetAlert();
        if (swalAlert) {
            try {
                await swalAlert(
                    success ? 'Deleted' : 'Error',
                    success ? 'Submission removed.' : 'Could not delete this submission.',
                    success ? 'success' : 'error'
                );
                return;
            } catch (err) {
                console.warn('SweetAlert delete result failed, falling back to native alert', err);
            }
        }
        Alert.alert(
            success ? 'Deleted' : 'Error',
            success ? 'Submission removed.' : 'Could not delete this submission.'
        );
    };

    const styles = StyleSheet.create({
        cardSlot: {
            width: isDesktopWeb ? 240 : 200,
            paddingBottom: reservedNotesSpace,
            backgroundColor: 'transparent',
        },
        container: {
            width: '100%',
            backgroundColor: '#f5f7faff',
            paddingTop: 10,
            paddingBottom: 10,
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 3,
            overflow: 'visible',
            position: 'relative',
        },
        titleWrap: {
            marginBottom: 6,
            alignItems: 'center',
            paddingHorizontal: 10,
        },
        title: {
            fontSize: isDesktopWeb ? 17 : 15,
            fontWeight: '800',
            textAlign: 'center',
            color: '#121212',
        },
        year: {
            fontSize: isDesktopWeb ? 13 : 11,
            color: '#666',
        },
        yearHover: {
            color: '#001ecf',
        },
        innerCard: {
            marginHorizontal: 8,
            position: 'relative',
            zIndex: 10,
        },
        imageWrap: {
            aspectRatio: 3 / 4,
            backgroundColor: '#1D1D1D',
            borderRadius: 12,
            overflow: 'hidden',
        },
        imagePlaceholder: {
            backgroundColor: '#EDEDED',
            borderColor: '#D0D0D0',
            borderWidth: 1,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        imagePlaceholderInner: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        imagePlaceholderIcon: {
            opacity: 0.6,
        },
        info: {
            marginTop: 6,
            backgroundColor: '#ececec',
            borderRadius: 12,
            overflow: 'visible',
            position: 'relative',
            zIndex: 20,
            elevation: 8,
        },
        infoBar: {
            paddingHorizontal: 8,
            paddingVertical: 6,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            backgroundColor: '#ffffffeb',
        },
        statusText: {
            fontSize: isDesktopWeb ? 13 : 11,
            color: '#1D1D1D',
        },
        userProfile: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 999,
            transitionProperty: 'background-color, transform, box-shadow',
            transitionDuration: '140ms',
            transitionTimingFunction: 'ease-out',
        },
        userPic: {
            width: isDesktopWeb ? 26 : 22,
            height: isDesktopWeb ? 26 : 22,
            borderRadius: 100,
            backgroundColor: '#d9d9d9',
        },
        username: {
            fontSize: isDesktopWeb ? 12 : 11,
            fontWeight: '700',
            color: '#0077CC',
        },
        infoTextContainer: {
            position: 'relative',
            minHeight: infoTextMaxHeight + 16,
            zIndex: 50,
        },
        infoText: {
            padding: 8,
            lineHeight: infoTextLineHeight,
            fontSize: isDesktopWeb ? 13 : 12,
            color: '#4b4b4b',
        },
        infoTextWrapper: {
            overflow: 'hidden',
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            zIndex: 900,
            backgroundColor: '#ececec',
            paddingBottom: 8,
            minHeight: infoTextMaxHeight + 16,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            elevation: 0,
        },
        infoTextScroll: {
            paddingHorizontal: 8,
            paddingTop: 8,
            paddingBottom: 4,
        },
        hiddenMeasure: {
            position: 'absolute',
            opacity: 0,
            left: 0,
            right: 0,
            top: 0,
            zIndex: -1,
            pointerEvents: 'none',
        },
        badgeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            paddingHorizontal: 10,
            justifyContent: 'center',
            position: 'relative',
            zIndex: 5,
        },
        badge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: '#eef2ff',
        },
        badgeText: {
            fontSize: 10,
            fontWeight: '700',
            color: '#1f4b99',
        },
        cardHover: {
            transform: [{ translateY: -2 }],
            shadowOpacity: 0.16,
            zIndex: 1200,
            elevation: 14,
            shadowRadius: 6,
        },
        titleHover: {
            color: '#001ecf',
            textDecorationLine: 'underline',
        },
        imageHover: {
            opacity: 0.95,
        },
        userProfileHover: {
            backgroundColor: '#e7f0ff',
            transform: [{ translateY: -1 }],
            boxShadow: '0px 2px 6px rgba(0,0,0,0.08)',
            opacity: 0.9,
        },
        userProfileActive: {
            backgroundColor: '#dce8ff',
            transform: [{ translateY: 0 }],
            boxShadow: '0px 1px 3px rgba(0,0,0,0.08)',
        },
        actionRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingHorizontal: 10,
            marginBottom: 4,
            minHeight: 32,
            gap: 8,
        },
        actionBtn: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 10,
            backgroundColor: '#f2f6ff',
            borderWidth: 1,
            borderColor: '#ced8ff',
        },
        actionBtnHover: {
            backgroundColor: '#e5edff',
            transform: [{ translateY: -1 }],
        },
        actionBtnActive: {
            backgroundColor: '#d7e4ff',
            transform: [{ translateY: 0 }],
        },
        actionText: {
            fontSize: 12,
            fontWeight: '800',
            color: '#1f2c4f',
        },
        actionDanger: {
            backgroundColor: '#fff3f3',
            borderColor: '#f5c2c7',
        },
        actionDangerText: {
            color: '#b00020',
        },
    });

    const displayName = userName || 'Player';
    const displayPhoto = userPhoto ? { uri: userPhoto } : null;
    const completionDisplay = completionValue ? `${completionValue}` : '—';
    const hasImage = Boolean(imageUrl);
    const pushSearch = ({ query, user, gameId: gameIdParam }) => {
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (user) params.set('user', user);
        if (gameIdParam) params.set('gameId', gameIdParam);
        const qs = params.toString();
        router.push(`/search${qs ? `?${qs}` : ''}`);
    };
    const handleOpenGameSearch = () => {
        pushSearch({ gameId: gameId || '' });
    };
    const handleOpenUserSearch = () => {
        const userQuery = displayName?.trim();
        if (userQuery) pushSearch({ user: userQuery });
    };
    const handleEdit = () => {
        if (!submissionId) return;
        router.push(`/submit?edit=${submissionId}`);
    };
    const handleDelete = async () => {
        if (!submissionId || typeof onDelete !== 'function') return;

        const confirmed = await confirmDelete();
        if (!confirmed) return;

        try {
            await onDelete(submissionId);
            await showDeleteResult(true);
        } catch (err) {
            console.warn('Failed to delete submission', err);
            await showDeleteResult(false);
        }
    };

    const canManage = Boolean(user?.uid && submissionId && ownerId && user.uid === ownerId);
    const actionAreaWidth = 120;

    return (
        <View style={styles.cardSlot}>
            <Pressable
                style={({ hovered }) => [
                    styles.container,
                    (hovered || isExpanded) && styles.cardHover,
                ]}
                onHoverIn={handleCardHoverIn}
                onHoverOut={handleCardHoverOut}
                onPress={handleCardPress}
            >
                <View style={styles.actionRow}>
                    {canManage ? (
                        <>
                            <Pressable
                                accessibilityLabel="Edit submission"
                                onPress={(e) => { e?.stopPropagation?.(); handleEdit(); }}
                                style={({ hovered, pressed }) => [
                                    styles.actionBtn,
                                    hovered && styles.actionBtnHover,
                                    pressed && styles.actionBtnActive,
                                ]}
                            >
                                <Text style={styles.actionText}>Edit</Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel="Delete submission"
                                onPress={(e) => { e?.stopPropagation?.(); handleDelete(); }}
                                style={({ hovered, pressed }) => [
                                    styles.actionBtn,
                                    styles.actionDanger,
                                    hovered && styles.actionBtnHover,
                                    pressed && styles.actionBtnActive,
                                ]}
                            >
                                <Text style={[styles.actionText, styles.actionDangerText]}>Delete</Text>
                            </Pressable>
                        </>
                    ) : (
                        <View style={{ width: actionAreaWidth, height: 32 }} />
                    )}
                </View>
                <Pressable
                    style={styles.titleWrap}
                    onPress={handleOpenGameSearch}
                    onHoverIn={handleCardHoverIn}
                >
                    {({ hovered, pressed }) => (
                        <>
                            <Text
                                style={[
                                    styles.title,
                                    (hovered || pressed) && styles.titleHover,
                                ]}
                                numberOfLines={2}
                            >
                                {title || 'Untitled Game'}
                            </Text>
                            <Text
                                style={[
                                    styles.year,
                                    (hovered || pressed) && styles.yearHover,
                                ]}
                            >
                                {[platform, year].filter(Boolean).join(' • ')}
                            </Text>
                        </>
                    )}
                </Pressable>
                <View style={styles.innerCard}>
                    <Pressable
                        onPress={handleOpenGameSearch}
                        onHoverIn={handleCardHoverIn}
                    >
                        {({ hovered }) => (
                            <View
                                style={[
                                    styles.imageWrap,
                                    hovered && styles.imageHover,
                                    !hasImage && styles.imagePlaceholder,
                                ]}
                            >
                                {hasImage ? (
                                    <Image
                                        source={{ uri: imageUrl }}
                                        style={styles.image}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholderInner}>
                                        <Ionicons
                                            name="image-outline"
                                            size={42}
                                            color="#666"
                                            style={styles.imagePlaceholderIcon}
                                        />
                                    </View>
                                )}
                            </View>
                        )}
                    </Pressable>
                    <View style={styles.info}>
                        <View style={styles.infoBar}>
                            <Text style={styles.statusText}>
                                <Text style={{ color: statusColor }}>{statusLabel}</Text>
                                {completionDisplay ? ` • ${completionDisplay}` : ''}
                            </Text>
                            <Pressable
                                onPress={(event) => {
                                    event.stopPropagation();
                                    handleOpenUserSearch();
                                }}
                                style={({ hovered, pressed }) => [
                                    styles.userProfile,
                                    (hovered || pressed) && styles.userProfileHover,
                                    pressed && styles.userProfileActive,
                                ]}
                            >
                                {displayPhoto
                                    ? <Image source={displayPhoto} style={styles.userPic} />
                                    : <View style={styles.userPic} />}
                                {isDesktopWeb && <Text style={styles.username}>{displayName}</Text>}
                            </Pressable>
                        </View>
                        <Pressable
                            onPressIn={handleNotesPressIn}
                            onPressOut={handleNotesPressOut}
                            onHoverIn={handleCardHoverIn}
                            onPress={handleNotesToggle}
                        >
                            <View style={styles.infoTextContainer}>
                                <Animated.View style={[styles.infoTextWrapper, { maxHeight: notesHeightAnim }]}>
                                    <ScrollView
                                        scrollEnabled={isExpanded && fullNotesHeight > expandedNotesMaxHeight}
                                        showsVerticalScrollIndicator
                                        nestedScrollEnabled
                                        contentContainerStyle={styles.infoTextScroll}
                                    >
                                        <Text
                                            style={styles.infoText}
                                            numberOfLines={isExpanded ? undefined : infoTextNumberOfLines}
                                            ellipsizeMode="tail"
                                        >
                                            {playerNotes ? `“${playerNotes}”` : 'No notes yet.'}
                                        </Text>
                                    </ScrollView>
                                </Animated.View>
                                <View style={styles.hiddenMeasure} onLayout={handleNotesMeasure}>
                                    <Text style={styles.infoText}>
                                        {playerNotes ? `“${playerNotes}”` : 'No notes yet.'}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    </View>
                </View>
                {(manual || manual === false) && (
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {manual ? 'LOREBoards' : 'IGDB'}
                            </Text>
                        </View>
                    </View>
                )}
            </Pressable>
        </View>
    );
}
