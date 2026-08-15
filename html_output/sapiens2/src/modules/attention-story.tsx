import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 640;
const H = 246;
const stages = [
  { label: 'Win-SA', detail: '局部窗口只交换邻近 patch 的信息，先保留发丝、边界等局部线索。', color: '#7c3aed' },
  { label: 'CLS 引导池化', detail: '池化阶段缩短后续全局计算面对的 token 序列。', color: '#228d5c' },
  { label: 'Global-SA', detail: '缩短后的表示再做全局注意力，连接更长距离的人体上下文。', color: '#27446e' },
] as const;

export const AttentionStory: React.FC<WidgetProps> = () => {
  const [index, setIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stage = stages[index];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let frame: number | null = null;
    const render = (time: number) => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, W, H);
      const pulse = 0.35 + (Math.sin(time / 650) + 1) * 0.16;
      const boxes = [
        { x: 34, title: '局部 token', count: 7 },
        { x: 268, title: '压缩表示', count: 3 },
        { x: 472, title: '全局上下文', count: 5 },
      ];
      boxes.forEach((box, boxIndex) => {
        const active = boxIndex === index;
        ctx.fillStyle = '#fffdf8'; ctx.fillRect(box.x, 35, 132, 140);
        ctx.strokeStyle = active ? stage.color : '#d7deea'; ctx.lineWidth = active ? 3 : 1; ctx.strokeRect(box.x, 35, 132, 140);
        ctx.fillStyle = active ? stage.color : '#68778f'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(box.title, box.x + 16, 61);
        for (let row = 0; row < box.count; row += 1) {
          for (let col = 0; col < box.count; col += 1) {
            ctx.fillStyle = active ? stage.color : '#b7c6d8'; ctx.globalAlpha = active ? pulse : 0.35;
            ctx.fillRect(box.x + 20 + col * (74 / box.count), 80 + row * (74 / box.count), 8, 8);
          }
        }
        ctx.globalAlpha = 1;
      });
      ctx.strokeStyle = '#68778f'; ctx.lineWidth = 2;
      [176, 410].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x + 52, 104); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 52, 104); ctx.lineTo(x + 43, 98); ctx.lineTo(x + 43, 110); ctx.closePath(); ctx.fill(); });
      ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; ctx.fillText('动图式扫描：点击一个阶段，观察其处理的表示与下一步的关系', 120, 216);
    };
    const tick = (time: number) => { render(time); frame = requestAnimationFrame(tick); };
    const start = () => { if (frame === null) frame = requestAnimationFrame(tick); };
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [index, stage]);

  return (
    <div className="attention-story">
      <canvas ref={canvasRef} aria-label="4K 分层注意力交互图" />
      <div className="ctrl"><div className="chip-row">{stages.map((item, next) => <button className={`chip ${index === next ? 'on' : ''}`} onClick={() => setIndex(next)} key={item.label}>{item.label}</button>)}</div></div>
      <div className="feedback good">{stage.detail}</div>
    </div>
  );
};
