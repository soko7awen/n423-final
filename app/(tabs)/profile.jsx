import { View, Text, StyleSheet, ScrollView, Image, } from 'react-native';

import { useTheme } from '../../styles/theme';
import Footer from "../../components/Footer";
import { useDevice } from "../../app/_layout";

import AboutImage from '../../assets/about.png';


export default function ProfileScreen() {
    const { isDesktopWeb } = useDevice();
    const theme = useTheme();

    return (
        <ScrollView contentContainerStyle={theme.scrollContainer}>
            <View style={theme.mainContainer}>
                <Text style={[theme.title, { textAlign: "center", }]}>Profile</Text>
                <Text style={[theme.body, { width: "100%", maxWidth: 1000, marginHorizontal: "auto", textAlign: "center", fontSize: 18 }]}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin gravida  porta felis, vitae porta velit mattis vel. Nunc ut nibh tortor. Vivamus  suscipit risus ac mattis venenatis. Donec convallis, risus vitae  ultrices volutpat, massa ex pretium justo, quis molestie nunc neque sit  amet diam. Maecenas at ex vitae felis posuere eleifend vel vel nulla. 
                </Text>
                <Image
                    source={AboutImage}
                    style={styles.image}
                />
            </View>
            {isDesktopWeb && <Footer />}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    image: {
        aspectRatio: 650/500,
        width: "100%",
        maxWidth: 650,
        height: 'auto',
        marginVertical: 40,
        alignSelf: 'center',
    }
});
