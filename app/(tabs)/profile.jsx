import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';

export default function ProfileScreen() {
  return (
    <ScrollView style={theme.container}>
        <Text style={theme.body}>This is your Profile!</Text>
        <Image source={{uri:'https://picsum.photos/480/480'}}
            style={styles.image}
        />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
    image: {
        aspectRatio: 1,
        width: "60%",
        height: "auto",
        borderRadius: 20,
        marginLeft: "auto",
        marginRight: "auto"
    },
    button: {
        width: "200px",
        marginLeft: "auto",
        marginRight: "auto",
    }
});