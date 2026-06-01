import type { TranslationTree } from "../types";

export const ja: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "キャンセル",
		clear: "クリア",
		continue: "続ける",
		disabled: "無効",
		enabled: "有効",
		inputs: "入力",
		maintain: "維持する",
		output: "出力",
		outputs: "出力",
		save: "保存",
		saved: "保存されました",
		stop: "停止",
		summary: "概要",
		systemDefault: "システムのデフォルト",
		unsavedChanges: "未保存の変更",
		runStatus: {
			success: "成功",
			failed: "失敗しました",
			skipped: "スキップしました",
			stopped: "止まった",
		},
		workflowStatus: {
			enabled: "有効",
			disabled: "無効化された",
			invalid: "無効な",
		},
		languages: {
			en: "英語",
		},
	},
	commands: {
		openWorkflows: "オープンなワークフロー",
		newWorkflow: "新しいワークフロー",
		reloadWorkflows: "ワークフローをリロードする",
		maintainDefaultWorkflows: "デフォルトのワークフローファイルを維持する",
		runWorkflow: "実行: {name}",
	},
	notices: {
		languageChanged: "言語が{language}に変更されました。",
		workflowsReloaded: "ワークフローがリロードされました。",
		defaultFilesCreated: "{count} のデフォルト {fileLabel} を作成しました。",
		defaultFilesAlreadyPresent: "デフォルトのワークフロー ファイルはすでに存在します。",
		workflowCommandUnavailable: "ワークフロー コマンドは使用できなくなりました。",
		workflowRunCompleted: "{status} を実行: {name}",
		workflowDryRunCompleted: "ドライラン {status}: {name}",
		workflowBaseNotFound: "ワークフロー ベースが見つかりません: {path}",
		runHistoryCleared: "ワークフローの実行履歴が消去されました。",
		workflowSaved: "保存されたワークフロー: {name}",
		discardChanges: "保存されていない変更。破棄するには、もう一度「キャンセル」を押します。",
		discardAndOpenNote: "保存されていない変更。メモを破棄して開くには、もう一度「メモを開く」を押します。",
	},
	settings: {
		workflowFiles: {
			heading: "ワークフローファイル",
			folder: {
				name: "ワークフローフォルダー",
				description: "Markdown ワークフロー定義を含む Vault フォルダー。",
			},
			base: {
				name: "ワークフローベース",
				description: "生成されたベース ワークフロー ビューのボールト パス。",
			},
			createDefaults: {
				name: "ワークフローのデフォルトを作成する",
				description: "プラグインがロードされるとき、またはデフォルトが維持されるときに、ワークフローの例のメモを書きます。",
			},
			createBase: {
				name: "ワークフローベースの作成",
				description: "プラグインのロード時、またはデフォルトが維持されるときに、生成されたベース ワークフロー ビューを書き込みます。",
			},
			maintainDefaults: {
				name: "デフォルトを維持する",
				description: "既存のファイルを上書きせずに、不足しているワークフロー ノートとワークフロー ベースを作成します。",
			},
		},
		triggers: {
			heading: "トリガー",
			tasknotesEvents: {
				name: "TaskNotes イベントトリガー",
				description: "TaskNotes ランタイム API イベント (task.status.changed など) からワークフローを実行します。",
			},
			scheduled: {
				name: "スケジュールされたトリガー",
				description: "Obsidian が開いている間に、cron と間隔ワークフローを実行します。",
			},
			obsidian: {
				name: "高度な Obsidian トリガー",
				description: "Obsidian ボールトおよびワークスペース トリガーを許可します。パスフィルターを狭くしてください。",
			},
			minInterval: {
				name: "最小間隔",
				description: "ミリ秒単位で許可される最小間隔トリガー頻度。",
			},
		},
		runLogs: {
			heading: "実行ログ",
			folder: {
				name: "実行ログフォルダー",
				description: "実行サマリーおよび詳細ファイルのオプションのボールト パス。このプラグインの設定フォルダーを使用するには、空白のままにします。",
			},
			level: {
				name: "実行ログレベル",
				description: "実行記録にどの程度の詳細を保持するかを制御します。",
				options: {
					summary: "概要",
					inputs: "入力",
					inputsAndOutputs: "入力と出力",
				},
			},
			retention: {
				name: "ワークフローごとに保持される実行数",
				description: "この制限を過ぎると、古い詳細ファイルは削除されます。",
			},
			clear: {
				name: "実行履歴をクリアする",
				description: "plugin-local ワークフロー実行ログを削除します。",
			},
		},
		language: {
			heading: "インターフェース言語",
			description: "TaskNotes Workflows コマンド、設定、通知、およびビューの言語を変更します。",
			name: "UI言語",
			dropdownDescription: "TaskNotes Workflows インターフェースのテキストに使用される言語を選択します。",
		},
	},
	baseView: {
		title: "ワークフロー",
		tasknotesAvailable: "TaskNotes ランタイム API が利用可能です。",
		tasknotesUnavailable: "TaskNotes ランタイム API は使用できません。 task-writing ステップは実行できません。",
		empty: "ワークフローが見つかりません",
		newWorkflow: "新しいワークフロー",
	},
	workflowCard: {
		labels: {
			triggers: "トリガー",
			steps: "ステップ",
			lastRun: "最後の実行",
			noOverlap: "重複なし",
		},
		tooltips: {
			edit: "ワークフローの編集",
			dryRun: "ドライランワークフロー",
			run: "ワークフローの実行",
			history: "実行履歴",
			openNote: "ワークフローノートを開く",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "{every}ごと",
			vault: "保管庫 {event}",
			metadata: "メタデータ {event}",
			workspace: "ワークスペース {event}",
			manual: "手動",
		},
	},
	runHistory: {
		title: "実行履歴",
		runs: "実行",
		latest: "最新の",
		trigger: "トリガー",
		duration: "期間",
		runId: "IDを実行",
		dryRun: "予行演習",
		stepCount: {
			one: "{count}ステップ",
			other: "{count} ステップ",
		},
		input: "入力",
		output: "出力",
		empty: {
			diagnostics: "実行を表示するには、ワークフロー診断を修正する必要があります。",
			loading: "実行履歴を読み込んでいます...",
			noRuns: "まだ打点は記録されていない。",
			missingDetail: "実行の詳細が見つかりませんでした。",
		},
	},
	engine: {
		workflowInvalid: "ワークフローが無効です: {path}",
		workflowAlreadyRunning: "ワークフローはすでに実行されています。",
		workflowDisabled: "ワークフローが無効になっています。",
		conditionsDidNotMatch: "ワークフロー条件が一致しませんでした。",
		stepFailed: "ステップが失敗しました。",
		unknownStepType: "不明なステップ タイプ: {type}",
		forEachNonArray: "forEach は non-array 値に解決されました。",
		forEachTooManyItems: "forEach は、run.maxTasks {max} より上の {count} アイテムを選択しました。",
	},
	editor: {
		title: {
			edit: "ワークフローの編集",
			new: "新しいワークフロー",
		},
		untitledWorkflow: "無題のワークフロー",
		workflowEditor: "ワークフローエディター",
		sections: {
			definition: {
				label: "定義",
				description: "名前と身元",
				title: "定義",
				body: "このワークフローに名前を付け、その安定したアイデンティティを維持します。",
			},
			triggers: {
				label: "トリガー",
				description: "イベントを開始する",
				title: "トリガー",
				body: "ワークフローを手動で、スケジュールに従って、TaskNotes イベントから、または選択した Obsidian イベントから実行します。",
			},
			steps: {
				label: "ステップ",
				description: "アクション",
				title: "ステップ",
				body: "階段は上から下へ進みます。前のステップの出力は、後のステップで参照できます。",
			},
			run: {
				label: "ポリシーの実行",
				description: "制限とエラー",
				title: "ポリシーの実行",
				body: "デフォルトの失敗動作を選択します。ほとんどのワークフローでは、安全制限はデフォルトのままにすることができます。",
			},
		},
		summary: {
			triggerCount: {
				one: "{count}トリガー",
				other: "{count}トリガー",
			},
			stepCount: {
				one: "{count}ステップ",
				other: "{count} ステップ",
			},
			noOverlap: "重複なし",
			overlapAllowed: "重複を許可する",
			enabledDescription: "手動トリガー、スケジュールされたトリガー、およびイベント トリガーを実行できます。",
			disabledDescription: "手動トリガー、スケジュールされたトリガー、およびイベント トリガーは実行されません。",
		},
		definition: {
			name: "名前",
			description: "説明",
			descriptionPlaceholder: "このワークフローが存在する理由に関するオプションのメモ。",
			id: "ID",
			advancedTitle: "高度なアイデンティティ",
			advancedDescription: "安定した ID は、コマンド、保存された実行、および他のワークフローからの参照に使用されます。",
		},
		triggers: {
			addTitle: "トリガーの追加",
			addDescription: "追加のトリガーによって同じワークフローが開始されます。",
			addButton: "トリガーの追加",
			type: "トリガータイプ",
			id: "ID",
			typeLabel: "タイプ",
			tasknotesEvent: "TaskNotesイベント",
			fromStatus: "ステータスから",
			toStatus: "ステータスへ",
			pathGlob: "パスグロブ",
			allowSelfTrigger: "self-triggerを許可する",
			schedule: "スケジュール",
			timezone: "タイムゾーン",
			catchUp: "追いつく",
			every: "毎",
			event: "イベント",
			manualHelp: "ワークフローが有効になっている場合、手動実行がコマンド パレットに表示されます。",
			valuesAvailable: "ステップで使用可能なトリガー値 ({count})",
			advancedTitle: "高度なトリガー オプション",
			advancedDescription: "一致を制限し、安定した ID を保持し、再生動作を制御します。",
			needsAttention: "注意が必要です",
			tooltips: {
				moveUp: "上に移動",
				moveDown: "下に移動",
				delete: "トリガーの削除",
			},
			types: {
				manual: {
					label: "手動",
					description: "明示的に開始された場合にのみ実行されます。",
				},
				tasknotesEvent: {
					label: "TaskNotesイベント",
					description: "TaskNotes が選択されたランタイム イベントを発行するときに実行されます。",
				},
				cron: {
					label: "Cronスケジュール",
					description: "five-part cron スケジュールが現在の分と一致するときに実行されます。",
				},
				interval: {
					label: "間隔",
					description: "Obsidian が開いている間、繰り返し実行されます。",
				},
				obsidianVault: {
					label: "ボールトファイルイベント",
					description: "Obsidian がファイルを作成、変更、削除、または名前変更するときに実行されます。",
				},
				obsidianMetadata: {
					label: "メタデータイベント",
					description: "Obsidian メタデータが変更または解決されるときに実行されます。",
				},
				obsidianWorkspace: {
					label: "ワークスペースイベント",
					description: "ファイルを開いたり、アクティブなリーフを変更したりするなど、選択したワークスペース アクティビティが発生したときに実行されます。",
				},
			},
			events: {
				create: "作成",
				modify: "変更",
				delete: "削除",
				rename: "名前の変更",
				changed: "変更されました",
				deleted: "削除されました",
				resolve: "解決する",
				resolved: "解決済み",
				fileOpen: "ファイルを開く",
				activeLeafChange: "アクティブなリーフが変更されました",
				layoutChange: "レイアウトが変更されました",
			},
			tasknotesEvents: {
				task: {
					created: "タスクが作成されました",
					updated: "タスクが更新されました",
					deleted: "タスクが削除されました",
					moved: "タスクが移動されました",
					status: {
						changed: "タスクのステータスが変更されました",
					},
					completed: "タスクが完了しました",
					uncompleted: "タスクは未完了です",
					archived: "タスクがアーカイブされました",
					unarchived: "タスクのアーカイブが解除されました",
					scheduled: {
						changed: "タスクのスケジュール日が変更されました",
					},
					due: {
						changed: "タスクの期限が変更されました",
					},
					priority: {
						changed: "タスクの優先度が変更されました",
					},
					tags: {
						changed: "タスクタグが変更されました",
					},
					contexts: {
						changed: "タスクのコンテキストが変更されました",
					},
					projects: {
						changed: "タスクプロジェクトが変更されました",
					},
					reminders: {
						changed: "タスクリマインダーが変更されました",
					},
					dependencies: {
						changed: "タスクの依存関係が変更されました",
					},
					recurrence: {
						changed: "タスクの繰り返しが変更されました",
					},
				},
				time: {
					started: "時間追跡が開始されました",
					stopped: "時間追跡が停止しました",
				},
				pomodoro: {
					started: "ポモドーロ始めました",
					completed: "ポモドーロ完了",
					interrupted: "ポモドーロが中断されました",
				},
				recurring: {
					instance: {
						completed: "定期的なインスタンスが完了しました",
						skipped: "定期的なインスタンスはスキップされました",
					},
				},
			},
			summary: {
				statusFromTo: "ステータスが {from} から {to} に変化します",
				statusTo: "ステータスが{to}に変わります",
				statusFrom: "{from}からのステータス変化",
				schedule: "スケジュール {schedule}",
				every: "すべての{every}",
				vaultFile: "ボールト ファイル {event}",
				metadata: "メタデータ {event}",
				workspace: "ワークスペース {event}",
				manual: "手動実行",
			},
			outputs: {
				type: {
					label: "タイプ",
					description: "トリガーの種類。",
				},
				id: {
					label: "ID",
					description: "このワークフローからのトリガー ID。",
				},
				event: {
					label: "イベント",
					description: "実行を開始したイベント名。",
				},
				actualAt: {
					label: "実際の時間",
					description: "ワークフローの実行が開始されたとき。",
				},
				after: {
					path: {
						label: "タスクパス",
						description: "イベント後のタスクのパス。",
					},
					title: {
						label: "タスクのタイトル",
						description: "イベント後のタスクのタイトル。",
					},
					status: {
						label: "現在の状況",
						description: "イベント後のタスクのステータス。",
					},
				},
				before: {
					status: {
						label: "以前のステータス",
						description: "イベント前のタスクのステータス。",
					},
				},
				changes: {
					label: "変更点",
					description: "プロパティ名をキーとするフィールドを変更しました。",
				},
				source: {
					label: "ソース",
					description: "突然変異のソース (指定された場合)。",
				},
				correlationId: {
					label: "相関 ID",
					description: "突然変異相関 ID (指定されている場合)。",
				},
				scheduledAt: {
					label: "予定時刻",
					description: "スケジュールのティック時間。",
				},
				path: {
					label: "パス",
					description: "一致するボールト ファイルのパス。",
				},
				file: {
					path: {
						label: "ファイルパス",
						description: "一致するファイルのパス。",
					},
					name: {
						label: "ファイル名",
						description: "一致するファイル名。",
					},
					extension: {
						label: "延長",
						description: "一致するファイル拡張子。",
					},
				},
				data: {
					label: "データ",
					description: "追加のイベント データ (提供される場合)。",
				},
				manual: {
					label: "手動",
					description: "手動実行の場合は True。",
				},
			},
		},
		steps: {
			addTitle: "次のステップを追加",
			addDescription: "新しいステップは、上記のステップの後に実行されます。",
			addButton: "ステップの追加",
			type: "ステップタイプ",
			id: "ID",
			advancedTitle: "高度なステップオプション",
			advancedDescription: "安定した ID は、後のステップの参照を作成します。バッチ実行では、各値にオプションの を使用します。",
			forEach: "それぞれについて",
			forEachHelp: "バッチ ステップのオプションの配列参照。",
			inputJson: "JSONを入力してください",
			writes: "書きます",
			needsAttention: "注意が必要です",
			outputsAvailable: "後のステップで使用できる出力 ({count})",
			tooltips: {
				moveUp: "上に移動",
				moveDown: "下に移動",
				delete: "ステップの削除",
			},
			unknownCategory: "その他",
			summary: {
				forEach: "{value}ごとに",
			},
		},
		runPolicy: {
			noOverlap: "重複なし",
			onError: "エラー時",
			advancedTitle: "高度な実行制限",
			advancedDescription: "これらの値により、自動化された実行が識別可能かつ制限された状態に保たれます。",
			maxTasks: "最大タスク数",
			source: "ソース",
		},
		footer: {
			openNote: "ノートを開く",
		},
		templateSuggestions: {
			workflowId: "ワークフローID",
			workflowName: "ワークフロー名",
			today: "今日",
			now: "今",
			itemPath: "現在のアイテムのパス",
			triggerValue: "トリガー{label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "名前は必須です。",
			invalidWorkflowId: "小文字、数字、ドット、アンダースコア、またはダッシュを使用してください。まずは手紙から始めましょう。",
			duplicateWorkflowId: "すでに {path} によって使用されています。",
			triggerRequired: "少なくとも 1 つのトリガーを追加します。",
			invalidTriggerId: "トリガー ID は文字で始まり、id-safe 文字を使用する必要があります。",
			duplicateTriggerId: "トリガー ID は一意である必要があります。",
			tasknotesEventRequired: "TaskNotes イベントを選択します。",
			cronScheduleRequired: "cron スケジュールを追加します。",
			intervalRequired: "間隔を追加します。",
			stepRequired: "少なくとも 1 つのステップを追加します。",
			invalidStepId: "ステップ ID は文字で始まり、id-safe 文字を使用する必要があります。",
			duplicateStepId: "ステップ ID は一意である必要があります。",
			unknownStepType: "不明なステップ タイプ: {type}",
			fieldRequired: "{field}は必須です。",
			positiveNumber: "正の数を使用してください。",
			jsonObject: "ステップ入力は JSON オブジェクトである必要があります。",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "タスクの関係",
			timeTracking: "時間の追跡",
			obsidian: "Obsidian",
			controlFlow: "制御フロー",
		},
		common: {
			task: {
				label: "タスク",
				description: "TaskNotes タスクへのボールト パス。トリガーされたタスクのワークフローは通常、{{trigger.after.path}} を使用します。",
			},
			path: {
				label: "パス",
				description: "Markdown ファイルへのボールト パス。",
			},
			outputTask: {
				label: "タスク",
				description: "TaskNotes タスク データを更新しました。",
			},
			outputPath: {
				label: "パス",
				description: "ステップ完了後のタスクのボールト パス。",
			},
		},
		definitions: {
			task: {
				get: {
					label: "タスクの取得",
					description: "パスごとに 1 つのタスクを読み取ります。",
					examples: {
						0: {
							label: "トリガーとなるタスクを読む",
						},
					},
				},
				query: {
					label: "クエリタスク",
					description: "TaskNotes のランタイムクエリ API を使用してタスクを選択します。",
					input: {
						query: {
							label: "クエリ",
							description: "TaskNotes のフィールド、演算子、並び替え、グループ化、上限を使用するランタイムタスククエリです。",
						},
					},
					output: {
						tasks: {
							label: "タスク",
							description: "一致する TaskNotes タスク。",
						},
						count: {
							label: "カウント",
							description: "一致するタスクの数。",
						},
					},
					examples: {
						0: {
							label: "開いているタスク",
						},
					},
				},
				parents: {
					label: "親タスクを取得する",
					description: "タスクのプロジェクトからリンクされている親タスクを読み取ります。",
				},
				subtasks: {
					label: "サブタスクの取得",
					description: "このタスクをプロジェクトとして参照するタスクを読み取ります。",
				},
				blocking: {
					label: "ブロックしているタスクを取得する",
					description: "このタスクによってブロックされているタスクを読み取ります。",
				},
				dependencies: {
					label: "依存関係を取得する",
					description: "このタスクをブロックするタスクを読み取ります。",
					output: {
						dependencies: {
							label: "依存関係",
							description: "解決された TaskNotes タスク データを含む依存関係オブジェクト (利用可能な場合)。",
						},
						tasks: {
							label: "タスク",
							description: "依存関係タスクが解決されました。",
						},
						count: {
							label: "カウント",
							description: "依存関係の数。",
						},
					},
					examples: {
						0: {
							label: "トリガータスクの依存関係を読み取る",
						},
					},
				},
				relationships: {
					label: "関係を取得する",
					description: "1 つのタスクの親、サブタスク、依存関係、およびブロックしているタスクを読み取ります。",
					output: {
						task: {
							label: "タスク",
							description: "タスク。",
						},
						parents: {
							label: "両親",
							description: "親タスク。",
						},
						subtasks: {
							label: "サブタスク",
							description: "サブタスク。",
						},
						dependencies: {
							label: "依存関係",
							description: "このタスクをブロックするタスク。",
						},
						blocking: {
							label: "ブロッキング",
							description: "このタスクによってブロックされたタスク。",
						},
					},
					examples: {
						0: {
							label: "すべての関係を読む",
						},
					},
				},
				create: {
					label: "タスクの作成",
					description: "新しい TaskNotes タスクを作成します。",
					input: {
						title: {
							label: "タイトル",
						},
						status: {
							label: "ステータス",
						},
						priority: {
							label: "優先順位",
						},
						due: {
							label: "期限",
						},
						scheduled: {
							label: "予定されている",
						},
						details: {
							label: "詳細",
						},
					},
					examples: {
						0: {
							label: "受信トレイタスクを作成する",
						},
					},
				},
				patch: {
					label: "パッチタスク",
					description: "タスクフィールドを更新します。",
					input: {
						patch: {
							label: "パッチ",
							description: "ステータス、優先度、期限、スケジュール、タグ、プロジェクト、コンテキストなど、更新するタスク フィールド。",
						},
					},
					examples: {
						0: {
							label: "アクティブとしてマークする",
						},
					},
				},
				set: {
					label: "タスクフィールドを設定する",
					description: "task.patchの別名。",
					input: {
						patch: {
							label: "フィールド",
							description: "設定するタスクのフィールド。",
						},
					},
				},
				move: {
					label: "タスクの移動",
					description: "タスクノートを移動します。",
					input: {
						targetFolder: {
							label: "対象フォルダ",
						},
					},
					examples: {
						0: {
							label: "トリガータスクの移動",
						},
					},
				},
				archive: {
					label: "アーカイブタスク",
					description: "タスクをアーカイブします。",
				},
				unarchive: {
					label: "タスクのアーカイブを解除する",
					description: "タスクのアーカイブを解除します。",
				},
				complete: {
					label: "タスクを完了する",
					description: "タスクを完了としてマークします。",
					input: {
						options: {
							status: {
								label: "完了ステータス",
							},
						},
					},
				},
				uncomplete: {
					label: "未完了のタスク",
					description: "完了したタスクを再度開きます。",
					input: {
						options: {
							status: {
								label: "再開状況",
							},
						},
					},
				},
				reschedule: {
					label: "タスクの再スケジュール",
					description: "予定日を設定またはクリアします。",
					input: {
						date: {
							label: "予定日",
						},
					},
				},
				setDue: {
					label: "期日を設定する",
					description: "期日を設定する",
					input: {
						date: {
							label: "期限",
						},
					},
				},
				clearDue: {
					label: "期日を明確にする",
					description: "期日を明確にする",
				},
				setScheduled: {
					label: "予定日を設定する",
					description: "予定日を設定する",
					input: {
						date: {
							label: "予定日",
						},
					},
				},
				clearScheduled: {
					label: "予定日をクリアする",
					description: "予定日をクリアする",
				},
				addTag: {
					label: "タグを追加",
					description: "タグを追加",
					input: {
						tag: {
							label: "タグ",
						},
					},
				},
				removeTag: {
					label: "タグを削除する",
					description: "タグを削除する",
					input: {
						tag: {
							label: "タグ",
						},
					},
				},
				addProject: {
					label: "プロジェクトの追加",
					description: "プロジェクトの追加",
					input: {
						project: {
							label: "プロジェクト",
						},
					},
				},
				removeProject: {
					label: "プロジェクトの削除",
					description: "プロジェクトの削除",
					input: {
						project: {
							label: "プロジェクト",
						},
					},
				},
				addContext: {
					label: "コンテキストを追加する",
					description: "コンテキストを追加する",
					input: {
						context: {
							label: "コンテキスト",
						},
					},
				},
				removeContext: {
					label: "コンテキストを削除する",
					description: "コンテキストを削除する",
					input: {
						context: {
							label: "コンテキスト",
						},
					},
				},
				addDependency: {
					label: "依存関係を追加する",
					description: "ブロッキング依存関係を追加します。",
					input: {
						dependency: {
							label: "依存関係",
						},
					},
				},
				removeDependency: {
					label: "依存関係を削除する",
					description: "依存関係を削除します。",
					input: {
						uid: {
							label: "依存関係 ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "タイマーを開始します",
					description: "時間の追跡を開始します。",
					input: {
						options: {
							description: {
								label: "説明",
							},
						},
					},
					output: {
						startedAt: {
							label: "に開始",
							description: "ワークフローの実行によって記録された ISO タイムスタンプ。",
						},
					},
				},
				stop: {
					label: "タイマーを停止する",
					description: "時間の追跡を停止します。",
					output: {
						stoppedAt: {
							label: "に立ち寄りました",
							description: "ワークフローの実行によって記録された ISO タイムスタンプ。",
						},
					},
				},
				appendEntry: {
					label: "時間エントリを追加",
					description: "時間エントリを追加します。",
					input: {
						entry: {
							label: "エントリー",
						},
					},
				},
			},
			notice: {
				show: {
					label: "通知を表示する",
					description: "Obsidian 通知を表示します。",
					input: {
						message: {
							label: "メッセージ",
						},
					},
					output: {
						message: {
							label: "メッセージ",
						},
					},
					examples: {
						0: {
							label: "タスクのタイトルを表示",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "ファイルを開く",
					description: "ワークスペースで Vault ファイルを開きます。",
					input: {
						newLeaf: {
							label: "で開く",
							options: {
								current: "現在のリーフ",
								tab: "新しいタブ",
								split: "スプリット",
								window: "ポップアウトウィンドウ",
							},
						},
					},
					output: {
						opened: {
							label: "開いた",
						},
						newLeaf: {
							label: "オープンターゲット",
						},
					},
					examples: {
						0: {
							label: "トリガーファイルを開く",
						},
					},
				},
				createNote: {
					label: "メモを作成する",
					description: "Vault に Markdown メモを作成します。",
					input: {
						content: {
							label: "内容",
						},
					},
					output: {
						created: {
							label: "作成されました",
						},
					},
					examples: {
						0: {
							label: "日付付きのメモを作成する",
						},
					},
				},
				appendNote: {
					label: "メモに追加",
					description: "既存の Markdown メモにテキストを追加します。",
					input: {
						text: {
							label: "テキスト",
						},
					},
					output: {
						appended: {
							label: "追加",
						},
						length: {
							label: "長さ",
						},
					},
					examples: {
						0: {
							label: "トリガーファイルに追加",
						},
					},
				},
				updateFrontmatter: {
					label: "frontmatterを更新",
					description: "top-level frontmatter パッチを Markdown ノートに適用します。",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Top-levelキーで設定します。キーを削除するには、null を使用します。",
						},
					},
					output: {
						updated: {
							label: "更新されました",
						},
						keys: {
							label: "キー",
						},
					},
					examples: {
						0: {
							label: "トリガーファイルをレビュー済みとしてマークする",
						},
					},
				},
				moveFile: {
					label: "ファイルの移動",
					description: "Vault ファイルを移動または名前変更します。",
					input: {
						targetPath: {
							label: "ターゲットパス",
						},
						updateLinks: {
							label: "リンクを更新する",
							description: "Obsidian のファイル マネージャーを使用して、リンクがボールトの設定に従って更新されるようにします。",
						},
					},
					output: {
						moved: {
							label: "移転しました",
						},
						oldPath: {
							label: "古い道",
						},
					},
					examples: {
						0: {
							label: "アーカイブトリガーファイル",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "ワークフローを停止する",
					description: "現在のワークフローの実行を停止します。",
					input: {
						reason: {
							label: "理由",
						},
					},
					output: {
						stopped: {
							label: "停止しました",
						},
						reason: {
							label: "理由",
						},
					},
					examples: {
						0: {
							label: "理性でやめる",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "TaskNotes ランタイム API は使用できません。",
			obsidianUnavailable: "Obsidian アプリ コンテキストが利用できません。",
			requiredText: "ステップ入力には non-empty テキストが必要です: {field}",
		},
	},
};
