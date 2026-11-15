import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '../src/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { API_URL } from '../src/config';
import { reloadMovies, useMovies } from '../src/hooks/useMovies';

type Stats = {
  bookings: number;
  tickets_sold: number;
  revenue_etb: number;
  cancelled: number;
  scanned_today: number;
  per_movie: { movie_id: number; title: string; bookings: number; tickets: number; revenue_etb: number }[];
};

type Hall = { id: number; hall_name: string; cinema_name: string };
type AdminMovie = { id: number; title: string; hidden: number };
type AdminShowtime = {
  id: number;
  movie_title: string;
  cinema_name: string;
  hall_name: string;
  starts_at: string;
  price_etb: number;
  bookings: number;
};
type Tab = 'stats' | 'movie' | 'showtime' | 'manage';
type Range = 'today' | '7d' | 'all';

const GENRES = ['Action', 'Drama', 'Sci-fi', 'Animation', 'Adventure', 'Comedy', 'Horror', 'Thriller'];

const RANGES: { id: Range; label: string; title: string }[] = [
  { id: 'today', label: 'Today', title: 'today' },
  { id: '7d', label: '7 days', title: 'last 7 days' },
  { id: 'all', label: 'All time', title: 'all time' },
];

const etb = (n: number) => `${n.toLocaleString()} ETB`;

