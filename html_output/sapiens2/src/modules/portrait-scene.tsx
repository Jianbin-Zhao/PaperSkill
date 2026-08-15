import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 244;
const H = 130;

const actions: Record<string, { tool: string; verb: string; goal: string; color: string }> = {
  'chap-1': { tool: '橡皮', verb: '擦去污点', goal: '露出眼睛轮廓', color: '#c43f52' },
  'chap-2': { tool: '放大镜', verb: '框选清晰区域', goal: '保留人像', color: '#27446e' },
  'chap-3': { tool: '铅笔', verb: '对齐参考线', goal: '吻合轮廓', color: '#27446e' },
  'chap-4': { tool: '铅笔', verb: '补回遮住的线', goal: '恢复一笔', color: '#228d5c' },
  'chap-5': { tool: '参考卡', verb: '对准姿势', goal: '匹配视角', color: '#27446e' },
  'chap-6': { tool: '铅笔', verb: '调整笔压', goal: '平衡线条', color: '#d97706' },
  'chap-7': { tool: '放大镜', verb: '放大一根发丝', goal: '看清轮廓', color: '#27446e' },
  'chap-8': { tool: '放大镜', verb: '扫描局部', goal: '接回全脸', color: '#7c3aed' },
  'chap-9': { tool: '铅笔', verb: '添加专用标记', goal: '得到任务输出', color: '#228d5c' },
  'chap-10': { tool: '画框', verb: '落下画框', goal: '比较结果', color: '#228d5c' },
};

export const PortraitScene: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const a = actions[chapterId] ?? actions['chap-1'];
    const draw = (now: number) => {
      const t = (Math.sin(now / 1300) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7'; ctx.fillRect(12, 16, 220, 96);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(30, 24, 132, 80);
      ctx.strokeStyle = '#76906a'; ctx.lineWidth = 2; ctx.strokeRect(30, 24, 132, 80);
      ctx.strokeStyle = '#21324a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(94, 57, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(62, 92); ctx.quadraticCurveTo(95, 64, 127, 92); ctx.stroke();
      ctx.strokeStyle = a.color; ctx.lineWidth = 3;
      const x = 40 + t * 96;
      ctx.beginPath(); ctx.moveTo(x, 47); ctx.lineTo(x + 14, 76); ctx.stroke();
      ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(x + 14, 76, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; ctx.fillText(a.tool, 174, 43);
      ctx.fillStyle = '#68778f'; ctx.font = '11px sans-serif'; ctx.fillText(a.verb, 174, 62); ctx.fillText(a.goal, 174, 80);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => { draw(now); rafRef.current = requestAnimationFrame(tick); };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [chapterId, moduleId]);
  return <canvas ref={canvasRef} aria-label="肖像素描修稿动画" />;
};
