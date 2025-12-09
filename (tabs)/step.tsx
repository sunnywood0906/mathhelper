import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

/* ------------------------------------------------------
   🟢 getSteps(): 呼叫後端 FastAPI
------------------------------------------------------ */
async function getSteps(problem: string, extra: string): Promise<string[]> {
  if (!problem) return ["⚠️ 未收到題目"];

  try {
    const res = await fetch("http://192.168.0.109:8000/api/gemini_steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, extra }),
    });

    const data = await res.json();
    return data.steps || ["⚠️ 後端未產生提示"];
  } catch (err) {
    console.error("❌ getSteps 前端錯誤:", err);
    return ["⚠️ 無法連線到後端", String(err)];
  }
}

/* ------------------------------------------------------
   🟦 Step Page Component
------------------------------------------------------ */
export default function StepPage() {
  console.log("🔥 StepPage mounted!");
  const router = useRouter();
  const { problem, extra, ts } = useLocalSearchParams();  // ⭐ ts 控制重新分析

  const webRef = useRef<WebView>(null);

  const [penSize, setPenSize] = useState(3);
  const [steps, setSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------
     ⭐ 每次 ts 改變 → 重新呼叫後端（避免重複）
  ------------------------------------------------------ */
  useEffect(() => {
    if (!ts) return;  // picture_upload 必須傳 ts 才會觸發

    async function loadAI() {
      if (!problem) return;

      setLoading(true);
      const result = await getSteps(String(problem), String(extra ?? ""));
      setSteps(result);
      setCurrentStep(0);
      setLoading(false);
    }

    loadAI();
  }, [ts]); 

  const sendJS = (jsCode: string) => {
    webRef.current?.injectJavaScript(jsCode);
  };

  /* ------------------------------------------------------
     ⭐ 分欄（每欄 3 個提示步驟）
  ------------------------------------------------------ */
  const columns: number[][] = [];
  const maxPerCol = 3;
  const total = steps.length;

  for (let col = 0; col * maxPerCol < total; col++) {
    const colItems: number[] = [];
    for (let row = 0; row < maxPerCol; row++) {
      const idx = col * maxPerCol + row;
      if (idx < total) colItems.push(idx);
    }
    columns.push(colItems);
  }

  return (
    <View style={styles.container}>
      {/* ================== 上半部 ================== */}
      <View style={styles.topArea}>
        
        {/* 題目框 */}
        <View style={styles.problemBox}>
          <ScrollView>
            <Text style={styles.placeholderText}>
              {problem ? String(problem) : "（未接收到題目）"}
              {extra ? "\n\n【使用者補充說明】\n" + String(extra) : ""}
            </Text>
          </ScrollView>
        </View>

        {/* 提示框 */}
        <View style={styles.hintBox}>
          <ScrollView>
            <Text style={styles.placeholderText}>
              {loading ? "AI 正在分析題目…請稍等(若步驟解析不滿意，請回上一步再下一步回到這裡讓ai重新解析，或再回到辨識題目頁補充說明。)" : steps[currentStep] || "（沒有提示）"}
            </Text>
          </ScrollView>
        </View>

        {/* 步驟按鈕區 */}
        <View style={styles.circleArea}>
          {columns.map((col, colIdx) => (
            <View key={colIdx} style={styles.column}>
              {col.map((stepIndex) => (
                <TouchableOpacity
                  key={stepIndex}
                  style={[
                    styles.circle,
                    currentStep === stepIndex && { backgroundColor: "#74b9ff" },
                  ]}
                  onPress={() => setCurrentStep(stepIndex)}
                >
                  <Text>{stepIndex + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

      </View>

      {/* ================== 工具列 ================== */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: "black" }]}
          onPress={() => sendJS(`window.penColor='black';`)}
        />
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: "red" }]}
          onPress={() => sendJS(`window.penColor='red';`)}
        />
        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: "blue" }]}
          onPress={() => sendJS(`window.penColor='blue';`)}
        />

        <TouchableOpacity
          style={styles.thickBtn}
          onPress={() => {
            const newSize = Math.min(15, penSize + 2);
            setPenSize(newSize);
            sendJS(`window.penSize=${newSize};`);
          }}
        >
          <Text>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.thickBtn}
          onPress={() => {
            const newSize = Math.max(1, penSize - 2);
            setPenSize(newSize);
            sendJS(`window.penSize=${newSize};`);
          }}
        >
          <Text>－</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.eraserBtn}
          onPress={() =>
            sendJS(`
              window.penColor='white';
              window.penSize=20;
            `)
          }
        >
          <Text>eraser</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => sendJS(`ctx.clearRect(0,0,canvas.width,canvas.height);`)}
        >
          <Text>clear</Text>
        </TouchableOpacity>
      </View>

      {/* ================== 畫布 ================== */}
      <View style={styles.canvasArea}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          source={{
            html: `
              <html>
              <body style="margin:0; padding:0; overflow:hidden;">
                <canvas id="canvas" style="touch-action:none; width:100vw; height:100vh;"></canvas>

                <script>
                  const canvas = document.getElementById("canvas");
                  const ctx = canvas.getContext("2d");
                  canvas.width = window.innerWidth;
                  canvas.height = window.innerHeight;

                  window.penColor = "black";
                  window.penSize = 3;

                  let drawing = false;

                  function start(e) {
                    drawing = true;
                    ctx.beginPath();
                    const t = e.touches[0];
                    ctx.moveTo(t.clientX, t.clientY);
                  }

                  function move(e) {
                    if (!drawing) return;
                    const t = e.touches[0];
                    ctx.lineWidth = window.penSize;
                    ctx.strokeStyle = window.penColor;
                    ctx.lineCap = "round";
                    ctx.lineTo(t.clientX, t.clientY);
                    ctx.stroke();
                  }

                  function end() {
                    drawing = false;
                    ctx.closePath();
                  }

                  canvas.addEventListener("touchstart", start);
                  canvas.addEventListener("touchmove", move);
                  canvas.addEventListener("touchend", end);
                </script>
              </body>
              </html>
            `,
          }}
          style={{ flex: 1 }}
        />
      </View>

      {/* ================== 下方按鈕 ================== */}
      <TouchableOpacity
        style={styles.prevButton}
        onPress={() => router.replace("/(tabs)/picture_upload?keep=1")}
      >
        <Text style={styles.prevButtonText}>上一步</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => 
          router.push({
            pathname: "/(tabs)/answer",
            params: {
              problem: problem ? String(problem) : "",
              extra: extra ? String(extra) : "",
            },
          })
        }
      >
        <Text style={styles.nextButtonText}>check answer</Text>
      </TouchableOpacity>

    </View>
  );
}

/* ------------------------------------------------------
   🟦 Styles
------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a7dce3",
    padding: 20,
  },
  topArea: {
    flexDirection: "row",
    flex: 0.45,
  },
  problemBox: {
    flex: 3,
    backgroundColor: "#d9d9d9",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  hintBox: {
    flex: 5,
    backgroundColor: "#d9d9d9",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  circleArea: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: 5,
  },
  column: {
    alignItems: "center",
    marginHorizontal: 4,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 5,
    flexWrap: "wrap",
  },
  colorBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  thickBtn: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginRight: 10,
  },
  eraserBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  clearBtn: {
    backgroundColor: "#f88",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  canvasArea: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  prevButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  prevButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  nextButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#73c45c",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  nextButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#333",
    fontSize: 15,
    lineHeight: 22,
  },
});