async function adminCall(
  key: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: object,
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const errorText = (data: any) => {
  const m = data?.message;
  return Array.isArray(m) ? m.join(' ') : String(m ?? 'Something went wrong.');
};

// Tomorrow in cinema time (UTC+3), as YYYY-MM-DD.
const tomorrow = () => new Date(Date.now() + 27 * 3600 * 1000).toISOString().slice(0, 10);

// A stored UTC time shown as cinema time (UTC+3).
const when = (iso: string) => {
  const s = new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)}`;
};

const EMPTY_MOVIE = { title: '', genre: '', duration: '', rating: '', synopsis: '', poster: '', trailer: '' };

export default function Admin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { movies } = useMovies();

  const [key, setKey] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('stats');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [movie, setMovie] = useState(EMPTY_MOVIE);
  const [movieId, setMovieId] = useState<number | null>(null);
  const [hallId, setHallId] = useState<number | null>(null);
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('19:30');
  const [price, setPrice] = useState('250');

  const [adminMovies, setAdminMovies] = useState<AdminMovie[]>([]);
  const [manageMovieId, setManageMovieId] = useState<number | null>(null);
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  const load = useCallback(
    async (r: Range = 'all') => {
      setLoading(true);
      setError('');
      try {
        const res = await adminCall(key, 'GET', `/admin/stats?range=${r}`);
        if (res.status === 401) {
          setStats(null);
          setError('Wrong admin key.');
        } else if (res.status >= 300) {
          setError('Server error. Try again.');
        } else {
          setStats(res.data);
          const h = await adminCall(key, 'GET', '/admin/halls');
          if (Array.isArray(h.data)) setHalls(h.data);
        }
      } catch {
        setError('Cannot reach the server.');
      }
      setLoading(false);
    },
    [key],
  );

  const pickRange = (r: Range) => {
    setRange(r);
    load(r);
  };

  const loadAdminMovies = async () => {
    const r = await adminCall(key, 'GET', '/admin/movies');
    if (Array.isArray(r.data)) setAdminMovies(r.data);
  };

  const openTab = (t: Tab) => {
    setTab(t);
    setNotice(null);
    setConfirmId(null);
    if (t === 'manage') loadAdminMovies().catch(() => {});
  };

  const toggleHidden = async (m: AdminMovie) => {
    setNotice(null);
    const r = await adminCall(key, 'PATCH', `/admin/movies/${m.id}/hidden`, { hidden: !m.hidden });
    if (r.status < 300) {
      setNotice({ ok: true, text: m.hidden ? `"${m.title}" is visible again.` : `"${m.title}" is hidden from the app.` });
      await loadAdminMovies();
      reloadMovies().catch(() => {});
    } else {
      setNotice({ ok: false, text: errorText(r.data) });
    }
  };

  const loadShowtimes = async (id: number) => {
    setManageMovieId(id);
    setConfirmId(null);
    const r = await adminCall(key, 'GET', `/admin/showtimes?movieId=${id}`);
    setShowtimes(Array.isArray(r.data) ? r.data : []);
  };

  const removeShowtime = async (id: number) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setNotice(null);
    const r = await adminCall(key, 'DELETE', `/admin/showtimes/${id}`);
    setConfirmId(null);
    if (r.status < 300) {
      setNotice({ ok: true, text: 'Showtime deleted.' });
      if (manageMovieId) await loadShowtimes(manageMovieId);
    } else {
      setNotice({ ok: false, text: errorText(r.data) });
    }
  };

  const addMovie = async () => {
    setNotice(null);
    setLoading(true);
    try {
      const r = await adminCall(key, 'POST', '/admin/movies', {
        title: movie.title,
        genre: movie.genre,
        duration_min: Number(movie.duration),
        rating: Number(movie.rating || 0),
        synopsis: movie.synopsis,
        poster_url: movie.poster,
        trailer_url: movie.trailer,
      });
      if (r.status < 300) {
        setNotice({ ok: true, text: `Added "${r.data.title}" (id ${r.data.id}).` });
        setMovie(EMPTY_MOVIE);
        reloadMovies().catch(() => {});
      } else {
        setNotice({ ok: false, text: errorText(r.data) });
      }
    } catch {
      setNotice({ ok: false, text: 'Cannot reach the server.' });
    }
    setLoading(false);
  };

  const addShowtime = async () => {
    setNotice(null);
    if (!movieId || !hallId) {
      setNotice({ ok: false, text: 'Pick a movie and a hall.' });
      return;
    }
    setLoading(true);
    try {
      const r = await adminCall(key, 'POST', '/admin/showtimes', {
        movieId,
        hallId,
        date: date.trim(),
        time: time.trim(),
        priceEtb: Number(price),
      });
      if (r.status < 300) {
        setNotice({
          ok: true,
          text: `Added ${r.data.movie_title} at ${r.data.cinema_name}, ${r.data.hall_name}, ${date} ${time}.`,
        });
      } else {
        setNotice({ ok: false, text: errorText(r.data) });
      }
    } catch {
      setNotice({ ok: false, text: 'Cannot reach the server.' });
    }
    setLoading(false);
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: insets.top + 12 }}>
      <Pressable
        onPress={goBack}
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Admin</Text>
    </View>
  );

  if (!stats) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {header}
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
            Enter the admin key
          </Text>
          <TextInput
            value={key}
            onChangeText={setKey}
            placeholder="Admin key"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={inputStyle}
          />
          {error ? <Text style={{ color: colors.redText, textAlign: 'center' }}>{error}</Text> : null}
          <Button label="Open dashboard" onPress={() => load(range)} loading={loading} disabled={!key} />
        </View>
      </View>
    );
  }

  const top = stats.per_movie[0]?.revenue_etb || 1;
  const rangeTitle = RANGES.find((r) => r.id === range)?.title ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 16 }}
      >
        <Chip label="Dashboard" active={tab === 'stats'} onPress={() => openTab('stats')} />
        <Chip label="Add movie" active={tab === 'movie'} onPress={() => openTab('movie')} />
        <Chip label="Add showtime" active={tab === 'showtime'} onPress={() => openTab('showtime')} />
        <Chip label="Manage" active={tab === 'manage'} onPress={() => openTab('manage')} />
      </ScrollView>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 40 }}
        refreshControl={
          tab === 'stats' ? (
            <RefreshControl refreshing={loading} onRefresh={() => load(range)} tintColor={colors.text} />
          ) : undefined
        }
      >
        {notice ? (
          <View
            style={{
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: notice.ok ? '#22C55E' : '#EF4444',
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ color: notice.ok ? '#22C55E' : '#EF4444', fontSize: 14, fontWeight: '700' }}>{notice.text}</Text>
          </View>
        ) : null}

        {tab === 'stats' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {RANGES.map((r) => (
                <Chip key={r.id} label={r.label} active={range === r.id} onPress={() => pickRange(r.id)} />
              ))}
            </View>

            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, gap: 4 }}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>Revenue ({rangeTitle})</Text>
              <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{etb(stats.revenue_etb)}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat label="Tickets sold" value={String(stats.tickets_sold)} />
              <Stat label="Bookings" value={String(stats.bookings)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Stat label="Scanned today" value={String(stats.scanned_today)} />
              <Stat label="Cancelled" value={String(stats.cancelled)} />
            </View>

            <Text style={sectionStyle}>Sales by movie</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 16 }}>
              {stats.per_movie.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 14 }}>No bookings in this period.</Text>
              ) : (
                stats.per_movie.map((m) => (
                  <View key={m.movie_id} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                      <Text style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                        {m.title}
                      </Text>
                      <Text style={{ color: colors.redText, fontSize: 14, fontWeight: '800' }}>{etb(m.revenue_etb)}</Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
                      <View
                        style={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colors.red,
                          width: `${Math.max(4, Math.round((m.revenue_etb / top) * 100))}%`,
                        }}
                      />
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {m.tickets} tickets · {m.bookings} bookings
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {tab === 'movie' ? (
          <>
            <Field label="Title" value={movie.title} onChangeText={(v) => setMovie({ ...movie, title: v })} />

            <Text style={labelStyle}>Genre</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GENRES.map((g) => (
                <Chip key={g} label={g} active={movie.genre === g} onPress={() => setMovie({ ...movie, genre: g })} />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Duration (minutes)"
                  value={movie.duration}
                  onChangeText={(v) => setMovie({ ...movie, duration: v })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Rating (0-10)"
                  value={movie.rating}
                  onChangeText={(v) => setMovie({ ...movie, rating: v })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Field label="Synopsis" value={movie.synopsis} onChangeText={(v) => setMovie({ ...movie, synopsis: v })} multiline />
            <Field
              label="Poster link (optional)"
              value={movie.poster}
              onChangeText={(v) => setMovie({ ...movie, poster: v })}
              placeholder="https://..."
            />
            <PosterPreview url={movie.poster.trim()} />
            <Field
              label="Trailer link (optional)"
              value={movie.trailer}
              onChangeText={(v) => setMovie({ ...movie, trailer: v })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Button label="Add movie" onPress={addMovie} loading={loading} />
          </>
        ) : null}

        {tab === 'showtime' ? (
          <>
            <Text style={labelStyle}>Movie</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {movies.map((m) => (
                <Chip key={m.id} label={m.title} active={movieId === Number(m.id)} onPress={() => setMovieId(Number(m.id))} />
              ))}
            </View>

            <Text style={labelStyle}>Hall</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {halls.map((h) => (
                <Chip
                  key={h.id}
                  label={`${h.cinema_name.replace('YUSA Cinema ', '')} · ${h.hall_name}`}
                  active={hallId === h.id}
                  onPress={() => setHallId(h.id)}
                />
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Time (HH:MM)" value={time} onChangeText={setTime} />
              </View>
            </View>
            <Field label="Price (ETB)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
            <Button label="Add showtime" onPress={addShowtime} loading={loading} />
          </>
        ) : null}

        {tab === 'manage' ? (
          <>
            <Text style={sectionStyle}>Movies</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
              {adminMovies.map((m, i) => (
                <View
                  key={m.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    minHeight: 54,
                    borderBottomWidth: i === adminMovies.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text
                    style={{ flex: 1, color: m.hidden ? colors.muted : colors.text, fontSize: 14, fontWeight: '700' }}
                    numberOfLines={1}
                  >
                    {m.title}
                    {m.hidden ? '  (hidden)' : ''}
                  </Text>
                  <SmallButton label={m.hidden ? 'Show' : 'Hide'} onPress={() => toggleHidden(m)} />
                </View>
              ))}
            </View>

            <Text style={sectionStyle}>Showtimes</Text>
            <Text style={labelStyle}>Pick a movie to see its upcoming showtimes</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {adminMovies.map((m) => (
                <Chip key={m.id} label={m.title} active={manageMovieId === m.id} onPress={() => loadShowtimes(m.id)} />
              ))}
            </View>

            {manageMovieId ? (
              <View style={{ backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14 }}>
                {showtimes.length === 0 ? (
                  <Text style={{ color: colors.muted, fontSize: 14, paddingVertical: 16 }}>No upcoming showtimes.</Text>
                ) : (
                  showtimes.map((s, i) => (
                    <View
                      key={s.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingVertical: 12,
                        borderBottomWidth: i === showtimes.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{when(s.starts_at)}</Text>
                        <Text style={{ color: colors.muted, fontSize: 12 }}>
                          {s.cinema_name.replace('YUSA Cinema ', '')} · {s.hall_name} · {s.price_etb} ETB
                        </Text>
                        {s.bookings > 0 ? (
                          <Text style={{ color: colors.redText, fontSize: 12, fontWeight: '700' }}>
                            {s.bookings} booking{s.bookings > 1 ? 's' : ''}
                          </Text>
                        ) : null}
                      </View>
                      {s.bookings === 0 ? (
                        <SmallButton
                          label={confirmId === s.id ? 'Sure?' : 'Delete'}
                          danger
                          onPress={() => removeShowtime(s.id)}
                        />
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const labelStyle = { color: colors.muted, fontSize: 13, fontWeight: '700' as const };
const sectionStyle = { color: colors.text, fontSize: 18, fontWeight: '800' as const, marginTop: 8 };

const inputStyle = {
  height: 50,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  color: colors.text,
  fontSize: 16,
  paddingHorizontal: 14,
};

// Shows the poster under the link field. The key resets the error when the link changes.
function PosterPreview({ url }: { url: string }) {
  if (!/^https?:\/\//i.test(url)) return null;
  return <PosterImage key={url} url={url} />;
}

function PosterImage({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      {failed ? (
        <Text style={{ color: colors.redText, fontSize: 13 }}>This link is not an image.</Text>
      ) : (
        <Image
          source={{ uri: url }}
          onError={() => setFailed(true)}
          style={{ width: 120, height: 180, borderRadius: 12, backgroundColor: colors.surface }}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        style={[inputStyle, multiline ? { height: 100, paddingTop: 12, textAlignVertical: 'top' } : null]}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? colors.red : colors.surface,
        borderWidth: 1,
        borderColor: active ? colors.red : colors.border,
      }}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: danger ? '#EF4444' : colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <Text style={{ color: danger ? '#EF4444' : colors.text, fontSize: 13, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

function Button({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        height: 50,
        borderRadius: 14,
        backgroundColor: colors.red,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.5 : 1,
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{label}</Text>}
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 18, padding: 16, alignItems: 'center', gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
    </View>
  );
}