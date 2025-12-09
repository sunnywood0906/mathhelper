from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import os, traceback, json, re

router = APIRouter()

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class AnswerRequest(BaseModel):
    problem: str
    user_answer: str

def clean_json_text(text: str) -> str:
    """移除 ```json ... ``` 格式 & 只保留 JSON 內容"""
    text = text.strip()

    # 移除 ```json 或 ``` 包裝
    text = re.sub(r"^```json", "", text)
    text = re.sub(r"^```", "", text)
    text = re.sub(r"```$", "", text)

    return text.strip()

@router.post("/check_answer")
async def check_answer(req: AnswerRequest):

    print("📥 收到核對答案請求")
    print("題目：", req.problem)
    print("學生答案：", req.user_answer)

    prompt = f"""
你是一位精準的數學批改老師，請根據題目與學生答案進行評分。
請務必提供嚴謹且客觀的結果，不要講廢話，不要講步驟。

題目：
{req.problem}

學生的最終答案：
{req.user_answer}

請只輸出符合以下 JSON 結構的純文字，不要加任何額外解釋：

{{
  "correct": true 或 false,
  "standard_answer": "正確答案（請簡潔）",
  "message": "若錯誤，請在 30 字內指出主要錯誤，並解釋怎麼改正；若正確，寫「答案正確」。"
}}

注意：
- 不要加入「根據題目可知」「我認為」等敘述。
- message 必須非常精準且短。
- 不要給推導步驟，只給判定與正確答案。
"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content(prompt)

        raw = (resp.text or "").strip()
        print("🔍 Gemini 回傳原始內容：", raw)

        # 🔧 清掉 ```json ... ``` 格式
        cleaned = clean_json_text(raw)
        print("✨ 清洗後：", cleaned)

        # 🔧 安全解析 JSON
        data = json.loads(cleaned)

        return data

    except Exception as e:
        print("❌ 核對答案錯誤：", e)
        print(traceback.format_exc())
        return {
            "correct": False,
            "standard_answer": "",
            "message": "伺服器錯誤，請稍後再試"
        }
