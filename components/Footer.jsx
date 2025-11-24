import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import { Link } from "expo-router";

import { useDevice } from "../app/_layout";

export default function Footer() {
  const { isDesktopWeb } = useDevice();

    const style = StyleSheet.create({
    footer: {
        width: "100%",
        height: isDesktopWeb ? 70 : "auto",
        backgroundColor: "#33052eff",
        flexDirection: isDesktopWeb ? "row" : "column",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: isDesktopWeb ? "unset" : 10,
        paddingHorizontal: 20,
    },
    left: {
        flexDirection: "row",
        gap: 20,
        marginBottom: 0,
    },
    link: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
    },
    right: {
        marginTop: 0,
        color: "#AAAAAA",
        lineHeight: "1.5em",
        fontSize: 14,
    },
    });

  return (
    <View style={[style.footer, !isDesktopWeb && style.footerNarrow]}>
      <View style={style.left}>
        <Link href="/about" style={style.link}>About Us</Link>
        <Link href="/contact" style={style.link}>Contact</Link>
      </View>
      <Text style={style.right}>
        <Text style={{ fontWeight: "bold" }}>LOREBoards</Text> <Text style={{ fontStyle: "italic" }}>“Playing Games to Study”</Text> · <Text style={{ whiteSpace: "nowrap"}}>(555) 123-2456</Text> · <Text style={{ whiteSpace: "nowrap"}}>9876 Place Ave. IN,  20456</Text>
      </Text>
    </View>
  );
}
