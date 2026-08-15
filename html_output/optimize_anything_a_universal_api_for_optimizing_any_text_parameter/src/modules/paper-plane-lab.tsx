import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
  white: '#ffffff',
};

const W = 560;
const H = 260;
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r = 10) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(184,201,167,.2)';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}

function label(ctx: Ctx, text: string, x: number, y: number, color = C.ink, size = 13, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawPlane(ctx: Ctx, x: number, y: number, angle = 0, color = C.blue, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = C.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-19, -11);
  ctx.lineTo(22, 0);
  ctx.lineTo(-19, 11);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(22, 0);
  ctx.stroke();
  ctx.restore();
}

function drawTarget(ctx: Ctx, x: number, y: number, r = 18, success = false) {
  const color = success ? C.green : C.orange;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPath(ctx: Ctx, points: Array<[number, number]>, color: string, width = 3, dashed = false) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [7, 6] : []);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
  ctx.restore();
}

function drawCard(ctx: Ctx, x: number, y: number, w: number, h: number, title: string, active = C.blue) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = C.white;
  ctx.fill();
  ctx.strokeStyle = active;
  ctx.lineWidth = 2;
  ctx.stroke();
  label(ctx, title, x + 10, y + 16, active, 12);
  ctx.strokeStyle = C.route;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x + 12, y + 29);
  ctx.lineTo(x + w - 12, y + 29);
  ctx.moveTo(x + 12, y + 38);
  ctx.lineTo(x + w * 0.7, y + 38);
  ctx.stroke();
}

function pill(ctx: Ctx, text: string, x: number, y: number, bg: string, fg = C.white) {
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 18;
  roundRect(ctx, x, y - 12, width, 24, 12);
  ctx.fillStyle = bg;
  ctx.fill();
  label(ctx, text, x + 9, y, fg, 12);
}

function useCanvas(draw: (ctx: Ctx) => void, deps: React.DependencyList, w = W, h = H) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, w, h);
    draw(ctx);
    canvas.classList.add('is-ready');
    // The draw callback is intentionally controlled by the caller's explicit state list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function interpolatePath(points: Array<[number, number]>, t: number): [number, number] {
  const p = clamp(t, 0, 0.9999) * (points.length - 1);
  const i = Math.floor(p);
  const f = p - i;
  const a = points[i];
  const b = points[Math.min(i + 1, points.length - 1)];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

function drawAutoScene(ctx: Ctx, variant: string, t: number, w: number, h: number) {
  clearScene(ctx, w, h);
  const p = easeInOutQuad(t);
  if (variant === 'hero-old' || variant === 'hero-new') {
    const isNew = variant === 'hero-new';
    const path: Array<[number, number]> = isNew
      ? [[32, 95], [125, 82], [220, 67], [w - 48, 57]]
      : [[32, 95], [125, 63], [220, 105], [w - 62, 112]];
    drawTarget(ctx, w - 45, 57, 18, isNew && p > 0.8);
    drawPath(ctx, path, isNew ? C.green : C.red, 3);
    const [x, y] = interpolatePath(path, p);
    drawPlane(ctx, x, y, isNew ? -0.08 : 0.12, isNew ? C.green : C.red, 0.9);
    pill(ctx, isNew ? '62 分 + 左偏/下沉' : '只有 62 分', 18, 24, isNew ? C.blue : C.red);
    if (isNew) drawPath(ctx, [[190, 112], [210, 92], [230, 86]], C.orange, 2, true);
    return;
  }

  const chap = Number(variant.replace('chap-', ''));
  if (chap === 1) {
    const first = t < 0.5;
    const q = (t % 0.5) * 2;
    const path = first
      ? [[18, 88], [88, 50], [165, 98], [215, 103]] as Array<[number, number]>
      : [[18, 88], [90, 80], [165, 66], [217, 54]] as Array<[number, number]>;
    drawTarget(ctx, 218, 54, 14, !first && q > 0.8);
    drawPath(ctx, path, first ? C.red : C.green, 2.5);
    const [x, y] = interpolatePath(path, q);
    drawPlane(ctx, x, y, first ? 0.15 : -0.05, first ? C.red : C.green, 0.65);
    label(ctx, first ? '盲试' : '有 SI', 14, 20, first ? C.red : C.green, 12);
  } else if (chap === 2) {
    drawCard(ctx, 42, 24, 160, 82, '折法文本', C.blue);
    const x = 55 + p * 112;
    ctx.save();
    ctx.translate(x, 67);
    ctx.rotate(-0.45);
    ctx.fillStyle = C.orange;
    ctx.fillRect(-18, -3, 32, 6);
    ctx.beginPath();
    ctx.moveTo(14, -3);
    ctx.lineTo(23, 0);
    ctx.lineTo(14, 3);
    ctx.fill();
    ctx.restore();
    label(ctx, '左翼 +2°', 65, 86, C.blue, 12);
  } else if (chap === 3) {
    const y = 65;
    drawPath(ctx, [[22, y], [222, y]], C.blue, 3);
    drawTarget(ctx, 220, y, 13, p > 0.82);
    drawPlane(ctx, 28 + p * 184, y, 0, C.blue, 0.65);
    label(ctx, '单任务 / 多任务 / 泛化', 122, 22, C.muted, 11, 'center');
  } else if (chap === 4) {
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(35, 50, 178, 30);
    ctx.strokeStyle = C.route;
    ctx.strokeRect(35, 50, 178, 30);
    const x = 58 + p * 125;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, 42);
    ctx.lineTo(x, 90);
    ctx.stroke();
    label(ctx, '任务 A 权重', 122, 23, C.orange, 12, 'center');
  } else if (chap === 5) {
    const path: Array<[number, number]> = [[20, 92], [85, 62], [155, 82], [220, 57]];
    drawTarget(ctx, 220, 57, 13, p > 0.85);
    drawPath(ctx, path, C.green, 2.5);
    drawPath(ctx, [[82, 102], [112, 72], [143, 88]], C.orange, 2, true);
    const [x, y] = interpolatePath(path, p);
    drawPlane(ctx, x, y, -0.06, C.green, 0.65);
    label(ctx, '左偏诊断', 111, 108, C.orange, 11, 'center');
  } else if (chap === 6) {
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.strokeRect(75, 18, 145, 82);
    drawPath(ctx, [[87, 86], [120, 62], [152, 54], [205, 31]], C.green, 2);
    const y = 105 - p * 51;
    drawCard(ctx, 22, y, 72, 43, '候选 Φ', C.green);
  } else if (chap === 7) {
    const path: Array<[number, number]> = [[20, 85], [88, 78], [155, 65], [220, 54]];
    drawPath(ctx, path, C.green, 2.5);
    drawTarget(ctx, 220, 54, 13, p > 0.84);
    const [x, y] = interpolatePath(path, p);
    drawPlane(ctx, x, y, -0.06, C.green, 0.65);
    pill(ctx, '复用折翼模式', 18, 22, C.blue);
  } else if (chap === 8) {
    drawPlane(ctx, 132, 72, 0, C.blue, 1.15);
    const x = 35 + p * 83;
    ctx.fillStyle = C.purple;
    roundRect(ctx, x, 42, 22, 44, 5);
    ctx.fill();
    label(ctx, '后端适配', 122, 111, C.purple, 11, 'center');
  } else if (chap === 9) {
    ctx.fillStyle = C.light;
    ctx.fillRect(28, 83, 188, 15);
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 83, 188, 15);
    const x = 30 + p * 165;
    const y = 35 + p * 47;
    drawPlane(ctx, x, y, 0.18, C.green, 0.66);
    label(ctx, '适合', 205, 111, C.green, 11, 'right');
  } else {
    const x1 = 30 + p * 180;
    const x2 = 30 + Math.min(1, p * 0.72) * 180;
    drawPath(ctx, [[28, 52], [220, 52]], C.line, 2);
    drawPath(ctx, [[28, 89], [220, 89]], C.line, 2);
    drawPlane(ctx, x1, 52, 0, C.green, 0.58);
    drawPlane(ctx, x2, 89, 0, C.red, 0.58);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(218, 34);
    ctx.lineTo(218, 106);
    ctx.stroke();
  }
}

