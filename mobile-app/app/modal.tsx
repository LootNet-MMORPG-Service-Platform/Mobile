import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LootNet</Text>
      <Text style={styles.body}>Your inventory, rewards, market listings, and runs live in the main tabs.</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Return Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#2C1810',
  },
  title: {
    color: '#F4E4C1',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
  },
  body: {
    color: '#A0826D',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Lato_400Regular',
  },
  link: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#8B7355',
  },
  linkText: {
    color: '#F4E4C1',
    fontWeight: '700',
    fontFamily: 'Lato_700Bold',
  },
});
