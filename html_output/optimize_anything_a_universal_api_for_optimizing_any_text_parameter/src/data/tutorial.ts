import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  "meta": {
    "titleEn": "optimize_anything: A Universal API for Optimizing any Text Parameter",
    "titleZh": "optimize_anything：优化任意文本参数的通用 API",
    "venue": "CAIS 2026 · 16 页 · 11 幅图",
    "authors": "Lakshya A Agrawal、Donghyun Lee、Shangyin Tan 等",
    "affiliation": "加州大学伯克利分校 · MIT",
    "domain": "LLM 文本优化 · Agent 系统 · 演化搜索",
    "coreProblem": "现有工具常被一种制品或一种搜索模式锁住，只有总分时，提议模型还不知道候选为什么失败。",
    "coreInsight": "把候选统一写成<b>文本制品</b>，让评估器同时返回<b>分数 + 可行动侧信息（SI）</b>，再用 Pareto 搜索保留互补强项：同一 API 因而可以承载单任务、多任务与泛化三种优化模式。",
    "keywords": [
      "文本制品",
      "侧信息 SI",
      "Pareto 前沿",
      "跨任务迁移",
      "通用优化 API"
    ]
  },
  "hero": {
    "oldMethod": {
      "desc": "专用工具各自配置；只有总分时，下一轮仍在猜<b>哪里需要改</b>。",
      componentId: "paper-plane-lab"
    },
    "newMethod": {
      "desc": "统一文本接口把<b>分数与 SI</b>交给提议模型，定向修改并保留互补候选。",
      componentId: "paper-plane-lab"
    }
  },
  "chapters": [
    {
      kind: "chapter",
      "id": "chap-1",
      "title": "从专用工具到一个循环",
      "badge": "inf",
      "badgeLabel": "基础 · 推理",
      "bridge": "先别急着记 API。我们从最朴素的问题开始：<b>只有一个总分，下一轮到底该改哪里？</b>",
      "analogy": {
        "title": "一次试飞，两个反馈世界",
        "text": "只知道“得了 62 分”，你只能盲改。若同时看到<b>左偏、机头下沉</b>，下一次折翼就有方向。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "1.1",
          "title": "同一起点：盲试还是定向修正",
          "desc": "让两架纸飞机从完全相同的折法出发。左侧评估器只给分数，右侧还给 SI；按下按钮后，观察第二次试飞为什么走向不同。",
          componentId: "paper-plane-lab"
        },
        {
          kind: "module",
          "id": "1.2",
          "title": "六种制品，同一个插口",
          "desc": "切换论文中的六个主要领域。接口几何保持不变，但候选文本、评估逻辑、SI 与指标会随任务改变。",
          componentId: "paper-plane-lab"
        }
      ],
      "insight": "真正可复用的不是某个领域的专用变异器，而是<b>文本候选 + 评估器 + 可行动反馈</b>这份契约。",
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共形结构",
          "desc": "六个领域都能写成候选、评估、诊断与改写。"
        },
        {
          "icon": "🔧",
          "title": "评价仍需定制",
          "desc": "通用的是接口，不是领域指标。"
        },
        {
          "icon": "✨",
          "title": "诊断胜过盲猜",
          "desc": "SI 让下一次修改有方向，但不保证每轮单调上升。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-2",
      "title": "文本制品与评估器契约",
      "badge": "inf",
      "badgeLabel": "基础 · 推理",
      "bridge": "上一节说“任何文本参数”，但不是任何现实对象都能直接塞进循环。这里要过两道门：<b>可写成文本</b>与<b>可自动评估</b>。",
      "analogy": {
        "title": "先把折法写成设计卡",
        "text": "纸飞机能被优化，不是因为它是纸，而是因为折法能写成文本，试飞又能自动评分。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "2.1",
          "title": "能否接入这条 API",
          "desc": "选择一个场景，再拖动候选卡依次穿过“文本表示”和“自动评估”两道门。被挡住时，反馈会说明缺的到底是什么。",
          componentId: "paper-plane-lab"
        }
      ],
      "formula": {
        "lead": "评估器一次返回“多好”与“为什么”两类信息。",
        "unicode": "f(x,e) = ( s(x,e), ι(x,e) )",
        "symbols": [
          {
            "sym": "f",
            "desc": "评估器：执行候选并返回分数与可选诊断。"
          },
          {
            "sym": "x",
            "desc": "文本制品字符串；非文本对象需要一个文本代理。"
          },
          {
            "sym": "e",
            "desc": "可选样例或任务；单任务直接评估时可视为 ⊥。"
          },
          {
            "sym": "s",
            "desc": "标量分数；该 API 约定越高越好。"
          },
          {
            "sym": "ι",
            "desc": "可行动侧信息，可为文本、结构化数据、图像或空值。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "两道门槛",
          "desc": "候选要能文本化，评估器要能执行。"
        },
        {
          "icon": "🔧",
          "title": "代理有代价",
          "desc": "连续或二进制对象需要文本代理，并承担代理误差。"
        },
        {
          "icon": "✨",
          "title": "契约很小",
          "desc": "f 同时返回标量分数与可选 SI。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-3",
      "title": "三种搜索模式，不是三个 API",
      "badge": "inf",
      "badgeLabel": "基础 · 推理",
      "bridge": "候选与评估器已经就位。下一步要明确你究竟想得到：<b>一个解、N 个专门解，还是一个能泛化的解</b>。",
      "analogy": {
        "title": "三条跑道，三种承诺",
        "text": "单任务要一个解，多任务要多个专门解，泛化则要一个能应对未见风况的解。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "3.1",
          "title": "用数据配置选对模式",
          "desc": "切换 dataset 与 valset 的配置，观察激活的模式、输出数量和验证语义。多任务与泛化的差别会同时出现在画面和反馈中。",
          componentId: "paper-plane-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "单任务",
          "desc": "一个问题对应一个候选解。"
        },
        {
          "icon": "🔧",
          "title": "多任务",
          "desc": "相关任务共享经验，最终输出仍各自专门。"
        },
        {
          "icon": "✨",
          "title": "泛化",
          "desc": "一个制品要通过未见样例的验证。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-4",
      "title": "目标函数与平均分陷阱",
      "badge": "both",
      "badgeLabel": "推理 + 训练",
      "bridge": "三种模式都会“最大化分数”，但在哪些任务上取平均完全不同。更麻烦的是，<b>一个平均分会淹没互补强项</b>。",
      "analogy": {
        "title": "平均得分会遮住偏科",
        "text": "只看总平均，可能丢掉“续航最好”或“稳定性最好”的折法。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "4.1",
          "title": "调权重，看平均值怎样改写选择",
          "desc": "拖动任务 A 的权重。三位候选的原始能力不变，但被平均分选中的候选会改变；画面中的坐标仅作教学几何，不是论文实验值。",
          componentId: "paper-plane-lab"
        }
      ],
      "formula": {
        "lead": "三种模式都最大化分数，但“在哪些任务上取平均”不同。",
        "unicode": "Jsingle(x)=s(x)；Jmulti(x)=(1/n)Σᵢ s(x,eᵢ)；Jgen(x)=(1/k)Σⱼ s(x,eⱼᵛᵃˡ)",
        "symbols": [
          {
            "sym": "Jsingle",
            "desc": "单任务目标：候选本身就是该问题的解。"
          },
          {
            "sym": "Jmulti",
            "desc": "多任务目标：在 n 个相关任务上聚合搜索反馈。"
          },
          {
            "sym": "Jgen",
            "desc": "泛化目标：用留出验证样例测量一个制品的未见表现。"
          },
          {
            "sym": "n",
            "desc": "相关任务数，必须为正整数。"
          },
          {
            "sym": "k",
            "desc": "留出验证样例数，必须为正整数。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "目标不同",
          "desc": "同一接口并不意味着三个模式在优化同一个量。"
        },
        {
          "icon": "🔧",
          "title": "平均会丢信息",
          "desc": "专门强项可能被总分淹没。"
        },
        {
          "icon": "✨",
          "title": "逐项记录",
          "desc": "保留逐任务和逐指标得分，才有 Pareto 搜索的空间。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-5",
      "title": "SI：把“错了”变成“改哪里”",
      "badge": "both",
      "badgeLabel": "推理 + 训练",
      "bridge": "现在回到评估器。平均分告诉你“结果怎样”，但真正推动下一次反思的，是<b>哪一种失败正在发生</b>。",
      "analogy": {
        "title": "看见偏航，才知道折哪边",
        "text": "总分只说“没到靶心”，SI 则指出左偏、下沉或边界违规。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "5.1",
          "title": "相同预算下，SI 改变收敛路线",
          "desc": "选择一个消融领域并开始对照。两条曲线使用各自论文协议和正确的指标方向，不会把不兼容指标拼成一个总分。",
          componentId: "paper-plane-lab"
        }
      ],
      "insight": "SI 的价值不在于“反馈更长”，而在于它能把下一次修改指向具体故障。",
      "formula": {
        "lead": "SI 扩展评估器输出，但并不把离散文本搜索变成可微优化。",
        "unicode": "f(x,e) = ( s(x,e), ι(x,e) )，ι ∈ {文本，结构化数据，图像}",
        "symbols": [
          {
            "sym": "ι",
            "desc": "侧信息：可为空；有值时应能帮助定位下一步修改。"
          },
          {
            "sym": "s",
            "desc": "标量分数，只说明候选相对好坏。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "多好与为何",
          "desc": "s 与 ι 承担不同职责。"
        },
        {
          "icon": "🔧",
          "title": "先看协议",
          "desc": "不同领域的 SI 消融指标不能直接相加。"
        },
        {
          "icon": "✨",
          "title": "可行动才关键",
          "desc": "错误、轨迹和子分数支持定向修改。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-6",
      "title": "Pareto 搜索：保留互补强项",
      "badge": "inf",
      "badgeLabel": "基础 · 推理",
      "bridge": "SI 让一次反思更有方向，但搜索还要回答：<b>哪些旧候选值得继续当父代？</b>只留平均分第一会过早收敛。",
      "analogy": {
        "title": "不只留下“总分第一”",
        "text": "一个折法也许飞得最远，另一个最稳。Pareto 前沿让这些互补父代都活下来。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "6.1",
          "title": "点击候选，判断谁该留下",
          "desc": "点击二维目标图中的候选。反馈会同时更新支配关系、前沿成员身份与后续被选择的理由。",
          componentId: "paper-plane-lab"
        }
      ],
      "formula": {
        "lead": "若没有另一个候选在所有目标都不差且至少一项更好，它就属于前沿。",
        "unicode": "P = { Φ | ¬∃Ψ : Ψ ≻ Φ }；Pr(select Φ) ∝ |{ j∈J : Φ∈B[j] }|",
        "symbols": [
          {
            "sym": "P",
            "desc": "Pareto 非支配候选集合。"
          },
          {
            "sym": "Φ",
            "desc": "当前候选文本制品。"
          },
          {
            "sym": "Ψ",
            "desc": "用于检查支配关系的另一个候选。"
          },
          {
            "sym": "J",
            "desc": "逐任务、逐指标或两者组成的目标索引集合。"
          },
          {
            "sym": "B[j]",
            "desc": "在目标 j 上达到最佳分数的前沿候选集合。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "不被支配",
          "desc": "前沿不是平均分排行榜。"
        },
        {
          "icon": "🔧",
          "title": "互补父代",
          "desc": "不同强项为后续反思提供结构多样性。"
        },
        {
          "icon": "✨",
          "title": "后端可替换",
          "desc": "Pareto 是当前默认机制，不等于 API 本身。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-7",
      "title": "跨任务迁移：何时共享经验",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "Pareto 前沿能保存多种模式，于是一个任务发现的技巧可以影响另一个任务。关键问题是：<b>它们真的相关吗？</b>",
      "analogy": {
        "title": "好折法能迁移，坏类比会添乱",
        "text": "CUDA 任务共享向量化与归约技巧；不同 n 的圆堆积却没有稳定可迁移结构。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "7.1",
          "title": "沿着迁移链走一遍",
          "desc": "选择相关 CUDA 或不相关圆堆积，再逐步观察“发现模式—保留前沿—跨题提议—验证结果”。任务族只能在起点切换，保证比较公平。",
          componentId: "paper-plane-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "共享的是模式",
          "desc": "多任务并不输出一个万能解。"
        },
        {
          "icon": "🔧",
          "title": "相关性是前提",
          "desc": "结构不共享时，迁移会引入噪声。"
        },
        {
          "icon": "✨",
          "title": "预算要对齐",
          "desc": "论文比较使用等价的单任务预算。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-8",
      "title": "系统结构：小接口，完整搜索栈",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "到这里，核心机制都已出现。现在才适合打开系统结构：一个小 API 背后，<b>解析、缓存、SI、前沿、反思和后端适配</b>如何协同？",
      "analogy": {
        "title": "一个小夹子，稳住整片机翼",
        "text": "用户看到的是一个小 API，背后却需要解析、缓存、SI、前沿与后端适配协同。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "8.1",
          "title": "点击组件，追踪一次候选更新",
          "desc": "点击系统节点或逐步前进。选中节点、下游路径、输入输出和反馈会同步变化；“ARC 四阶段代理”被明确标为搜索产物，而不是框架节点。",
          componentId: "paper-plane-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "声明式入口",
          "desc": "用户声明 what，不必配置每个搜索细节。"
        },
        {
          "icon": "🔧",
          "title": "搜索栈完整",
          "desc": "解析、缓存、SI、前沿与反思共同工作。"
        },
        {
          "icon": "✨",
          "title": "分清两层",
          "desc": "ARC 四阶段代理是被发现的制品，不是框架本体。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-9",
      "title": "适用边界、成本与提议模型",
      "badge": "trn",
      "badgeLabel": "训练进阶",
      "bridge": "机制完整，不代表任何项目都值得上。现在把论文的限制转成一张<b>可操作的适用性地图</b>。",
      "analogy": {
        "title": "先选对风场，再谈飞多快",
        "text": "能文本化不代表值得优化；评估成本、任务相关性和 SI 设计常常决定成败。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "9.1",
          "title": "把场景放到适用性地图上",
          "desc": "拖动场景标记，探索“任务相关性 × 评估可承受性”。文本代理与自动评估器缺失时，地图会直接给出不可用原因。",
          componentId: "paper-plane-lab"
        }
      ],
      "takeaways": [
        {
          "icon": "🎯",
          "title": "先验边界",
          "desc": "文本代理和评估器缺一不可。"
        },
        {
          "icon": "🔧",
          "title": "成本来自评估",
          "desc": "复杂代理任务的评估器可能主导总花费。"
        },
        {
          "icon": "✨",
          "title": "领域知识仍重要",
          "desc": "好 SI 需要知道哪些诊断真正可行动。"
        }
      ]
    },
    {
      kind: "chapter",
      "id": "chap-10",
      "title": "六域结果与诚实结论",
      "badge": "both",
      "badgeLabel": "推理 + 训练",
      "bridge": "最后读结果。请始终把数值与<b>模型、硬件、数据划分、基线和指标方向</b>放在一起，而不是寻找一个跨域总冠军。",
      "analogy": {
        "title": "同一赛道，先看计分规则",
        "text": "89.5%、40.2% 和 2.63598 都很亮眼，但来自不同任务、基线与指标，不能混成一个总效果量。",
        componentId: "paper-plane-lab"
      },
      "modules": [
        {
          kind: "module",
          "id": "10.1",
          "title": "选择指标，再开始验证赛",
          "desc": "先选一个结果协议，再启动比较。每次只在兼容尺度上运动，精确数值与适用边界始终保留。",
          componentId: "paper-plane-lab"
        }
      ],
      "formula": {
        "lead": "CUDA 图中的 Fastₚ(s) 统计达到某个加速阈值的任务比例。",
        "unicode": "Fastₚ(s) = |{ i : speedupᵢ ≥ s }| / p",
        "symbols": [
          {
            "sym": "Fastₚ",
            "desc": "在固定阈值与硬件下达到要求的任务比例。"
          },
          {
            "sym": "s",
            "desc": "相对 PyTorch 的加速阈值。"
          },
          {
            "sym": "p",
            "desc": "经过正确性检查的评估任务数。"
          },
          {
            "sym": "speedupᵢ",
            "desc": "任务 i 相对 PyTorch 基线的速度比。"
          }
        ]
      },
      "takeaways": [
        {
          "icon": "🎯",
          "title": "广度是贡献",
          "desc": "一个 API 覆盖六个主要领域与三种模式。"
        },
        {
          "icon": "🔧",
          "title": "协议不可省",
          "desc": "数值必须与模型、硬件、基线和指标方向一起读。"
        },
        {
          "icon": "✨",
          "title": "通用不等于无条件",
          "desc": "文本代理、成本、相关性与 SI 质量仍决定成败。"
        }
      ]
    }
  ],
  "bilibili": [
    {
      bvid: "BV1zkzRBSE4X",
      "title": "工作流 Agent 多 Prompt 联合优化（1）GEPA：超越 GRPO，让 Prompt 像基因一样进化",
      "reason": "直接讲解论文默认后端 GEPA；播放量较低，但与核心算法最直接相关。",
      "cover": "https://i2.hdslb.com/bfs/archive/70e1ba7a0950121bc341181ce2caf125550f5aed.jpg",
      "views": "1103播放"
    },
    {
      bvid: "BV1QbWEzUEH7",
      "title": "别再收藏提示词了！掌握这个循环，让 AI 为你打造完美提示词",
      "reason": "用直观案例展示测试、诊断、迭代的提示词优化循环。",
      "cover": "https://i2.hdslb.com/bfs/archive/6db24246fa1fcbf432879e0e7ce5dddb8eedba9f.jpg",
      "views": "1.4万播放"
    },
    {
      bvid: "BV1ov4y1H7GK",
      "title": "ChatGPT 提示词工程师教程",
      "reason": "补足提示词工程和迭代改写的基础背景。",
      "cover": "https://i1.hdslb.com/bfs/archive/e003ea9d7899a1d6768044ac8b76919a4e9fd0cc.png",
      "views": "46.1万播放"
    },
    {
      bvid: "BV1NHmsBwEbT",
      "title": "15分钟从 Prompt Engineering 到 Agent！",
      "reason": "把提示词、Agent 和系统增强技术放进同一张概念地图。",
      "cover": "https://i2.hdslb.com/bfs/archive/495022df07137146d00e3ac2ba60868553fa4efe.jpg",
      "views": "1.8万播放"
    }
  ]
};