function AutoScene({ variant, hero = false }: { variant: string; hero?: boolean }) {
  const w = hero ? 360 : 244;
  const h = hero ? 150 : 130;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, w, h);
    let raf: number | null = null;
    let startAt = performance.now();
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const render = (now: number) => {
      const t = reduced ? 0.88 : ((now - startAt) % 3200) / 3200;
      drawAutoScene(ctx, variant, t, w, h);
      canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (raf === null) {
        startAt = performance.now();
        raf = requestAnimationFrame(render);
      }
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    if (reduced) render(performance.now());
    return () => {
      stop();
      disconnect();
    };
  }, [variant, hero, w, h]);
  return <canvas ref={ref} width={w} height={h} aria-label="纸飞机类比动画" />;
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))',
  gap: 8,
  margin: '10px 0',
};

const factStyle: React.CSSProperties = {
  padding: '9px 11px',
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: C.white,
  color: C.ink,
  fontSize: 14,
  lineHeight: 1.45,
};

function CompareLoop() {
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setPhase((v) => {
        if (v >= 3) {
          setRunning(false);
          return 3;
        }
        return v + 1;
      });
    }, 700);
    return () => window.clearInterval(timer);
  }, [running]);
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    label(ctx, '只给总分', 140, 23, C.red, 14, 'center');
    label(ctx, '分数 + SI', 420, 23, C.green, 14, 'center');
    ctx.strokeStyle = C.line;
    ctx.beginPath();
    ctx.moveTo(280, 16);
    ctx.lineTo(280, 205);
    ctx.stroke();
    const oldPath: Array<[number, number]> = [[40, 125], [125, 75], [215, 145], [245, 158]];
    const newPath: Array<[number, number]> = phase >= 3
      ? [[320, 125], [390, 108], [470, 83], [525, 70]]
      : [[320, 125], [400, 80], [470, 142], [510, 150]];
    drawTarget(ctx, 245, 70, 18, false);
    drawTarget(ctx, 525, 70, 18, phase >= 3);
    drawPath(ctx, oldPath, C.red, 3);
    drawPath(ctx, newPath, phase >= 3 ? C.green : C.red, 3);
    drawPlane(ctx, phase === 0 ? 40 : 238, phase === 0 ? 125 : 155, 0.12, C.red, 0.8);
    drawPlane(ctx, phase === 0 ? 320 : phase >= 3 ? 518 : 505, phase === 0 ? 125 : phase >= 3 ? 70 : 150, phase >= 3 ? 0 : 0.12, phase >= 3 ? C.green : C.red, 0.8);
    if (phase >= 2) {
      pill(ctx, '左偏 · 机头下沉', 342, 190, C.orange);
      drawPath(ctx, [[410, 154], [430, 124], [455, 133]], C.orange, 2, true);
    }
    pill(ctx, phase === 0 ? '同一折法' : '62 分', 86, 190, phase === 0 ? C.blue : C.red);
    pill(ctx, phase < 2 ? (phase === 0 ? '同一折法' : '62 分') : '62 分 + 诊断', 376, 190, phase >= 2 ? C.blue : C.red);
  }, [phase]);
  const feedback = phase === 0
    ? { text: '两边从同一折法出发，差别只在评估器返回什么。', cls: '' }
    : phase === 1
    ? { text: '只给总分：两边都知道“没命中”，但还不知道原因。', cls: 'bad' }
    : phase === 2
    ? { text: 'SI 已把失败定位到机头与左翼，右侧可以定向修改。', cls: '' }
    : { text: '定向修改命中目标；SI 提供方向，但不保证每轮都单调变好。', cls: 'good' };
  return (
    <div>
      <canvas ref={canvas} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" type="button" disabled={running} onClick={() => { setPhase(0); setRunning(true); }}>
          {phase === 3 ? '再次同时试飞' : '同时试飞'}
        </button>
        <button className="tiny" type="button" disabled={phase === 0 || running} onClick={() => setPhase(0)}>重置</button>
        <span className="step-label">阶段 <b>{phase}</b> / 3</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
}

