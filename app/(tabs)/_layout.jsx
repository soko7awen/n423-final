import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDevice } from "../device-context";

export default function TabsLayout() {
  const { isDesktopWeb } = useDevice();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarStyle: { display: isDesktopWeb ? "none" : "flex" },
        headerShown: !isDesktopWeb,
        headerTitleStyle: {
          fontFamily: "LexendZetta_400Regular",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "LOREBoards",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
