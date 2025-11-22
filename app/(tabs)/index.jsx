import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { theme } from '../../styles/theme';

import MarioWorldImage from '../../assets/super-mario-world.png';


export default function HomeScreen() {
    const router = useRouter();
    return (
        <ScrollView style={theme.container}>
            <View style={styles.welcomeText}>
                <Text style={[theme.title, { fontSize: 32, textAlign: "center" }]}>Welcome to LOREBoards!</Text>
                <Text style={[theme.subtitle, { textAlign: "center" }]}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Ut sit amet euismod turpis. Nullam vel lobortis arcu. Nam auctor erat vehicula odio malesuada.{"\n"}
                    {"\n"}
                    To add entries of your own, you will need to{" "}
                    <Text
                        style={theme.link}
                        onPress={() => router.push("/profile")}
                    >
                        Log In
                    </Text>{" "}
                    or{" "}
                    <Text
                        style={theme.link}
                        onPress={() => router.push("/profile")}
                    >
                        Create an Account
                    </Text>
                    .
                </Text>
            </View>
            <Text style={[theme.title, {width: "100%", maxWidth: 900, marginVertical: 0, marginHorizontal: "auto", }]}>Latest Submissions:</Text>
            <View style={styles.gamesFlex}>
                <View style={styles.gameWrap}>
                    <View style={styles.gameImageWrap}>
                        <Image
                            source={MarioWorldImage}
                            style={styles.gameImage}
                        />
                    </View>
                    <View style={styles.gameLower}>
                        <View style={styles.gameInfo}>
                            <View style={styles.gameInfoBar}>Completed - 96 Exits soko Awen</View>
                            <View style={styles.gameInfoText}>123</View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    welcomeText: {
        width: "100%",
        maxWidth: 1200,
        marginVertical: 0,
        marginHorizontal: "auto",
    },
    gamesFlex: {

    },
    gameWrap: {
        maxWidth: 380,
    },
    gameImageWrap: {
        aspectRatio: 38/27,
        width: "100%",
        height: "auto",
        backgroundColor: "#1D1D1D",
        borderTopLeftRadius: 21,
        borderTopRightRadius: 21,
    },
    gameImage: {
        aspectRatio: 1,
        width: "auto",
        height: "100%",
        marginHorizontal: "auto",
    },
    gameLower: {
        height: 95,
        borderBottomLeftRadius: 21,
        borderBottomRightRadius: 21,
        backgroundColor: "#CFCFCF",
    },
    gameInfo: {
        
    },
    gameInfoBar: {
        zIndex: 1,
        height: 35,
        marginTop: -35,
        justifyContent: "center",

        userProfile: {
            pic: {
                width: 30,
                height: 30,
                borderRadius: "100%",
            }
        }
    },
    gameInfoText: {
        
    },
    button: {
        width: "200px",
        marginHorizontal: "auto",
    }
});
