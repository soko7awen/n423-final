import { View, Text, useWindowDimensions, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WebTopNav() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  return (
    <View as="header" style={style.header}>
      <View
        as="nav"
        style={[
          style.nav,
          { flexWrap: isNarrow ? "wrap" : "nowrap", gap: isNarrow ? 8 : 16 },
        ]}
      >
        <Link href="/" style={style.logo}>LOREBoards</Link>

        <View
          style={[
            style.linksRow,
            { gap: isNarrow ? 8 : 16 },
          ]}
        >
          <Link href="/create" style={{ fontSize: 20 }}>
            <Text name="add" style={style.addBtn}>+</Text>
          </Link>
          <Link href="/profile" style={style.profile}>
            <Ionicons style={{ height: 40, marginTop: -20, fontSize: 50 }} name="person-circle-outline"></Ionicons>
            Profile
            <Ionicons style={{ marginTop: -2, marginLeft: 10, fontSize: 28 }} name="chevron-down-outline"></Ionicons>
          </Link>
        </View>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  header: {
    zIndex: 1000,
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  logo: {
    fontSize: 32,
    fontFamily: "LexendZetta_400Regular",
  },
  addBtn: {
    display: "flex",
    height: 37,
    width: 37,
    border: "3px solid black",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 36,
  },
  profile: {
    display: "flex",
    paddingTop: 5,
    fontSize: 20,
    alignItems: "center",
  },
});