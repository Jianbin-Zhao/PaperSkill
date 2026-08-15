import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 640;
const H = 260;

const lenses = [
  {
    label: '预训练信号',
    old: '上一代以掩码图像建模为主，擅长把可见外观补回来。',
    next: 'Sapiens2 把掩码重建与学生—教师对比自蒸馏联合起来。',
    takeaway: '提出 Sapiens2 的第一个理由：密集细节与跨视图语义都要被同一表示保留。',
    oldColor: '#c43f52',
    nextColor: '#228d5c',
  },
  {
    label: '训练数据',
    old: '论文将前代最大 Sapiens-2B 描述为在约 3 亿张人类图像上预训练。',
    next: 'Sapiens2 使用 Humans-1B：从约 40 亿候选中整理出的约 10 亿高质量人类图像。',
    takeaway: '提出 Sapiens2 的第二个理由：高分辨率人体任务需要更大、质量更稳定的数据分布。',
    oldColor: '#c43f52',
    nextColor: '#228d5c',
  },
  {
    label: '分辨率与上下文',
    old: '上一代最大对照模型工作在 1024px 输入尺度。',
    next: 'Sapiens2 有原生 1K 模型，并以窗口注意力、池化和全局注意力扩展到 4K。',
    takeaway: '提出 Sapiens2 的第三个理由：保住发丝、手部和身体边界，需要更高分辨率，也需要可承受的上下文计算。',
    oldColor: '#c43f52',
    nextColor: '#27446e',
  },
] as const;

function grid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, cells: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i <= cells; i += 1) {
    const p = (i * size) / cells;
    ctx.beginPath(); ctx.moveTo(x + p, y); ctx.lineTo(x + p, y + size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + p); ctx.lineTo(x + size, y + p); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export const SapiensComparison: React.FC<WidgetProps> = () => {
  const [lensIndex, setLensIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lens = lenses[lensIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let frame: number | null = null;
    const render = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f7f3ea'; ctx.fillRect(0, 0, W, H);
      const pulse = 0.5 + Math.sin(time / 650) * 0.5;
      const panels = [
        { x: 22, title: 'Sapiens（前代对照）', color: lens.oldColor, detail: lens.old, cells: 7 },
        { x: 340, title: 'Sapiens2', color: lens.nextColor, detail: lens.next, cells: 14 },
      ];
      panels.forEach((panel, panelIndex) => {
        ctx.fillStyle = '#fffdf8'; ctx.fillRect(panel.x, 24, 278, 210);
        ctx.strokeStyle = panel.color; ctx.lineWidth = 2; ctx.strokeRect(panel.x, 24, 278, 210);
        ctx.fillStyle = panel.color; ctx.font = 'bold 14px sans-serif'; ctx.fillText(panel.title, panel.x + 16, 48);
        ctx.fillStyle = '#e8edf2'; ctx.fillRect(panel.x + 16, 62, 104, 104);
        grid(ctx, panel.x + 16, 62, 104, panel.cells, panel.color);
        ctx.fillStyle = panel.color; ctx.globalAlpha = panelIndex === 0 ? 0.3 + pulse * 0.12 : 0.22 + pulse * 0.2;
        ctx.beginPath(); ctx.arc(panel.x + 68, 111, 33, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#21324a'; ctx.lineWidth = panelIndex === 0 ? 4 : 2;
        ctx.beginPath(); ctx.arc(panel.x + 68, 106, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(panel.x + 35, 152); ctx.quadraticCurveTo(panel.x + 68, 118, panel.x + 101, 152); ctx.stroke();
        ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif';
        const chars = panel.detail.split(''); let line = ''; let y = 187;
        chars.forEach((char) => {
          const candidate = line + char;
          if (ctx.measureText(candidate).width > 136 && line) { ctx.fillText(line, panel.x + 132, y); line = char; y += 17; }
          else line = candidate;
        });
        if (line) ctx.fillText(line, panel.x + 132, y);
      });
      ctx.fillStyle = '#68778f'; ctx.font = '12px sans-serif'; ctx.fillText('点击下方维度，观察“为什么需要下一代”的变化', 176, 253);
    };
    const tick = (time: number) => { render(time); frame = requestAnimationFrame(tick); };
    const start = () => { if (frame === null) frame = requestAnimationFrame(tick); };
    const stop = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [lens]);

  return (
    <div className="evolution-lab">
      <canvas ref={canvasRef} aria-label="Sapiens 与 Sapiens2 的交互式比较" />
      <div className="ctrl"><div className="chip-row">{lenses.map((item, index) => <button className={`chip ${lensIndex === index ? 'on' : ''}`} onClick={() => setLensIndex(index)} key={item.label}>{item.label}</button>)}</div></div>
      <div className="feedback good">{lens.takeaway}</div>
    </div>
  );
};
