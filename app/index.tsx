// app/index.tsx
import { supabase } from '@/lib/supabase';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(!!data.session);
      setReady(true);
    })();
  }, []);

  if (!ready) return null; // or a tiny splash

  // If signed in → go to tabs Home; else → cleaner sign-in
  return <Redirect href={signedIn ? '/Home' : '/cleaner-sign-in'} />;
}
