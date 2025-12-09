import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AnswerPage() {
  const router = useRouter();
  const { problem, extra } = useLocalSearchParams();

  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");

  /* ---------------- 核對答案 ---------------- */
  async function checkAnswer() {
    if (!userAnswer.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("http://192.168.0.109:8000/api/check_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          user_answer: userAnswer,
        }),
      });

      const data = await res.json();

      setIsCorrect(data.correct);
      setAiMessage(data.message);
      setAiAnswer(data.standard_answer);

    } catch (err) {
      console.log(err);
      setIsCorrect(false);
      setAiMessage("伺服器連線錯誤");
      setAiAnswer("");
    }

    setLoading(false);
  }

  return (
    <View style={styles.container}>

      {/* 上半：使用者輸入 Answer */}
      <View style={styles.card}>
        <Text style={styles.title}>題目</Text>

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{problem}</Text>
        </View>

        <Text style={styles.section}>你的答案</Text>

        <TextInput
          style={styles.input}
          placeholder="請輸入你的最終答案"
          value={userAnswer}
          onChangeText={setUserAnswer}
        />

        {/* 按鈕列 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.blueBtn}
            onPress={() => router.push({ pathname: "/(tabs)/step", params: { problem, extra }, }) }
          >
            <Text style={styles.blueBtnText}>← 回步驟頁</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.grayBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.grayBtnText}>← 回首頁</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.greenBtn} onPress={checkAnswer}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.greenBtnText}>核對答案</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 下半：AI 回答區（按下核對後才顯示） */}
      {isCorrect !== null && (
        <View style={styles.aiCard}>
          <ScrollView>

            {/* 判斷正確與否 */}
            <Text
              style={[
                styles.resultText,
                isCorrect ? styles.correct : styles.wrong,
              ]}
            >
              {isCorrect ? "✔ 答案正確！" : "✘ 答案不正確"}
            </Text>

            {/* AI 30 字短評 */}
            <Text style={styles.aiMessage}>{aiMessage}</Text>

            {/* 標準答案 */}
            <Text style={styles.section}>AI 標準答案</Text>

            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{aiAnswer}</Text>
            </View>

          </ScrollView>
        </View>
      )}

    </View>
  );
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A7DCE3",
    padding: 25,
    alignItems: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 30,
    paddingVertical: 30,
    paddingHorizontal: 28,

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,

    marginBottom: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  questionBox: {
    backgroundColor: "#EFEFEF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 18,
  },

  questionText: {
    fontSize: 17,
    lineHeight: 24,
    color: "#333",
  },

  section: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },

  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  grayBtn: {
    backgroundColor: "#9E9E9E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  grayBtnText: {
    color: "white",
    fontWeight: "bold",
  },
  blueBtn: {
  backgroundColor: "#5c9cc4ff",
  paddingVertical: 12,
  paddingHorizontal: 30,
  borderRadius: 12,
  },
  blueBtnText: {
    color: "white",
    fontWeight: "bold",
  },

  greenBtn: {
    backgroundColor: "#73C45C",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  greenBtnText: {
    color: "white",
    fontWeight: "bold",
  },

  /* ---------------- AI 回答卡片 ---------------- */
  aiCard: {
    width: "100%",
    flex: 1,
    backgroundColor: "white",
    borderRadius: 25,
    padding: 22,

    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  resultText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  correct: { color: "#2ECC71" },
  wrong: { color: "#E74C3C" },

  aiMessage: {
    fontSize: 16,
    color: "#444",
    marginBottom: 15,
  },

  answerBox: {
    backgroundColor: "#F2F2F2",
    padding: 15,
    borderRadius: 12,
  },

  answerText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
});
