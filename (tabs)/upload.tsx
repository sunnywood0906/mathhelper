import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function UploadScreen() {
  const router = useRouter();
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []); // 鎖定橫向


   const handleAddPress = () => {
    Alert.alert(
      '上傳方式',
      '請選擇上傳題目的方式',
      [
        { text: '手寫輸入', onPress: () => console.log('手寫模式') },
        { text: '上傳照片', onPress: () => router.push('/picture_upload') },
        { text: '拍照上傳', onPress: () => console.log('拍照上傳') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/upload.png')} 
        style={styles.image} 
      />

      {/* 加號按鈕（風格同 HomeScreen） */}
      <TouchableOpacity style={styles.circle} onPress={handleAddPress}>
        <Ionicons name="add" size={50} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center', // 垂直置中
    alignItems: 'center',     // 水平置中
  },
  image: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
//按鈕
  circle: {
    backgroundColor: '#00AEEF', // 同 HomeScreen
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});