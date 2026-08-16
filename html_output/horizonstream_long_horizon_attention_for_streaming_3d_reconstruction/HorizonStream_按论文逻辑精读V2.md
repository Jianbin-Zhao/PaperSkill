# HorizonStream：按论文逻辑的完整精读 V2

论文：**HorizonStream: Long-Horizon Attention for Streaming 3D Reconstruction**  
arXiv：2605.23889v1，2026-05-22  
正文：https://arxiv.org/html/2605.23889  
项目主页：https://3dagentworld.github.io/horizonstream/  
官方代码：https://github.com/3DAgentWorld/HorizonStream

这份 V2 严格按照论文阅读顺序组织：

```text
Introduction
    -> 现在的问题是什么
Related Work
    -> 以前的方法分别怎么做、为什么还不够
Core Contributions
    -> HorizonStream 到底提出了什么
Pipeline
    -> 一帧数据完整经过哪些模块
Method
    -> 每个公式、变量、代码实现逐项拆解
Training and Inference
    -> 为什么 48 帧可以外推到 10K+
Experiments
    -> 做了哪些对比、消融和结论
Limitations and Future Work
    -> 论文没有解决什么
```

文中会区分：

- **论文事实**：来自论文正文、附录、官方项目页和公开代码；
- **直观解释**：为了让你真正理解公式而加入的类比，不是论文新增结论。

---

## 1. Introduction：论文首先发现了什么问题

### 1.1 任务背景：为什么流式三维重建重要

机器人、自动驾驶和具身智能系统都希望一边移动，一边从摄像头视频建立三维世界模型。系统不能先录完整段视频、再离线慢慢优化，而是要在第 \(t\) 帧到来时立刻给出估计：

\[
\hat{\mathbf T}_t\in SE(3),
\qquad
\hat D_t.
\]

其中：

- \(\hat{\mathbf T}_t\)：相机在世界中的位姿，包括旋转和平移；
- \(\hat D_t\)：当前 RGB 帧对应的稠密深度图。

再根据位姿和深度，可以把像素反投影成三维点，形成点云或场景重建。

这个任务同时具有三种约束：

1. **严格因果**：当前帧只能看当前和过去，不能看未来；
2. **有限内存**：视频可以有几千到几万帧，不能永远缓存所有 token；
3. **长期几何一致性**：早期看到的结构和尺度，不能因为视频变长就完全失效。

论文的核心不是让单帧深度更漂亮，而是解决第三个问题：**长时间运行后，整条相机轨迹和三维几何是否还稳定。**

### 1.2 离线方法为什么不能直接拿来用

离线 feed-forward 方法通常可以让整段视频或图像集合互相注意，因此容易得到很好的几何一致性；但它们往往：

- 访问未来帧；
- 在一个大窗口里做 full attention；
- 长度增加后显存和计算量快速增长；
- 不能满足机器人“来一帧处理一帧”的因果要求。

经典 SLAM/优化方法能够维护显式几何状态，但需要反复优化，吞吐量和实时性受限。HorizonStream 试图站在二者之间：保留 feed-forward Transformer 的速度，同时加入可控的长期状态。

### 1.3 论文真正的诊断：recency 不等于 geometric relevance

很多流式模型按“新旧”组织历史：最近的证据保留，久远的证据删除或压缩。但在三维重建中，**最近不一定最有用，久远也不一定已经过时**。

举例：

- 当前车旁边一辆正在移动的汽车，是最近看到的，但它不适合当作稳定场景结构；
- 1000 帧以前看到的建筑立面很久远，却可能是当前重新定位时最可靠的结构线索；
- 一个局部纹理的 2D-3D 对应关系可能只在几帧内有效；
- 全局尺度和道路/房间结构则需要跨越很多窗口保留。

所以历史证据不是一个“按时间排队的 token 列表”，而是多种有效寿命不同的几何线索。

### 1.4 现有设计造成的四种 pathological influence pattern

论文把“过去的证据如何影响当前输出”抽象成影响模式，并指出四类病态：

| 设计 | 影响模式 | 具体问题 |
|---|---|---|
| 滑动窗口 | hard-cutoff box kernel | 到窗口边界直接归零，可能过早丢掉有用历史 |
| 周期 refresh | blockwise discontinuity | 记忆突然被刷新，长程回访不连续 |
| 因果 Softmax/KV cache | spike-like attention sink | 某些早期 token 吸收异常注意力，造成 cache 污染 |
| 无门控递归 | heavy-tailed influence | 错误被长期保留，误差不断累积、状态饱和 |

论文 Figure 1 的核心作用，就是把这些方法画成不同的“历史影响曲线”，然后提出一个目标：

> 影响应该连续衰减、保持有界，而且不同几何通道拥有不同的衰减速度。

### 1.5 Introduction 中的三项贡献

论文贡献可以准确归纳为三点：

1. **提出几何证据影响核**：用一个统一的时空影响函数描述历史几何证据如何传播；
2. **提出核分解架构**：Geometric Linear Attention 处理跨窗口、多时间尺度传播，Geometric Local Attention 处理窗口内可靠三维匹配；
3. **提出 MRT 与相对位姿融合**：从长期几何状态读取尺度和刚体位姿，保持深度与轨迹的度量一致性。