const artifacts = [
  ['代理技能', '技能说明', '仓库任务通过率', '代理轨迹 / 测试错误'],
  ['云调度', '调度策略代码', '成本节省', '路由 / 实例时间线'],
  ['ARC 代理', '代理代码与提示词', '未见谜题准确率', '逐题输出 / 错误栈'],
  ['AIME 提示词', '系统提示词', 'AIME 2025 准确率', '推理链 / 对错标记'],
  ['CUDA', '内核生成提示', 'V100 加速比', '编译错误 / 正确性差异'],
  ['圆堆积', '优化算法代码', '半径和', '重叠 / 边界 / 渲染图'],
] as const;

function ArtifactSelector() {
  const [idx, setIdx] = useState(0);
  const item = artifacts[idx];
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, 230);
    drawCard(ctx, 28, 72, 128, 72, item[0], C.blue);
    roundRect(ctx, 210, 66, 135, 84, 14);
    ctx.fillStyle = '#eef4fb';
    ctx.fill();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.stroke();
    label(ctx, 'evaluate(x,e)', 277, 91, C.blue, 15, 'center');
    label(ctx, '同一个接口形状', 277, 122, C.muted, 12, 'center');
    drawPath(ctx, [[158, 108], [207, 108]], C.blue, 3);
    drawPath(ctx, [[347, 108], [390, 108]], C.blue, 3);
    drawCard(ctx, 393, 64, 140, 88, 'score + SI', C.green);
    pill(ctx, item[2], 35, 190, C.green);
    pill(ctx, item[3], 292, 190, C.orange);
  }, [idx], W, 230);
  return (
    <div>
      <div className="chip-row">
        {artifacts.map((x, i) => <button type="button" key={x[0]} className={`chip ${i === idx ? 'selected' : ''}`} aria-pressed={i === idx} onClick={() => setIdx(i)}>{x[0]}</button>)}
      </div>
      <canvas ref={canvas} width={W} height={230} />
      <div style={panelStyle}>
        <div style={factStyle}><b>文本制品</b><br />{item[1]}</div>
        <div style={factStyle}><b>主指标</b><br />{item[2]}</div>
        <div style={factStyle}><b>可行动 SI</b><br />{item[3]}</div>
      </div>
      <div className="feedback good">接口没变；变化的是制品内容、评估逻辑、SI 与协议。</div>
    </div>
  );
}

const boundaryScenarios = [
  { name: 'CUDA 内核代码', text: true, proxy: false, evaluator: true },
  { name: '系统提示词', text: true, proxy: false, evaluator: true },
  { name: '代理架构代码', text: true, proxy: false, evaluator: true },
  { name: '连续波形', text: false, proxy: true, evaluator: true },
  { name: '私有人工审美', text: true, proxy: false, evaluator: false },
];

