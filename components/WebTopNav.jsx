import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { useDevice } from "../app/device-context";
import { useAuth } from "../src/auth/AuthContext";
import { auth, db } from "../src/firebase/firebaseConfig";

export default function WebTopNav() {
  const { isDesktopWeb } = useDevice();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rotateAnim = useMemo(() => new Animated.Value(0), []);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const username = user?.displayName || user?.email?.split("@")[0] || "User";
  const photo = profilePhoto || user?.photoURL || null;

  useEffect(() => { if (!user) setOpen(false); }, [user]);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!user) {
        setProfilePhoto(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "profiles", user.uid));
        const data = snap.data();
        setProfilePhoto(data?.photoData || null);
      } catch {
        setProfilePhoto(null);
      }
    };
    loadProfilePhoto();
  }, [user]);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const handleNavPress = () => {
    if (!user) {
      router.push("/login");
    } else {
      toggleOpen();
    }
  };

  const handlePickImage = async () => {
    if (!auth.currentUser) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;

    try {
      // Compress and convert to base64 data URI to avoid needing Cloud Storage
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 128 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipulated.base64) return;
      const dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
      // Store in Firestore to avoid photoURL length limits
      await setDoc(doc(db, "profiles", auth.currentUser.uid), { photoData: dataUrl }, { merge: true });
      setProfilePhoto(dataUrl);
      // Try to set photoURL only if short enough to avoid the profile attribute limit
      if (dataUrl.length < 1900) {
        await updateProfile(auth.currentUser, { photoURL: dataUrl });
      }
    } catch (e) {
      console.warn("Failed to update profile photo", e);
    }
  };

  const handleAvatarPress = (e) => {
    e?.stopPropagation?.();
    if (user) {
      handlePickImage();
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    router.replace("/login");
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View as="header" style={style.header}>
      <View
        as="nav"
        style={[
          style.nav,
          { flexWrap: isDesktopWeb ? "nowrap" : "wrap", gap: isDesktopWeb ? 16 : 8 },
        ]}
      >
        <Link href="/" style={style.logo}>LOREBoards</Link>

        <View
          style={[
            style.linksRow,
            { gap: isDesktopWeb ? 16 : 8 },
          ]}
        >
          <Link href="/create" style={{ fontSize: 20 }}>
            <Pressable
              style={({ hovered, pressed }) => [
                style.addBtn,
                hovered && style.addBtnHover,
                pressed && style.addBtnActive,
              ]}
            >
              <Text name="add" style={style.addBtnText}>+</Text>
            </Pressable>
          </Link>
          <Pressable
            style={({ hovered, pressed }) => [
              style.profile,
              hovered && style.profileHover,
              pressed && style.profileActive,
            ]}
            onPress={handleNavPress}
          >
            <Pressable onPress={handleAvatarPress}>
              {photo
                ? <Image source={{ uri: photo }} style={style.avatar} />
                : <Ionicons style={style.avatarIcon} name="person-circle-outline" size={44} />}
            </Pressable>
            <Text style={style.profileLabel}>{user ? username : "Log In"}</Text>
            {user && (
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons style={style.chevron} name="chevron-down-outline" />
              </Animated.View>
            )}
          </Pressable>
          {open && user && (
            <View style={style.dropdown}>
              <Pressable
                style={({ hovered, pressed }) => [
                  style.dropdownItem,
                  hovered && style.dropdownItemHover,
                  pressed && style.dropdownItemActive,
                ]}
                onPress={() => { setOpen(false); router.push("/search"); }}
              >
                <Text style={style.dropdownText}>My Completions</Text>
              </Pressable>
              <Pressable
                style={({ hovered, pressed }) => [
                  style.dropdownItem,
                  hovered && style.dropdownItemHover,
                  pressed && style.dropdownItemActive,
                ]}
                onPress={handleLogout}
              >
                <Text style={style.dropdownText}>Log Out</Text>
              </Pressable>
            </View>
          )}
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
    backgroundColor: "#fff",
    transitionProperty: "transform, background-color, border-color",
    transitionDuration: "140ms",
    transitionTimingFunction: "ease-out",
  },
  addBtnText: {
    fontSize: 36,
    color: "#000",
    lineHeight: 36,
  },
  addBtnHover: {
    backgroundColor: "#e7f0ff",
    borderColor: "#4b7bec",
    transform: [{ translateY: -1 }],
  },
  addBtnActive: {
    backgroundColor: "#cddbff",
    borderColor: "#2d5ad7",
    transform: [{ translateY: 0 }],
  },
  profile: {
    display: "flex",
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 20,
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 12,
    transitionProperty: "background-color, transform",
    transitionDuration: "140ms",
    transitionTimingFunction: "ease-out",
  },
  profileLabel: {
    fontSize: 20,
    marginLeft: 8,
  },
  chevron: {
    marginTop: -2,
    marginLeft: 10,
    fontSize: 28,
  },
  profileHover: {
    backgroundColor: "#f2f6ff",
    transform: [{ translateY: -1 }],
  },
  profileActive: {
    backgroundColor: "#e0e9ff",
    transform: [{ translateY: 0 }],
  },
  avatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  avatarIcon: {
    fontSize: 44,
  },
  dropdown: {
    position: "absolute",
    top: 60,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e2e2",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    width: 200,
    paddingVertical: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemHover: {
    backgroundColor: "#f2f6ff",
  },
  dropdownItemActive: {
    backgroundColor: "#e0e9ff",
  },
  dropdownText: {
    fontSize: 16,
  },
});
