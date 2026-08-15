import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Result = {
  task: string;
  score: string;
  metric: string;
  direction: 'higher' | 'lower';
  protocol: string;
  note: string;
};

const groups: Array<{ label: string; title: string; intro: string; results: Result[] }> = [
  {
    label: 'Dense probing',
    title: '冻结 backbone：比较预训练表示',
    intro: '此处只训练轻量 decoder，因此更接近比较“预训练表示可用性”，但它仍不是把数据、模型和目标逐一拆开的因果实验。',
    results: [
      { task: '姿态', score: '74.7', metric: 'mAP ↑', direction: 'higher', protocol: '表 2 · dense probing', note: '同一冻结特征评测协议下的报告值。' },
      { task: '人体部件分割', score: '69.6', metric: 'mIoU ↑', direction: 'higher', protocol: '表 2 · dense probing', note: '以类别区域重合度衡量。' },
      { task: 'Pointmap', score: '0.358', metric: 'L2 ↓', direction: 'lower', protocol: '表 2 · dense probing', note: '数值越低代表几何点图误差越小。' },
      { task: '表面法线', score: '13.5°', metric: 'MAE ↓', direction: 'lower', protocol: '表 2 · dense probing', note: '角度误差，数值越低越好。' },
      { task: 'Albedo', score: '3.12e−2', metric: 'MAE ↓', direction: 'lower', protocol: '表 2 · dense probing', note: '反照率重建误差，数值越低越好。' },
    ],
  },
  {
    label: '任务后训练',
    title: '任务专用训练：比较最终系统结果',
    intro: '这些数值属于各自任务的数据、任务头与训练协议。它们说明完整系统效果强，不应与 dense probing 混成同一排行榜。',
    results: [
      { task: '姿态', score: '82.3', metric: 'mAP ↑', direction: 'higher', protocol: '表 3 · Humans-11K', note: 'Sapiens2-5B 的报告值。' },
      { task: '人体部件分割', score: '82.5', metric: 'mIoU ↑', direction: 'higher', protocol: '表 4 · Humans-5K', note: 'Sapiens2-5B 的报告值。' },
      { task: '表面法线', score: '6.73°', metric: 'MAE ↓', direction: 'lower', protocol: '表 6 · synthetic test', note: '平均角误差，Sapiens2-5B 的报告值。' },
      { task: 'Albedo', score: '0.01191', metric: 'MAE ↓', direction: 'lower', protocol: '表 7 · synthetic test', note: '反照率误差，Sapiens2-5B 的报告值。' },
    ],
  },
];

export const ResultsMatrix: React.FC<WidgetProps> = () => {
  const [groupIndex, setGroupIndex] = useState(0);
  const group = groups[groupIndex];

  return (
    <div className="results-matrix">
      <div className="ctrl"><div className="chip-row">
        {groups.map((item, index) => (
          <button className={`chip ${groupIndex === index ? 'on' : ''}`} onClick={() => setGroupIndex(index)} key={item.label}>
            {item.label}
          </button>
        ))}
      </div></div>
      <div className="result-heading">
        <strong>{group.title}</strong>
        <span>{group.intro}</span>
      </div>
      <div className="results-grid">
        {group.results.map((result) => (
          <article className="result-card" key={`${group.label}-${result.task}`}>
            <div className="result-card-top"><span>{result.task}</span><b className={result.direction}>{result.metric}</b></div>
            <div className="result-score">{result.score}</div>
            <div className="result-protocol">{result.protocol}</div>
            <p>{result.note}</p>
          </article>
        ))}
      </div>
      <div className="feedback good"><strong>阅读边界：</strong>这些是论文报告的<strong>完整系统</strong>结果；联合目标、Humans-1B、模型规模、架构与任务配置同时变化，不能由这些表单独量化某一项改动的贡献。</div>
    </div>
  );
};
