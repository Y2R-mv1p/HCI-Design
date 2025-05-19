import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [seats, setSeats] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState(null);

  // 绘制选区逻辑
  const handleMouseDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    setStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);

    // 绘制已有的座位区域（包含编号和状态）
    drawAllSeats(ctx);

    // 绘制当前正在框选的区域
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const rect = e.target.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = currentX - startPos.x;
    const height = currentY - startPos.y;

    ctx.strokeRect(startPos.x, startPos.y, width, height);
  };

  const handleMouseUp = (e) => {
    setDrawing(false);
    if (!canvasRef.current) return;

    const rect = e.target.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const x1 = Math.min(startPos.x, endX) / 640;
    const y1 = Math.min(startPos.y, endY) / 480;
    const x2 = Math.max(startPos.x, endX) / 640;
    const y2 = Math.max(startPos.y, endY) / 480;

    const newSeat = {
      id: seats.length + 1,
      x1,
      y1,
      x2,
      y2,
      status: '未检测',
      confidence: 0
    };

    setSeats([...seats, newSeat]);
  };

  // 绘制所有座位区域（包含编号和状态）
  const drawAllSeats = (ctx) => {
    seats.forEach(seat => {
      const x1 = seat.x1 * 640;
      const y1 = seat.y1 * 480;
      const x2 = seat.x2 * 640;
      const y2 = seat.y2 * 480;
      const width = x2 - x1;
      const height = y2 - y1;

      // 根据状态设置不同颜色
      const statusColor = seat.status === 'empty' ? 'green' :
        seat.status === 'occupied' ? 'red' : 'gray';
      
      // 绘制座位边框
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x1, y1, width, height);

      // 绘制座位编号背景
      ctx.fillStyle = statusColor;
      ctx.fillRect(x1, y1 - 20, 30, 20);
      
      // 绘制座位编号
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`#${seat.id}`, x1 + 5, y1 - 5);

      // 绘制状态文本背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x1, y2, width, 20);
      
      // 绘制状态文本
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${seat.status} ${seat.confidence ? `(${seat.confidence.toFixed(2)})` : ''}`,
        x1 + 5,
        y2 + 15
      );
    });
  };

  // 实时更新框选位置的状态
  const updateSeatStatus = async () => {
    if (seats.length === 0) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then(r => r.blob());

      const formData = new FormData();
      formData.append('image', blob, 'seat.jpg');
      formData.append('seats', JSON.stringify(seats));

      const response = await fetch('http://localhost:8000/api/detect', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const results = await response.json();
      if (Array.isArray(results)) {
        setSeats(prevSeats =>
          prevSeats.map(s => {
            const updated = results.find(r => r.id === s.id);
            return updated ? updated : s;
          })
        );
      }
    } catch (error) {
      console.error('检测失败:', error);
    }
  };

  // 开始实时检测
  const startRealTimeDetection = () => {
    if (detectionInterval) clearInterval(detectionInterval);

    updateSeatStatus();

    const interval = setInterval(updateSeatStatus, 3000);
    setDetectionInterval(interval);
    setIsDetecting(true);
  };

  // 停止实时检测
  const stopRealTimeDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setIsDetecting(false);
  };

  // 生命周期管理
  useEffect(() => {
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [detectionInterval]);

  // 监听seats变化，重绘所有座位
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, 640, 480);
    drawAllSeats(ctx);
  }, [seats]);

  return (
    <div className="app">
      <div className="controls">
        <button
          onClick={isDetecting ? stopRealTimeDetection : startRealTimeDetection}
          style={{ marginBottom: '10px' }}
        >
          {isDetecting ? '停止检测' : '开始实时检测'}
        </button>
      </div>

      <div className="camera-box">
        <Webcam
          ref={webcamRef}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ border: '1px solid #ccc' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      <div className="status-list">
        {seats.map(seat => (
          <div key={seat.id} className={`seat-item ${seat.status}`}>
            <span>座位 #{seat.id} - </span>
            <span>{seat.status} ({seat.confidence?.toFixed(2)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;