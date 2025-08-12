import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type PhotoRow = {
  image_url: string;    // storage path
  type: 'before' | 'after';
  created_at: string;
};
type GalleryItem = {
  path: string;
  url: string;
  type: 'before' | 'after';
  created_at: string;
};
type Props = {
  jobId: string;
  bucket?: string;             // default 'photos'
  useSignedUrls?: boolean;     // default false (public bucket)
  columns?: number;            // default 3
  refreshKey?: string | number;
};

const withCB = (url: string) => `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`;

async function toDisplayUrl(bucket: string, path: string, signed: boolean) {
  if (signed) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw error || new Error('Failed to sign URL');
    return withCB(data.signedUrl);
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return withCB(data.publicUrl);
}

export default function JobPhotoGallery({
  jobId,
  bucket = 'photos',
  useSignedUrls = false,
  columns = 3,
  refreshKey,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const gap = 8;
  const screenW = Dimensions.get('window').width;
  const horizontalPadding = 16; // match your card/container padding
  const thumbSize = useMemo(() => {
    const totalGaps = gap * (columns - 1);
    const available = screenW - horizontalPadding * 2 - totalGaps;
    return Math.floor(available / columns);
  }, [screenW, columns]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('photos')
          .select('image_url, type, created_at')
          .eq('job_id', jobId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = (data as PhotoRow[]) ?? [];
        const urls = await Promise.all(
          rows.map(async (r) => ({
            path: r.image_url,
            url: await toDisplayUrl(bucket, r.image_url, useSignedUrls),
            type: r.type,
            created_at: r.created_at,
          }))
        );

        if (!cancelled) setItems(urls);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load photos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [jobId, bucket, useSignedUrls, refreshKey]);

  const openAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading photos…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centerBox}>
        <Text style={{ color: 'tomato' }}>{error}</Text>
      </View>
    );
  }
  if (items.length === 0) {
    return <Text style={styles.muted}>No photos yet.</Text>;
  }

  return (
    <View>
      {/* SIMPLE WRAPPED GRID (no FlatList) */}
      <View style={[styles.gridWrap, { marginRight: -gap, marginBottom: -gap }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item.path}-${index}`}
            onPress={() => openAt(index)}
            activeOpacity={0.8}
            style={{ width: thumbSize, height: thumbSize, marginRight: gap, marginBottom: gap }}
          >
            <Image
              source={{ uri: item.url }}
              style={{ width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#eee' }}
              resizeMode="cover"
            />
            <View style={styles.pill}>
              <Text style={styles.pillText}>{item.type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIGHTBOX (separate root via Modal, FlatList here is OK) */}
      <Modal visible={lightboxOpen} animationType="fade" onRequestClose={() => setLightboxOpen(false)}>
        <View style={styles.lightboxRoot}>
          <View style={styles.lightboxHeader}>
            <Text style={styles.lightboxTitle}>
              {items[lightboxIndex]?.type?.toUpperCase()} • {lightboxIndex + 1}/{items.length}
            </Text>
            <Pressable onPress={() => setLightboxOpen(false)} hitSlop={10}>
              <X color="#fff" size={24} />
            </Pressable>
          </View>

          {/* Use a plain pager-style view to avoid VirtualizedList inside scroll roots */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={{ uri: items[lightboxIndex]?.url }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>

          {/* Simple left/right controls (optional) */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => setLightboxIndex(i => Math.max(0, i - 1))}
              disabled={lightboxIndex === 0}
              style={[styles.navBtn, lightboxIndex === 0 && { opacity: 0.4 }]}
            >
              <Text style={styles.navTxt}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLightboxIndex(i => Math.min(items.length - 1, i + 1))}
              disabled={lightboxIndex === items.length - 1}
              style={[styles.navBtn, lightboxIndex === items.length - 1 && { opacity: 0.4 }]}
            >
              <Text style={styles.navTxt}>Next</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.caption}>
            <Text style={styles.captionText}>
              {items[lightboxIndex]?.type} • {new Date(items[lightboxIndex]?.created_at || '').toLocaleString()}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  muted: { color: '#777' },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' },

  pill: {
    position: 'absolute',
    left: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pillText: { color: '#fff', fontSize: 11, textTransform: 'capitalize' },

  lightboxRoot: { flex: 1, backgroundColor: 'black' },
  lightboxHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  lightboxImage: { width: '100%', height: '70%' },
  navRow: { position: 'absolute', bottom: 80, width: '100%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  navBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  navTxt: { color: '#fff', fontWeight: '600' },
  caption: { position: 'absolute', bottom: 24, width: '100%', alignItems: 'center' },
  captionText: { color: '#fff', opacity: 0.85 },
});
