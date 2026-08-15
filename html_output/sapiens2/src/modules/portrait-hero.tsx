import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

export const PortraitHero: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, 340, 150); } catch { return; }
    const isNew = moduleId === 'new';
    const draw = (now: number) => {
      const t = (Math.sin(now / 1000) + 1) / 2;
      ctx.clearRect(0, 0, 340, 150); ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, 340, 150);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(28, 16, 198, 118); ctx.strokeStyle = '#b8c9a7'; ctx.lineWidth = 2; ctx.strokeRect(28, 16, 198, 118);
      ctx.strokeStyle = isNew ? '#228d5c' : '#c43f52'; ctx.lineWidth = isNew ? 3 : 7 - t * 3;
      ctx.beginPath(); ctx.arc(126, 67, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(75, 116); ctx.quadraticCurveTo(126, 73, 177, 116); ctx.stroke();
      ctx.fillStyle = '#27446e'; ctx.fillRect(247, 45, 64, 30); ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText('语义线索', 254, 64);
      if (isNew) { ctx.fillStyle = '#228d5c'; ctx.fillText('细节已保留', 246, 102); } else { ctx.fillStyle = '#c43f52'; ctx.fillText('存在盲点', 250, 102); }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (n: number) => { draw(n); raf.current = requestAnimationFrame(tick); };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const off = observeCanvas(canvas, start, stop); return () => { stop(); off(); };
  }, [moduleId]);
  return <canvas ref={ref} aria-label={moduleId === 'new' ? '本文方法对比图' : '传统方法对比图'} />;
};
