import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 252;
type Kind = 'slider' | 'chips' | 'step' | 'start' | 'drag' | 'race';
type Spec = { kind: Kind; prompt: string; options: string[]; feedback: string[]; evidence: string; initial?: number };

const specs: Record<string, Spec> = {
  '1.1': { kind: 'slider', prompt: '强调方向', options: ['偏细节', '平衡', '偏语义'], feedback: ['细节清楚，但全局语义线索不足。', '两类线索同时可见；这是联合学习的目标示意。', '语义标签稳定，但密集边界会变软。'], evidence: '论文 p.1：MIM 与全局对比的动机张力。', initial: 1 },
  '1.2': { kind: 'start', prompt: '比较状态', options: ['共同起点', '联合目标'], feedback: ['两边从同一模糊轮廓出发。', '联合约束的目标是同时保住外观细节和跨视图语义。'], evidence: '论文 p.1、p.5：联合预训练目标。' },
  '2.1': { kind: 'drag', prompt: '拖动筛选框', options: ['清晰人物', '文字遮挡', '人物过小'], feedback: ['保留：人物突出，且短边尺寸达到论文所述的至少384px条件。', '拒绝：文字叠加会破坏所需的真实感与质量线索。', '拒绝：人物尺寸不足，不能满足论文的人物突出条件。'], evidence: '论文 p.4 Sec.3.1：Humans-1B 多阶段筛选。' },
  '3.1': { kind: 'chips', prompt: '学习目标', options: ['只重建', '只对比', '联合'], feedback: ['重建把特征锚在可见外观，但这张图不把它说成完整语义方案。', '对比组织跨视图语义，但论文动机指出密集细节可能受损。', '联合目标同时表达细节锚定与语义一致性。'], evidence: '论文 pp.1、5：L = L_MAE + λL_CL。' },
  '4.1': { kind: 'step', prompt: '掩码重建步骤', options: ['可见 token', '插入 mask token', 'decoder 重建', '只在 M 计误差'], feedback: ['编码器首先处理可见 token。', '被遮住的位置由 mask token 占位。', 'decoder 对完整序列给出 patch 重建。', 'L_MAE 只在 M 中的目标 patch 上平均。'], evidence: '论文 p.4 Sec.3.2：L_MAE。' },
  '5.1': { kind: 'chips', prompt: '跨视图正对', options: ['global↔global', 'global↔local', 'local↔local'], feedback: ['允许：全局视图之间可构成正对。', '允许：全局与局部视图可构成正对。', '未使用：论文跳过 local↔local 正对。'], evidence: '论文 p.5 Sec.3.2：正对集合 S。' },
  '6.1': { kind: 'chips', prompt: '相对强调', options: ['更重重建', '并重', '更重对比'], feedback: ['这强调细节锚点；教程不把它当作论文的通用最优设定。', '这显示两项共同进入总损失。', '这强调跨视图语义；具体权重仍依赖训练设置。'], evidence: '论文 p.5：λ 出现在联合目标中。', initial: 1 },
  '7.1': { kind: 'step', prompt: '观察尺度', options: ['概览', '1K', '4K'], feedback: ['概览先说明人像任务需要同时理解整体与局部。', '1K 设定已有高分辨率视觉 token。', '4K 提供更密的视觉 token，同时带来更高计算压力。'], evidence: '论文 pp.1-2、p.5：1K/4K 模型与 token 数。' },
  '8.1': { kind: 'chips', prompt: '注意力阶段', options: ['Win-SA', 'CLS 引导池化', 'Global-SA'], feedback: ['窗口自注意力先处理局部纹理和边界。', '池化将 token 网格从 N 缩短到 N/ω。', '全局注意力在缩短后的序列上融合长程上下文。'], evidence: '论文 p.5 Sec.4、Fig.5。' },
  '8.2': { kind: 'step', prompt: '表示路线', options: ['局部处理', '池化压缩', '全局融合'], feedback: ['高亮表示局部计算阶段的一个 token 表示。', '池化减少后续全局计算面对的 token 数。', '全局融合把局部信息连到更长距离的上下文。'], evidence: '论文 p.5：N → N/ω 的分层路线。' },
  '9.1': { kind: 'chips', prompt: '任务头', options: ['姿态', '分割', '点图', '法线', '反照率'], feedback: ['姿态：308 个关键点热图，并增加 in-the-wild 标注。', '分割：29 个身体部位类别，并增加 in-the-wild 标注。', '点图：焦距归一化的逐像素三维点，论文说明监督来自合成资产。', '法线：逐像素单位法线，监督来自高保真合成资产。', '反照率：RGB 漫反射反照率，使用合成配对数据。'], evidence: '论文 p.6 Sec.5。' },
  '10.1': { kind: 'race', prompt: '结果表', options: ['dense probing', '任务特定结果'], feedback: ['表2：冻结 backbone、轻量 decoder；不同列指标方向不同。', '表3/4/6/7：每张表都有自己的测试集、协议和指标方向。'], evidence: '论文 pp.7-10，表2、3、4、6、7。' }
};

function specFor(id: string): Spec { return specs[id] ?? specs['3.1']; }

function tone(index: number, count: number): string {
  if (count <= 1) return '#27446e';
  if (index === 0) return '#c43f52';
  if (index === count - 1) return '#228d5c';
  return '#27446e';
}

