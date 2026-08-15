import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 640;
const H = 250;

const challenges = [
  {
    label: '细节与语义',
    question: '只靠重建，如何同时学会睫毛边界与“这仍是同一个人”的跨视图概念？',
    response: '把 L_MAE 和 L_CL 放进同一预训练目标：前者锚定细节，后者约束跨视图表征。',
    color: '#c43f52',
  },
  {
    label: '数据分布',
    question: '人体任务既需要人像突出，也需要姿态、衣物、遮挡和场景的多样性。',
    response: 'Humans-1B 从大规模候选中通过质量、去重、聚类与选择性采样整理出训练分布。',
    color: '#d97706',
  },
  {
    label: '4K 上下文',
    question: '更密的 token 能看清局部，但让全部 token 直接相互注意会带来高计算代价。',
    response: '先 Win-SA 看局部，再 CLS 引导池化缩短序列，最后 Global-SA 融合长程上下文。',
    color: '#27446e',
  },
] as const;

export const WhySapiens2: React.FC<WidgetProps> = () => {
  const [index, setIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const item = challenges[index];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let frame: number | null = null;
    const render = (time: number) => {
      const sweep = (Math.sin(time / 800) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(24, 28, 244, 186); ctx.fillRect(372, 28, 244, 186);
      ctx.strokeStyle = '#c43f52'; ctx.lineWidth = 2; ctx.strokeRect(24, 28, 244, 186);
      ctx.strokeStyle = '#228d5c'; ctx.strokeRect(372, 28, 244, 186);
      ctx.fillStyle = '#c43f52'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('旧问题', 42, 54);
      ctx.fillStyle = '#228d5c'; ctx.fillText('Sapiens2 的回答', 390, 54);
      ctx.fillStyle = item.color; ctx.globalAlpha = 0.15 + sweep * 0.22; ctx.fillRect(48, 78, 196, 74); ctx.fillRect(396, 78, 196, 74); ctx.globalAlpha = 1;
      ctx.strokeStyle = item.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(68, 160); ctx.lineTo(224, 160); ctx.stroke();
      ctx.strokeStyle = '#228d5c'; ctx.beginPath(); ctx.moveTo(416, 160); ctx.lineTo(572, 160); ctx.stroke();
      ctx.fillStyle = '#68778f'; ctx.font = '12px sans-serif'; ctx.fillText(item.label, 112, 111); ctx.fillText(item.label, 460, 111);
      ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; ctx.fillText('点击挑战，读出“缺口 → 设计回应”', 216, 238);
      ctx.strokeStyle = '#68778f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(286, 121); ctx.lineTo(354, 121); ctx.stroke();
      ctx.fillStyle = '#68778f'; ctx.beginPath(); ctx.moveTo(354, 121); ctx.lineTo(344, 115); ctx.lineTo(344, 127); ctx.closePath(); ctx.fill();
    };
    const tick = (time: number) => { render(time); frame = requestAnimationFrame(tick); };
    const start = () => { if (frame === null) frame = requestAnimationFrame(tick); };
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [item]);

  return (
    <div className="motivation-lab">
      <canvas ref={canvasRef} aria-label="Sapiens2 提出动机的交互图" />
      <div className="ctrl"><div className="chip-row">{challenges.map((challenge, next) => <button className={`chip ${index === next ? 'on' : ''}`} onClick={() => setIndex(next)} key={challenge.label}>{challenge.label}</button>)}</div></div>
      <div className="feedback"><strong>缺口：</strong>{item.question}<br /><strong>回应：</strong>{item.response}</div>
    </div>
  );
};
