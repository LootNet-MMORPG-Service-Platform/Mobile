import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const tips = [
  {
    title: 'Prepare Gear',
    body: 'Move items into Adventure Gear before starting a run. Items listed on the market stay out of your adventure choices.',
  },
  {
    title: 'Choose Difficulty',
    body: 'Scout is the lighter route. Warband is the standard fight for better pressure and bigger risk.',
  },
  {
    title: 'Fight Smart',
    body: 'Attack, reposition, and adjust your hands when the current weapon setup does not fit the enemy distance.',
  },
  {
    title: 'Claim Rewards',
    body: 'Daily rewards add fresh loot to your inventory. Check back after the UTC reset.',
  },
];

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="questionmark.circle" size={42} color="#D6A84F" />
        <Text style={styles.title}>Guide</Text>
        <Text style={styles.subtitle}>Quick reminders for surviving LootNet runs.</Text>
      </View>

      <View style={styles.content}>
        {tips.map((tip) => (
          <View key={tip.title} style={styles.tip}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipBody}>{tip.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C1810' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#1A0E08', borderBottomWidth: 2, borderBottomColor: '#8B7355' },
  title: { color: '#F4E4C1', fontSize: 28, fontWeight: '700', textTransform: 'uppercase', marginTop: 10, fontFamily: 'Lato_700Bold' },
  subtitle: { color: '#A0826D', fontSize: 15, marginTop: 6, textAlign: 'center', fontFamily: 'Lato_400Regular' },
  content: { padding: 16, gap: 12 },
  tip: { backgroundColor: '#3E2723', borderWidth: 1, borderColor: '#8B7355', borderRadius: 8, padding: 14 },
  tipTitle: { color: '#D6A84F', fontSize: 16, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  tipBody: { color: '#F4E4C1', fontSize: 14, lineHeight: 20, marginTop: 6, fontFamily: 'Lato_400Regular' },
});
