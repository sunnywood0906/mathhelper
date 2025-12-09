import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function PictureUpload() {
  const router = useRouter();
  const { reset } = useLocalSearchParams();  // ⭐ 讀取 reset 參數

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [cleanLatex, setCleanLatex] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extra, setExtra] = useState("");

  // ⭐ reset=1 → 清空全部資料
  useEffect(() => {
    if (reset === "1") {
      console.log("🔄 RESET triggered");
      setImageUri(null);
      setRecognizedText(null);
      setCleanLatex(null);
      setExtra("");
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要相簿權限才能選擇照片");
      return;
    }

    setRecognizedText(null);
    setCleanLatex(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });

    if (!result.canceled) {
      const image = result.assets[0];

      let manipulated = image;
      if (image.width < 1000) {
        const scale = 1000 / image.width;
        manipulated = await ImageManipulator.manipulateAsync(
          image.uri,
          [{ resize: { width: Math.round(image.width * scale) } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
      }

      setImageUri(manipulated.uri);
      handleRecognize(manipulated.uri);
    }
  };

  const handleRecognize = async (uri: string) => {
    try {
      setLoading(true);
      setRecognizedText(null);
      setCleanLatex(null);

      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "question.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch("http://192.168.0.109:8000/api/gemini_latex", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.latex) {
        setRecognizedText(`辨識結果：${data.latex}`);
        setCleanLatex(data.latex);
      } else {
        setRecognizedText("辨識失敗，請再試一次");
      }
    } catch (err) {
      console.error("❌ 辨識錯誤：", err);
      setRecognizedText("發生錯誤，請檢查伺服器");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!cleanLatex) {
      Alert.alert("提示", "尚未成功辨識題目");
      return;
    }

    const ts = Date.now();

    router.replace(
      `/step?problem=${encodeURIComponent(cleanLatex)}&extra=${encodeURIComponent(extra)}&ts=${ts}`
    );
  };

  const handlePrevious = () => router.back();


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        <Image
          source={require('@/assets/images/upload.png')}
          style={styles.image}
        />

        {!imageUri && (
          <TouchableOpacity style={styles.circle} onPress={pickImage}>
            <Ionicons name="add" size={50} color="#fff" />
          </TouchableOpacity>
        )}

        {imageUri && (
          <View style={styles.resultBox}>

            <Image key={imageUri} source={{ uri: imageUri }} style={styles.preview} />

            {loading ? (
              <ActivityIndicator size="large" color="#00AEEF" style={{ marginTop: 10 }} />
            ) : (
              recognizedText && <Text style={styles.text}>{recognizedText}</Text>
            )}

            <ScrollView style={styles.extraWrapper} keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.extraInput}
                placeholder="你可以補充題目背景、你卡住的地方、希望 AI 多講解的方向（可留白）"
                value={extra}
                onChangeText={setExtra}
                multiline
                placeholderTextColor="#777"
              />
            </ScrollView>

            {!loading && (
              <View style={styles.buttonRow}>

                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#4A90E2" }]}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>重新上傳</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#FF7F50" }]}
                  onPress={() => handleRecognize(imageUri!)}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.buttonText}>重新識別</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#999" }]}
                  onPress={handlePrevious}
                >
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                  <Text style={styles.buttonText}>上一步</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallButton, { backgroundColor: "#00AEEF" }]}
                  onPress={handleNext}
                >
                  <Text style={styles.buttonText}>下一步</Text>
                  <Ionicons name="arrow-forward" size={22} color="#fff" />
                </TouchableOpacity>

              </View>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  image: { position: 'absolute', width: '100%', height: '100%', resizeMode: 'contain' },
  circle: { backgroundColor: '#00AEEF', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },

  resultBox: { alignItems: 'center', width: '70%', marginTop: -40 },
  preview: { width: 300, height: 200, borderRadius: 10, resizeMode: 'contain' },
  text: { marginTop: -5, fontSize: 16, color: '#333', textAlign: 'center' },

  extraWrapper: { width: "100%", height: 140, marginTop: 5 },
  extraInput: {
    backgroundColor: "#F3F3F3", borderRadius: 10, padding: 12, width: "100%", minHeight: 100,
    fontSize: 15, textAlignVertical: "top", borderWidth: 1, borderColor: "#ccc", flex: 1,
  },

  buttonRow: { marginTop: 15, width: '100%', flexDirection: 'row', justifyContent: 'space-between', flexWrap: "wrap", gap: 10 },
  smallButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600', marginHorizontal: 4 },
});
