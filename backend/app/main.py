from turtle import textinput
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import clip
import torch
from PIL import Image
import io
import json
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

@app.post("/api/detect")
async def detect_seats(
    image: UploadFile = File(...),
    seats: str = Form(...)
):

    try:
        start_time = time.time()
        seats_data = json.loads(seats)
        
        # 记录处理进度
        print(f"▶ 开始处理 {len(seats_data)} 个座位检测")
        
        image_data = await image.read()
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        w, h = img.size
        print(f"▷ 图像尺寸: {w}x{h}")

        results = []
        for idx, seat in enumerate(seats_data, 1):
            # 坐标转换
            x1 = max(0, int(seat['x1'] * w))
            y1 = max(0, int(seat['y1'] * h))
            x2 = min(w, int(seat['x2'] * w))
            y2 = min(h, int(seat['y2'] * h))
            
            # 验证区域有效性
            if x2 <= x1 or y2 <= y1:
                print(f"⚠ 无效区域: 座位{idx} ({x1},{y1})-({x2},{y2})")
                continue
                
            # 裁剪和处理
            crop = img.crop((x1, y1, x2, y2))
            image_input = preprocess(crop).unsqueeze(0).to(device)

            text_input = clip.tokenize(["A completely empty desk and chair with no objects",
                    "A desk with personal items and someone sitting"]).to(device)
            
            # 模型推理
            start_infer = time.time()
            with torch.no_grad():
                logits_per_image, _ = model(image_input, text_input)
                probs = logits_per_image.softmax(dim=-1).cpu().numpy()
            infer_time = time.time() - start_infer
            
            # 记录结果
            status = "empty" if probs[0][0] > 0.5 else "occupied"
            results.append({
                "id": seat["id"],
                "status": status,
                "confidence": float(probs[0][0])
            })
            print(f"✓ 座位{idx} 检测完成 (耗时: {infer_time:.2f}s)")

        total_time = time.time() - start_time
        print(f"✔ 全部处理完成 (总耗时: {total_time:.2f}s)\n")
        return results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}