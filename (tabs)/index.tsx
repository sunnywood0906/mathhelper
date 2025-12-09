import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  return (
    <ImageBackground 
      source={require('../../assets/images/home.png')}
      style={styles.background}
    >
      {/* 按鈕列 */}
      <View style={styles.buttonRow}>
        {/* Upload 按鈕 */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/picture_upload?reset=1')}>
          <View style={styles.circle}>
            <Ionicons name="add" size={50} color="#fff" />
          </View>
          <Text style={styles.label}>upload</Text>
        </TouchableOpacity>

        {/* Check 按鈕 */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/check')}>
          <View style={styles.circle}>
            <Ionicons name="list" size={50} color="#fff" />
          </View>
          <Text style={styles.label}>check</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  button: {
    alignItems: 'center',
    marginHorizontal: 80, // 拉開按鈕間距
  },
  circle: {
    backgroundColor: '#00AEEF',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
