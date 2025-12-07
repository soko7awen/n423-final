import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { auth } from '../../src/firebase/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function SignIn() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (user) router.replace('/(tabs)'); }, [user]);

  const onSignIn = async () => {
    setError('');
    try { await signInWithEmailAndPassword(auth, email.trim(), pw); }
    catch (e) { setError(e.message); }
  };

  const onSignUp = async () => {
    setError('');
    try { await createUserWithEmailAndPassword(auth, email.trim(), pw); }
    catch (e) { setError(e.message); }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Welcome</Text>
      <TextInput style={s.input} placeholder="email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="password" secureTextEntry value={pw} onChangeText={setPw} />
      {!!error && <Text style={s.error}>{error}</Text>}
      <View style={{ flexDirection:'row', gap:12, marginTop:8 }}>
        <Button title="Sign In" onPress={onSignIn} />
        <Button title="Create Account" onPress={onSignUp} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  container:{ flex:1, padding:16, paddingTop:80 },
  title:{ fontSize:28, fontWeight:'700', marginBottom:12 },
  input:{ borderWidth:1, borderColor:'#ccc', padding:12, borderRadius:10, marginBottom:8 },
  error:{ color:'#c00', marginTop:6 }
});