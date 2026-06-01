import type { TranslationTree } from "../types";

export const ko: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "취소",
		clear: "지우기",
		continue: "계속",
		disabled: "장애인",
		enabled: "활성화됨",
		inputs: "입력",
		maintain: "유지하다",
		output: "출력",
		outputs: "출력",
		save: "저장",
		saved: "저장됨",
		stop: "중지",
		summary: "요약",
		systemDefault: "시스템 기본값",
		unsavedChanges: "저장되지 않은 변경사항",
		runStatus: {
			success: "성공",
			failed: "실패했다",
			skipped: "건너뛰었습니다",
			stopped: "중지됨",
		},
		workflowStatus: {
			enabled: "활성화됨",
			disabled: "장애인",
			invalid: "유효하지 않은",
		},
		languages: {
			en: "영어",
		},
	},
	commands: {
		openWorkflows: "개방형 워크플로",
		newWorkflow: "새로운 작업 흐름",
		reloadWorkflows: "워크플로 다시 로드",
		maintainDefaultWorkflows: "기본 워크플로우 파일 유지",
		runWorkflow: "실행: {name}",
	},
	notices: {
		languageChanged: "언어가 {language}로 변경되었습니다.",
		workflowsReloaded: "워크플로가 다시 로드되었습니다.",
		defaultFilesCreated: "{count} 기본 {fileLabel}를 생성했습니다.",
		defaultFilesAlreadyPresent: "기본 워크플로 파일이 이미 있습니다.",
		workflowCommandUnavailable: "워크플로 명령을 더 이상 사용할 수 없습니다.",
		workflowRunCompleted: "{status} 실행: {name}",
		workflowDryRunCompleted: "드라이 런 {status}: {name}",
		workflowBaseNotFound: "워크플로 기반을 찾을 수 없음: {path}",
		runHistoryCleared: "워크플로 실행 기록이 삭제되었습니다.",
		workflowSaved: "저장된 작업 흐름: {name}",
		discardChanges: "저장되지 않은 변경사항 취소하려면 취소를 다시 누르세요.",
		discardAndOpenNote: "저장되지 않은 변경사항 메모 열기를 다시 눌러 메모를 삭제하고 엽니다.",
	},
	settings: {
		workflowFiles: {
			heading: "워크플로 파일",
			folder: {
				name: "워크플로 폴더",
				description: "Markdown 워크플로우 정의가 포함된 Vault 폴더입니다.",
			},
			base: {
				name: "워크플로 기반",
				description: "생성된 기지 워크플로 보기에 대한 Vault 경로입니다.",
			},
			createDefaults: {
				name: "워크플로 기본값 만들기",
				description: "플러그인이 로드되거나 기본값이 유지될 때 예제 워크플로 메모를 작성합니다.",
			},
			createBase: {
				name: "워크플로우 기반 생성",
				description: "플러그인이 로드되거나 기본값이 유지될 때 생성된 기본 워크플로 보기를 작성합니다.",
			},
			maintainDefaults: {
				name: "기본값 유지",
				description: "기존 파일을 덮어쓰지 않고 누락된 워크플로 메모와 워크플로 기반을 만듭니다.",
			},
		},
		triggers: {
			heading: "트리거",
			tasknotesEvents: {
				name: "TaskNotes 이벤트 트리거",
				description: "task.status.changed와 같은 TaskNotes 런타임 API 이벤트에서 워크플로를 실행합니다.",
			},
			scheduled: {
				name: "예약된 트리거",
				description: "Obsidian가 열려 있는 동안 cron 및 간격 워크플로를 실행합니다.",
			},
			obsidian: {
				name: "고급 Obsidian 트리거",
				description: "Obsidian 볼트 및 작업공간 트리거를 허용합니다. 경로 필터를 좁게 유지하세요.",
			},
			minInterval: {
				name: "최소 간격",
				description: "허용되는 최저 간격 트리거 빈도(밀리초)입니다.",
			},
		},
		runLogs: {
			heading: "로그 실행",
			folder: {
				name: "로그 폴더 실행",
				description: "실행 요약 및 세부 정보 파일에 대한 선택적 저장소 경로입니다. 이 플러그인의 구성 폴더를 사용하려면 비워 두세요.",
			},
			level: {
				name: "실행 로그 수준",
				description: "실행 기록에 얼마나 많은 세부 정보가 유지되는지 제어합니다.",
				options: {
					summary: "요약",
					inputs: "입력",
					inputsAndOutputs: "입력 및 출력",
				},
			},
			retention: {
				name: "워크플로당 유지되는 실행",
				description: "이 제한 이후에는 오래된 세부 파일이 삭제됩니다.",
			},
			clear: {
				name: "실행 기록 지우기",
				description: "plugin-local 워크플로 실행 로그를 삭제합니다.",
			},
		},
		language: {
			heading: "인터페이스 언어",
			description: "TaskNotes Workflows 명령, 설정, 공지 및 보기의 언어를 변경합니다.",
			name: "UI 언어",
			dropdownDescription: "TaskNotes Workflows 인터페이스 텍스트에 사용되는 언어를 선택합니다.",
		},
	},
	baseView: {
		title: "워크플로",
		tasknotesAvailable: "TaskNotes 런타임 API를 사용할 수 있습니다.",
		tasknotesUnavailable: "TaskNotes 런타임 API를 사용할 수 없습니다. task-writing 단계를 실행할 수 없습니다.",
		empty: "워크플로를 찾을 수 없습니다.",
		newWorkflow: "새로운 작업 흐름",
	},
	workflowCard: {
		labels: {
			triggers: "트리거",
			steps: "단계",
			lastRun: "마지막 실행",
			noOverlap: "겹치지 않음",
		},
		tooltips: {
			edit: "작업 흐름 편집",
			dryRun: "테스트 실행 워크플로",
			run: "워크플로 실행",
			history: "실행 기록",
			openNote: "워크플로 노트 열기",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "모든 {every}",
			vault: "금고 {event}",
			metadata: "메타데이터 {event}",
			workspace: "작업 공간 {event}",
			manual: "매뉴얼",
		},
	},
	runHistory: {
		title: "실행 기록",
		runs: "실행",
		latest: "최신",
		trigger: "트리거",
		duration: "기간",
		runId: "ID 실행",
		dryRun: "드라이런",
		stepCount: {
			one: "{count} 단계",
			other: "{count} 단계",
		},
		input: "입력",
		output: "출력",
		empty: {
			diagnostics: "실행을 표시하려면 먼저 워크플로 진단을 수정해야 합니다.",
			loading: "실행 기록 로드 중...",
			noRuns: "아직 기록된 실행이 없습니다.",
			missingDetail: "실행 세부정보를 찾을 수 없습니다.",
		},
	},
	engine: {
		workflowInvalid: "워크플로가 잘못되었습니다: {path}",
		workflowAlreadyRunning: "워크플로가 이미 실행 중입니다.",
		workflowDisabled: "워크플로가 비활성화되었습니다.",
		conditionsDidNotMatch: "워크플로 조건이 일치하지 않습니다.",
		stepFailed: "단계가 실패했습니다.",
		unknownStepType: "알 수 없는 단계 유형: {type}",
		forEachNonArray: "forEach는 non-array 값으로 확인되었습니다.",
		forEachTooManyItems: "forEach는 run.maxTasks {max}보다 높은 {count} 항목을 선택했습니다.",
	},
	editor: {
		title: {
			edit: "작업 흐름 편집",
			new: "새로운 작업 흐름",
		},
		untitledWorkflow: "제목 없는 워크플로",
		workflowEditor: "워크플로우 편집기",
		sections: {
			definition: {
				label: "정의",
				description: "이름과 신원",
				title: "정의",
				body: "이 워크플로의 이름을 지정하고 안정적인 ID를 유지하세요.",
			},
			triggers: {
				label: "트리거",
				description: "이벤트 시작",
				title: "트리거",
				body: "일정에 따라 TaskNotes 이벤트 또는 선택한 Obsidian 이벤트에서 워크플로를 수동으로 실행합니다.",
			},
			steps: {
				label: "단계",
				description: "작업",
				title: "단계",
				body: "단계는 위에서 아래로 진행됩니다. 이전 단계의 출력은 이후 단계에서 참조될 수 있습니다.",
			},
			run: {
				label: "정책 실행",
				description: "한계 및 오류",
				title: "정책 실행",
				body: "기본 실패 동작을 선택합니다. 안전 제한은 대부분의 워크플로에서 기본값으로 유지될 수 있습니다.",
			},
		},
		summary: {
			triggerCount: {
				one: "{count} 트리거",
				other: "{count} 트리거",
			},
			stepCount: {
				one: "{count} 단계",
				other: "{count} 단계",
			},
			noOverlap: "중복 없음",
			overlapAllowed: "중복 허용",
			enabledDescription: "수동, 예약 및 이벤트 트리거를 실행할 수 있습니다.",
			disabledDescription: "수동, 예약 및 이벤트 트리거는 실행되지 않습니다.",
		},
		definition: {
			name: "이름",
			description: "설명",
			descriptionPlaceholder: "이 워크플로가 존재하는 이유에 대한 선택적 참고 사항입니다.",
			id: "ID",
			advancedTitle: "고급 신원",
			advancedDescription: "안정적인 ID는 명령, 저장된 실행 및 다른 워크플로의 참조에 사용됩니다.",
		},
		triggers: {
			addTitle: "트리거 추가",
			addDescription: "추가 트리거는 동일한 워크플로를 시작합니다.",
			addButton: "트리거 추가",
			type: "트리거 유형",
			id: "ID",
			typeLabel: "유형",
			tasknotesEvent: "TaskNotes 이벤트",
			fromStatus: "상태에서",
			toStatus: "상태로",
			pathGlob: "경로 글로브",
			allowSelfTrigger: "self-trigger 허용",
			schedule: "일정",
			timezone: "시간대",
			catchUp: "따라잡기",
			every: "매",
			event: "이벤트",
			manualHelp: "워크플로가 활성화되면 명령 팔레트에 수동 실행이 나타납니다.",
			valuesAvailable: "스텝에 사용 가능한 트리거 값({count})",
			advancedTitle: "고급 트리거 옵션",
			advancedDescription: "일치를 제한하고 안정적인 ID를 유지하며 재생 동작을 제어합니다.",
			needsAttention: "주의가 필요함",
			tooltips: {
				moveUp: "위로 이동",
				moveDown: "아래로 이동",
				delete: "트리거 삭제",
			},
			types: {
				manual: {
					label: "매뉴얼",
					description: "명시적으로 시작된 경우에만 실행됩니다.",
				},
				tasknotesEvent: {
					label: "TaskNotes 이벤트",
					description: "TaskNotes가 선택한 런타임 이벤트를 내보낼 때 실행됩니다.",
				},
				cron: {
					label: "Cron 일정",
					description: "five-part cron 일정이 현재 분과 일치할 때 실행됩니다.",
				},
				interval: {
					label: "간격",
					description: "Obsidian가 열려 있는 동안 반복적으로 실행됩니다.",
				},
				obsidianVault: {
					label: "Vault 파일 이벤트",
					description: "Obsidian가 파일을 생성, 수정, 삭제하거나 이름을 바꿀 때 실행됩니다.",
				},
				obsidianMetadata: {
					label: "메타데이터 이벤트",
					description: "Obsidian 메타데이터가 변경되거나 확인될 때 실행됩니다.",
				},
				obsidianWorkspace: {
					label: "작업공간 이벤트",
					description: "파일 열기 또는 활성 리프 변경과 같은 선택된 작업공간 활동이 발생할 때 실행됩니다.",
				},
			},
			events: {
				create: "만들기",
				modify: "수정",
				delete: "삭제",
				rename: "이름 바꾸기",
				changed: "변경됨",
				deleted: "삭제됨",
				resolve: "해결",
				resolved: "해결됨",
				fileOpen: "파일 열기",
				activeLeafChange: "활성 리프가 변경됨",
				layoutChange: "레이아웃이 변경됨",
			},
			tasknotesEvents: {
				task: {
					created: "작업이 생성되었습니다.",
					updated: "작업이 업데이트되었습니다.",
					deleted: "작업이 삭제되었습니다.",
					moved: "작업이 이동되었습니다.",
					status: {
						changed: "할 일 상태가 변경됨",
					},
					completed: "작업 완료",
					uncompleted: "완료되지 않은 작업",
					archived: "작업이 보관되었습니다.",
					unarchived: "할 일 보관 취소됨",
					scheduled: {
						changed: "작업 예약 날짜가 변경되었습니다.",
					},
					due: {
						changed: "할 일 기한이 변경됨",
					},
					priority: {
						changed: "작업 우선순위가 변경됨",
					},
					tags: {
						changed: "작업 태그가 변경됨",
					},
					contexts: {
						changed: "작업 컨텍스트가 변경됨",
					},
					projects: {
						changed: "작업 프로젝트가 변경되었습니다.",
					},
					reminders: {
						changed: "작업 알림이 변경됨",
					},
					dependencies: {
						changed: "작업 종속성이 변경됨",
					},
					recurrence: {
						changed: "할 일 반복이 변경됨",
					},
				},
				time: {
					started: "시간 추적이 시작되었습니다.",
					stopped: "시간 추적이 중지되었습니다.",
				},
				pomodoro: {
					started: "뽀모도로가 시작되었습니다",
					completed: "뽀모도로 완성",
					interrupted: "뽀모도로가 방해받았습니다.",
				},
				recurring: {
					instance: {
						completed: "반복 인스턴스가 완료되었습니다.",
						skipped: "반복 인스턴스를 건너뛰었습니다.",
					},
				},
			},
			summary: {
				statusFromTo: "{from}에서 {to}로 상태 변경",
				statusTo: "{to}로 상태 변경",
				statusFrom: "{from}의 상태 변경",
				schedule: "{schedule} 일정",
				every: "모든 {every}",
				vaultFile: "Vault 파일 {event}",
				metadata: "메타데이터 {event}",
				workspace: "워크스페이스 {event}",
				manual: "수동 실행",
			},
			outputs: {
				type: {
					label: "유형",
					description: "트리거 종류.",
				},
				id: {
					label: "ID",
					description: "이 워크플로의 트리거 ID입니다.",
				},
				event: {
					label: "이벤트",
					description: "실행을 시작한 이벤트 이름입니다.",
				},
				actualAt: {
					label: "실제 시간",
					description: "워크플로 실행이 시작된 시간입니다.",
				},
				after: {
					path: {
						label: "작업 경로",
						description: "이벤트 이후의 작업 경로입니다.",
					},
					title: {
						label: "작업 제목",
						description: "이벤트 이후의 작업 제목입니다.",
					},
					status: {
						label: "현황",
						description: "이벤트 후 작업 상태입니다.",
					},
				},
				before: {
					status: {
						label: "이전 상태",
						description: "이벤트 전 작업 상태입니다.",
					},
				},
				changes: {
					label: "변경 사항",
					description: "속성 이름으로 입력된 필드가 변경되었습니다.",
				},
				source: {
					label: "소스",
					description: "제공된 경우 돌연변이 소스입니다.",
				},
				correlationId: {
					label: "상관관계 ID",
					description: "제공된 경우 돌연변이 상관관계 ID입니다.",
				},
				scheduledAt: {
					label: "예정된 시간",
					description: "일정 틱 시간입니다.",
				},
				path: {
					label: "경로",
					description: "일치하는 Vault 파일 경로입니다.",
				},
				file: {
					path: {
						label: "파일 경로",
						description: "일치하는 파일 경로입니다.",
					},
					name: {
						label: "파일 이름",
						description: "일치하는 파일 이름입니다.",
					},
					extension: {
						label: "확장",
						description: "일치하는 파일 확장자입니다.",
					},
				},
				data: {
					label: "데이터",
					description: "추가 이벤트 데이터(제공된 경우)",
				},
				manual: {
					label: "매뉴얼",
					description: "수동 실행의 경우 true입니다.",
				},
			},
		},
		steps: {
			addTitle: "다음 단계 추가",
			addDescription: "위 단계 이후에 새 단계가 실행됩니다.",
			addButton: "단계 추가",
			type: "단계 유형",
			id: "ID",
			advancedTitle: "고급 단계 옵션",
			advancedDescription: "안정적인 ID는 이후 단계에 대한 참조를 생성합니다. 일괄 실행에서는 각 값에 대해 선택 사항을 사용합니다.",
			forEach: "각각에 대해",
			forEachHelp: "일괄 단계에 대한 선택적 배열 참조입니다.",
			inputJson: "JSON를 입력하세요",
			writes: "쓴다",
			needsAttention: "주의가 필요함",
			outputsAvailable: "이후 단계에서 사용할 수 있는 출력({count})",
			tooltips: {
				moveUp: "위로 이동",
				moveDown: "아래로 이동",
				delete: "단계 삭제",
			},
			unknownCategory: "기타",
			summary: {
				forEach: "각 {value}에 대해",
			},
		},
		runPolicy: {
			noOverlap: "중복 없음",
			onError: "오류 발생 시",
			advancedTitle: "고급 실행 제한",
			advancedDescription: "이러한 값은 자동화된 실행을 식별 가능하고 제한적으로 유지합니다.",
			maxTasks: "최대 작업",
			source: "소스",
		},
		footer: {
			openNote: "노트 열기",
		},
		templateSuggestions: {
			workflowId: "워크플로 ID",
			workflowName: "워크플로 이름",
			today: "오늘",
			now: "지금",
			itemPath: "현재 항목 경로",
			triggerValue: "{label} 트리거",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "이름은 필수입니다.",
			invalidWorkflowId: "소문자, 숫자, 점, 밑줄, 대시를 사용하세요. 편지로 시작하세요.",
			duplicateWorkflowId: "이미 {path}에서 사용되었습니다.",
			triggerRequired: "트리거를 하나 이상 추가하세요.",
			invalidTriggerId: "트리거 ID는 문자로 시작하고 id-safe 문자를 사용해야 합니다.",
			duplicateTriggerId: "트리거 ID는 고유해야 합니다.",
			tasknotesEventRequired: "TaskNotes 이벤트를 선택하세요.",
			cronScheduleRequired: "cron 일정을 추가합니다.",
			intervalRequired: "간격을 추가합니다.",
			stepRequired: "단계를 하나 이상 추가하세요.",
			invalidStepId: "단계 ID는 문자로 시작하고 id-safe 문자를 사용해야 합니다.",
			duplicateStepId: "단계 ID는 고유해야 합니다.",
			unknownStepType: "알 수 없는 단계 유형: {type}",
			fieldRequired: "{field}가 필요합니다.",
			positiveNumber: "양수를 사용하세요.",
			jsonObject: "단계 입력은 JSON 객체여야 합니다.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "태스크 관계",
			timeTracking: "시간 추적",
			obsidian: "Obsidian",
			controlFlow: "제어 흐름",
		},
		common: {
			task: {
				label: "작업",
				description: "TaskNotes 작업에 대한 Vault 경로입니다. 트리거된 작업 워크플로는 일반적으로 {{trigger.after.path}}를 사용합니다.",
			},
			path: {
				label: "경로",
				description: "Markdown 파일의 Vault 경로입니다.",
			},
			outputTask: {
				label: "작업",
				description: "TaskNotes 작업 데이터를 업데이트했습니다.",
			},
			outputPath: {
				label: "경로",
				description: "단계가 완료된 후 작업의 Vault 경로입니다.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "작업 가져오기",
					description: "경로별로 하나의 작업을 읽습니다.",
					examples: {
						0: {
							label: "트리거 작업 읽기",
						},
					},
				},
				query: {
					label: "쿼리 작업",
					description: "간결한 워크플로 쿼리로 작업을 선택합니다.",
					input: {
						query: {
							label: "쿼리",
							description: "작업 필드별로 키가 지정된 개체입니다. 값은 리터럴 또는 { operator, value } 필터일 수 있습니다.",
						},
					},
					output: {
						tasks: {
							label: "작업",
							description: "일치하는 TaskNotes 작업.",
						},
						count: {
							label: "개수",
							description: "일치하는 작업 수입니다.",
						},
					},
					examples: {
						0: {
							label: "열린 작업",
						},
					},
				},
				parents: {
					label: "부모 작업 가져오기",
					description: "작업의 프로젝트에서 연결된 상위 작업을 읽습니다.",
				},
				subtasks: {
					label: "하위 작업 가져오기",
					description: "이 작업을 프로젝트로 참조하는 작업을 읽습니다.",
				},
				blocking: {
					label: "차단 작업 가져오기",
					description: "이 작업으로 차단된 작업을 읽습니다.",
				},
				dependencies: {
					label: "종속성 가져오기",
					description: "이 작업을 차단하는 작업을 읽습니다.",
					output: {
						dependencies: {
							label: "종속성",
							description: "사용 가능한 경우 확인된 TaskNotes 작업 데이터가 있는 종속성 개체입니다.",
						},
						tasks: {
							label: "작업",
							description: "종속성 작업이 해결되었습니다.",
						},
						count: {
							label: "개수",
							description: "종속성 수.",
						},
					},
					examples: {
						0: {
							label: "트리거 작업 종속성 읽기",
						},
					},
				},
				relationships: {
					label: "관계를 맺으세요",
					description: "하나의 작업에 대한 상위, 하위 작업, 종속성 및 차단 작업을 읽습니다.",
					output: {
						task: {
							label: "작업",
							description: "작업.",
						},
						parents: {
							label: "부모",
							description: "부모 작업.",
						},
						subtasks: {
							label: "하위 작업",
							description: "하위 작업.",
						},
						dependencies: {
							label: "종속성",
							description: "이 작업을 차단하는 작업입니다.",
						},
						blocking: {
							label: "차단",
							description: "이 작업에 의해 차단된 작업입니다.",
						},
					},
					examples: {
						0: {
							label: "모든 관계 읽기",
						},
					},
				},
				create: {
					label: "작업 만들기",
					description: "새 TaskNotes 작업을 생성합니다.",
					input: {
						title: {
							label: "제목",
						},
						status: {
							label: "상태",
						},
						priority: {
							label: "우선순위",
						},
						due: {
							label: "마감",
						},
						scheduled: {
							label: "예정됨",
						},
						details: {
							label: "세부정보",
						},
					},
					examples: {
						0: {
							label: "받은 편지함 작업 만들기",
						},
					},
				},
				patch: {
					label: "패치 작업",
					description: "작업 필드를 업데이트합니다.",
					input: {
						patch: {
							label: "패치",
							description: "상태, 우선 순위, 기한, 예약, 태그, 프로젝트 또는 컨텍스트 등 업데이트할 작업 필드입니다.",
						},
					},
					examples: {
						0: {
							label: "활성으로 표시",
						},
					},
				},
				set: {
					label: "작업 필드 설정",
					description: "task.patch의 별칭입니다.",
					input: {
						patch: {
							label: "필드",
							description: "설정할 작업 필드입니다.",
						},
					},
				},
				move: {
					label: "작업 이동",
					description: "작업 메모를 이동합니다.",
					input: {
						targetFolder: {
							label: "대상 폴더",
						},
					},
					examples: {
						0: {
							label: "이동 트리거 작업",
						},
					},
				},
				archive: {
					label: "아카이브 작업",
					description: "작업을 보관합니다.",
				},
				unarchive: {
					label: "보관 취소 작업",
					description: "작업 보관을 취소합니다.",
				},
				complete: {
					label: "작업 완료",
					description: "작업을 완료로 표시합니다.",
					input: {
						options: {
							status: {
								label: "완료 상태",
							},
						},
					},
				},
				uncomplete: {
					label: "완료되지 않은 작업",
					description: "완료된 작업을 다시 엽니다.",
					input: {
						options: {
							status: {
								label: "재개장 상태",
							},
						},
					},
				},
				reschedule: {
					label: "작업 일정 변경",
					description: "예정된 날짜를 설정하거나 지웁니다.",
					input: {
						date: {
							label: "예정일",
						},
					},
				},
				setDue: {
					label: "마감일 설정",
					description: "마감일 설정",
					input: {
						date: {
							label: "마감일",
						},
					},
				},
				clearDue: {
					label: "마감일 지우기",
					description: "마감일 지우기",
				},
				setScheduled: {
					label: "예정일 설정",
					description: "예정일 설정",
					input: {
						date: {
							label: "예정일",
						},
					},
				},
				clearScheduled: {
					label: "예정된 날짜 지우기",
					description: "예정된 날짜 지우기",
				},
				addTag: {
					label: "태그 추가",
					description: "태그 추가",
					input: {
						tag: {
							label: "태그",
						},
					},
				},
				removeTag: {
					label: "태그 제거",
					description: "태그 제거",
					input: {
						tag: {
							label: "태그",
						},
					},
				},
				addProject: {
					label: "프로젝트 추가",
					description: "프로젝트 추가",
					input: {
						project: {
							label: "프로젝트",
						},
					},
				},
				removeProject: {
					label: "프로젝트 제거",
					description: "프로젝트 제거",
					input: {
						project: {
							label: "프로젝트",
						},
					},
				},
				addContext: {
					label: "컨텍스트 추가",
					description: "컨텍스트 추가",
					input: {
						context: {
							label: "맥락",
						},
					},
				},
				removeContext: {
					label: "컨텍스트 삭제",
					description: "컨텍스트 삭제",
					input: {
						context: {
							label: "맥락",
						},
					},
				},
				addDependency: {
					label: "종속성 추가",
					description: "차단 종속성을 추가합니다.",
					input: {
						dependency: {
							label: "의존성",
						},
					},
				},
				removeDependency: {
					label: "종속성 제거",
					description: "종속성을 제거합니다.",
					input: {
						uid: {
							label: "종속성 ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "타이머 시작",
					description: "시간 추적을 시작합니다.",
					input: {
						options: {
							description: {
								label: "설명",
							},
						},
					},
					output: {
						startedAt: {
							label: "시작 시간",
							description: "워크플로 실행에 의해 기록된 ISO 타임스탬프입니다.",
						},
					},
				},
				stop: {
					label: "타이머 중지",
					description: "시간 추적을 중지합니다.",
					output: {
						stoppedAt: {
							label: "에 멈췄다",
							description: "워크플로 실행에 의해 기록된 ISO 타임스탬프입니다.",
						},
					},
				},
				appendEntry: {
					label: "시간 항목 추가",
					description: "시간 항목을 추가합니다.",
					input: {
						entry: {
							label: "입장",
						},
					},
				},
			},
			notice: {
				show: {
					label: "공지사항 표시",
					description: "Obsidian 알림을 표시합니다.",
					input: {
						message: {
							label: "메시지",
						},
					},
					output: {
						message: {
							label: "메시지",
						},
					},
					examples: {
						0: {
							label: "작업 제목 표시",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "파일 열기",
					description: "작업공간에서 Vault 파일을 엽니다.",
					input: {
						newLeaf: {
							label: "다음에서 열기",
							options: {
								current: "현재 리프",
								tab: "새 탭",
								split: "분할",
								window: "팝아웃 창",
							},
						},
					},
					output: {
						opened: {
							label: "개설됨",
						},
						newLeaf: {
							label: "오픈 타겟",
						},
					},
					examples: {
						0: {
							label: "트리거링 파일 열기",
						},
					},
				},
				createNote: {
					label: "메모 만들기",
					description: "볼트에 Markdown 메모를 생성합니다.",
					input: {
						content: {
							label: "내용",
						},
					},
					output: {
						created: {
							label: "생성됨",
						},
					},
					examples: {
						0: {
							label: "날짜가 적힌 메모 만들기",
						},
					},
				},
				appendNote: {
					label: "메모에 추가",
					description: "기존 Markdown 메모에 텍스트를 추가합니다.",
					input: {
						text: {
							label: "텍스트",
						},
					},
					output: {
						appended: {
							label: "첨부됨",
						},
						length: {
							label: "길이",
						},
					},
					examples: {
						0: {
							label: "트리거 파일에 추가",
						},
					},
				},
				updateFrontmatter: {
					label: "frontmatter 업데이트",
					description: "Markdown 노트에 top-level frontmatter 패치를 적용합니다.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Top-level 키를 설정할 수 있습니다. 키를 삭제하려면 null를 사용하세요.",
						},
					},
					output: {
						updated: {
							label: "업데이트됨",
						},
						keys: {
							label: "열쇠",
						},
					},
					examples: {
						0: {
							label: "트리거 파일을 검토한 것으로 표시",
						},
					},
				},
				moveFile: {
					label: "파일 이동",
					description: "Vault 파일을 이동하거나 이름을 바꿉니다.",
					input: {
						targetPath: {
							label: "대상 경로",
						},
						updateLinks: {
							label: "링크 업데이트",
							description: "Obsidian의 파일 관리자를 사용하면 볼트 설정에 따라 링크가 업데이트됩니다.",
						},
					},
					output: {
						moved: {
							label: "이동됨",
						},
						oldPath: {
							label: "이전 경로",
						},
					},
					examples: {
						0: {
							label: "아카이브 트리거 파일",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "워크플로 중지",
					description: "현재 워크플로 실행을 중지합니다.",
					input: {
						reason: {
							label: "이유",
						},
					},
					output: {
						stopped: {
							label: "중지됨",
						},
						reason: {
							label: "이유",
						},
					},
					examples: {
						0: {
							label: "이성적으로 멈춰라",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "TaskNotes 런타임 API를 사용할 수 없습니다.",
			obsidianUnavailable: "Obsidian 앱 컨텍스트를 사용할 수 없습니다.",
			requiredText: "단계 입력에는 non-empty 텍스트가 필요합니다: {field}",
		},
	},
};
