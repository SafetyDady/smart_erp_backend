from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 🔴 เพิ่ม CORS ตรงนี้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ชั่วคราว เพื่อ debug
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}