function BoundaryLab() {
  const [scenario, setScenario] = useState(0);
  const [gate, setGate] = useState(0);
  const [dragging, setDragging] = useState(false);
  const current = boundaryScenarios[scenario];
  const canText = current.text || current.proxy;
  const maxGate = !canText ? 0 : current.evaluator ? 2 : 1;
  useEffect(() => setGate(0), [scenario]);
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const gates = [{ x: 202, title: '可写成文本' }, { x: 365, title: '可自动评估' }];
    gates.forEach((g, i) => {
      ctx.fillStyle = gate > i ? '#e6f5ed' : C.white;
      ctx.strokeStyle = gate > i ? C.green : C.line;
      ctx.lineWidth = 3;
      roundRect(ctx, g.x, 42, 105, 135, 12);
      ctx.fill();
      ctx.stroke();
      label(ctx, g.title, g.x + 52, 63, gate > i ? C.green : C.muted, 12, 'center');
    });
    drawPath(ctx, [[40, 135], [518, 135]], C.line, 4);
    const positions = [72, 255, 418];
    drawCard(ctx, positions[gate] - 55, 101, 110, 67, current.name, gate === maxGate && gate < 2 ? C.red : gate === 2 ? C.green : C.orange);
    if (current.proxy) pill(ctx, '需要文本代理', 54, 210, C.orange);
    if (!current.evaluator) pill(ctx, '缺少自动评估器', 330, 210, C.red);
  }, [scenario, gate]);
  const updateByPointer = (clientX: number, rect: DOMRect) => {
    const x = (clientX - rect.left) * W / rect.width;
    const desired = x < 170 ? 0 : x < 340 ? 1 : 2;
    setGate(Math.min(desired, maxGate));
  };
  const feedback = gate === 2
    ? { text: '文本可表示、评估可执行：可以进入 optimize_anything 循环。', cls: 'good' }
    : gate === 1 && !current.evaluator
    ? { text: '没有可执行评估器，系统无法自动比较候选。', cls: 'bad' }
    : current.proxy
    ? { text: '可以借助文本代理，但代理误差会成为新的适用边界。', cls: '' }
    : { text: '把候选卡向右拖，依次检查两道门。', cls: '' };
  return (
    <div>
      <div className="chip-row">{boundaryScenarios.map((s, i) => <button type="button" key={s.name} className={`chip ${i === scenario ? 'selected' : ''}`} aria-pressed={i === scenario} onClick={() => setScenario(i)}>{s.name}</button>)}</div>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); updateByPointer(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onPointerMove={(e) => { if (dragging) updateByPointer(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onPointerUp={(e) => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
        aria-label="把候选卡拖过文本表示与自动评估两道门"
      />
      <div className="step-ctrl">
        <button type="button" className="tiny" disabled={gate === 0} onClick={() => setGate((g) => Math.max(0, g - 1))}>← 上一道门</button>
        <span className="step-label">已通过 <b>{gate}</b> / 2</span>
        <button type="button" className="tiny" disabled={gate >= maxGate} onClick={() => setGate((g) => Math.min(maxGate, g + 1))}>下一道门 →</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
}

const modeData = [
  { key: 'single', chip: '无 dataset', mode: '单任务搜索', output: '1 个问题解', args: 'dataset=None · valset=None', color: C.blue, note: '候选本身就是一个问题的解。' },
  { key: 'multi', chip: '有 dataset', mode: '多任务搜索', output: 'N 个专门制品', args: 'dataset=D · valset=None', color: C.green, note: '共享搜索经验，最终每个任务各选一个候选。' },
  { key: 'gen', chip: 'dataset + valset', mode: '泛化搜索', output: '1 个泛化制品', args: 'dataset=Dtrain · valset=Dval', color: C.purple, note: '训练反馈指导搜索，留出集测未见表现。' },
];

function ModeSelector() {
  const [idx, setIdx] = useState(0);
  const m = modeData[idx];
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, 245);
    label(ctx, 'optimize_anything( … )', 28, 25, C.ink, 15);
    pill(ctx, m.args, 285, 25, m.color);
    modeData.forEach((d, i) => {
      const x = 30 + i * 178;
      roundRect(ctx, x, 62, 145, 83, 12);
      ctx.fillStyle = i === idx ? '#eef4fb' : C.white;
      ctx.fill();
      ctx.strokeStyle = i === idx ? d.color : C.line;
      ctx.lineWidth = i === idx ? 3 : 1.5;
      ctx.stroke();
      label(ctx, d.mode, x + 72, 87, i === idx ? d.color : C.muted, 13, 'center');
      label(ctx, d.output, x + 72, 117, C.ink, 12, 'center');
    });
    drawPath(ctx, [[102 + idx * 178, 146], [102 + idx * 178, 178], [280, 178]], m.color, 3);
    drawCard(ctx, 218, 174, 124, 54, m.output, m.color);
  }, [idx], W, 245);
  return (
    <div>
      <div className="chip-row">
        {modeData.map((d, i) => <button type="button" key={d.key} className={`chip ${i === idx ? 'selected' : ''}`} aria-pressed={i === idx} onClick={() => setIdx(i)}>{d.chip}</button>)}
        <button type="button" className="chip" disabled title="缺少训练 dataset，valset 没有搜索反馈来源">只有 valset（无效）</button>
      </div>
      <canvas ref={canvas} width={W} height={245} />
      <div className="feedback good">{m.note}</div>
      <div className="feedback bad">无效组合说明：只有 valset 而没有训练 dataset，搜索阶段没有反馈来源。</div>
    </div>
  );
}

const demoCandidates = [
  { name: '远航型 A', a: 0.92, b: 0.30, color: C.blue },
  { name: '均衡型 B', a: 0.68, b: 0.70, color: C.green },
  { name: '稳定型 C', a: 0.36, b: 0.96, color: C.purple },
];

function WeightLab() {
  const [weight, setWeight] = useState(50);
  const w = weight / 100;
  const scores = demoCandidates.map((c) => w * c.a + (1 - w) * c.b);
  const best = scores.indexOf(Math.max(...scores));
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    label(ctx, '教学示意：坐标不是论文实验值', 18, 20, C.muted, 11);
    demoCandidates.forEach((c, i) => {
      const y = 62 + i * 57;
      label(ctx, c.name, 18, y + 13, best === i ? c.color : C.muted, 12);
      ctx.fillStyle = '#edf1f6';
      ctx.fillRect(110, y, 300, 13);
      ctx.fillStyle = c.color;
      ctx.fillRect(110, y, 300 * scores[i], 13);
      label(ctx, scores[i].toFixed(2), 423, y + 7, best === i ? c.color : C.muted, 12);
      if (best === i) pill(ctx, '被平均分选中', 455, y + 7, c.color);
      label(ctx, `A ${c.a.toFixed(2)} · B ${c.b.toFixed(2)}`, 110, y + 32, C.muted, 11);
    });
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    const x = 110 + 300 * w;
    ctx.beginPath();
    ctx.moveTo(x, 45);
    ctx.lineTo(x, 225);
    ctx.stroke();
  }, [weight, best]);
  const feedback = weight < 20 || weight > 80
    ? { text: '权重极端：另一任务上的专长几乎不影响选择。', cls: '' }
    : { text: '平均分给出一个排序，却没有保留候选的全部互补强项。', cls: '' };
  return (
    <div>
      <canvas ref={canvas} width={W} height={H} />
      <div className="ctrl">
        <label>任务 A 权重 <span className="val">{weight}%</span></label>
        <input type="range" min={0} max={100} value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        <span>任务 B：{100 - weight}%</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text} 当前选择：<b>{demoCandidates[best].name}</b>。</div>
      <div className="feedback good">保留逐任务得分，才能在下一节用 Pareto 前沿维持多样性。</div>
    </div>
  );
}

const siDomains = [
  { key: 'facility', label: '提示优化', protocol: 'Facility Support · 测试分越高越好', withSI: '86.32', without: '82.5', detail: '验证分 0.80：约 100 vs 600 rollouts' },
  { key: 'circle', label: '圆堆积', protocol: '最佳值占最优比例 · 越高越好', withSI: '100%', without: '93.96%', detail: 'n=26；不能与 CUDA 速度相加' },
  { key: 'kst', label: 'CUDA 单任务', protocol: '平均加速比 · 越高越好', withSI: '4.11×', without: '1.15×', detail: 'f₁.₁：32.3% vs 12.9%' },
  { key: 'kmt', label: 'CUDA 多任务', protocol: '达到 1.1× 的比例 · 越高越好', withSI: '40%', without: '0%', detail: '平均加速：1.15× vs 1.03×' },
];

