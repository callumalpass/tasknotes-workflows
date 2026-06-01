import type { TranslationTree } from "../types";

export const ru: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Отмена",
		clear: "Очистить",
		continue: "Продолжить",
		disabled: "Отключено",
		enabled: "Включено",
		inputs: "Входы",
		maintain: "Поддерживать",
		output: "Выход",
		outputs: "Выходы",
		save: "Сохранить",
		saved: "Сохранено",
		stop: "Стоп",
		summary: "Резюме",
		systemDefault: "Система по умолчанию",
		unsavedChanges: "Несохраненные изменения",
		runStatus: {
			success: "успех",
			failed: "не удалось",
			skipped: "пропущен",
			stopped: "остановился",
		},
		workflowStatus: {
			enabled: "включен",
			disabled: "отключен",
			invalid: "недействительный",
		},
		languages: {
			en: "английский",
		},
	},
	commands: {
		openWorkflows: "Открытые рабочие процессы",
		newWorkflow: "Новый рабочий процесс",
		reloadWorkflows: "Перезагрузить рабочие процессы",
		maintainDefaultWorkflows: "Сохранение файлов рабочего процесса по умолчанию",
		runWorkflow: "Запустить: {name}",
	},
	notices: {
		languageChanged: "Язык изменен на {language}.",
		workflowsReloaded: "Рабочие процессы перезагружены.",
		defaultFilesCreated: "Создан {count} по умолчанию {fileLabel}.",
		defaultFilesAlreadyPresent: "Файлы рабочего процесса по умолчанию уже присутствуют.",
		workflowCommandUnavailable: "Команда рабочего процесса больше недоступна.",
		workflowRunCompleted: "Запустите {status}: {name}",
		workflowDryRunCompleted: "Сухой прогон {status}: {name}",
		workflowBaseNotFound: "База рабочего процесса не найдена: {path}",
		runHistoryCleared: "История выполнения рабочего процесса очищена.",
		workflowSaved: "Сохраненный рабочий процесс: {name}.",
		discardChanges: "Несохраненные изменения. Нажмите «Отмена» еще раз, чтобы отменить.",
		discardAndOpenNote: "Несохраненные изменения. Нажмите «Открыть заметку» еще раз, чтобы отменить и открыть заметку.",
	},
	settings: {
		workflowFiles: {
			heading: "Файлы рабочего процесса",
			folder: {
				name: "Папка рабочего процесса",
				description: "Папка хранилища, содержащая определения рабочих процессов Markdown.",
			},
			base: {
				name: "База рабочих процессов",
				description: "Путь к хранилищу для представления рабочего процесса сгенерированных баз.",
			},
			createDefaults: {
				name: "Создание настроек рабочего процесса по умолчанию",
				description: "Напишите примеры рабочих процессов при загрузке плагина или при сохранении значений по умолчанию.",
			},
			createBase: {
				name: "Создать базу рабочих процессов",
				description: "Запишите представление рабочего процесса сгенерированных баз при загрузке плагина или при сохранении значений по умолчанию.",
			},
			maintainDefaults: {
				name: "Сохранять настройки по умолчанию",
				description: "Создавайте недостающие примечания к рабочему процессу и базу рабочих процессов, не перезаписывая существующие файлы.",
			},
		},
		triggers: {
			heading: "Триггеры",
			tasknotesEvents: {
				name: "Триггеры событий TaskNotes",
				description: "Запускайте рабочие процессы из событий среды выполнения TaskNotes API, таких как task.status.changed.",
			},
			scheduled: {
				name: "Запланированные триггеры",
				description: "Запускайте cron и интервальные рабочие процессы, пока Obsidian открыт.",
			},
			obsidian: {
				name: "Расширенные триггеры Obsidian",
				description: "Разрешить триггеры хранилища и рабочей области Obsidian. Фильтры путей должны быть узкими.",
			},
			minInterval: {
				name: "Минимальный интервал",
				description: "Наименьшая допустимая интервальная частота запуска в миллисекундах.",
			},
		},
		runLogs: {
			heading: "Журналы запуска",
			folder: {
				name: "Папка журнала запуска",
				description: "Необязательный путь к хранилищу для отчетов о прогонах и файлов подробных сведений. Оставьте пустым, чтобы использовать папку конфигурации этого плагина.",
			},
			level: {
				name: "Уровень журнала запуска",
				description: "Контролирует, сколько подробностей сохраняется в записях выполнения.",
				options: {
					summary: "Резюме",
					inputs: "Входы",
					inputsAndOutputs: "Входы и выходы",
				},
			},
			retention: {
				name: "Запуски сохраняются для каждого рабочего процесса",
				description: "По истечении этого предела старые файлы сведений удаляются.",
			},
			clear: {
				name: "Очистить историю запусков",
				description: "Удалите журналы выполнения рабочего процесса plugin-local.",
			},
		},
		language: {
			heading: "Язык интерфейса",
			description: "Измените язык команд, настроек, уведомлений и представлений TaskNotes Workflows.",
			name: "UI язык",
			dropdownDescription: "Выберите язык, используемый для текста интерфейса TaskNotes Workflows.",
		},
	},
	baseView: {
		title: "Рабочие процессы",
		tasknotesAvailable: "Доступна среда выполнения TaskNotes API.",
		tasknotesUnavailable: "Среда выполнения TaskNotes API недоступна; Шаги task-writing не могут быть выполнены.",
		empty: "Рабочие процессы не найдены",
		newWorkflow: "Новый рабочий процесс",
	},
	workflowCard: {
		labels: {
			triggers: "Триггеры",
			steps: "Шаги",
			lastRun: "Последний запуск",
			noOverlap: "без перекрытия",
		},
		tooltips: {
			edit: "Редактировать рабочий процесс",
			dryRun: "Рабочий процесс пробного прогона",
			run: "Запустить рабочий процесс",
			history: "История запуска",
			openNote: "Открыть заметку о рабочем процессе",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "каждый {every}",
			vault: "хранилище {event}",
			metadata: "метаданные {event}",
			workspace: "рабочая область {event}",
			manual: "руководство",
		},
	},
	runHistory: {
		title: "История запуска",
		runs: "Бежит",
		latest: "Последние",
		trigger: "Триггер",
		duration: "Продолжительность",
		runId: "Запустите ID",
		dryRun: "пробный ход",
		stepCount: {
			one: "{count} шаг",
			other: "{count} шаги",
		},
		input: "Ввод",
		output: "Выход",
		empty: {
			diagnostics: "Диагностика рабочего процесса должна быть исправлена, прежде чем можно будет отобразить прогоны.",
			loading: "Загрузка истории запусков...",
			noRuns: "Пробегов пока не зафиксировано.",
			missingDetail: "Деталь пробега не найдена.",
		},
	},
	engine: {
		workflowInvalid: "Недопустимый рабочий процесс: {path}.",
		workflowAlreadyRunning: "Рабочий процесс уже запущен.",
		workflowDisabled: "Рабочий процесс отключен.",
		conditionsDidNotMatch: "Условия рабочего процесса не совпали.",
		stepFailed: "Шаг не удался.",
		unknownStepType: "Неизвестный тип шага: {type}.",
		forEachNonArray: "forEach преобразуется в значение non-array.",
		forEachTooManyItems: "forEach выбрал элементы {count} выше run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Редактировать рабочий процесс",
			new: "Новый рабочий процесс",
		},
		untitledWorkflow: "Рабочий процесс без названия",
		workflowEditor: "Редактор рабочего процесса",
		sections: {
			definition: {
				label: "Определение",
				description: "Имя и личность",
				title: "Определение",
				body: "Назовите этот рабочий процесс и сохраните его стабильную идентичность.",
			},
			triggers: {
				label: "Триггеры",
				description: "Начать мероприятия",
				title: "Триггеры",
				body: "Запускайте рабочий процесс вручную по расписанию из событий TaskNotes или из выбранных событий Obsidian.",
			},
			steps: {
				label: "Шаги",
				description: "Действия",
				title: "Шаги",
				body: "Шаги идут сверху вниз. На результаты предыдущих шагов можно ссылаться на более поздних шагах.",
			},
			run: {
				label: "Запустить политику",
				description: "Ограничения и ошибки",
				title: "Запустить политику",
				body: "Выберите поведение при сбое по умолчанию. Для большинства рабочих процессов пределы безопасности могут оставаться значениями по умолчанию.",
			},
		},
		summary: {
			triggerCount: {
				one: "Триггер {count}",
				other: "Триггеры {count}",
			},
			stepCount: {
				one: "{count} шаг",
				other: "{count} шаги",
			},
			noOverlap: "Нет перекрытия",
			overlapAllowed: "Перекрытие разрешено",
			enabledDescription: "Могут запускаться ручные, запланированные и событийные триггеры.",
			disabledDescription: "Ручные, запланированные и событийные триггеры не будут запускаться.",
		},
		definition: {
			name: "Имя",
			description: "Описание",
			descriptionPlaceholder: "Необязательное примечание о том, почему существует этот рабочий процесс.",
			id: "ID",
			advancedTitle: "Расширенная идентификация",
			advancedDescription: "Стабильные идентификаторы используются для команд, сохраненных запусков и ссылок из других рабочих процессов.",
		},
		triggers: {
			addTitle: "Добавить триггер",
			addDescription: "Дополнительные триггеры запускают тот же рабочий процесс.",
			addButton: "Добавить триггер",
			type: "Тип триггера",
			id: "ID",
			typeLabel: "Тип",
			tasknotesEvent: "Событие TaskNotes",
			fromStatus: "Из статуса",
			toStatus: "К статусу",
			pathGlob: "Объединённый путь",
			allowSelfTrigger: "Разрешить self-trigger",
			schedule: "Расписание",
			timezone: "Часовой пояс",
			catchUp: "Догонять",
			every: "Каждый",
			event: "Событие",
			manualHelp: "Ручные запуски отображаются в палитре команд, когда рабочий процесс включен.",
			valuesAvailable: "Значения триггера, доступные для шагов ({count})",
			advancedTitle: "Расширенные параметры триггера",
			advancedDescription: "Ограничьте совпадение, сохраните стабильный идентификатор и контролируйте поведение воспроизведения.",
			needsAttention: "Требует внимания",
			tooltips: {
				moveUp: "Вверх",
				moveDown: "Двигаться вниз",
				delete: "Удалить триггер",
			},
			types: {
				manual: {
					label: "Руководство",
					description: "Запускается только при явном запуске.",
				},
				tasknotesEvent: {
					label: "Событие TaskNotes",
					description: "Запускается, когда TaskNotes генерирует выбранное событие времени выполнения.",
				},
				cron: {
					label: "Расписание Cron",
					description: "Запускается, когда расписание five-part cron соответствует текущей минуте.",
				},
				interval: {
					label: "Интервал",
					description: "Запускается повторно, пока Obsidian открыт.",
				},
				obsidianVault: {
					label: "Событие файла хранилища",
					description: "Запускается, когда Obsidian создает, изменяет, удаляет или переименовывает файл.",
				},
				obsidianMetadata: {
					label: "Событие метаданных",
					description: "Запускается, когда метаданные Obsidian изменяются или разрешаются.",
				},
				obsidianWorkspace: {
					label: "Событие рабочей области",
					description: "Запускается при выполнении выбранного действия в рабочей области, например при открытии файла или изменении активного листа.",
				},
			},
			events: {
				create: "Создать",
				modify: "Изменить",
				delete: "Удалить",
				rename: "Переименовать",
				changed: "Изменено",
				deleted: "Удалено",
				resolve: "Решить",
				resolved: "Решено",
				fileOpen: "Файл открыт",
				activeLeafChange: "Активный лист изменен",
				layoutChange: "Макет изменен",
			},
			tasknotesEvents: {
				task: {
					created: "Задача создана",
					updated: "Задача обновлена",
					deleted: "Задача удалена",
					moved: "Задача перемещена",
					status: {
						changed: "Статус задачи изменен",
					},
					completed: "Задача выполнена",
					uncompleted: "Задача не выполнена",
					archived: "Задача заархивирована",
					unarchived: "Задача разархивирована",
					scheduled: {
						changed: "Запланированная дата задачи изменена",
					},
					due: {
						changed: "Срок выполнения задачи изменен",
					},
					priority: {
						changed: "Приоритет задачи изменен",
					},
					tags: {
						changed: "Теги задач изменены",
					},
					contexts: {
						changed: "Контексты задач изменены",
					},
					projects: {
						changed: "Проекты задач изменены",
					},
					reminders: {
						changed: "Напоминания о задачах изменены",
					},
					dependencies: {
						changed: "Зависимости задач изменены",
					},
					recurrence: {
						changed: "Повторение задачи изменено",
					},
				},
				time: {
					started: "Отслеживание времени начато",
					stopped: "Отслеживание времени остановлено",
				},
				pomodoro: {
					started: "Помидор начался",
					completed: "Помидор завершен",
					interrupted: "Помидор прерван",
				},
				recurring: {
					instance: {
						completed: "Повторяющийся экземпляр завершен",
						skipped: "Повторяющийся экземпляр пропущен",
					},
				},
			},
			summary: {
				statusFromTo: "Статус меняется с {from} на {to}.",
				statusTo: "Статус меняется на {to}",
				statusFrom: "Статус меняется с {from}",
				schedule: "Расписание {schedule}",
				every: "Каждый {every}",
				vaultFile: "Файл хранилища {event}",
				metadata: "Метаданные {event}",
				workspace: "Рабочая область {event}",
				manual: "Ручной запуск",
			},
			outputs: {
				type: {
					label: "Тип",
					description: "Тип триггера.",
				},
				id: {
					label: "ID",
					description: "Триггер ID из этого рабочего процесса.",
				},
				event: {
					label: "Событие",
					description: "Имя события, с которого начался запуск.",
				},
				actualAt: {
					label: "Фактическое время",
					description: "Когда начался рабочий процесс.",
				},
				after: {
					path: {
						label: "Путь к задаче",
						description: "Путь задачи после события.",
					},
					title: {
						label: "Название задачи",
						description: "Название задачи после события.",
					},
					status: {
						label: "Текущий статус",
						description: "Статус задачи после события.",
					},
				},
				before: {
					status: {
						label: "Предыдущий статус",
						description: "Статус задачи до события.",
					},
				},
				changes: {
					label: "Изменения",
					description: "Изменены поля, связанные с именем свойства.",
				},
				source: {
					label: "Источник",
					description: "Источник мутации, если он указан.",
				},
				correlationId: {
					label: "Корреляция ID",
					description: "Корреляция мутации ID, если она предусмотрена.",
				},
				scheduledAt: {
					label: "Запланированное время",
					description: "График тикающего времени.",
				},
				path: {
					label: "Путь",
					description: "Соответствующий путь к файлу хранилища.",
				},
				file: {
					path: {
						label: "Путь к файлу",
						description: "Соответствующий путь к файлу.",
					},
					name: {
						label: "Имя файла",
						description: "Соответствующее имя файла.",
					},
					extension: {
						label: "Расширение",
						description: "Соответствующее расширение файла.",
					},
				},
				data: {
					label: "Данные",
					description: "Дополнительные данные о событии, если они предусмотрены.",
				},
				manual: {
					label: "Руководство",
					description: "Верно для ручного запуска.",
				},
			},
		},
		steps: {
			addTitle: "Добавить следующий шаг",
			addDescription: "Новый шаг будет выполнен после шагов, описанных выше.",
			addButton: "Добавить шаг",
			type: "Тип шага",
			id: "ID",
			advancedTitle: "Расширенные параметры шага",
			advancedDescription: "Стабильные идентификаторы создают ссылки для последующих шагов. Пакетные запуски используют необязательный параметр для каждого значения.",
			forEach: "Для каждого",
			forEachHelp: "Необязательная ссылка на массив для шагов пакета.",
			inputJson: "Ввод JSON",
			writes: "пишет",
			needsAttention: "Требует внимания",
			outputsAvailable: "Выходы, доступные для последующих шагов ({count})",
			tooltips: {
				moveUp: "Вверх",
				moveDown: "Двигаться вниз",
				delete: "Удалить шаг",
			},
			unknownCategory: "Другое",
			summary: {
				forEach: "для каждого {value}",
			},
		},
		runPolicy: {
			noOverlap: "Нет перекрытия",
			onError: "При ошибке",
			advancedTitle: "Расширенные ограничения пробега",
			advancedDescription: "Эти значения делают автоматические прогоны идентифицируемыми и ограниченными.",
			maxTasks: "Макс задач",
			source: "Источник",
		},
		footer: {
			openNote: "Открыть заметку",
		},
		templateSuggestions: {
			workflowId: "Идентификатор рабочего процесса",
			workflowName: "Имя рабочего процесса",
			today: "Сегодня",
			now: "Сейчас",
			itemPath: "Текущий путь к элементу",
			triggerValue: "Триггер {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "Требуется имя.",
			invalidWorkflowId: "Используйте строчные буквы, цифры, точки, подчеркивания или тире. Начните с письма.",
			duplicateWorkflowId: "Уже используется {path}.",
			triggerRequired: "Добавьте хотя бы один триггер.",
			invalidTriggerId: "Идентификатор триггера должен начинаться с буквы и содержать символы id-safe.",
			duplicateTriggerId: "Идентификаторы триггеров должны быть уникальными.",
			tasknotesEventRequired: "Выберите событие TaskNotes.",
			cronScheduleRequired: "Добавьте расписание cron.",
			intervalRequired: "Добавьте интервал.",
			stepRequired: "Добавьте хотя бы один шаг.",
			invalidStepId: "Идентификатор шага должен начинаться с буквы и содержать символы id-safe.",
			duplicateStepId: "Идентификаторы шагов должны быть уникальными.",
			unknownStepType: "Неизвестный тип шага: {type}.",
			fieldRequired: "{field} является обязательным.",
			positiveNumber: "Используйте положительное число.",
			jsonObject: "Входные данные шага должны быть объектом JSON.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Отношения задач",
			timeTracking: "Учет времени",
			obsidian: "Obsidian",
			controlFlow: "Поток управления",
		},
		common: {
			task: {
				label: "Задача",
				description: "Путь хранилища к задаче TaskNotes. Рабочие процессы с триггерными задачами обычно используют {{trigger.after.path}}.",
			},
			path: {
				label: "Путь",
				description: "Путь хранилища к файлу Markdown.",
			},
			outputTask: {
				label: "Задача",
				description: "Обновлены данные задачи TaskNotes.",
			},
			outputPath: {
				label: "Путь",
				description: "Путь к хранилищу задачи после завершения шага.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "Получить задачу",
					description: "Считывает одну задачу по пути.",
					examples: {
						0: {
							label: "Прочитайте триггерную задачу",
						},
					},
				},
				query: {
					label: "Задачи запроса",
					description: "Выбирает задачи с помощью API запросов времени выполнения TaskNotes.",
					input: {
						query: {
							label: "Запрос",
							description: "Запрос задач времени выполнения с полями, операторами, сортировкой, группировкой и лимитом TaskNotes.",
						},
					},
					output: {
						tasks: {
							label: "Задачи",
							description: "Соответствующие задачи TaskNotes.",
						},
						count: {
							label: "Граф",
							description: "Количество совпадающих задач.",
						},
					},
					examples: {
						0: {
							label: "Открытые задачи",
						},
					},
				},
				parents: {
					label: "Получить родительские задачи",
					description: "Считывает родительские задачи, связанные с проектами задач.",
				},
				subtasks: {
					label: "Получить подзадачи",
					description: "Считывает задачи, которые ссылаются на эту задачу как на проект.",
				},
				blocking: {
					label: "Получить задачи блокировки",
					description: "Читает задачи, которые заблокированы этой задачей.",
				},
				dependencies: {
					label: "Получить зависимости",
					description: "Читает задачи, которые блокируют эту задачу.",
					output: {
						dependencies: {
							label: "Зависимости",
							description: "Объекты зависимостей с решенными данными задачи TaskNotes, если они доступны.",
						},
						tasks: {
							label: "Задачи",
							description: "Решены задачи зависимостей.",
						},
						count: {
							label: "Граф",
							description: "Количество зависимостей.",
						},
					},
					examples: {
						0: {
							label: "Чтение зависимостей триггерной задачи",
						},
					},
				},
				relationships: {
					label: "Получить отношения",
					description: "Считывает родителей, подзадачи, зависимости и блокирующие задачи для одной задачи.",
					output: {
						task: {
							label: "Задача",
							description: "Задача.",
						},
						parents: {
							label: "Родители",
							description: "Родительские задачи.",
						},
						subtasks: {
							label: "Подзадачи",
							description: "Подзадачи.",
						},
						dependencies: {
							label: "Зависимости",
							description: "Задачи, которые блокируют эту задачу.",
						},
						blocking: {
							label: "Блокировка",
							description: "Задачи, заблокированные этой задачей.",
						},
					},
					examples: {
						0: {
							label: "Прочитать все отношения",
						},
					},
				},
				create: {
					label: "Создать задачу",
					description: "Создает новую задачу TaskNotes.",
					input: {
						title: {
							label: "Название",
						},
						status: {
							label: "Статус",
						},
						priority: {
							label: "Приоритет",
						},
						due: {
							label: "Срок погашения",
						},
						scheduled: {
							label: "Запланировано",
						},
						details: {
							label: "Подробности",
						},
					},
					examples: {
						0: {
							label: "Создать задачу входящих сообщений",
						},
					},
				},
				patch: {
					label: "Задача исправления",
					description: "Обновляет поля задач.",
					input: {
						patch: {
							label: "Патч",
							description: "Поля задач для обновления, такие как статус, приоритет, срок выполнения, запланированные, теги, проекты или контексты.",
						},
					},
					examples: {
						0: {
							label: "Отметить как активный",
						},
					},
				},
				set: {
					label: "Установить поля задач",
					description: "Псевдоним task.patch.",
					input: {
						patch: {
							label: "Поля",
							description: "Поля задач для установки.",
						},
					},
				},
				move: {
					label: "Переместить задачу",
					description: "Перемещает заметку о задаче.",
					input: {
						targetFolder: {
							label: "Целевая папка",
						},
					},
					examples: {
						0: {
							label: "Переместить триггерную задачу",
						},
					},
				},
				archive: {
					label: "Задача архивирования",
					description: "Архивирует задачу.",
				},
				unarchive: {
					label: "Разархивировать задачу",
					description: "Разархивирует задачу.",
				},
				complete: {
					label: "Выполнить задачу",
					description: "Отмечает задачу выполненной.",
					input: {
						options: {
							status: {
								label: "Завершенный статус",
							},
						},
					},
				},
				uncomplete: {
					label: "Незавершенная задача",
					description: "Повторно открывает выполненную задачу.",
					input: {
						options: {
							status: {
								label: "Статус повторного открытия",
							},
						},
					},
				},
				reschedule: {
					label: "Перепланировать задачу",
					description: "Устанавливает или очищает запланированную дату.",
					input: {
						date: {
							label: "Запланированная дата",
						},
					},
				},
				setDue: {
					label: "Установить дату сдачи",
					description: "Установить дату сдачи",
					input: {
						date: {
							label: "Срок сдачи",
						},
					},
				},
				clearDue: {
					label: "Очистить дату сдачи",
					description: "Очистить дату сдачи",
				},
				setScheduled: {
					label: "Установить запланированную дату",
					description: "Установить запланированную дату",
					input: {
						date: {
							label: "Запланированная дата",
						},
					},
				},
				clearScheduled: {
					label: "Очистить запланированную дату",
					description: "Очистить запланированную дату",
				},
				addTag: {
					label: "Добавить тег",
					description: "Добавить тег",
					input: {
						tag: {
							label: "Тег",
						},
					},
				},
				removeTag: {
					label: "Удалить тег",
					description: "Удалить тег",
					input: {
						tag: {
							label: "Тег",
						},
					},
				},
				addProject: {
					label: "Добавить проект",
					description: "Добавить проект",
					input: {
						project: {
							label: "Проект",
						},
					},
				},
				removeProject: {
					label: "Удалить проект",
					description: "Удалить проект",
					input: {
						project: {
							label: "Проект",
						},
					},
				},
				addContext: {
					label: "Добавить контекст",
					description: "Добавить контекст",
					input: {
						context: {
							label: "Контекст",
						},
					},
				},
				removeContext: {
					label: "Удалить контекст",
					description: "Удалить контекст",
					input: {
						context: {
							label: "Контекст",
						},
					},
				},
				addDependency: {
					label: "Добавить зависимость",
					description: "Добавляет блокирующую зависимость.",
					input: {
						dependency: {
							label: "Зависимость",
						},
					},
				},
				removeDependency: {
					label: "Удалить зависимость",
					description: "Удаляет зависимость.",
					input: {
						uid: {
							label: "Зависимость ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Запустить таймер",
					description: "Запускает учет времени.",
					input: {
						options: {
							description: {
								label: "Описание",
							},
						},
					},
					output: {
						startedAt: {
							label: "Началось с",
							description: "Временная метка ISO, записанная при выполнении рабочего процесса.",
						},
					},
				},
				stop: {
					label: "Остановить таймер",
					description: "Останавливает учет времени.",
					output: {
						stoppedAt: {
							label: "Остановился на",
							description: "Временная метка ISO, записанная при выполнении рабочего процесса.",
						},
					},
				},
				appendEntry: {
					label: "Добавить запись времени",
					description: "Добавляет запись времени.",
					input: {
						entry: {
							label: "Вход",
						},
					},
				},
			},
			notice: {
				show: {
					label: "Показать уведомление",
					description: "Показывает уведомление Obsidian.",
					input: {
						message: {
							label: "Сообщение",
						},
					},
					output: {
						message: {
							label: "Сообщение",
						},
					},
					examples: {
						0: {
							label: "Показать название задачи",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Открыть файл",
					description: "Открывает файл хранилища в рабочей области.",
					input: {
						newLeaf: {
							label: "Открыть через",
							options: {
								current: "Текущий лист",
								tab: "Новая вкладка",
								split: "Сплит",
								window: "Всплывающее окно",
							},
						},
					},
					output: {
						opened: {
							label: "Открыто",
						},
						newLeaf: {
							label: "Открытая цель",
						},
					},
					examples: {
						0: {
							label: "Открыть файл триггера",
						},
					},
				},
				createNote: {
					label: "Создать заметку",
					description: "Создает заметку Markdown в хранилище.",
					input: {
						content: {
							label: "Содержание",
						},
					},
					output: {
						created: {
							label: "Создано",
						},
					},
					examples: {
						0: {
							label: "Создать датированную заметку",
						},
					},
				},
				appendNote: {
					label: "Добавить к заметке",
					description: "Добавляет текст к существующей заметке Markdown.",
					input: {
						text: {
							label: "Текст",
						},
					},
					output: {
						appended: {
							label: "Добавлено",
						},
						length: {
							label: "Длина",
						},
					},
					examples: {
						0: {
							label: "Добавить к триггерному файлу",
						},
					},
				},
				updateFrontmatter: {
					label: "Обновление frontmatter",
					description: "Применяет патч top-level frontmatter к заметке Markdown.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Ключи Top-level для установки. Используйте null для удаления ключа.",
						},
					},
					output: {
						updated: {
							label: "Обновлено",
						},
						keys: {
							label: "Ключи",
						},
					},
					examples: {
						0: {
							label: "Отметить триггерный файл как проверенный",
						},
					},
				},
				moveFile: {
					label: "Переместить файл",
					description: "Перемещает или переименовывает файл хранилища.",
					input: {
						targetPath: {
							label: "Целевой путь",
						},
						updateLinks: {
							label: "Обновить ссылки",
							description: "Используйте файловый менеджер Obsidian, чтобы ссылки обновлялись в соответствии с настройками хранилища.",
						},
					},
					output: {
						moved: {
							label: "Перемещено",
						},
						oldPath: {
							label: "Старый путь",
						},
					},
					examples: {
						0: {
							label: "Архивировать триггерный файл",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Остановить рабочий процесс",
					description: "Останавливает выполнение текущего рабочего процесса.",
					input: {
						reason: {
							label: "Причина",
						},
					},
					output: {
						stopped: {
							label: "Остановлено",
						},
						reason: {
							label: "Причина",
						},
					},
					examples: {
						0: {
							label: "Остановитесь разумно",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "Среда выполнения TaskNotes API недоступна.",
			obsidianUnavailable: "Контекст приложения Obsidian недоступен.",
			requiredText: "Для пошагового ввода требуется текст non-empty: {field}.",
		},
	},
};
