import type { TutorialData } from '../types';

export const tutorial: TutorialData = {
  meta: {
    titleEn: "Sapiens2",
    titleZh: "Sapiens2：从人体视觉的细节缺口到语义与 4K 协同",
    venue: "ICLR 2026",
    authors: "Rawal Khirodkar, He Wen, Julieta Martinez, Yuan Dong, Su Zhaoen, Shunsuke Saito",
    affiliation: "Meta Reality Labs",
    domain: "人类中心视觉｜自监督预训练｜高分辨率密集预测",
    coreProblem: "上一代的高分辨率 MAE 路线擅长保留外观，但人体密集理解还需要稳定的跨视图语义，以及能承受 4K token 数量的上下文计算。",
    coreInsight: "Sapiens2 不是单纯把 Sapiens 做大：它联合掩码重建与学生—教师对比自蒸馏，扩展 Humans-1B，并用分层注意力把高分辨率上下文推向 4K。",
    keywords: [
      "掩码重建",
      "对比自蒸馏",
      "4K视觉Transformer"
    ]
  },
  hero: {
    oldMethod: {
      desc: "<strong>前代 Sapiens：</strong>在 Humans-300M 上以高分辨率 MAE 为核心，建立人类中心密集预测 backbone。",
      componentId: "portrait-hero"
    },
    newMethod: {
      desc: "<strong>Sapiens2：</strong>联合 MAE 与自蒸馏对比学习，使用 Humans-1B；原生 1K，并提供层次化 4K 变体。",
      componentId: "portrait-hero"
    }
  },
  chapters: [
    {
      kind: "chapter",
      id: "chap-1",
      title: "为什么需要 Sapiens2：把前代缺口连到新设计",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge: "先建立对照：Sapiens 已证明人类中心、高分辨率 MAE 很强；Sapiens2 则试图补上跨视图语义与更大尺度上下文这两块拼图。",
      analogy: {
        title: "一只眼睛，两种要求",
        text: "橡皮只擦一处红色污点。擦得太粗，眼睛轮廓会消失；只看大概，又会漏掉睫毛。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "1.1",
          title: "按三个维度比较两代模型",
          desc: "依次切换预训练信号、数据与分辨率。<strong>左侧是前代路线，右侧是 Sapiens2 的系统升级。</strong>动画用于解释设计关系；图中不是性能刻度。",
          componentId: "sapiens-comparison",
          figure: "/images/sapiens-evolution.png"
        },
        {
          kind: "module",
          id: "1.2",
          title: "从问题缺口走到设计回应",
          desc: "点击每一项挑战，沿着 <strong>旧问题 → Sapiens2 的回应</strong> 阅读。这里解释作者的设计动机，不把它误读为每个模块已被单独验证的因果结论。",
          componentId: "why-sapiens2"
        }
      ],
      insight: "关键阅读法：Sapiens2 同时更换了目标、数据、模型规模、架构与部分任务配置。结果能支持“完整系统更强”，却不能只凭总分数分离每一项升级的独立贡献。",
      takeaways: [
        {
          icon: "🎯",
          title: "前代基础",
          desc: "Sapiens 的 Humans-300M、原生 1K 与 MAE 路线奠定人类中心 backbone。"
        },
        {
          icon: "🔧",
          title: "新一代动机",
          desc: "Sapiens2 要同时保留高保真外观与跨视图人体语义，并把上下文扩到 4K。"
        },
        {
          icon: "✨",
          title: "保留证据边界",
          desc: "这是特定人体视觉系统的设计与结果，不是对所有视觉任务的普遍因果定律。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-2",
      title: "一十亿张人像从哪里来",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge: "Sapiens2 把前代 Humans-300M 扩展为 Humans-1B。数据不是背景数字：它与训练目标、模型规模一起构成完整系统的一部分。",
      analogy: {
        title: "挑一块能看清的参考",
        text: "放大镜在一张肖像纸上移动，只框住清晰、人物突出的区域。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "2.1",
          title: "拖动筛选框",
          desc: "在清晰人物、文字遮挡和人物过小之间选择。筛选条件服务于高质量人类中心预训练，不等同于下游任务标签；它也不能替代对数据规模独立贡献的对照实验。",
          componentId: "portrait-lab"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "候选不是训练集",
          desc: "论文从约 40 亿候选中构建约 10 亿高质量人类图像；前代对照为 Humans-300M。"
        },
        {
          icon: "🔧",
          title: "质量与平衡",
          desc: "过滤、去重、聚类和选择性采样共同塑造训练分布。"
        },
        {
          icon: "✨",
          title: "适用范围",
          desc: "阅读结果时须记住：论文没有用同训练预算的 300M vs 1B 完整因子对照来隔离数据量贡献。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-3",
      title: "为什么两种目标要一起学",
      badge: "inf",
      badgeLabel: "推理基础",
      bridge: "数据准备好后，核心问题回到表示本身：怎样既把图像锚在像素细节上，又让不同视角的语义对齐？这正是前代纯 MAE 路线希望补强的地方。",
      analogy: {
        title: "对齐两张参考线",
        text: "铅笔只对齐一个轮廓目标：不忘纸上的线，也让不同参考视角指向同一人物。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "3.1",
          title: "三种学习视角",
          desc: "切换只重建、只对比和联合，查看外观细节与跨视图语义怎样被同时呈现。该交互是概念模型，不是论文给出的逐模块性能消融。",
          componentId: "portrait-lab"
        }
      ],
      formula: {
        lead: "两种约束写在同一个训练目标里。",
        unicode: "L = Lₘₐₑ + λL꜀ₗ",
        symbols: [
          {
            sym: "Lₘₐₑ",
            desc: "掩码重建损失"
          },
          {
            sym: "L꜀ₗ",
            desc: "跨视图对比损失"
          },
          {
            sym: "λ",
            desc: "两项之间的相对权重"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "两项职责不同",
          desc: "重建锚定外观，对比整理跨视图语义。"
        },
        {
          icon: "🔧",
          title: "联合训练",
          desc: "论文把它们写成一个总损失。"
        },
        {
          icon: "✨",
          title: "不要跳过协议",
          desc: "具体收益须回到论文的任务、评测设置与完整系统证据。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-4",
      title: "掩码重建怎样守住细节",
      badge: "both",
      badgeLabel: "推理与训练",
      bridge: "联合目标的第一项是掩码重建。现在沿着一个被遮住的 patch，看看误差究竟在哪里计算。",
      analogy: {
        title: "补回被遮住的一笔",
        text: "纸条挡住一小段睫毛，铅笔根据周围轮廓补回它。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "4.1",
          title: "走过掩码集合",
          desc: "用上一步和下一步依次查看可见 token、mask token、decoder 重建，以及只在 M 上计误差。",
          componentId: "portrait-lab"
        }
      ],
      formula: {
        lead: "论文把归一化目标与重建输出的误差只在被遮住的位置平均。",
        unicode: "Lₘₐₑ = (1/V)Σᵢ(1/|Mᵢ|)Σₚ∈Mᵢ ||x̃ᵢᵖ − x̂ᵢᵖ||²",
        symbols: [
          {
            sym: "Mᵢ",
            desc: "第 i 个视图中被遮住的 token 集合"
          },
          {
            sym: "x̃",
            desc: "归一化目标 patch"
          },
          {
            sym: "x̂",
            desc: "decoder 重建 patch"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "误差看 M",
          desc: "重建误差在被遮住 token 集合上平均。"
        },
        {
          icon: "🔧",
          title: "先编码可见部分",
          desc: "mask token 在完整序列中补位，再交给 decoder。"
        },
        {
          icon: "✨",
          title: "守住细节",
          desc: "这一项解释像素与纹理保真的来源。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-5",
      title: "学生和教师怎样对齐语义",
      badge: "both",
      badgeLabel: "推理与训练",
      bridge: "重建把表示拉回图像细节；对比自蒸馏则让同一人物的不同视角在全局表征上相遇。",
      analogy: {
        title: "把参考卡对准姿势",
        text: "同一张人像换了角度，参考卡仍指向同一个姿势要点。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "5.1",
          title: "选择视图对",
          desc: "选择论文允许的 global-global 或 global-local 对；local-local 会明确提示为未进入该正对集合。",
          componentId: "portrait-lab"
        }
      ],
      formula: {
        lead: "教师分布 q 以交叉熵监督学生分布 p。",
        unicode: "L꜀ₗ = (1/|S|)Σ₍ᵢ,ⱼ₎∈S H(qⱼ,pᵢ)，H(q,p)=−Σₖqₖlog pₖ",
        symbols: [
          {
            sym: "S",
            desc: "论文定义的跨视图正样本对集合"
          },
          {
            sym: "q",
            desc: "EMA 教师的 softmax 分布"
          },
          {
            sym: "p",
            desc: "学生的 softmax 分布"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "EMA 教师",
          desc: "教师参数是学生参数的指数滑动平均。"
        },
        {
          icon: "🔧",
          title: "跨视图对齐",
          desc: "论文使用 global-global 和 global-local 配对。"
        },
        {
          icon: "✨",
          title: "全局语义",
          desc: "对比项不等于逐像素重建，它约束的是表征分布。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-6",
      title: "λ 不是一个魔法旋钮",
      badge: "both",
      badgeLabel: "推理与训练",
      bridge: "两项都在总损失中出现，但权重符号不应被误读成脱离数据和训练配置的万能答案。",
      analogy: {
        title: "调一笔的轻重",
        text: "笔压改变一条线的存在感，它类比两项目标的相对强调，而不是论文公布的固定处方。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "6.1",
          title: "选择强调方向",
          desc: "切换更重重建、并重和更重对比，阅读 λ 在方程里的相对作用。控件只作概念演示。",
          componentId: "portrait-lab"
        }
      ],
      formula: {
        lead: "λ 改变两个写入同一总损失的项的相对强调。",
        unicode: "L = Lₘₐₑ + λL꜀ₗ",
        symbols: [
          {
            sym: "λ",
            desc: "对 L꜀ₗ 的相对权重；该论文段落未给出可外推的通用最优值"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "权衡符号",
          desc: "λ 表达两类约束的相对权重。"
        },
        {
          icon: "🔧",
          title: "不伪造最佳值",
          desc: "教程不把机制演示误写成论文的最优超参数。"
        },
        {
          icon: "✨",
          title: "回到条件",
          desc: "论文主文用 λ 表示相对强调；阅读实现或附录时，应把完整损失与训练配置一并核对。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-7",
      title: "高分辨率让哪些细节可见",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "视觉 token 越密，细微边界越可能被表达；但更多 token 也带来更大的计算负担。以 4096×3072、patch=16 为例，网格将产生 49,152 个 token。",
      analogy: {
        title: "放大一根发丝",
        text: "放大镜沿着一根发丝移动，说明更密的视觉 token 能保留更细的轮廓。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "7.1",
          title: "切换观察尺度",
          desc: "按步骤从概览到 1K 再到 4K，观察 token 网格与人像边界的关系。",
          componentId: "portrait-lab"
        }
      ],
      formula: {
        lead: "给定高度、宽度和 patch 大小，token 数由网格大小决定。",
        unicode: "N = (H/p)(W/p)",
        symbols: [
          {
            sym: "H,W",
            desc: "输入图像高度与宽度"
          },
          {
            sym: "p",
            desc: "patch 大小"
          },
          {
            sym: "N",
            desc: "生成的视觉 token 数"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "尺度改变 token 数",
          desc: "图像分辨率是视觉计算量的重要来源。"
        },
        {
          icon: "🔧",
          title: "细节有成本",
          desc: "若把所有 token 直接做全局注意力，计算会随 N² 增长；更高分辨率不是免费提升。"
        },
        {
          icon: "✨",
          title: "引出架构",
          desc: "下一章解释 4K 如何组织局部和全局计算。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-8",
      title: "4K 如何先看局部再看整体",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "4K 的关键不是把 49,152 个 token 一次性全局相连，而是先局部处理，再压缩，再聚合长程上下文。",
      analogy: {
        title: "先看局部，再看全脸",
        text: "放大镜只扫描一个局部区域，目标却是把细节接回整张肖像。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "8.1",
          title: "点击三段注意力路线",
          desc: "点击 Win-SA、CLS 引导池化或 Global-SA，观察局部 token、压缩表示和全局上下文怎样交接。它解释 <strong>先局部、再压缩、后全局</strong> 的计算故事。",
          componentId: "attention-story",
          figure: "/images/hierarchical-attention.png"
        },
        {
          kind: "module",
          id: "8.2",
          title: "把算力问题与视觉收益分开读",
          desc: "分层注意力说明 4K <strong>如何可算</strong>；它本身不等于已经证明 4K 在所有任务上都有同等幅度的收益。请把视觉案例、任务指标与计算成本分开判断。",
          componentId: "attention-story"
        }
      ],
      formula: {
        lead: "池化后，后续全局注意力面对的是缩短的序列。",
        unicode: "N → N/ω",
        symbols: [
          {
            sym: "N",
            desc: "池化前的 token 数"
          },
          {
            sym: "ω",
            desc: "CLS 引导池化的空间步长"
          }
        ]
      },
      takeaways: [
        {
          icon: "🎯",
          title: "先局部",
          desc: "窗口注意力捕捉纹理和细边界。"
        },
        {
          icon: "🔧",
          title: "再压缩",
          desc: "CLS 引导池化缩短后续全局计算面对的序列；N/ω 是教学化的长度示意。"
        },
        {
          icon: "✨",
          title: "后全局",
          desc: "缩短后的序列再用全局注意力融合长程上下文；论文的完整成本收益仍须结合任务结果理解。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-9",
      title: "同一个 backbone 怎样服务五类任务",
      badge: "trn",
      badgeLabel: "训练细节",
      bridge: "预训练 backbone 提供起点，但姿态、分割、点图、法线和反照率覆盖 2D 关键点、区域、几何与材质，仍各有不同的监督、输出和损失。",
      analogy: {
        title: "补上一种专用标记",
        text: "同一张底稿，换一支笔就能标注关节、边界或表面方向；底稿不自动等于最终答案。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "9.1",
          title: "选择任务头",
          desc: "切换五个任务头，查看输出类型和论文所述的监督来源。",
          componentId: "portrait-lab"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "共享 backbone",
          desc: "同一个 backbone 为五类任务提供起点，但不等于共享监督或共享评测。"
        },
        {
          icon: "🔧",
          title: "任务各有定义",
          desc: "点图、法线和反照率与姿态、分割的输出和数据不同。"
        },
        {
          icon: "✨",
          title: "按协议理解",
          desc: "每项后训练结果都需要对应其任务设定。"
        }
      ]
    },
    {
      kind: "chapter",
      id: "chap-10",
      title: "结果要连同协议和方向读",
      badge: "both",
      badgeLabel: "结果与边界",
      bridge: "最后一章不做“总分”。我们先区分冻结 backbone 的 dense probing 与任务后训练，再在同协议、同指标方向下阅读论文报告的数字。",
      analogy: {
        title: "为成稿落下画框",
        text: "画框只包住一张完成的肖像，提醒每项分数都属于自己的任务和测试协议。",
        componentId: "portrait-scene"
      },
      modules: [
        {
          kind: "module",
          id: "10.1",
          title: "切换两种证据层级",
          desc: "选择 <strong>Dense probing</strong> 或<strong>任务后训练</strong>。每张卡都保留指标方向和表格/测试协议，避免把不同实验混成一个总分。",
          componentId: "results-matrix"
        }
      ],
      takeaways: [
        {
          icon: "🎯",
          title: "方向不同",
          desc: "mAP、mIoU 越高越好；L2、MAE、角度误差越低越好。"
        },
        {
          icon: "🔧",
          title: "协议不同",
          desc: "dense probing 与完整后训练不是同一实验。"
        },
        {
          icon: "✨",
          title: "范围明确",
          desc: "论文证明完整 Sapiens2 系统很强；由于多项设计同时变化，不能把总结果外推成任一单模块的独立因果结论。"
        }
      ]
    }
  ]
};