function SILab() {
  const [domain, setDomain] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setProgress((v) => {
      const next = Math.min(1, v + 0.035);
      if (next >= 1) setRunning(false);
      return next;
    }), 40);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => { setProgress(0); setRunning(false); }, [domain]);
  const d = siDomains[domain];
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const left = 45, top = 42, width = 465, height = 145;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, top + height);
    ctx.lineTo(left + width, top + height);
    ctx.stroke();
    label(ctx, '优化进度', left + width, top + height + 22, C.muted, 11, 'right');
    const endX = left + width * progress;
    const steps = 28;
    const redPoints: Array<[number, number]> = [];
    const greenPoints: Array<[number, number]> = [];
    for (let i = 0; i <= steps * progress; i++) {
      const q = i / steps;
      redPoints.push([left + q * width, top + height * (1 - (0.15 + 0.53 * Math.sqrt(q)))]);
      greenPoints.push([left + q * width, top + height * (1 - (0.15 + 0.80 * Math.pow(q, 0.35)))]);
    }
    drawPath(ctx, redPoints, C.red, 3);
    drawPath(ctx, greenPoints, C.green, 3);
    if (progress > 0) {
      drawPlane(ctx, endX, greenPoints[greenPoints.length - 1]?.[1] ?? 170, -0.05, C.green, 0.58);
    }
    pill(ctx, '有 SI', 68, 20, C.green);
    pill(ctx, '只给总分', 146, 20, C.red);
    label(ctx, d.protocol, 520, 218, C.muted, 11, 'right');
  }, [domain, progress]);
  return (
    <div>
      <div className="chip-row">{siDomains.map((x, i) => <button type="button" key={x.key} className={`chip ${i === domain ? 'selected' : ''}`} aria-pressed={i === domain} onClick={() => setDomain(i)}>{x.label}</button>)}</div>
      <canvas ref={canvas} width={W} height={H} />
      <div style={panelStyle}>
        <div style={{ ...factStyle, borderColor: C.green }}><b>有 SI</b><br /><span style={{ color: C.green, fontSize: 20 }}>{d.withSI}</span></div>
        <div style={{ ...factStyle, borderColor: C.red }}><b>只给总分</b><br /><span style={{ color: C.red, fontSize: 20 }}>{d.without}</span></div>
        <div style={factStyle}><b>协议细节</b><br />{d.detail}</div>
      </div>
      <div className="step-ctrl"><button type="button" className="tiny" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>{progress >= 1 ? '再次对照' : '开始对照'}</button></div>
      <div className={`feedback ${progress >= 1 ? 'good' : ''}`}>{progress >= 1 ? '在此协议内，SI 收敛更快或最终更高；不同领域的指标不能合并。' : '两条路线使用相同进度轴，差别是评估器是否返回可行动诊断。'}</div>
    </div>
  );
}

const paretoPoints = [
  { id: 'A', x: 0.93, y: 0.42, frontier: true, note: '任务 1 最强，仍应保留。' },
  { id: 'B', x: 0.76, y: 0.66, frontier: true, note: '两项均衡，位于非支配前沿。' },
  { id: 'C', x: 0.55, y: 0.84, frontier: true, note: '任务 2 很强，提供互补父代。' },
  { id: 'D', x: 0.31, y: 0.95, frontier: true, note: '任务 2 最强，属于 B[2]。' },
  { id: 'E', x: 0.66, y: 0.34, frontier: false, note: '被 B 支配：两项都不更好。' },
  { id: 'F', x: 0.38, y: 0.45, frontier: false, note: '被多个候选支配，不进入前沿。' },
];

function ParetoLab() {
  const [selected, setSelected] = useState('A');
  const active = paretoPoints.find((p) => p.id === selected)!;
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const ox = 60, oy = 215, pw = 400, ph = 165;
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - ph);
    ctx.lineTo(ox, oy);
    ctx.lineTo(ox + pw, oy);
    ctx.stroke();
    label(ctx, '任务 1 分数 →', ox + pw, oy + 22, C.muted, 11, 'right');
    label(ctx, '任务 2', ox - 8, oy - ph, C.muted, 11, 'right');
    const frontier = paretoPoints.filter((p) => p.frontier).sort((a, b) => a.x - b.x).map((p) => [ox + p.x * pw, oy - p.y * ph] as [number, number]);
    drawPath(ctx, frontier, C.green, 2.5);
    paretoPoints.forEach((p) => {
      const x = ox + p.x * pw, y = oy - p.y * ph;
      ctx.beginPath();
      ctx.arc(x, y, p.id === selected ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = p.frontier ? '#e6f5ed' : '#fdecef';
      ctx.fill();
      ctx.strokeStyle = p.id === selected ? C.orange : p.frontier ? C.green : C.red;
      ctx.lineWidth = p.id === selected ? 4 : 2;
      ctx.stroke();
      label(ctx, p.id, x, y - 17, p.id === selected ? C.orange : C.ink, 12, 'center');
    });
    pill(ctx, 'Pareto 前沿', 390, 25, C.green);
  }, [selected]);
  const pickFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * W / rect.width;
    const y = (e.clientY - rect.top) * H / rect.height;
    const ox = 60, oy = 215, pw = 400, ph = 165;
    let best = paretoPoints[0], bestD = Infinity;
    paretoPoints.forEach((p) => {
      const dx = x - (ox + p.x * pw), dy = y - (oy - p.y * ph);
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = p; }
    });
    if (bestD < 900) setSelected(best.id);
  };
  return (
    <div>
      <canvas ref={canvas} width={W} height={H} onClick={pickFromCanvas} style={{ cursor: 'pointer' }} aria-label="点击候选查看 Pareto 支配关系" />
      <div className="chip-row">{paretoPoints.map((p) => <button type="button" key={p.id} className={`chip ${p.id === selected ? 'selected' : ''}`} aria-pressed={p.id === selected} onClick={() => setSelected(p.id)}>候选 {p.id}</button>)}</div>
      <div style={panelStyle}>
        <div style={factStyle}><b>任务 1</b><br />{active.x.toFixed(2)}</div>
        <div style={factStyle}><b>任务 2</b><br />{active.y.toFixed(2)}</div>
        <div style={factStyle}><b>状态</b><br />{active.frontier ? '非支配候选' : '已被支配'}</div>
      </div>
      <div className={`feedback ${active.frontier ? 'good' : 'bad'}`}>{active.note} 坐标仅为教学几何。</div>
    </div>
  );
}

