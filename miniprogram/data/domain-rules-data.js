// 此文件由 scripts/generate-data-modules.mjs 根据同名 JSON 自动生成。
// 微信小程序运行时不能直接 require JSON，因此以 CommonJS 模块提供离线数据。
module.exports = {
  "career": {
    "id": "career",
    "name": "工作事业",
    "icon": "briefcase",
    "description": "梳理职业选择、工作环境、项目推进与资源准备。",
    "questionPrompt": "例如：我想换工作，但还没有验证新方向，下一步应先做什么？",
    "focusDimensions": [
      "readiness",
      "risk",
      "control",
      "clarity"
    ],
    "dimensionWeights": {
      "action": 0.16,
      "clarity": 0.17,
      "control": 0.14,
      "risk": 0.18,
      "relation": 0.08,
      "pressure": 0.12,
      "stage": 0.07,
      "readiness": 0.08
    },
    "conflicts": {
      "highActionLowReadiness": "行动意愿已经很强，但替代方案和现实准备仍不足。",
      "highRiskLowClarity": "事情影响较大，而关键事实尚未核实。",
      "lowControlHighPressure": "外部决定因素较多，当前压力却在推动你独自承担结果。",
      "highReadinessLowAction": "准备已较充分，但仍缺少一个明确的启动动作。",
      "default": "当前需要把目标、可用资源和下一次验证放在同一张清单上比较。"
    },
    "advantages": [
      "可以通过简历、作品、试投递、访谈或小规模尝试获得现实反馈。",
      "职业选择通常可以拆成准备、验证和决定三个阶段。",
      "明确现金与时间边界后，判断会更稳定。"
    ],
    "riskGuidance": [
      "不要在没有替代方案时，仅因短期情绪作不可逆决定。",
      "不要把一次积极或消极反馈当成完整的行业结论。",
      "涉及生计时，应优先核对现金缓冲、合同义务和退出成本。"
    ],
    "resultTone": "清晰、务实、强调验证与可逆步骤",
    "reconsiderSignals": [
      "获得真实投递、面试、试做或客户反馈后",
      "现金缓冲或家庭责任发生明显变化时",
      "当前环境持续影响基本生活或健康状态时"
    ]
  },
  "relationship": {
    "id": "relationship",
    "name": "感情关系",
    "icon": "heart",
    "description": "梳理期待、沟通、投入程度与个人边界。",
    "questionPrompt": "例如：对方最近联系减少，我该怎样确认彼此的期待？",
    "focusDimensions": [
      "relation",
      "clarity",
      "pressure",
      "control"
    ],
    "dimensionWeights": {
      "action": 0.1,
      "clarity": 0.17,
      "control": 0.13,
      "risk": 0.1,
      "relation": 0.22,
      "pressure": 0.15,
      "stage": 0.07,
      "readiness": 0.06
    },
    "conflicts": {
      "highPressureLowClarity": "情绪正在放大不确定感，但双方的真实想法还没有被清楚表达。",
      "highRelationLowControl": "这件事高度依赖对方，不能只靠增加自己的投入来解决。",
      "highActionHighPressure": "你很想马上得到答案，但连续推动可能压缩双方坦诚交流的空间。",
      "lowActionHighRelation": "关系对你很重要，但关键需求仍停留在猜测中。",
      "default": "当前需要区分自己的感受、对方的明确表达和可以观察到的实际行动。"
    },
    "advantages": [
      "一次具体、尊重边界的沟通可以减少反复猜测。",
      "观察持续行动比解读单次回复更可靠。",
      "你可以决定自己的投入边界和回应方式。"
    ],
    "riskGuidance": [
      "不要把沉默、延迟或单次情绪直接解释为确定态度。",
      "不要用连续追问、试探或牺牲自身边界换取短期回应。",
      "若出现控制、威胁或伤害，应优先离开危险处境并寻求现实支持。"
    ],
    "resultTone": "温和、尊重双方、强调事实和边界",
    "reconsiderSignals": [
      "完成一次明确沟通并观察到后续行动后",
      "双方对关系目标或边界给出清晰表达时",
      "互动持续造成恐惧、控制或明显消耗时"
    ]
  },
  "social": {
    "id": "social",
    "name": "人际沟通",
    "icon": "people",
    "description": "梳理协作、分歧、拒绝、信任与沟通边界。",
    "questionPrompt": "例如：同事多次改变约定，我该怎样说清楚边界？",
    "focusDimensions": [
      "relation",
      "control",
      "clarity",
      "action"
    ],
    "dimensionWeights": {
      "action": 0.14,
      "clarity": 0.16,
      "control": 0.14,
      "risk": 0.1,
      "relation": 0.2,
      "pressure": 0.12,
      "stage": 0.08,
      "readiness": 0.06
    },
    "conflicts": {
      "highRelationLowClarity": "关系需要继续，但职责、期待或事实还没有说清楚。",
      "highPressureHighAction": "当前情绪容易让表达变成指责，削弱真正需要传达的信息。",
      "lowControlHighRelation": "结果依赖多人配合，需要用明确约定替代个人猜测。",
      "highRiskLowReadiness": "分歧影响较大，但沟通目标和证据尚未准备充分。",
      "default": "当前需要把事实、影响、需求和可接受边界分别表达。"
    },
    "advantages": [
      "具体描述行为和影响，比评价对方人格更容易形成共识。",
      "书面确认职责、时间与交付物可以减少误解。",
      "保留拒绝和暂停合作的边界，有助于保护长期关系。"
    ],
    "riskGuidance": [
      "不要在信息不完整时公开指责或扩大冲突。",
      "不要把回避冲突当成已经解决问题。",
      "涉及职场责任时，应保存必要的事实记录和正式约定。"
    ],
    "resultTone": "平和、具体、强调可观察行为与明确约定",
    "reconsiderSignals": [
      "双方确认了职责、时间或边界后",
      "对方是否持续遵守新约定已有事实可查时",
      "沟通开始影响安全、工作权益或基本尊重时"
    ]
  },
  "study": {
    "id": "study",
    "name": "学习成长",
    "icon": "book",
    "description": "梳理学习目标、路径选择、反馈节奏与持续投入。",
    "questionPrompt": "例如：我想转向新领域，应该先验证哪项能力？",
    "focusDimensions": [
      "readiness",
      "action",
      "clarity",
      "stage"
    ],
    "dimensionWeights": {
      "action": 0.18,
      "clarity": 0.17,
      "control": 0.13,
      "risk": 0.09,
      "relation": 0.06,
      "pressure": 0.12,
      "stage": 0.12,
      "readiness": 0.13
    },
    "conflicts": {
      "highActionLowClarity": "投入意愿很强，但目标标准和学习路径还不够具体。",
      "highPressureLowReadiness": "进度焦虑正在消耗练习时间，基础能力仍需要分段补齐。",
      "highReadinessLowAction": "资源和条件已经具备，需要用一次实际练习启动反馈循环。",
      "lowControlHighRisk": "选择受到考试、学校或行业条件影响，应先核实正式要求。",
      "default": "当前需要把长期目标改写为一项可练习、可展示、可获得反馈的任务。"
    },
    "advantages": [
      "学习结果可以通过练习作品、模拟测试和外部反馈逐步验证。",
      "把大目标拆成一周可完成的任务，会更容易持续。",
      "记录错误和复盘原因比反复更换资料更有效。"
    ],
    "riskGuidance": [
      "不要因短期进度缓慢就频繁更换完整学习路线。",
      "不要只收集课程和资料而缺少实际练习。",
      "涉及升学或资格时，应以官方要求和截止时间为准。"
    ],
    "resultTone": "鼓励但不空泛、强调练习与反馈",
    "reconsiderSignals": [
      "完成一个可展示的练习或模拟测试后",
      "获得教师、同行或目标岗位的具体反馈后",
      "官方要求、时间预算或学习目标发生变化时"
    ]
  },
  "family": {
    "id": "family",
    "name": "家庭生活",
    "icon": "home",
    "description": "梳理家庭责任、共同决策、资源安排与相处边界。",
    "questionPrompt": "例如：家人对一个重要决定意见不同，我该先谈什么？",
    "focusDimensions": [
      "relation",
      "risk",
      "control",
      "pressure"
    ],
    "dimensionWeights": {
      "action": 0.09,
      "clarity": 0.14,
      "control": 0.13,
      "risk": 0.15,
      "relation": 0.22,
      "pressure": 0.14,
      "stage": 0.07,
      "readiness": 0.06
    },
    "conflicts": {
      "highRelationHighPressure": "你既想维护关系又承受较大压力，需要把责任和情感分开讨论。",
      "lowControlHighRisk": "事情影响家庭整体，但你无法单独决定，必须建立共同决策过程。",
      "highActionLowClarity": "很想尽快结束分歧，但每个人真正担心的问题尚未说清。",
      "highRiskLowReadiness": "决定影响较大，而时间、资金或照护安排仍不完整。",
      "default": "当前需要明确共同目标、各自责任和不可忽视的现实限制。"
    },
    "advantages": [
      "围绕具体安排讨论，比争论谁对谁错更容易推进。",
      "把资金、时间、照护与情绪需求分别列出，有助于减少混淆。",
      "允许分阶段试行，可以降低一次决定带来的压力。"
    ],
    "riskGuidance": [
      "不要把维持表面和谐建立在长期隐瞒或单方承担上。",
      "涉及共同财务、照护和居住时，应明确责任与退出方案。",
      "若家庭互动出现威胁或伤害，应优先保护人身安全。"
    ],
    "resultTone": "体谅但不回避边界、强调共同安排",
    "reconsiderSignals": [
      "家庭成员分别表达真实顾虑后",
      "资金、时间或照护方案形成书面清单后",
      "互动出现持续控制、威胁或安全风险时"
    ]
  },
  "self": {
    "id": "self",
    "name": "自我状态",
    "icon": "leaf",
    "description": "梳理情绪、精力、优先级、习惯与可以掌控的下一步。",
    "questionPrompt": "例如：最近总是疲惫和拖延，我可以先调整什么？",
    "focusDimensions": [
      "pressure",
      "clarity",
      "action",
      "readiness"
    ],
    "dimensionWeights": {
      "action": 0.15,
      "clarity": 0.17,
      "control": 0.14,
      "risk": 0.11,
      "relation": 0.05,
      "pressure": 0.2,
      "stage": 0.08,
      "readiness": 0.1
    },
    "conflicts": {
      "highPressureLowClarity": "情绪和疲惫占用了判断空间，当前更需要恢复基本节奏。",
      "highActionLowReadiness": "改变意愿很强，但目标过多，精力和环境支持尚未匹配。",
      "lowActionHighClarity": "你已经知道问题所在，需要把第一步缩小到今天能够完成。",
      "lowControlHighPressure": "你把注意力放在难以控制的结果上，忽略了可调整的日常条件。",
      "default": "当前需要区分必须处理的事情、可以延后的事情和能够求助的事情。"
    },
    "advantages": [
      "睡眠、饮食、活动、环境和任务规模都可以成为可观察的调整点。",
      "记录一周状态能够帮助识别反复触发因素。",
      "向可信赖的人说明需要，比独自维持表面正常更有帮助。"
    ],
    "riskGuidance": [
      "不要在极度疲惫或强烈情绪中要求自己一次解决所有问题。",
      "不要用文化解读替代医疗或心理专业评估。",
      "若出现伤害自己或他人的想法，应立即停止本流程并寻求现实中的紧急支持。"
    ],
    "resultTone": "温和、具体、不作诊断、强调恢复与求助",
    "reconsiderSignals": [
      "连续记录一周的睡眠、精力和任务完成情况后",
      "完成一次休息、减负或求助安排后",
      "状态持续影响基本生活或出现人身安全风险时"
    ]
  }
}