论文报告：只用 48 帧训练样本，也能在超过 10,000 帧的流式序列上运行，持久状态相对于序列长度是常数级，时间复杂度近似线性。[论文摘要与 Introduction](https://arxiv.org/html/2605.23889)

---

## 2. Related Work：以前的方法分别怎么做

论文 Related Work 不是简单列引用，而是按“是否在线”和“如何处理长历史”分成两大类。

### 2.1 Offline feed-forward 3D reconstruction

代表方法包括：

- **DUSt3R、MASt3R**：从图像对预测稠密几何；
- **Spann3R、MonST3R**：把空间记忆扩展到图像序列；
- **VGGT**：用 geometry-aware Transformer 处理更一般的图像集合；
- **FastVGGT**：通过复用 attention map 降低推理内存；
- **VGGT-Long、LoGeR**：用 chunk 处理或累积权重扩展输入长度。

它们的共同问题是：通常在 chunk 内使用 full attention，chunk 之间主要靠拼接、累积或后处理连接，因此跨 chunk 的依赖不够连续，容易出现时间不连续或尺度不一致。

### 2.2 Online feed-forward 3D reconstruction

这一类方法满足因果流式输入，但每种方法对历史的处理不同：

| 方法 | 历史机制 | 长序列风险 |
|---|---|---|
| STream3R、StreamVGGT | causal mask + sliding window | 窗口外历史被硬丢弃 |
| CUT3R、TTT3R | persistent recurrent state | 状态污染、误差累积 |
| Point3R | spatial pointer memory | 依赖有限指针记忆 |
| InfiniteVGGT | KV cache pruning | 剪枝可能丢掉长期结构 |
| Lingbot-map | keyframe memory | 长序列出现位姿 jitter 和点云重叠 |
| LongStream | attention sink 诊断 + 周期 refresh | refresh 边界造成记忆不连续 |

论文并不是说这些工作“完全错误”。它们分别解决了在线化、缓存压缩或长序列问题，但没有同时提供：

1. 可靠的局部空间筛选；
2. 有界的跨窗口多时间尺度记忆；
3. 稳定的度量尺度读取。

### 2.3 HorizonStream 与 Related Work 的真正差异

HorizonStream 的差异不是“再加一个 cache”，而是把历史传播机制重新定义为：

\[
\text{空间可靠性}
\times
\text{时间寿命}
\quad+
\text{度量读取}.
\]

也就是说，论文从“保存多少 token”转向“每一类几何证据的影响曲线应该是什么样”。

---

## 3. Core Idea：论文提出的核心抽象

### 3.1 问题形式化

给定 RGB 流，模型在时刻 \(t\) 只能使用过去观察和一个有限状态，输出：

\[
\hat{\mathbf T}_{t},\qquad \hat D_t.
\]

论文定义 \(K(t,i)\)，表示在时间 \(i\) 看到的几何证据对时间 \(t\) 的影响。一个合格的 kernel 要解决三个问题：

1. 根据图像内容和相对三维布局筛选可靠局部对应；
2. 在有限状态里控制不同证据的传播寿命，避免无限累积；
3. 保持尺度和刚体位姿的一致性。

### 3.2 核分解

论文提出：

\[
K(t,i)=K_{\text{spatial}}(t,i)\cdot K_{\text{time}}(t,i).
\]

解释如下：

- \(K_{\text{spatial}}\)：证据在空间上是否可信，主要由 Local Attention 实现；
- \(K_{\text{time}}\)：证据还应保留多久，主要由 GLA 实现；
- MRT：从高保留的几何子空间读取尺度和刚体位姿。

这一公式不是网络里额外乘了一个简单的标量，而是论文用来组织架构设计的抽象：三个工程模块分别对应三个几何问题。

### 3.3 你可以用一句话记住三者分工

```text
Local：这条对应信不信？
Linear：这条证据记多久？
MRT：怎样用同一把尺读出位姿和深度？
```

---

## 4. Pipeline：一帧数据到底怎么流

论文 Figure 3 的完整逻辑是：

```text
RGB 流
  -> ViT-L patch features + pose tokens + MRT
  -> 当前窗口内的 frame blocks
  -> Geometric Local Attention：局部匹配和可靠性过滤
  -> global blocks / GLA：跨窗口更新固定状态 S_t
  -> MRT：从高 retention 几何状态读取尺度
  -> pose consensus + DPT depth head
  -> camera pose + dense depth + point cloud
  -> optional loop closure：回访修正和 pose graph
```

### 4.1 输入窗口和持久状态

当前系统同时看两类信息：

- 最近的局部窗口，配置中是 `window_size: 10`；
- 之前累积的 GLA 递归状态。

窗口用于精细匹配，状态用于保留跨窗口结构和尺度。窗口滑动时，当前帧加入，旧帧不一定全都保留为 token，而是通过状态更新影响后续。

### 4.2 Token 组成

每帧主要包含：

- 图像 patch tokens：来自 ViT-L / DINOv2 patch embedding；
- pose tokens：用于窗口内位姿共识；
- MRT：一个学习到的 metric readout token；
- 代码里还可能有 register token，具体由配置决定。

官方配置 `img_size=518`、`patch_size=14`、`embed_dim=1024`、`depth=24`、`num_heads=16`，输入经过 patch embedding 后进入 frame/global 两类 Transformer blocks。

### 4.3 Frame blocks 和 global blocks

源码 `Aggregator` 里把网络分成两类 block：

- **frame blocks**：同一帧/局部窗口内部的因果处理，保留局部空间和时间上下文；
- **global blocks**：将窗口内容和跨窗口持久状态结合。

论文称 global blocks 使用混合设计：在特定深度插入 GLA，其他位置仍可保留常规全局注意力逻辑。官方配置 `gla_serial_layers: [4, 11, 17, 23]`，表示 GLA 被放到这些全局层。

### 4.4 输出头

输出分为三条支路：

1. **Camera head**：从 pose tokens 预测位姿编码，源码中包含迭代 refinement；
2. **DPT depth head**：从四个中间层特征做多尺度融合，输出深度和 confidence；
3. **Metric readout head**：从 MRT/高保留状态读尺度，注入平移和深度。

因此“模型输出点云”并不是 Transformer 直接画出点云，而是：

```text
预测 pose + 预测 depth + 相机内参
        -> 像素反投影
        -> 世界坐标变换
        -> 拼接、过滤、保存点云
```

### 4.5 Loop Closure 的位置

Loop Closure 在主模型输出轨迹后运行，不是 GLA 的替代品：

```text
早期 DINOv2 特征
  -> 检索可能重访的帧对
  -> 重新送入网络估计局部几何修正
  -> 形成 loop constraints
  -> pose graph optimization
  -> loop_abs_pose.txt / loop point cloud
```

代码配置中能看到 `retrieval_top_k`、`min_frame_separation`、`pose_graph_backend: pypose` 等参数。官方 `infer.py` 默认运行 Loop Closure，也可以使用 `--no-loop` 关闭。

---

## 5. Method：逐个模块看懂公式

# 5.1 Geometric Linear Attention：长期时间因子

### 5.1.1 先从普通线性注意力开始

标准注意力可以理解为：当前 Query 去和历史 Key 做匹配，再按权重汇总 Value。线性注意力会把历史压缩成一个矩阵状态：

\[
S_t=\sum_{i=1}^{t}\phi(k_i)v_i^\top.
\]

当前 Query 通过：

\[
o_t=q_t^\top S_t
\]

读取历史。

它的优点是状态形状固定，不必保留全部历史 token；但它也有致命问题：如果每个新证据都直接加进去，旧错误不会自然离开。

### 5.1.2 加入时间衰减

论文先写一个折扣的几何状态估计目标：

\[
\mathcal J_t(S)
=\sum_{i=1}^{t}
\left(\prod_{j=i+1}^{t}\gamma_j\right)
\|S^\top k_i-v_i\|_2^2.
\]

这条式子逐项解释：

- 第 \(i\) 个历史证据是 \((k_i,v_i)\)；
- 当前状态用 \(S^\top k_i\) 去拟合它的 value；
- 误差是 \(\|S^\top k_i-v_i\|_2^2\)；
- 从 \(i\) 到 \(t\) 的所有 retention rate 相乘，决定它现在还剩多少权重。

如果 \(\gamma=1\)，历史永不衰减；如果 \(0<\gamma<1\)，旧证据的影响会逐步减小。

对应的时间 kernel 是：

\[
K_{\text{time}}(t,i)=\prod_{j=i+1}^{t}\gamma_j.
\]

### 5.1.3 递推形式

目标满足：

\[
\mathcal J_t(S)
=\gamma_t\mathcal J_{t-1}(S)
+\|S^\top k_t-v_t\|_2^2.
\]

所以状态可以递推更新，而不需要重新遍历所有历史：

\[
S_t=\gamma_tS_{t-1}+\phi(k_t)\tilde v_t^\top,
\]

输出是：

\[
o_t=q_t^\top S_t.

\]

直观解释：

1. 先把旧状态乘上 \(\gamma_t\)，让过时证据变淡；
2. 再把当前可靠证据写进去；
3. 当前 Query 从更新后的状态读取结果。

### 5.1.4 为什么必须是 channel-wise retention

如果 \(\gamma_t\) 是一个标量，所有几何信息共用同一寿命：要么全忘得快，要么全保留得慢。

论文改成：

\[
\boldsymbol\gamma_t
=\sigma(W_\gamma x_t+b_\gamma)
\in(0,1)^d,
\]

\[
S_t
=\operatorname{diag}(\boldsymbol\gamma_t)S_{t-1}
+\phi(k_t)\tilde v_t^\top.
\]

这里：

- \(d\)：状态的通道维度；
- \(\boldsymbol\gamma_t^{(c)}\)：第 \(c\) 个通道的保留率；
- `diag`：把每个通道的旧状态分别缩放；
- sigmoid：把保留率约束到 0 和 1 之间。

于是不同通道可以学出不同的寿命：

| \(\gamma\) | 可能承载的证据 | 直觉 |
|---|---|---|
| 低 | 瞬时局部对应 | 几帧后快速忘掉 |
| 中 | 运动模式、局部结构 | 保留一段中期上下文 |
| 高 | 场景结构、metric scale | 长时间保留 |

论文定义有效时间尺度：

\[
\tau^{(c)}=-\frac{1}{\log\bar\gamma^{(c)}}.
\]

若通道的保留率近似固定，则：

\[
K_{\text{time}}^{(c)}(t,i)
=\prod_{j=i+1}^{t}\gamma_j^{(c)}
\approx e^{-(t-i)/\tau^{(c)}}.
\]

当距离约为 \(3\tau\) 时，影响约降到 5%。这就是“连续寿命谱”，而不是一个硬窗口。

### 5.1.5 有界性：为什么不会无限累积

假设：

\[
\bar\gamma=\sup_{t,c}|\gamma_t^{(c)}|<1,
\quad
\|k_t\|\le B_k,
\quad
\|\tilde v_t\|\le B_v.
\]

论文附录给出：

\[
\|S_t\|_F
\le
\bar\gamma^t\|S_0\|_F
+\frac{B_kB_v}{1-\bar\gamma}.
\]

当 \(t\) 变大时，初始状态影响消失，状态范数仍然有上界。

这解决的是“状态无界累积”问题，不等于“预测结果永远零漂移”。有界状态仍然可能保存了错误内容，或者因为容量不足丢掉细节。

### 5.1.6 和 TTT 的关系

论文把 GLA 解释成带折扣的在线学习。对应目标：

\[
\mathcal J_t(S)
=\gamma_t\mathcal J_{t-1}(S)
+\|S^\top k_t-v_t\|_2^2.
\]

它与 Test-Time Training 的相似点是：状态会根据新到来的证据不断更新；不同点是：HorizonStream 不在每一帧显式做昂贵的梯度下降，而是用线性注意力形式维护固定状态。

论文 Table 6 还做了 `replace with TTT-like fast weight` 的消融，说明“有在线更新”不等于“任意在线更新都能达到 GLA 的效果”。

### 5.1.7 GLA 在代码里对应什么

官方配置：

```yaml
enable_metric_readout_token: true
global_attn_arch: gla
gla_serial_layers: [4, 11, 17, 23]
gla_use_short_conv: true
gla_conv_size: 4
window_size: 10
sliding_size: 21
```

代码对应关系：

- `horizonstream/runtime/layers/attention.py`
  - `LinearAttention`：普通 feature-map linear attention；
  - `GLAAttention`：调用 `flash-linear-attention` 中的 `KimiDeltaAttention` 实现 GLA 路径；
- `horizonstream/runtime/models/horizonstream.py`
  - `GLACache`：保存每层的 recurrent state / conv state；
  - `HorizonStreamAggregator`：把 GLA block 插入 global blocks；
  - `_run_gla_global_block()`：将 patch token、pose token 送进 GLA；
- `configs/horizonstream_infer.yaml`
  - 指定 GLA 层、短卷积、状态和窗口参数。

理论公式写成 \(\operatorname{diag}(\gamma)S\)，而公开实现把底层递归更新交给高效的 `KimiDeltaAttention` kernel。阅读代码时不要期待直接看到一个名为 `gamma` 的 Python for-loop；论文中的数学对象和工程库中的 fused kernel 是两种表示。

---

# 5.2 Geometric Local Attention：短程空间因子

### 5.2.1 它解决的问题

GLA 能够保存跨窗口的压缩证据，但它不负责当前窗口内的精细 3D 对应。Local Attention 解决：

> 当前窗口里，哪些匹配是可靠的，哪些应该在写入长期状态前被压低？

例如：

- 墙角、路牌边缘和静态建筑通常是稳定匹配；
- 汽车、行人和树叶可能运动；
- 重复窗户和纯色墙面容易误匹配；
- 某些早期 token 可能形成 attention sink。

### 5.2.2 Head-wise reliability gate

论文给每个注意力 head 一个可靠性门：

\[
g_h=\sigma(W_g\bar x+b_g),
\]

\[
\tilde y_h=g_h\cdot y_h.
\]

变量含义：

- \(\bar x\)：窗口特征的 mean-pooled summary；
- \(y_h\)：第 \(h\) 个 head 的注意力输出；
- \(g_h\)：当前 head 的可信程度；
- \(\tilde y_h\)：门控后的输出。

为什么是 head-wise？不同 head 可以学习不同匹配模式。某一个 head 被动态物体干扰时，只压低它，不需要把整个窗口的所有证据都清零。

源码中 `MemEffAttention` 支持：

```python
if self.gate_attn == "headwise":
    x_pooled = x.mean(dim=1)
    gate = torch.sigmoid(self.gate_proj(x_pooled))
```

然后将 `x = x * gate`。官方配置使用 `gate_attn: headwise`。

### 5.2.3 Spatiotemporal RoPE

纯二维位置编码只处理 patch 的：

\[
(y,x).
\]

视频中的 patch 还需要时间位置，所以论文使用：

\[
\pi=(t,y,x).
\]

Query 和 Key 的通道分为三部分，分别沿时间、高度、宽度轴旋转。这样注意力更像在比较相对时空位移，而不是只比较 token 的绝对编号。

论文的具体设置：

- patch 位置从 \((t+1,y+1,x+1)\) 开始；
- 时间索引周期性重置，避免无限长序列的位置编号不断变大；
- MRT 和 pose token 的位置设为 \((0,0,0)\)，让它们关注相对几何。

代码对应：

- `horizonstream/runtime/layers/rope.py` 的 `RotaryPositionEmbedding3D`；
- 它把 token 通道分成三个部分，分别调用 `_apply_1d_rope`；
- `PositionGetter3D` 生成 `(t,y,x)` 网格坐标；
- `horizonstream/runtime/models/aggregator.py` 在构造 `pos_patch` 和全零 `pose_pos`。

### 5.2.4 Local 为什么不是“一个普通局部注意力窗口”

普通局部窗口只回答“附近 token 谁和谁相似”。Geometric Local Attention 还强调：

1. 结合图像内容；
2. 结合相对三维布局；
3. 用 head gate 抑制不可靠输出；
4. 用时空 RoPE 让时间和空间位置共同参与。

因此它实现的是 \(K_{\text{spatial}}\)，不是单纯为了降低计算量。

### 5.2.5 Local 消融怎么解释

vKITTI2 Table 6：

| 版本 | 80 帧 | 200 帧 | 1000 帧 |
|---|---:|---:|---:|
| Full | 0.42 | 0.71 | 1.20 |
| 去掉 Geometric Local Attention | 0.78 | 2.64 | 7.46 |
| 去掉 head-wise output gating | 0.61 | 1.74 | 4.06 |
| 去掉 Geometric RoPE，只保留 2D spatial | 0.64 | 1.22 | 2.58 |

这说明三件事：

- 细粒度局部对应本身不可替代；
- head gate 对抑制噪声有贡献；
- 时间维度的 RoPE 不是装饰，而是长序列几何匹配的一部分；
- 1000 帧时错误局部匹配会通过长期状态被放大，所以差距最大。

---

# 5.3 MRT、相对位姿融合和深度头

### 5.3.1 为什么单纯链式位姿会漂

最朴素的轨迹更新是：

\[
T_t=T_{t-1}\Delta T_t.
\]

如果每个 \(\Delta T_t\) 都有一点误差，这些误差会沿着长序列不断复合。即使方向总体正确，也可能出现：

- 平移尺度逐渐偏大或偏小；
- 相机轨迹 jitter；
- 点云重复、错位或重叠；
- 深度和位姿的单位不一致。

### 5.3.2 MRT 读取度量尺度

每帧有一个学习到的 metric token：

\[
\mathbf z^{metric}.
\]

scale head 输出正尺度：

\[
\hat s=\exp(g(\mathbf z^{metric})).
\]

然后：

\[
\hat{\mathbf t}=\hat s\hat{\mathbf t}^{raw},
\qquad
\hat D=\hat s\hat D^{raw}.
\]

这里最重要的是同一个 \(\hat s\) 同时作用于平移和深度。可以把 MRT 理解为：

> 它从长期高保留几何中拿出一把“当前帧应该使用的尺子”。

注意：MRT 不是凭空读取绝对世界坐标，它只能从已有的几何证据和训练到的度量规律中估计尺度。

### 5.3.3 Relative pose fusion

窗口内多个 pose token 被一个轻量 Transformer head 联合处理，估计当前帧相对于窗口上下文的共识位姿。

对比：

```text
单帧链式：当前只相信上一帧 -> 误差滚雪球
窗口融合：当前同时参考多个 pose token -> 减轻单帧噪声
```

这不是全局 bundle adjustment，而是一个在局部窗口内完成的 learned consensus。

### 5.3.4 深度输出

论文使用 DPT 风格的多尺度 depth head：

- 从四个中间层抽取特征；
- 多尺度融合；
- 输出深度和 confidence；
- 注入 MRT 的 scale 信息。

源码配置：

```yaml
dpt_decoder_cfg:
  dim_in: 2048
  output_dim: 2
  activation: exp
  conf_activation: expp1
  intermediate_layer_idx: [4, 11, 17, 23]
```

`output_dim: 2` 可以理解为深度和置信度两类输出，具体后处理见 `horizonstream/core/infer.py` 和 `horizonstream/utils/depth.py`。

### 5.3.5 MRT 消融

Table 6 中去掉 MRT：

```text
80 帧：0.55
200 帧：1.32
1000 帧：3.34
```

这说明 MRT 对长序列尺度和位姿稳定性有实质作用，但它并不是唯一的长期记忆模块；去掉 GLA 或 Local 的影响更大，因为它们分别负责跨窗口传播和局部可靠性。

---

# 5.4 完整 Architecture：backbone 如何把模块组合起来

论文的 backbone 是 ViT-L，初始化来自 VGGT 和 DINOv2。每帧由 patch tokens、pose tokens 和 MRT 组成。

网络交替使用：

```text
frame blocks：帧内/局部窗口处理
global blocks：跨帧、跨窗口处理
```

global blocks 在指定深度插入 GLA，Local Attention 负责窗口内密集跟踪，GLA 负责持久状态更新。这样做的意义是：

- 不让每一层都承担长期递归成本；
- 在若干深度注入长期几何；
- 保留 Transformer 的逐层特征抽象；
- 让局部和长期路径在多个层级互动。

源码对应：

- `horizonstream/runtime/models/aggregator.py`：构建 frame/global blocks、patch/camera/register token；
- `horizonstream/runtime/models/horizonstream.py`：根据 `global_attn_arch=gla` 创建 GLA blocks；
- `horizonstream/runtime/layers/block.py`：Transformer block 组合 LayerNorm、attention、MLP；
- `horizonstream/runtime/heads/camera_head.py`：pose token 的迭代 refinement；
- `horizonstream/runtime/heads/dpt_head.py` 或对应 DPT 模块：深度解码。

---

## 6. Training：训练目标和推理流程

### 6.1 训练损失

论文的总损失：

\[
\mathcal L
=\lambda_{pose}\mathcal L_{pose}
+\lambda_{depth}\mathcal L_{depth}
+\lambda_{scale}\mathcal L_{scale}.
\]

- `pose loss`：约束相机位姿；
- `depth loss`：约束稠密深度，论文说明使用带 confidence weighting 的 SmoothL1；
- `scale loss`：只在有真实 metric scale 的样本上使用。

平移和深度会依据几何尺度因子进行归一化，避免网络把尺度误差和几何形状误差混为一谈。

### 6.2 训练配置

论文附录报告：

- 48 帧训练 batch；
- 两阶段训练，第一阶段 64 张 A800、60,000 iterations；
- 第二阶段 64 张 H20、40,000 iterations；
- AdamW，学习率 \(2\times10^{-5}\)；
- cosine decay，2,000 steps warm-up；
- 24 个数据集；
- 时间 stride 1–8；
- chunk 内随机帧排列概率 0.2；
- 输入尺寸 518，patch size 14，ViT-L embed dim 1024。

### 6.3 48 帧为什么可以推理 10K+

模型学习的不是“这 48 帧的内容”，而是一个可重复的状态转移：

\[
S_t=F(S_{t-1},x_t).
\]

只要状态形状与总长度无关，就可以不断执行：

\[
S_{48}\to S_{49}\to\cdots\to S_{10000}.
\]

GLA 的 retention 负责让旧证据衰减，长期通道负责让结构和尺度继续存在，所以模型能够进行长度外推。

这是一种由结构归纳偏置带来的实验泛化，不是说任何 48 帧训练模型都天然能处理一万帧。

### 6.4 代码中的 chunk 和 cache

官方配置：

```yaml
window_size: 10
sliding_size: 21
frames_chunk_size: 1
use_chunkwise_checkpoint: true
```

源码 `horizonstream/core/infer.py` 中，`_chunk_schedule()` 把长视频切成初始窗口和后续 sliding chunks；`HorizonStreamAggregator.forward()` 接收：

- frame KV caches；
- global KV caches；
- `gla_cache`；
- 当前 chunk 的 `chunk_idx`；
- `window_size` 和 `rope_frame_start`。

`GLACache.advance(is_last_chunk=...)` 会把当前 chunk 的 state 交给下一个 chunk，而不是把所有历史 token 重新拼回 Transformer。

---

## 7. Experiments：做了哪些比较和消融

## 7.1 实验设置

论文评测：

- KITTI；
- vKITTI2；
- Oxford Spires；
- ScanNet++；
- TUM RGB-D；
- Waymo；
- VBR；
- ETH3D；
- 7Scenes。

序列按完整长度评测，不用短片段替代长序列。vKITTI2、7Scenes、Waymo 有训练数据来源，但 Waymo 测试片段来自未见过的 segment，其他数据集用于跨域泛化分析。

对比方法分三组：

1. **优化型**：COLMAP、DPVO、DROID-SLAM、MASt3R-SLAM、VGGT-SLAM；
2. **离线 feed-forward**：VGGT-Long、FastVGGT、LoGeR、Pi3-Chunk；
3. **在线 feed-forward**：CUT3R、TTT3R、STream3R、StreamVGGT、InfiniteVGGT、LongStream、Lingbot-map。

### 7.2 Camera trajectory：KITTI Table 1

ATE 越低越好。HorizonStream 在 11 条完整 KITTI 序列上的平均 ATE：

```text
HorizonStream       19.75
HorizonStream + LC  16.44
Lingbot-map         25.29
LongStream          51.90
STream3R            227.77
TTT3R w/o refresh   177.73
TTT3R w/ refresh     72.86
```

这里的关键不是“所有方法都一定失败”，而是：

- 只看局部窗口的方法在长序列上容易忘掉有用历史；
- 无 refresh 的循环状态容易污染；
- refresh 可以缓解但会造成记忆不连续；
- HorizonStream 不依赖周期性清空，而是持续折扣旧证据。

### 7.3 Cross-dataset：Table 2

示例结果：

| 方法 | vKITTI2 | KITTI | Oxford | ScanNet++ | TUM | Waymo | FPS |
|---|---:|---:|---:|---:|---:|---:|---:|
| HorizonStream | 0.94 | 19.75 | 9.38 | 0.40 | 0.04 | 0.46 | 13.20 |
| HorizonStream + LC | 0.94 | 16.44 | 8.71 | 0.40 | 0.04 | 0.46 | 10.45 |

Loop Closure 主要帮助长轨迹、回访场景；代价是速度下降。

### 7.4 VBR 超长序列：Table 3

VBR 序列为 8,815–18,846 帧，最长约 5.20 km：

| 方法 | 平均 ATE |
|---|---:|
| LongStream | 77.93 |
| Lingbot-map | 27.53 |
| HorizonStream | 25.30 |
| HorizonStream + LC | 18.84 |

汇报时必须说完整：**18.84 是启用 Loop Closure 的结果，基础前向模型是 25.30。**

### 7.5 Dense reconstruction：Table 4

论文不只评估相机轨迹，还评估多视图重建：

- CD，Chamfer Distance，越低越好；
- F1，越高越好。

HorizonStream 在 ETH3D、Oxford Spires、7Scenes、TUM 的在线方法中取得较好的重建结果。论文解释，重建质量提升很大程度来自更稳定的位姿，而不是单独的点云后处理。

官方 Table 4 的 HorizonStream 行：

```text
ETH3D:          CD 0.32, F1 0.74
Oxford Spires:  CD 4.97, F1 0.89
7Scenes:        CD 2.98, F1 0.93
TUM:            CD 0.08, F1 0.95
```

注意不同数据集 F1 的阈值不同，不能把不同列的 F1 直接横向比较。

### 7.6 Dense depth：Table 5

KITTI 深度指标：

- Abs Rel 越低越好；
- \(\delta<1.25\) 越高越好。

HorizonStream：

```text
Abs Rel = 0.057
delta   = 94.8
```

论文结论是：它在在线方法中表现最好，并接近部分离线方法的深度质量。

### 7.7 组件消融：Table 6

这是证明方法设计的核心实验：

| Variant | 80 帧 | 200 帧 | 1000 帧 |
|---|---:|---:|---:|
| Full model | 0.42 | 0.71 | 1.20 |
| w/o Geometric Linear Attention | 0.83 | 2.06 | 5.38 |
| w/o channel-wise gating | 0.67 | 1.43 | 3.21 |
| replace with TTT-like fast weight | 0.58 | 1.56 | 3.96 |
| w/o Geometric Local Attention | 0.78 | 2.64 | 7.46 |
| w/o head-wise output gating | 0.61 | 1.74 | 4.06 |
| w/o Geometric RoPE, 2D only | 0.64 | 1.22 | 2.58 |
| w/o MRT | 0.55 | 1.32 | 3.34 |
| single-token pose, no aggregation | 0.51 | 1.10 | 2.67 |

逐项解释：

#### 去掉 GLA

1000 帧从 1.20 变成 5.38。说明短窗口局部匹配不能单独支撑长期结构和尺度，必须有跨窗口的有界传播。

#### 去掉 channel-wise gating

1000 帧变成 3.21。状态还在，但所有通道不再拥有灵活的记忆寿命，无法很好地区分短期对应和长期结构。

#### 用 TTT-like fast weight 替代

1000 帧变成 3.96。说明“在线更新”这个概念本身不够，GLA 的几何状态形式和通道 retention 很重要。

#### 去掉 Local

1000 帧变成 7.46，是这一组里最差的。错误局部对应更容易污染长期状态，说明长期记忆必须建立在可靠空间匹配之上。

#### 去掉 head-wise gate / Geometric RoPE

分别变成 4.06 和 2.58，说明局部可靠性门控和三维时空位置编码互补。

#### 去掉 MRT

1000 帧变成 3.34，说明尺度和位姿的显式读取不是可有可无。

#### single-token pose

1000 帧变成 2.67，说明窗口内 pose token 的共识融合比只依赖一个 token 更稳定。

### 7.8 Learned spectrum：Figure 6

论文还可视化每层学到的有效寿命 \(\tau=-1/\log\bar\gamma\)，并观察到：

- 不同通道形成连续的短到长谱；
- 不同层的谱分布不完全相同；
- 用固定时间频带替代学习到的 spectrum，会降低精度。

这验证了论文不是只需要“一个短记忆 + 一个长记忆”两个手工桶，而是需要可学习的多时间尺度分布。

### 7.9 资源曲线

官方项目页报告：

- 200 到 10,000+ 帧，核心持久状态显存近似平坦；
- 流式推理显存约 8.5 GB；
- A800 上约 13.2 FPS；
- 启用 Loop Closure 后速度下降。

准确表述应是：**持久递归状态相对于序列长度为 O(1)**。视频输出、点云、检索特征和可视化仍可能产生额外内存。

---

## 8. 局限与未来工作

### 8.1 固定状态有容量上限

GLA 让状态大小不随帧数增长，但这也意味着它不能无损保存所有历史细节。重复访问和视觉歧义下，细节可能被压缩掉。

未来可以做：

- O(1) 状态 + 稀疏关键帧检索；
- 只有出现重定位需要时才取回局部高分辨率证据；
- 按几何不确定性决定哪些内容进入长期记忆。

### 8.2 动态前景会污染局部几何

Local gate 能降低不可靠 head 的影响，但如果动态物体产生了强而一致的匹配，仍可能进入状态。

未来可以加入：

- 动静态分解；
- motion segmentation；
- uncertainty-aware write；
- 动态区域的时空一致性检测。

### 8.3 回环仍需要额外系统

Loop Closure 需要检索、重新推理和 pose graph，不是免费修正。对没有回环的场景，它甚至可能没有明显收益。

### 8.4 论文的“长序列稳定”不是绝对保证

它是在给定数据、训练和评测协议下成立的实证结论。不能外推成：

```text
任何相机、任何动态场景、任何长度、永远不漂移
```

最准确的说法是：HorizonStream 通过有界、多时间尺度传播，让误差增长更受控。

---

## 9. 代码综合理解：从命令到输出

### 9.1 推理入口

官方 README 的基本命令：

```bash
python infer.py \
  --config configs/horizonstream_infer.yaml \
  --video-path /path/to/input.mp4 \
  --checkpoint checkpoints/HorizonStream.pt \
  --output-root outputs_horizonstream/input_video
```

`infer.py` 负责：

1. 读取视频或图片序列；
2. 调用 `HorizonStreamModel`；
3. 按 chunk 推理；
4. 保存在线 pose、depth、confidence 和 RGB；
5. 可选运行 Loop Closure；
6. 将深度反投影并保存点云。

### 9.2 模型初始化

`horizonstream/core/model.py` 负责载入 checkpoint 和构造模型。内部包括：

```text
HorizonStreamModel
  -> HorizonStreamAggregator
      -> ViT-L patch embed
      -> frame blocks
      -> global blocks
      -> GLA serial blocks
      -> pose tokens / MRT
  -> camera head
  -> DPT depth head
  -> metric readout head
```

### 9.3 真正的 chunk 状态

`HorizonStreamAggregator.forward()` 同时接收：

- `frame_kv_caches`：局部 frame attention 的缓存；
- `global_kv_caches`：global attention 的缓存；
- `gla_cache`：GLA 的 recurrent state；
- `chunk_idx`：当前 chunk 序号；
- `rope_frame_start`：时间位置编码起点。

这能帮助你区分两种缓存：

- KV cache 仍可能保存窗口级 token；
- GLA cache 保存的是固定大小的递归几何状态。

论文说的长序列 O(1) 重点是后者，不应简单理解成代码中完全没有任何缓存。

### 9.4 输出文件

官方 README 的输出包括：

```text
poses/abs_pose.txt
poses/loop_abs_pose.txt
depth/dpt/
depth/conf/
points/full.ply
points/full_lc.ply
```

其中 `abs_pose.txt` 是在线前向轨迹，`loop_abs_pose.txt` 是 Loop Closure 后的轨迹；这正是为什么论文表格要区分 Ours 和 Ours w/ LC。

---

## 10. 你应该如何把论文真正讲明白

### 10.1 先用 Introduction 讲动机

不要开场就念 GLA。先说：

> 长序列在线重建的难点不是继续输出，而是历史证据的寿命不同。滑窗忘得太快，无门控状态忘得太慢，attention sink 会把注意力吸到错误 token。

### 10.2 Related Work 只讲三条线

不需要把所有论文都讲一遍，只要分三类：

1. 离线方法：精度高但看未来/成本高；
2. 滑窗在线方法：有限内存但硬截断；
3. 递归/缓存在线方法：能传长期信息但可能污染或刷新断裂。

然后自然引出 HorizonStream：

> 它不是再扩大 cache，而是学习每类几何证据的影响寿命。

### 10.3 Pipeline 要沿 Figure 3 指着讲

从左到右只讲一条数据流：

```text
RGB -> patch/pose/MRT -> Local -> GLA -> MRT/pose/depth -> 3D
```

每个模块只回答一个问题：

- Local：对应是否可靠；
- GLA：证据保留多久；
- MRT：尺度如何保持一致。

### 10.4 Method 必须讲出“为什么这样设计”

不能只说“使用 channel-wise gamma”。你要说：

> 如果统一 gamma，短期对应和长期尺度会一起忘；如果没有 gamma，错误会一直累积。因此作者把 gamma 做成向量，让不同通道拥有不同有效时间尺度，同时把最大 retention 限制在 1 以下保证状态有界。

### 10.5 实验必须回答三个问题

1. 全模型在不同数据集是否有效？
2. 长序列优势是否真实存在？
3. 每个设计是否真的必要？

对应实验：

- Table 1/2/3：跨方法和跨数据集；
- VBR、KITTI 全序列：长序列扩展性；
- Table 6、Figure 6：模块消融和 retention spectrum。

---

## 11. 老师可能追问

### Q1：为什么不能直接使用更大的窗口？

更大的窗口会增加内存和注意力成本，而且仍没有区分证据的寿命。HorizonStream 解决的是“什么该保留”，不是简单增加 token 数。

### Q2：GLA 和 GRU/LSTM 有什么区别？

二者都有门控，但 GLA 的状态是 key-value 几何证据的递推摘要，能够直接解释成线性注意力和 evidence influence kernel；它不是普通 RNN hidden state 的简单替换。

### Q3：为什么 Local 和 Linear 缺一不可？

Local 过滤空间噪声，Linear 控制时间寿命。没有 Local，错误会进入长期状态；没有 Linear，可靠的局部结构也无法跨窗口保留。

### Q4：48 帧训练到 10K+ 是否是理论保证？

不是。它来自论文给定数据和协议下的长度泛化实验。原因是状态更新规则不依赖总长度，可以重复使用，但分布外动态和视觉歧义仍可能失败。

### Q5：18.84 是什么结果？

VBR 上 HorizonStream + 可选 Loop Closure 的平均 ATE。基础模型是 25.30，不能混说。

### Q6：MRT 和 Loop Closure 哪个负责长期尺度？

MRT 是核心前向路径中在线读取长期尺度；Loop Closure 是额外的回访检索和全局轨迹优化。

### Q7：O(1) 是整个系统内存都恒定吗？

不是。它主要指持久递归几何状态相对于序列长度的大小。输出深度、点云、检索特征和可视化仍可能占额外内存。

### Q8：页面里自己画的 retention 动画是不是论文结果？

不是。它是机制示意。真实证据来自论文的 Figure 1、Figure 6、Table 1–6 和官方代码/配置。

---

## 12. 最终背诵版

```text
Introduction：长序列在线重建的问题不是输出不了，而是几何证据寿命不同。

Related Work：离线方法看未来，滑窗方法硬截断，递归/缓存方法会污染或刷新断裂。

Core：用 K(t,i)=K_spatial*K_time 分解空间可靠性和时间寿命。

Pipeline：RGB -> Local -> Linear -> MRT -> pose/depth/3D。

Local：head-wise gate + 3D RoPE，解决当前窗口“信不信”。

Linear：channel-wise gamma + bounded recurrent state，解决跨窗口“记多久”。

MRT：读取高保留几何中的尺度，统一校准平移和深度。

Experiments：48 帧训练、10K+ 推理；Table 6 证明每个模块在长序列上都重要。

Limitations：固定状态有容量边界，动态物体会污染，Loop Closure 是可选后处理。
```

最后一句：

> **HorizonStream 的关键不是记住更多，而是让不同几何证据以不同速度正确地遗忘。**

