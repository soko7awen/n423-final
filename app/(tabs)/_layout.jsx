import { useWindowDimensions, Platform, View, Text } from "react-native";
import { Tabs, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import WebTopNav from "../../components/WebTopNav";

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 768;

  return (
    <>
      {isDesktopWeb && <WebTopNav />}

      <Tabs
        screenOptions={{
          headerShown: !isDesktopWeb,
          tabBarStyle: { display: isDesktopWeb ? "none" : "flex" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="details"
          options={{ title: "Details" }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: "Profile" }}
        />
      </Tabs>
    </>
  );
}
