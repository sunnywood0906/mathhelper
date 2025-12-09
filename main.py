from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
import os

# 載入三個 router
from solver import router as steps_router
from getanswer import router as answer_router
from latex import router as latex_router

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 掛載路由
app.include_router(steps_router, prefix="/api")
app.include_router(answer_router, prefix="/api")
app.include_router(latex_router, prefix="/api")
