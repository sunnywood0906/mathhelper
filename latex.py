from fastapi import APIRouter, File, UploadFile
from dotenv import load_dotenv
import google.generativeai as genai
import os, base64, traceback, io, datetime
from PIL import Image, ImageOps, ImageEnhance, ImageFilter

router = APIRouter()   # ⭐ 必須有這行！main.py 才能 import router

# --- 讀取 .env ---
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/gemini_latex")
async def gemini_latex(image: UploadFile = File(...)):
    try:
        # 讀取圖片
        image_bytes = await image.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # --- Debug：存原圖 ---
        debug_path = f"debug_raw_{datetime.datetime.now().strftime('%H%M%S')}.png"
        img.save(debug_path)
        print(f"📷 原圖儲存：{debug_path}, size={img.size}, format={img.format}")

        # Step 1. 調整尺寸（至少 1000px 寬）
        w, h = img.size
        min_width = 1000
        scale = max(1, min_width / w)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        # Step 2. 提升對比與銳利度
        img = ImageEnhance.Contrast(img).enhance(1.4)
        img = ImageEnhance.Sharpness(img).enhance(1.5)
        img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150))

        # Step 3. 加白邊（避免裁切）
        img = ImageOps.expand(img, border=100, fill="white")

        # Step 4. 轉 base64 PNG
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = (
            "請完整分析圖片中呈現的所有數學符號和結構，只輸出你辨識到的純數學公式。"
            "不要加解釋；若內容是 LaTeX，請轉成一般算式格式（例如 y = x + 1）。"
            "題號請自動忽略。"
        )

        result = model.generate_content([
            {"role": "user", "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/png", "data": image_b64}}
            ]}
        ])

        print("💡 Gemini 回傳：", result.text)
        return {"latex": result.text.strip() if result.text else "辨識失敗"}

    except Exception as e:
        print("❌ gemini_latex 錯誤：", e)
        print(traceback.format_exc())
        return {"error": str(e)}
