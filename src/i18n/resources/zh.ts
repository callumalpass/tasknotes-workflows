import type { TranslationTree } from "../types";

export const zh: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "取消",
		clear: "清除",
		continue: "继续",
		disabled: "残疾人",
		enabled: "启用",
		inputs: "输入",
		maintain: "维护",
		output: "输出",
		outputs: "输出",
		save: "保存",
		saved: "已保存",
		stop: "停止",
		summary: "总结",
		systemDefault: "系统默认",
		unsavedChanges: "未保存的更改",
		runStatus: {
			success: "成功",
			failed: "失败了",
			skipped: "跳过",
			stopped: "停止了",
		},
		workflowStatus: {
			enabled: "已启用",
			disabled: "残疾人",
			invalid: "无效",
		},
		languages: {
			en: "英语",
		},
	},
	commands: {
		openWorkflows: "开放的工作流程",
		newWorkflow: "新的工作流程",
		reloadWorkflows: "重新加载工作流程",
		maintainDefaultWorkflows: "维护默认工作流程文件",
		runWorkflow: "运行：{name}",
	},
	notices: {
		languageChanged: "语言更改为 {language}。",
		workflowsReloaded: "工作流程已重新加载。",
		defaultFilesCreated: "创建了 {count} 默认 {fileLabel}。",
		defaultFilesAlreadyPresent: "默认工作流程文件已存在。",
		workflowCommandUnavailable: "工作流命令不再可用。",
		workflowRunCompleted: "运行{status}：{name}",
		workflowDryRunCompleted: "试运行 {status}：{name}",
		workflowBaseNotFound: "未找到工作流程基础：{path}",
		runHistoryCleared: "工作流程运行历史记录已清除。",
		workflowSaved: "保存的工作流程：{name}",
		discardChanges: "未保存的更改。再次按取消即可放弃。",
		discardAndOpenNote: "未保存的更改。再次按“打开笔记”即可放弃并打开笔记。",
	},
	settings: {
		workflowFiles: {
			heading: "工作流程文件",
			folder: {
				name: "工作流程文件夹",
				description: "包含 Markdown 工作流程定义的 Vault 文件夹。",
			},
			base: {
				name: "工作流程基础",
				description: "生成的基础工作流程视图的 Vault 路径。",
			},
			createDefaults: {
				name: "创建工作流程默认值",
				description: "当插件加载或维护默认值时编写示例工作流程注释。",
			},
			createBase: {
				name: "创建工作流程基础",
				description: "当插件加载或维护默认值时编写生成的基础工作流程视图。",
			},
			maintainDefaults: {
				name: "维持默认值",
				description: "创建缺失的工作流程注释和工作流程基础，而无需覆盖现有文件。",
			},
		},
		triggers: {
			heading: "触发器",
			tasknotesEvents: {
				name: "TaskNotes 事件触发器",
				description: "从 TaskNotes 运行时 API 事件（例如 task.status.changed）运行工作流。",
			},
			scheduled: {
				name: "预定的触发器",
				description: "在 Obsidian 打开时运行 cron 和间隔工作流程。",
			},
			obsidian: {
				name: "高级 Obsidian 触发器",
				description: "允许 Obsidian 保管库和工作区触发器。保持路径过滤器狭窄。",
			},
			minInterval: {
				name: "最小间隔",
				description: "允许的最低间隔触发频率（以毫秒为单位）。",
			},
		},
		runLogs: {
			heading: "运行日志",
			folder: {
				name: "运行日志文件夹",
				description: "运行摘要和详细文件的可选保管库路径。留空以使用此插件的配置文件夹。",
			},
			level: {
				name: "运行日志级别",
				description: "控制运行记录中保留多少详细信息。",
				options: {
					summary: "总结",
					inputs: "输入",
					inputsAndOutputs: "输入和输出",
				},
			},
			retention: {
				name: "每个工作流程保留的运行",
				description: "在此限制之后，旧的详细信息文件将被删除。",
			},
			clear: {
				name: "清除运行历史记录",
				description: "删除 plugin-local 工作流运行日志。",
			},
		},
		language: {
			heading: "界面语言",
			description: "更改 TaskNotes Workflows 命令、设置、通知和视图的语言。",
			name: "UI语言",
			dropdownDescription: "选择 TaskNotes Workflows 界面文本所使用的语言。",
		},
	},
	baseView: {
		title: "工作流程",
		tasknotesAvailable: "TaskNotes 运行时 API 可用。",
		tasknotesUnavailable: "TaskNotes运行时API不可用； task-writing 步骤无法运行。",
		empty: "未找到工作流程",
		newWorkflow: "新的工作流程",
	},
	workflowCard: {
		labels: {
			triggers: "触发器",
			steps: "步骤",
			lastRun: "最后一次运行",
			noOverlap: "无重叠",
		},
		tooltips: {
			edit: "编辑工作流程",
			dryRun: "试运行工作流程",
			run: "运行工作流程",
			history: "运行历史",
			openNote: "打开工作流程注释",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "每{every}",
			vault: "保险库{event}",
			metadata: "元数据 {event}",
			workspace: "工作区 {event}",
			manual: "手册",
		},
	},
	runHistory: {
		title: "运行历史",
		runs: "跑步",
		latest: "最新",
		trigger: "触发",
		duration: "持续时间",
		runId: "运行ID",
		dryRun: "试运行",
		stepCount: {
			one: "{count}步",
			other: "{count}步骤",
		},
		input: "输入",
		output: "输出",
		empty: {
			diagnostics: "在显示运行之前必须修复工作流诊断。",
			loading: "正在加载运行历史记录...",
			noRuns: "尚未记录任何跑步记录。",
			missingDetail: "未找到运行详细信息。",
		},
	},
	engine: {
		workflowInvalid: "工作流程无效：{path}",
		workflowAlreadyRunning: "工作流程已经在运行。",
		workflowDisabled: "工作流程已禁用。",
		conditionsDidNotMatch: "工作流程条件不匹配。",
		stepFailed: "步骤失败。",
		unknownStepType: "未知步骤类型：{type}",
		forEachNonArray: "forEach 解析为 non-array 值。",
		forEachTooManyItems: "forEach选择了{count}项，上面是run.maxTasks {max}。",
	},
	editor: {
		title: {
			edit: "编辑工作流程",
			new: "新的工作流程",
		},
		untitledWorkflow: "无标题工作流程",
		workflowEditor: "工作流程编辑器",
		sections: {
			definition: {
				label: "定义",
				description: "姓名和身份",
				title: "定义",
				body: "命名该工作流程并保持其稳定的标识。",
			},
			triggers: {
				label: "触发器",
				description: "开始活动",
				title: "触发器",
				body: "按计划、从 TaskNotes 事件或从选定的 Obsidian 事件手动运行工作流。",
			},
			steps: {
				label: "步骤",
				description: "行动",
				title: "步骤",
				body: "步骤从上到下进行。后面的步骤可以引用前面步骤的输出。",
			},
			run: {
				label: "运行策略",
				description: "限制和错误",
				title: "运行策略",
				body: "选择默认的失败行为。对于大多数工作流程，安全限制可以保留默认值。",
			},
		},
		summary: {
			triggerCount: {
				one: "{count}触发器",
				other: "{count} 触发器",
			},
			stepCount: {
				one: "{count}步",
				other: "{count}步骤",
			},
			noOverlap: "无重叠",
			overlapAllowed: "允许重叠",
			enabledDescription: "可以运行手动、计划和事件触发器。",
			disabledDescription: "手动、计划和事件触发器将不会运行。",
		},
		definition: {
			name: "名称",
			description: "描述",
			descriptionPlaceholder: "关于此工作流程存在原因的可选注释。",
			id: "ID",
			advancedTitle: "高级身份",
			advancedDescription: "稳定的 ID 用于命令、保存的运行以及来自其他工作流程的引用。",
		},
		triggers: {
			addTitle: "添加触发器",
			addDescription: "其他触发器启动相同的工作流程。",
			addButton: "添加触发器",
			type: "触发类型",
			id: "ID",
			typeLabel: "类型",
			tasknotesEvent: "TaskNotes事件",
			fromStatus: "从状态",
			toStatus: "至状态",
			pathGlob: "路径全局",
			allowSelfTrigger: "允许self-trigger",
			schedule: "时间表",
			timezone: "时区",
			catchUp: "赶上",
			every: "每个",
			event: "活动",
			manualHelp: "启用工作流程后，手动运行将显示在命令选项板中。",
			valuesAvailable: "步骤可用的触发值 ({count})",
			advancedTitle: "高级触发选项",
			advancedDescription: "限制匹配、保留稳定的 ID 并控制重播行为。",
			needsAttention: "需要注意",
			tooltips: {
				moveUp: "向上移动",
				moveDown: "下移",
				delete: "删除触发器",
			},
			types: {
				manual: {
					label: "手册",
					description: "仅在显式启动时运行。",
				},
				tasknotesEvent: {
					label: "TaskNotes事件",
					description: "当 TaskNotes 发出选定的运行时事件时运行。",
				},
				cron: {
					label: "Cron时间表",
					description: "当 five-part cron 计划与当前分钟匹配时运行。",
				},
				interval: {
					label: "间隔",
					description: "当 Obsidian 打开时重复运行。",
				},
				obsidianVault: {
					label: "保管库文件事件",
					description: "当 Obsidian 创建、修改、删除或重命名文件时运行。",
				},
				obsidianMetadata: {
					label: "元数据事件",
					description: "当 Obsidian 元数据更改或解析时运行。",
				},
				obsidianWorkspace: {
					label: "工作区活动",
					description: "当选定的工作区活动发生时运行，例如打开文件或更改活动叶。",
				},
			},
			events: {
				create: "创建",
				modify: "修改",
				delete: "删除",
				rename: "重命名",
				changed: "改变了",
				deleted: "已删除",
				resolve: "解决",
				resolved: "已解决",
				fileOpen: "文件打开",
				activeLeafChange: "活动叶子发生变化",
				layoutChange: "布局已更改",
			},
			tasknotesEvents: {
				task: {
					created: "任务已创建",
					updated: "任务已更新",
					deleted: "任务已删除",
					moved: "任务已移动",
					status: {
						changed: "任务状态发生变化",
					},
					completed: "任务完成",
					uncompleted: "任务未完成",
					archived: "任务已存档",
					unarchived: "任务未归档",
					scheduled: {
						changed: "任务计划日期已更改",
					},
					due: {
						changed: "任务截止日期已更改",
					},
					priority: {
						changed: "任务优先级已更改",
					},
					tags: {
						changed: "任务标签已更改",
					},
					contexts: {
						changed: "任务上下文已更改",
					},
					projects: {
						changed: "任务项目变更",
					},
					reminders: {
						changed: "任务提醒已更改",
					},
					dependencies: {
						changed: "任务依赖关系发生变化",
					},
					recurrence: {
						changed: "任务重复发生变化",
					},
				},
				time: {
					started: "时间追踪开始",
					stopped: "时间追踪停止",
				},
				pomodoro: {
					started: "番茄钟开始",
					completed: "番茄工作完成",
					interrupted: "番茄钟被打断",
				},
				recurring: {
					instance: {
						completed: "重复实例已完成",
						skipped: "已跳过重复实例",
					},
				},
			},
			summary: {
				statusFromTo: "状态从 {from} 更改为 {to}",
				statusTo: "状态更改为 {to}",
				statusFrom: "{from} 的状态变化",
				schedule: "时间表 {schedule}",
				every: "每{every}",
				vaultFile: "保管库文件 {event}",
				metadata: "元数据 {event}",
				workspace: "工作区 {event}",
				manual: "手动运行",
			},
			outputs: {
				type: {
					label: "类型",
					description: "触发器的那种。",
				},
				id: {
					label: "ID",
					description: "此工作流程中的触发器 ID。",
				},
				event: {
					label: "活动",
					description: "开始运行的事件名称。",
				},
				actualAt: {
					label: "实际时间",
					description: "工作流程运行开始时。",
				},
				after: {
					path: {
						label: "任务路径",
						description: "事件发生后的任务路径。",
					},
					title: {
						label: "任务标题",
						description: "事件后的任务标题。",
					},
					status: {
						label: "目前状态",
						description: "事件发生后的任务状态。",
					},
				},
				before: {
					status: {
						label: "以前的状态",
						description: "事件发生前的任务状态。",
					},
				},
				changes: {
					label: "变化",
					description: "更改了按属性名称键入的字段。",
				},
				source: {
					label: "来源",
					description: "突变源（如果提供）。",
				},
				correlationId: {
					label: "相关性 ID",
					description: "突变相关性 ID（如果提供）。",
				},
				scheduledAt: {
					label: "预定时间",
					description: "时间表滴答时间。",
				},
				path: {
					label: "路径",
					description: "匹配的保管库文件路径。",
				},
				file: {
					path: {
						label: "文件路径",
						description: "匹配的文件路径。",
					},
					name: {
						label: "文件名",
						description: "匹配的文件名。",
					},
					extension: {
						label: "扩展",
						description: "匹配的文件扩展名。",
					},
				},
				data: {
					label: "数据",
					description: "额外的事件数据（如果提供）。",
				},
				manual: {
					label: "手册",
					description: "对于手动运行来说确实如此。",
				},
			},
		},
		steps: {
			addTitle: "添加下一步",
			addDescription: "新步骤将在上述步骤之后运行。",
			addButton: "添加步骤",
			type: "台阶式",
			id: "ID",
			advancedTitle: "高级步骤选项",
			advancedDescription: "稳定的 ID 为后续步骤创建参考。批量运行对每个值使用可选值。",
			forEach: "对于每个",
			forEachHelp: "批处理步骤的可选数组参考。",
			inputJson: "输入JSON",
			writes: "写",
			needsAttention: "需要注意",
			outputsAvailable: "输出可用于后续步骤 ({count})",
			tooltips: {
				moveUp: "向上移动",
				moveDown: "下移",
				delete: "删除步骤",
			},
			unknownCategory: "其他",
			summary: {
				forEach: "对于每个 {value}",
			},
		},
		runPolicy: {
			noOverlap: "无重叠",
			onError: "出错时",
			advancedTitle: "高级运行限制",
			advancedDescription: "这些值使自动运行保持可识别和有界。",
			maxTasks: "最大任务数",
			source: "来源",
		},
		footer: {
			openNote: "打开笔记",
		},
		templateSuggestions: {
			workflowId: "工作流程编号",
			workflowName: "工作流程名称",
			today: "今天",
			now: "现在",
			itemPath: "当前项目路径",
			triggerValue: "触发{label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "姓名为必填项。",
			invalidWorkflowId: "使用小写字母、数字、点、下划线或破折号。从一封信开始。",
			duplicateWorkflowId: "已被 {path} 使用。",
			triggerRequired: "添加至少一个触发器。",
			invalidTriggerId: "触发器 ID 必须以字母开头并使用 id-safe 字符。",
			duplicateTriggerId: "触发器 ID 必须是唯一的。",
			tasknotesEventRequired: "选择 TaskNotes 事件。",
			cronScheduleRequired: "添加 cron 计划。",
			intervalRequired: "添加一个间隔。",
			stepRequired: "至少添加一个步骤。",
			invalidStepId: "步骤 ID 必须以字母开头并使用 id-safe 字符。",
			duplicateStepId: "步骤 ID 必须是唯一的。",
			unknownStepType: "未知步骤类型：{type}",
			fieldRequired: "需要 {field}。",
			positiveNumber: "使用正数。",
			jsonObject: "步骤输入必须是 JSON 对象。",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "任务关系",
			timeTracking: "时间追踪",
			obsidian: "Obsidian",
			controlFlow: "控制流程",
		},
		common: {
			task: {
				label: "任务",
				description: "TaskNotes 任务的保管库路径。触发任务工作流通常使用{{trigger.after.path}}。",
			},
			path: {
				label: "路径",
				description: "Markdown 文件的保管库路径。",
			},
			outputTask: {
				label: "任务",
				description: "更新了TaskNotes任务数据。",
			},
			outputPath: {
				label: "路径",
				description: "步骤完成后任务的保管库路径。",
			},
		},
		definitions: {
			task: {
				get: {
					label: "获取任务",
					description: "按路径读取一项任务。",
					examples: {
						0: {
							label: "读取触发任务",
						},
					},
				},
				query: {
					label: "查询任务",
					description: "使用紧凑的工作流查询选择任务。",
					input: {
						query: {
							label: "查询",
							description: "由任务字段键入的对象。值可以是文字或 { operator, value } 过滤器。",
						},
					},
					output: {
						tasks: {
							label: "任务",
							description: "匹配的 TaskNotes 任务。",
						},
						count: {
							label: "计数",
							description: "匹配任务的数量。",
						},
					},
					examples: {
						0: {
							label: "开放任务",
						},
					},
				},
				parents: {
					label: "获取父任务",
					description: "读取从任务项目链接的父任务。",
				},
				subtasks: {
					label: "获取子任务",
					description: "读取将此任务引用为项目的任务。",
				},
				blocking: {
					label: "获取阻塞任务",
					description: "读取被该任务阻塞的任务。",
				},
				dependencies: {
					label: "获取依赖项",
					description: "读取阻止此任务的任务。",
					output: {
						dependencies: {
							label: "依赖关系",
							description: "具有解析的 TaskNotes 任务数据（如果可用）的依赖关系对象。",
						},
						tasks: {
							label: "任务",
							description: "已解决的依赖任务。",
						},
						count: {
							label: "计数",
							description: "依赖项的数量。",
						},
					},
					examples: {
						0: {
							label: "读取触发任务依赖关系",
						},
					},
				},
				relationships: {
					label: "建立关系",
					description: "读取一项任务的父任务、子任务、依赖项和阻塞任务。",
					output: {
						task: {
							label: "任务",
							description: "任务。",
						},
						parents: {
							label: "家长",
							description: "家长任务。",
						},
						subtasks: {
							label: "子任务",
							description: "子任务。",
						},
						dependencies: {
							label: "依赖关系",
							description: "阻止此任务的任务。",
						},
						blocking: {
							label: "阻塞",
							description: "被该任务阻止的任务。",
						},
					},
					examples: {
						0: {
							label: "读取所有关系",
						},
					},
				},
				create: {
					label: "创建任务",
					description: "创建新的 TaskNotes 任务。",
					input: {
						title: {
							label: "标题",
						},
						status: {
							label: "状态",
						},
						priority: {
							label: "优先级",
						},
						due: {
							label: "由于",
						},
						scheduled: {
							label: "预定",
						},
						details: {
							label: "详情",
						},
					},
					examples: {
						0: {
							label: "创建收件箱任务",
						},
					},
				},
				patch: {
					label: "补丁任务",
					description: "更新任务字段。",
					input: {
						patch: {
							label: "补丁",
							description: "要更新的任务字段，例如状态、优先级、到期时间、计划、标签、项目或上下文。",
						},
					},
					examples: {
						0: {
							label: "标记为活动",
						},
					},
				},
				set: {
					label: "设置任务字段",
					description: "别名为 task.patch。",
					input: {
						patch: {
							label: "领域",
							description: "要设置的任务字段。",
						},
					},
				},
				move: {
					label: "移动任务",
					description: "移动任务注释。",
					input: {
						targetFolder: {
							label: "目标文件夹",
						},
					},
					examples: {
						0: {
							label: "移动触发任务",
						},
					},
				},
				archive: {
					label: "存档任务",
					description: "归档任务。",
				},
				unarchive: {
					label: "取消存档任务",
					description: "取消存档任务。",
				},
				complete: {
					label: "完成任务",
					description: "标记任务已完成。",
					input: {
						options: {
							status: {
								label: "完成状态",
							},
						},
					},
				},
				uncomplete: {
					label: "未完成的任务",
					description: "重新打开已完成的任务。",
					input: {
						options: {
							status: {
								label: "重新开放状态",
							},
						},
					},
				},
				reschedule: {
					label: "重新安排任务",
					description: "设置或清除预定日期。",
					input: {
						date: {
							label: "预定日期",
						},
					},
				},
				setDue: {
					label: "设定截止日期",
					description: "设定截止日期",
					input: {
						date: {
							label: "截止日期",
						},
					},
				},
				clearDue: {
					label: "明确的截止日期",
					description: "明确的截止日期",
				},
				setScheduled: {
					label: "设置预定日期",
					description: "设置预定日期",
					input: {
						date: {
							label: "预定日期",
						},
					},
				},
				clearScheduled: {
					label: "明确预定日期",
					description: "明确预定日期",
				},
				addTag: {
					label: "添加标签",
					description: "添加标签",
					input: {
						tag: {
							label: "标签",
						},
					},
				},
				removeTag: {
					label: "删除标签",
					description: "删除标签",
					input: {
						tag: {
							label: "标签",
						},
					},
				},
				addProject: {
					label: "添加项目",
					description: "添加项目",
					input: {
						project: {
							label: "项目",
						},
					},
				},
				removeProject: {
					label: "删除项目",
					description: "删除项目",
					input: {
						project: {
							label: "项目",
						},
					},
				},
				addContext: {
					label: "添加上下文",
					description: "添加上下文",
					input: {
						context: {
							label: "背景",
						},
					},
				},
				removeContext: {
					label: "删除上下文",
					description: "删除上下文",
					input: {
						context: {
							label: "背景",
						},
					},
				},
				addDependency: {
					label: "添加依赖项",
					description: "添加阻塞依赖。",
					input: {
						dependency: {
							label: "依赖性",
						},
					},
				},
				removeDependency: {
					label: "删除依赖",
					description: "删除依赖项。",
					input: {
						uid: {
							label: "依赖项 ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "启动定时器",
					description: "开始时间跟踪。",
					input: {
						options: {
							description: {
								label: "描述",
							},
						},
					},
					output: {
						startedAt: {
							label: "开始于",
							description: "ISO 工作流运行记录的时间戳。",
						},
					},
				},
				stop: {
					label: "停止计时器",
					description: "停止时间跟踪。",
					output: {
						stoppedAt: {
							label: "停在",
							description: "ISO 工作流运行记录的时间戳。",
						},
					},
				},
				appendEntry: {
					label: "追加时间条目",
					description: "添加时间条目。",
					input: {
						entry: {
							label: "参赛作品",
						},
					},
				},
			},
			notice: {
				show: {
					label: "显示通知",
					description: "显示 Obsidian 通知。",
					input: {
						message: {
							label: "留言",
						},
					},
					output: {
						message: {
							label: "留言",
						},
					},
					examples: {
						0: {
							label: "显示任务标题",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "打开文件",
					description: "在工作区中打开 Vault 文件。",
					input: {
						newLeaf: {
							label: "打开于",
							options: {
								current: "当前叶子",
								tab: "新标签页",
								split: "斯普利特",
								window: "弹出窗口",
							},
						},
					},
					output: {
						opened: {
							label: "已开通",
						},
						newLeaf: {
							label: "开放目标",
						},
					},
					examples: {
						0: {
							label: "打开触发文件",
						},
					},
				},
				createNote: {
					label: "创建笔记",
					description: "在保管库中创建 Markdown 注释。",
					input: {
						content: {
							label: "内容",
						},
					},
					output: {
						created: {
							label: "已创建",
						},
					},
					examples: {
						0: {
							label: "创建一个注明日期的笔记",
						},
					},
				},
				appendNote: {
					label: "附加到注释",
					description: "将文本附加到现有 Markdown 注释。",
					input: {
						text: {
							label: "文字",
						},
					},
					output: {
						appended: {
							label: "附加",
						},
						length: {
							label: "长度",
						},
					},
					examples: {
						0: {
							label: "附加到触发文件",
						},
					},
				},
				updateFrontmatter: {
					label: "更新frontmatter",
					description: "将 top-level frontmatter 补丁应用于 Markdown 音符。",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Top-level键设置。使用 null 删除密钥。",
						},
					},
					output: {
						updated: {
							label: "已更新",
						},
						keys: {
							label: "按键",
						},
					},
					examples: {
						0: {
							label: "标记触发文件已审核",
						},
					},
				},
				moveFile: {
					label: "移动文件",
					description: "移动或重命名 Vault 文件。",
					input: {
						targetPath: {
							label: "目标路径",
						},
						updateLinks: {
							label: "更新链接",
							description: "使用 Obsidian 的文件管理器，以便根据保管库设置更新链接。",
						},
					},
					output: {
						moved: {
							label: "搬家了",
						},
						oldPath: {
							label: "老路",
						},
					},
					examples: {
						0: {
							label: "存档触发文件",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "停止工作流程",
					description: "停止当前工作流程运行。",
					input: {
						reason: {
							label: "原因",
						},
					},
					output: {
						stopped: {
							label: "已停止",
						},
						reason: {
							label: "原因",
						},
					},
					examples: {
						0: {
							label: "有理由停止",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "TaskNotes 运行时 API 不可用。",
			obsidianUnavailable: "Obsidian 应用程序上下文不可用。",
			requiredText: "步骤输入需要non-empty文本：{field}",
		},
	},
};