function TransferLab() {
  const [relation, setRelation] = useState<'related' | 'unrelated'>('related');
  const [stage, setStage] = useState(0);
  const stages = ['尚未共享', '发现可复用模式', '保留在共享前沿', '用于另一任务并验证'];
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const taskXs = [65, 205, 345, 485];
    taskXs.forEach((x, i) => {
      roundRect(ctx, x - 48, 71, 96, 64, 10);
      ctx.fillStyle = i <= stage ? '#eef4fb' : C.white;
      ctx.fill();
      ctx.strokeStyle = i < stage ? C.green : i === stage ? C.orange : C.line;
      ctx.lineWidth = i === stage ? 3 : 1.5;
      ctx.stroke();
      label(ctx, ['任务 i', '优化技巧', '共享前沿', '任务 j'][i], x, 92, i <= stage ? C.blue : C.muted, 12, 'center');
      label(ctx, ['起点', '向量化/折翼', '保留模式', '验证迁移'][i], x, 116, C.muted, 10, 'center');
      if (i < 3) drawPath(ctx, [[x + 49, 103], [taskXs[i + 1] - 49, 103]], i < stage ? (relation === 'related' ? C.green : C.red) : C.line, 3);
    });
    if (stage > 0) drawPlane(ctx, taskXs[stage], 54, 0, relation === 'related' ? C.green : C.red, 0.6);
    if (stage === 3) {
      pill(ctx, relation === 'related' ? 'ST 60% → MT10 90%' : '2.6360 → 2.5973', 180, 185, relation === 'related' ? C.green : C.red);
      label(ctx, relation === 'related' ? 'KernelBench f₁.₀（10题）' : '圆堆积：Single → MT11', 280, 224, C.muted, 11, 'center');
    }
  }, [relation, stage]);
  const feedback = stage < 3
    ? '逐步观察一个模式怎样被发现、保留并送往另一任务。'
    : relation === 'related'
    ? '相关 CUDA 任务：可复用模式带来更高阈值达成率；结果依赖任务子集和速度阈值。'
    : '不相关圆堆积：MT7=2.6313、MT11=2.5973，均低于单任务 2.6360。';
  return (
    <div>
      <div className="chip-row">
        <button type="button" className={`chip ${relation === 'related' ? 'selected' : ''}`} aria-pressed={relation === 'related'} disabled={stage !== 0} onClick={() => setRelation('related')}>相关 CUDA</button>
        <button type="button" className={`chip ${relation === 'unrelated' ? 'selected' : ''}`} aria-pressed={relation === 'unrelated'} disabled={stage !== 0} onClick={() => setRelation('unrelated')}>不相关圆堆积</button>
      </div>
      {stage !== 0 && <div className="feedback">重置到起点后才能切换任务族，保证比较起点一致。</div>}
      <canvas ref={canvas} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny" disabled={stage === 0} onClick={() => setStage((s) => s - 1)}>← 上一步</button>
        <span className="step-label"><b>{stage}</b> / 3 · {stages[stage]}</span>
        <button type="button" className="tiny" disabled={stage === 3} onClick={() => setStage((s) => s + 1)}>下一步 →</button>
        <button type="button" className="tiny" onClick={() => setStage(0)}>重置</button>
      </div>
      <div className={`feedback ${stage === 3 ? (relation === 'related' ? 'good' : 'bad') : ''}`}>{feedback}</div>
    </div>
  );
}

const systemNodes = [
  { id: 'api', name: '声明式 API', detail: '接收 seed/objective、evaluator、可选 dataset 与 valset。' },
  { id: 'parse', name: '解析与修复', detail: '修正常见代码块、导入与语法格式问题，避免小格式错误导致全盘失败。' },
  { id: 'cache', name: '评估缓存', detail: '对内容寻址；重复候选可跳过昂贵执行。' },
  { id: 'eval', name: '评估器 + SI', detail: '返回标量分数与类型化诊断。' },
  { id: 'frontier', name: 'Pareto 前沿', detail: '保留逐任务或逐指标的互补候选。' },
  { id: 'reflect', name: '反思提议', detail: '在小批样例上读取分数与 SI，提出定向修改。' },
  { id: 'adapter', name: '后端适配', detail: '搜索后端可替换，用户 API 保持不变。' },
];

function SystemMap() {
  const [active, setActive] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const positions = systemNodes.map((_, i) => ({ x: 55 + (i % 4) * 145, y: i < 4 ? 70 : 170 }));
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, 280);
    systemNodes.forEach((n, i) => {
      if (i < systemNodes.length - 1) {
        const a = positions[i], b = positions[i + 1];
        drawPath(ctx, [[a.x + 48, a.y], [b.x - 48, b.y]], i < active ? C.green : C.line, i < active ? 3 : 2);
      }
    });
    systemNodes.forEach((n, i) => {
      const p = positions[i];
      roundRect(ctx, p.x - 48, p.y - 29, 96, 58, 10);
      ctx.fillStyle = i === active ? '#fff7ed' : i < active ? '#e6f5ed' : C.white;
      ctx.fill();
      ctx.strokeStyle = i === active ? C.orange : i < active ? C.green : C.line;
      ctx.lineWidth = i === active ? 4 : 1.5;
      ctx.stroke();
      label(ctx, n.name, p.x, p.y, i === active ? C.orange : i < active ? C.green : C.muted, 11, 'center');
    });
    if (repeat) {
      drawPath(ctx, [[positions[2].x, positions[2].y + 30], [positions[4].x, positions[4].y - 36]], C.blue, 3, true);
      pill(ctx, '缓存命中', 225, 230, C.blue);
    }
    label(ctx, 'ARC 四阶段代理 = 搜索产物，不是框架节点', 280, 260, C.red, 11, 'center');
  }, [active, repeat], W, 280);
  const selectCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * W / rect.width;
    const y = (e.clientY - rect.top) * 280 / rect.height;
    let best = 0, dist = Infinity;
    positions.forEach((p, i) => {
      const d = (x - p.x) ** 2 + (y - p.y) ** 2;
      if (d < dist) { dist = d; best = i; }
    });
    if (dist < 2600) setActive(best);
  };
  const node = systemNodes[active];
  return (
    <div>
      <div className="chip-row">
        {systemNodes.map((n, i) => <button type="button" key={n.id} className={`chip ${i === active ? 'selected' : ''}`} aria-pressed={i === active} onClick={() => setActive(i)}>{n.name}</button>)}
      </div>
      <canvas ref={canvas} width={W} height={280} onClick={selectCanvas} style={{ cursor: 'pointer' }} aria-label="点击系统组件查看职责与活动路径" />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={() => setActive((v) => (v + 1) % systemNodes.length)}>下一节点 →</button>
        <button type="button" className={`chip ${repeat ? 'selected' : ''}`} aria-pressed={repeat} onClick={() => setRepeat((v) => !v)}>{repeat ? '重复候选：缓存命中' : '新候选：完整评估'}</button>
        <button type="button" className="chip" disabled title="这是搜索得到的 ARC 代理，不属于框架结构">ARC 四阶段代理（搜索产物）</button>
      </div>
      <div style={factStyle}><b>{node.name}</b><br />{node.detail}</div>
      <div className={`feedback ${repeat && active >= 2 ? 'good' : ''}`}>{repeat && active >= 2 ? '缓存命中会避免重复昂贵评估，但不会改变候选本身的质量。' : '选中节点、活动路径、职责与输入输出同步更新。'}</div>
    </div>
  );
}

