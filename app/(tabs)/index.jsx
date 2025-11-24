import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import MaskedView from '@react-native-masked-view/masked-view';

import { useTheme } from '../../styles/theme';
import Footer from "../../components/Footer";
import GameCard from "../../components/GameCard";
import { useDevice } from "../../app/_layout";

export default function HomeScreen() {
    const router = useRouter();
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    const styles = StyleSheet.create({
        welcomeText: {
            width: "100%",
            maxWidth: 1200,
            paddingHorizontal: 15,
            marginHorizontal: "auto",
        },
        welcomeTextLink: {
            ...theme.link,
            color: "#062dff"
        },
        gamesContainer: {
            position: "relative",
            overflow: 'hidden',
        },
        gamesFlex: {
            flexDirection: "row",
            gap: 27,
            alignItems: 'center',
        },
        webMask: {
            overflow: 'hidden',
            maskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 100%)',
        },
    });

    const GamesContent = () => (
        <View style={styles.gamesFlex}>
            <GameCard />
            <GameCard />
            <GameCard />
            <GameCard />
            <GameCard />
        </View>
    );

    return (
        <ScrollView contentContainerStyle={theme.scrollContainer}>
            <LinearGradient
                colors={['rgba(250, 218, 97, 1)', 'rgba(255, 145, 136, 1)', 'rgba(255, 90, 205, 1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.welcomeText}>
                    <Text style={[theme.title, { marginTop: 30, fontSize: 32, textAlign: "center" }]}>
                        Welcome to LOREBoards!
                    </Text>
                    <Text style={[theme.subtitle, { textAlign: "center" }]}>
                        We love indexing game completions...{"\n"}
                        {"\n"}
                        To add entries of your own, you will need{" "}
                        <Text style={styles.welcomeTextLink} onPress={() => router.push("/login")}>Log In</Text>{" "}
                        or{" "}
                        <Text style={styles.welcomeTextLink} onPress={() => router.push("/signup")}>Create an Account</Text>.
                    </Text>
                </View>
            </LinearGradient>
            <View style={theme.mainContainer}>
                <Text style={[theme.title, { marginLeft: isDesktopWeb ? "5%" : 0 }]}>
                    Latest Submissions:
                </Text>

                <View style={[styles.gamesContainer, { marginLeft: isDesktopWeb ? "5%" : 0, width: isDesktopWeb ? '95%' : '100%' }]}>
                    {Platform.OS === 'web' ? (
                        <View style={styles.webMask}>
                            <GamesContent />
                        </View>
                    ) : (
                        <MaskedView
                            style={{ width: '100%' }}
                            maskElement={
                                <LinearGradient
                                    colors={['#000', '#000', 'transparent']}
                                    start={[0, 0]}
                                    end={[1, 0]}
                                    style={{ flex: 1 }}
                                />
                            }
                        >
                            <GamesContent />
                        </MaskedView>
                    )}
                </View>
            </View>
            <Footer />
        </ScrollView>
    );
}

