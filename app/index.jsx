import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

export default function IndexScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/sign-up');
      return;
    }
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_onboarded')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        const hasOnboarded = data?.has_onboarded === true;
        if (hasOnboarded) {
          router.replace('/(tabs)/discover');
        } else {
          router.replace('/onboarding');
        }
      } catch (_) {
        if (!cancelled) router.replace('/onboarding');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (authLoading || (user && profileLoading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