export const PortraitLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const spec = useMemo(() => specFor(moduleId), [moduleId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ index: spec.initial ?? 0, running: false });
  const [index, setIndex] = useState(spec.initial ?? 0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const next = spec.initial ?? 0;
    stateRef.current = { index: next, running: false };
    setIndex(next); setRunning(false);
  }, [spec]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const drawText = (text: string, x: number, y: number, max = 190) => {
      const words = text.split(''); let line = ''; let yy = y;
      for (const word of words) { const trial = line + word; if (ctx.measureText(trial).width > max && line) { ctx.fillText(line, x, yy); line = word; yy += 18; } else line = trial; }
      if (line) ctx.fillText(line, x, yy);
    };
    const render = (now: number) => {
      const s = stateRef.current; const current = clamp(s.index, 0, spec.options.length - 1);
      const accent = tone(current, spec.options.length);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7'; ctx.fillRect(18, 22, 276, 202);
      ctx.fillStyle = '#fffdf8'; ctx.fillRect(42, 38, 176, 156); ctx.strokeStyle = '#76906a'; ctx.lineWidth = 2; ctx.strokeRect(42, 38, 176, 156);
      ctx.strokeStyle = '#21324a'; ctx.lineWidth = moduleId === '1.1' && current === 2 ? 7 : 3;
      ctx.beginPath(); ctx.arc(130, 92, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(72, 169); ctx.quadraticCurveTo(130, 112, 188, 169); ctx.stroke();
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(142 + Math.sin(now / 900) * 5, 86, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(320, 22, 220, 202); ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1; ctx.strokeRect(320, 22, 220, 202);
      ctx.fillStyle = '#21324a'; ctx.font = 'bold 15px sans-serif'; ctx.fillText(spec.prompt, 338, 50);
      ctx.fillStyle = accent; ctx.fillRect(338, 68, 178, 12 + current * 12);
      ctx.fillStyle = '#68778f'; ctx.font = '12px sans-serif'; drawText(spec.options[current], 338, 110);
      ctx.fillStyle = '#21324a'; ctx.font = '12px sans-serif'; drawText(spec.evidence, 338, 144, 176);
      if (moduleId === '8.1') {
        ['Win-SA', 'Pool', 'Global-SA'].forEach((label, i) => { const x = 54 + i * 72; ctx.fillStyle = i === current ? '#7c3aed' : '#d7deea'; ctx.fillRect(x, 201, 54, 13); ctx.fillStyle = '#21324a'; ctx.font = '10px sans-serif'; ctx.fillText(label, x + 2, 213); });
      }
      if (moduleId === '10.1' && s.running) {
        const values = current === 0 ? [74.7, 69.6, 35.8, 13.5, 31.2] : [82.3, 82.5, 6.73, 1.191];
        values.forEach((v, i) => { const bar = Math.min(140, (v / 85) * 140); ctx.fillStyle = i < 2 ? '#228d5c' : '#27446e'; ctx.fillRect(338, 178 + i * 0, bar, 9); });
        ctx.fillStyle = '#68778f'; ctx.fillText('数值按原表各自指标阅读', 338, 208);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = (now: number) => { render(now); rafRef.current = requestAnimationFrame(tick); };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [moduleId, spec]);

  const choose = (next: number) => {
    const valid = clamp(next, 0, spec.options.length - 1);
    stateRef.current.index = valid; setIndex(valid);
  };
  const begin = () => { stateRef.current.running = true; setRunning(true); if (moduleId === '1.2') choose(1); };
  const pointerSelect = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (spec.kind !== 'drag') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    choose(x < 105 ? 0 : x < 205 ? 1 : 2);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const currentFeedback = spec.feedback[index] ?? spec.feedback[0];
  const feedbackClass = index === 0 && spec.options.length > 2 ? 'bad' : index === spec.options.length - 1 ? 'good' : '';

  return (
    <div className="portrait-lab">
      <canvas ref={canvasRef} onPointerDown={pointerSelect} onPointerMove={pointerSelect} aria-label={`${spec.prompt}互动图`} />
      {spec.kind === 'slider' ? (
        <div className="ctrl"><label>{spec.prompt} <span className="val">{spec.options[index]}</span></label><input type="range" min="0" max="2" step="1" value={index} onInput={(e) => choose(Number((e.target as HTMLInputElement).value))} /></div>
      ) : spec.kind === 'step' ? (
        <div className="ctrl"><button onClick={() => choose(index - 1)} disabled={index === 0}>上一步</button><span className="val">{index + 1} / {spec.options.length} · {spec.options[index]}</span><button onClick={() => choose(index + 1)} disabled={index === spec.options.length - 1}>下一步</button></div>
      ) : spec.kind === 'start' ? (
        <div className="ctrl"><button onClick={begin}>{running ? '重新比较' : '同时比较'}</button><span className="val">{spec.options[index]}</span></div>
      ) : spec.kind === 'race' ? (
        <div className="ctrl"><div className="chip-row">{spec.options.map((option, i) => <button key={option} className={`chip ${index === i ? 'on' : ''}`} onClick={() => choose(i)}>{option}</button>)}</div><button onClick={begin}>开始比较</button></div>
      ) : (
        <div className="ctrl"><div className="chip-row">{spec.options.map((option, i) => <button key={option} className={`chip ${index === i ? 'on' : ''}`} onClick={() => choose(i)}>{option}</button>)}</div></div>
      )}
      <div className={`feedback ${feedbackClass}`}>{currentFeedback}</div>
    </div>
  );
};