const scenarios = [
  { key: 'cuda', label: 'CUDA', x: .86, y: .62, proxy: true, evaluator: true, evidence: '相关性高；31 项评估约 140 美元（4.51 美元/题）' },
  { key: 'arc', label: 'ARC-AGI', x: .68, y: .25, proxy: true, evaluator: true, evidence: '总成本 144.70 美元，代理评估主导成本' },
  { key: 'circle', label: '圆堆积多 n', x: .18, y: .72, proxy: true, evaluator: true, evidence: '不同 n 缺少迁移结构；MT11 低于单任务' },
  { key: 'taste', label: '私有审美', x: .45, y: .18, proxy: true, evaluator: false, evidence: '缺少可执行评估器，不能自动比较候选' },
  { key: 'cloud', label: '云调度', x: .75, y: .48, proxy: true, evaluator: true, evidence: '有训练/验证场景与结构化决策诊断' },
];

function SuitabilityMap() {
  const [scenario, setScenario] = useState(0);
  const [pos, setPos] = useState({ x: scenarios[0].x, y: scenarios[0].y });
  const [dragging, setDragging] = useState(false);
  useEffect(() => setPos({ x: scenarios[scenario].x, y: scenarios[scenario].y }), [scenario]);
  const s = scenarios[scenario];
  const verdict = !s.evaluator ? 'avoid' : pos.x > .6 && pos.y > .45 ? 'multi' : pos.y < .35 ? 'cost' : pos.x < .4 ? 'single' : 'caution';
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const ox = 60, oy = 220, pw = 430, ph = 170;
    ctx.fillStyle = '#fdecef'; ctx.fillRect(ox, oy - ph, pw / 2, ph / 2);
    ctx.fillStyle = '#fff7ed'; ctx.fillRect(ox + pw / 2, oy - ph, pw / 2, ph / 2);
    ctx.fillStyle = '#eef4fb'; ctx.fillRect(ox, oy - ph / 2, pw / 2, ph / 2);
    ctx.fillStyle = '#e6f5ed'; ctx.fillRect(ox + pw / 2, oy - ph / 2, pw / 2, ph / 2);
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy - ph, pw, ph);
    ctx.beginPath(); ctx.moveTo(ox + pw / 2, oy - ph); ctx.lineTo(ox + pw / 2, oy); ctx.moveTo(ox, oy - ph / 2); ctx.lineTo(ox + pw, oy - ph / 2); ctx.stroke();
    label(ctx, '任务相关性 →', ox + pw, oy + 22, C.muted, 11, 'right');
    label(ctx, '评估可承受性 ↑', ox, oy - ph - 18, C.muted, 11);
    label(ctx, '不宜直接用', ox + pw * .25, oy - ph * .75, C.red, 12, 'center');
    label(ctx, '先控成本', ox + pw * .75, oy - ph * .75, C.orange, 12, 'center');
    label(ctx, '退回单任务', ox + pw * .25, oy - ph * .25, C.blue, 12, 'center');
    label(ctx, '适合多任务', ox + pw * .75, oy - ph * .25, C.green, 12, 'center');
    const x = ox + pos.x * pw, y = oy - pos.y * ph;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = C.orange; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.stroke();
    label(ctx, s.label, x, y - 22, C.ink, 12, 'center');
  }, [scenario, pos.x, pos.y]);
  const move = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clamp(((clientX - rect.left) * W / rect.width - 60) / 430, 0, 1);
    const y = clamp((220 - (clientY - rect.top) * H / rect.height) / 170, 0, 1);
    setPos({ x, y });
  };
  const texts: Record<string, [string, string]> = {
    multi: ['相关且评估可承受：可考虑多任务共享。', 'good'],
    single: ['结构不共享：退回单任务，避免负迁移。', ''],
    cost: ['评估器昂贵：先做缓存、缩小预算或改进代理。', ''],
    caution: ['边界状态：先小预算验证 SI 与迁移是否真的有效。', ''],
    avoid: ['缺少可执行评估器，不宜直接套用自动文本优化。', 'bad'],
  };
  const [feedback, cls] = texts[verdict];
  const nudge = (dx: number, dy: number) => setPos((p) => ({ x: clamp(p.x + dx, 0, 1), y: clamp(p.y + dy, 0, 1) }));
  return (
    <div>
      <div className="chip-row">{scenarios.map((x, i) => <button type="button" key={x.key} className={`chip ${i === scenario ? 'selected' : ''}`} aria-pressed={i === scenario} onClick={() => setScenario(i)}>{x.label}</button>)}</div>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
        onPointerMove={(e) => { if (dragging) move(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect()); }}
        onPointerUp={(e) => { setDragging(false); e.currentTarget.releasePointerCapture(e.pointerId); }}
        aria-label="拖动场景标记探索任务相关性与评估可承受性"
      />
      <div className="step-ctrl">
        <button type="button" className="tiny" onClick={() => nudge(-.1, 0)}>相关性 −</button>
        <button type="button" className="tiny" onClick={() => nudge(.1, 0)}>相关性 +</button>
        <button type="button" className="tiny" onClick={() => nudge(0, -.1)}>承受性 −</button>
        <button type="button" className="tiny" onClick={() => nudge(0, .1)}>承受性 +</button>
      </div>
      <div style={factStyle}><b>论文证据</b><br />{s.evidence}</div>
      <div className={`feedback ${cls}`}>{feedback}</div>
    </div>
  );
}

