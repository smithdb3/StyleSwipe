import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>StyleSwipe — Expo + Supabase</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function App() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    supabase.auth.getSession().then(res =>
      setStatus(res.data ? 'Connected! ✅' : 'Ready')
    ).catch(err => setStatus('Error: ' + err.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text>StyleSwipe — {status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}