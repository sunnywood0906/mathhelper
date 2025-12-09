from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
import os

router = APIRouter()

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class StepRequest(BaseModel):
    problem: str
    extra: str = ""

@router.post("/gemini_steps")
async def get_steps(req: StepRequest):

    print("📩 收到題目：", req.problem)
    print("📩 收到使用者補充：", req.extra)

    prompt = f"""
你是一位具備「零基礎也能看懂提示」的數學助教。

任務：根據題目及使用者補充，提供 1～10 句提示。  
每句提示「直接且沒有與解題無關的廢話，但是必須將題目講解的非常詳細」。  
若提示中包含「可行動的步驟」或「專有名詞」，請一定要另外用補充說明表達怎麼做。

格式要求如下：

- 一行提示
- 補充說明

【請務必遵守】
- 不要重述題目,不要講廢話不做開場白，例如「我們開始分析…」
- 不要出現「步驟」「第X步」「Step」 「提示X」 「Hint X」
- 每句提示 ≤ 30字，不能太過簡潔要說這步該做甚麼但不在提示解釋為甚麼
- 若是補充說明請加上"補充說明：" 怎麼做及專有名詞解釋 加在提示下方，並空兩行
- 最多輸出 10 個提示
- 補充說明可包含簡單例子（但不能太長）
- 提示的部分不要太冗長只講關鍵步驟就好且<20字，不講廢話
- 補充說明：一句或多句，解釋提示裡的名詞概念、公式或如何操作，若無則不顯示
- 每個步驟皆須包含提式，若有不充說明請空白兩行後顯示
- 不用硬要將步驟拆成10個
- 不要給最終答案，也不要提供算式，只說方法
- 一律輸出繁體中文除非使用者要求

題目：{req.problem}
使用者補充(若有)：{req.extra}

"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        resp = model.generate_content(prompt)
        raw = (resp.text or "").strip()

        print("🔍 Gemini 回傳：", raw)

        if not raw:
            return {"steps": ["⚠️ AI 未產生內容"]}

        lines = [line.strip() for line in raw.split("\n") if line.strip()]

        final_blocks = []
        current_block = []

        for line in lines:

            # 若含「補充」字樣 → 屬於當前提示的補充說明
            if "補充" in line:
                current_block.append(line)
                continue

            # 如果遇到新提示 → 將舊 block 收起來
            if current_block:
                final_blocks.append("\n\n".join(current_block))
                current_block = []

            # 建立新提示
            current_block = [line]

        # 最後一塊加入
        if current_block:
            final_blocks.append("\n\n".join(current_block))

        # 限制最多 10 個提示
        final_blocks = final_blocks[:10]

        return {"steps": final_blocks}

    except Exception as e:
        print("❌ 錯誤：", e)
        return {"steps": ["⚠️ 後端錯誤", str(e)]}
