import { StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>

      <Text style={styles.subtitle}>
        University Timetable & Course Registration
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  },
});