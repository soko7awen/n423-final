import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router';

import { useDevice } from "../app/device-context";

import MarioWorldImage from '../assets/super-mario-world.png';
import ProfileImage from '../assets/zim-zorp.png';

export default function GameCard() {
    const router = useRouter();
    const { isDesktopWeb } = useDevice();

    const infoBarHeight = Math.round(isDesktopWeb ? 35 : 28);
    const infoTextNumberOfLines = isDesktopWeb ? 4 : 3;
    const infoTextLineHeight = isDesktopWeb ? 18 : 12;
    const styles = StyleSheet.create({
        container: {
            width: isDesktopWeb ? 420 : 240,
            backgroundColor: '#f5f7faff',
            paddingVertical: isDesktopWeb ? 20 : 10,
            borderRadius: 21
        },
        titleWrap: { 
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'flex-start'
        },
        title: {
            fontSize: isDesktopWeb ? 24 : 16,
            fontWeight: 'bold',
            textDecorationLine: 'underline',
            textAlign: 'center',
            color: '#1D1D1D'
        },
        year: {
            fontSize: isDesktopWeb ? 18 : 14,
            textDecorationLine: 'none',
            color: '#888888',
        },
        innerCard: {
            marginHorizontal: isDesktopWeb ? 48 : 12
        },
        imageWrap: {
            aspectRatio: 38 / 27,
            height: 'auto',
            backgroundColor: '#1D1D1D',
            borderTopLeftRadius: 21,
            borderTopRightRadius: 21
        },
        image: {
            aspectRatio: 1,
            width: 'auto',
            height: '100%',
            marginHorizontal: 'auto'
        },
        info: {
            height: isDesktopWeb ? 95 : 50,
            backgroundColor: '#ececec',
            borderBottomLeftRadius: 21,
            borderBottomRightRadius: 21
        },
        infoBar: {
            height: infoBarHeight,
            backgroundColor: '#ffffffe8',
            paddingHorizontal: 10,
            marginTop: -infoBarHeight+.01,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        statusText: {
            fontSize: isDesktopWeb ? 16 : 12,
            color: '#1D1D1D'
        },
        userProfile: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
        },
        userPic: {
            width: infoBarHeight-4,
            height: infoBarHeight-4,
            borderRadius: 100,
            marginVertical: 5,
        },
        username: {
            fontSize: isDesktopWeb ? 16 : 12,
            fontWeight: 'bold',
            color: '#0077CC'
        },
        infoText: {
            maxHeight: (infoTextLineHeight * infoTextNumberOfLines) + (isDesktopWeb ? 0 : 3),
            paddingBottom: 5,
            paddingHorizontal: 5,
            marginTop: isDesktopWeb ? 10 : 5,
            lineHeight: infoTextLineHeight,
            fontSize: isDesktopWeb ? 16 : 10,
            color: '#5B5B5B',
        }
  });

  return (
    <View style={styles.container}>
        <View style={styles.titleWrap}>
            <Text style={styles.title}>Super Mario World</Text>
            <Text style={styles.year}>{" "}(1991)</Text>
        </View>
        <View style={styles.innerCard}>
            <View style={styles.imageWrap}>
                <Image
                    source={MarioWorldImage}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.info}>
                <View style={styles.infoBar}>
                <Text style={styles.statusText}>
                    <Text style={{ color: "#60E54E" }}>✓ Completed</Text> – <Text style={{ fontWeight:"bold" }}>96 Exits</Text>
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/search")}
                    style={styles.userProfile}
                >
                    <Image source={ProfileImage} style={styles.userPic} />
                    {isDesktopWeb && <Text style={styles.username}>soko Awen</Text>}
                </TouchableOpacity>
                </View>
                <Text
                 style={styles.infoText}
                 numberOfLines={infoTextNumberOfLines}
                 ellipsizeMode="tail"
                 >
                -  “Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dignissim justo non varius scelerisque."
                </Text>
            </View>
        </View>
    </View>
  )
}