const results = [
  { key: 'arc', label: 'ARC-AGI', old: 32.5, now: 89.5, min: 0, max: 100, oldText: '32.5%', nowText: '89.5%', protocol: 'Gemini 3 Flash · 测试准确率 · 越高越好' },
  { key: 'cloud', label: 'CloudCast', old: 0, now: 40.2, min: 0, max: 50, oldText: 'Dijkstra：0%节省', nowText: '40.2%成本节省', protocol: 'ADRS 泛化场景 · 成本节省越高越好' },
  { key: 'aime', label: 'AIME', old: 46.67, now: 60, min: 0, max: 100, oldText: '46.67%', nowText: '60.00%', protocol: 'AIME 2025 · GPT-4.1-mini · 准确率越高越好' },
  { key: 'cuda', label: 'CUDA', old: 0, now: 87, min: 0, max: 100, oldText: '0%任务超过基线', nowText: '87%达到/超过', protocol: '31项 KernelBench · V100 · 达标比例越高越好' },
  { key: 'circle', label: '圆堆积', old: 2.6307, now: 2.63598, min: 2.62, max: 2.64, oldText: '2.6307 / 200次', nowText: '2.63598 / 63次', protocol: 'n=26 · GPT-5.1 对照 · 半径和越高越好' },
  { key: 'si', label: 'SI 消融', old: 82.5, now: 86.32, min: 70, max: 90, oldText: '82.5', nowText: '86.32', protocol: 'Facility Support 测试分 · 越高越好' },
];

function ResultRace() {
  const [metric, setMetric] = useState(0);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const data = results[metric];
  useEffect(() => { setProgress(0); setRunning(false); }, [metric]);
  useEffect(() => {
    if (!running) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setProgress(1); setRunning(false); return; }
    const timer = window.setInterval(() => setProgress((v) => {
      const next = Math.min(1, v + .025);
      if (next >= 1) setRunning(false);
      return next;
    }), 35);
    return () => window.clearInterval(timer);
  }, [running]);
  const canvas = useCanvas((ctx) => {
    clearScene(ctx, W, H);
    const x0 = 90, width = 405;
    [92, 164].forEach((y) => drawPath(ctx, [[x0, y], [x0 + width, y]], C.line, 7));
    const oldNorm = (data.old - data.min) / (data.max - data.min);
    const nowNorm = (data.now - data.min) / (data.max - data.min);
    const oldX = x0 + width * oldNorm * progress;
    const nowX = x0 + width * nowNorm * progress;
    drawPath(ctx, [[x0, 92], [oldX, 92]], C.red, 7);
    drawPath(ctx, [[x0, 164], [nowX, 164]], C.green, 7);
    drawPlane(ctx, oldX, 92, 0, C.red, .68);
    drawPlane(ctx, nowX, 164, 0, C.green, .68);
    label(ctx, '基线', 18, 92, C.red, 12);
    label(ctx, '本文', 18, 164, C.green, 12);
    label(ctx, progress >= 1 ? data.oldText : '—', 500, 92, C.red, 12, 'right');
    label(ctx, progress >= 1 ? data.nowText : '—', 500, 164, C.green, 12, 'right');
    pill(ctx, data.label, 20, 24, C.blue);
    label(ctx, data.protocol, 530, 226, C.muted, 11, 'right');
  }, [metric, progress]);
  return (
    <div>
      <div className="chip-row">{results.map((r, i) => <button type="button" key={r.key} className={`chip ${i === metric ? 'selected' : ''}`} aria-pressed={i === metric} onClick={() => setMetric(i)}>{r.label}</button>)}</div>
      <canvas ref={canvas} width={W} height={H} />
      <div style={panelStyle}>
        <div style={{ ...factStyle, borderColor: C.red }}><b>基线 / 对照</b><br />{data.oldText}</div>
        <div style={{ ...factStyle, borderColor: C.green }}><b>optimize_anything</b><br />{data.nowText}</div>
        <div style={factStyle}><b>协议</b><br />{data.protocol}</div>
      </div>
      <div className="step-ctrl"><button type="button" className="tiny" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>{progress >= 1 ? '再次比较' : '开始比较'}</button></div>
      <div className={`feedback ${progress >= 1 ? 'good' : ''}`}>{progress >= 1 ? '这个结论只在上方协议内成立；切换指标会重置赛道，避免不兼容数值混在一起。' : '先确认基线、数据、硬件与指标方向，再启动比较。'}</div>
      {metric === 3 && <div className="feedback">“87%”表示 31 项任务中达到或超过 PyTorch 的比例，不是平均加速 87%。另有 25% 至少快 20%。</div>}
    </div>
  );
}

export const PaperPlaneLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  if (chapterId === 'hero') return <AutoScene variant={`hero-${moduleId}`} hero />;
  if (moduleId === 'ana') return <AutoScene variant={chapterId} />;
  switch (moduleId) {
    case '1.1': return <CompareLoop />;
    case '1.2': return <ArtifactSelector />;
    case '2.1': return <BoundaryLab />;
    case '3.1': return <ModeSelector />;
    case '4.1': return <WeightLab />;
    case '5.1': return <SILab />;
    case '6.1': return <ParetoLab />;
    case '7.1': return <TransferLab />;
    case '8.1': return <SystemMap />;
    case '9.1': return <SuitabilityMap />;
    case '10.1': return <ResultRace />;
    default: return <div className="feedback bad">未找到交互模块：{moduleId}</div>;
  }
};

export default PaperPlaneLab;
