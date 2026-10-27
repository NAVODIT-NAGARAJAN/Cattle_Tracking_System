"""
One-time export: best.pt -> best.onnx
Run: python export_onnx.py
"""
from ultralytics import YOLO

model = YOLO(r"C:\IOT\ml\models\best.pt")
model.export(format="onnx", imgsz=224, opset=12, simplify=True)
print("Export complete: C:\\IOT\\ml\\models\\best.onnx")
