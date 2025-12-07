import { Animated, Pressable, Text } from 'react-native';
import { useState, useRef } from 'react';

export default function AnimatedButton({ title, onPress, buttonStyle, textStyle }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [pressed, setPressed] = useState(false);

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.93,
            useNativeDriver: true,
            speed: 60,
            bounciness: 10,
            overshootClamping: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 10,
            overshootClamping: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                onPressIn={() => {
                    setPressed(true);
                    onPressIn();
                }}
                onPressOut={() => {
                    onPressOut();
                    setTimeout(() => setPressed(false), 150);
                }}
                onPress={onPress}
                android_disableSound={true}
                style={[
                    {
                        width: "100%",
                        maxWidth: 300,
                        backgroundColor: "#60E54E",
                        borderWidth: 2,
                        borderColor: "#19660F",
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignSelf: "center",
                        alignItems: "center",
                        marginTop: 10,
                        shadowColor: "#19660F",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 3,
                    },
                    pressed && { filter: "brightness(1.5)" },
                    buttonStyle,
                ]}
            >
                <Text style={[{ color: "#fff", fontSize: 24, fontWeight: "600", userSelect: 'none' }, textStyle]}>
                    {title}
                </Text>
            </Pressable>
        </Animated.View>
    );
}
