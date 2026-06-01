import type { TranslationTree } from "../types";

export const pt: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Cancelar",
		clear: "Limpar",
		continue: "Continuar",
		disabled: "Desativado",
		enabled: "Habilitado",
		inputs: "Entradas",
		maintain: "Manter",
		output: "Saída",
		outputs: "Resultados",
		save: "Salvar",
		saved: "Salvo",
		stop: "Pare",
		summary: "Resumo",
		systemDefault: "Padrão do sistema",
		unsavedChanges: "Alterações não salvas",
		runStatus: {
			success: "sucesso",
			failed: "falhou",
			skipped: "ignorado",
			stopped: "parou",
		},
		workflowStatus: {
			enabled: "habilitado",
			disabled: "desativado",
			invalid: "inválido",
		},
		languages: {
			en: "Inglês",
		},
	},
	commands: {
		openWorkflows: "Fluxos de trabalho abertos",
		newWorkflow: "Novo fluxo de trabalho",
		reloadWorkflows: "Recarregar fluxos de trabalho",
		maintainDefaultWorkflows: "Manter arquivos de fluxo de trabalho padrão",
		runWorkflow: "Execute: {name}",
	},
	notices: {
		languageChanged: "Idioma alterado para {language}.",
		workflowsReloaded: "Fluxos de trabalho recarregados.",
		defaultFilesCreated: "Criado {count} padrão {fileLabel}.",
		defaultFilesAlreadyPresent: "Os arquivos de fluxo de trabalho padrão já estão presentes.",
		workflowCommandUnavailable: "O comando Workflow não está mais disponível.",
		workflowRunCompleted: "Execute {status}: {name}",
		workflowDryRunCompleted: "Funcionamento a seco {status}: {name}",
		workflowBaseNotFound: "Base de fluxo de trabalho não encontrada: {path}",
		runHistoryCleared: "O histórico de execução do fluxo de trabalho foi apagado.",
		workflowSaved: "Fluxo de trabalho salvo: {name}",
		discardChanges: "Alterações não salvas. Pressione Cancelar novamente para descartar.",
		discardAndOpenNote: "Alterações não salvas. Pressione Abrir nota novamente para descartar e abrir a nota.",
	},
	settings: {
		workflowFiles: {
			heading: "Arquivos de fluxo de trabalho",
			folder: {
				name: "Pasta de fluxo de trabalho",
				description: "Pasta do Vault contendo definições de fluxo de trabalho Markdown.",
			},
			base: {
				name: "Base de fluxo de trabalho",
				description: "Caminho do vault para a visualização do fluxo de trabalho de bases geradas.",
			},
			createDefaults: {
				name: "Criar padrões de fluxo de trabalho",
				description: "Escreva notas de fluxo de trabalho de exemplo quando o plug-in for carregado ou quando os padrões forem mantidos.",
			},
			createBase: {
				name: "Criar base de fluxo de trabalho",
				description: "Escreva a visualização do fluxo de trabalho das bases geradas quando o plug-in for carregado ou quando os padrões forem mantidos.",
			},
			maintainDefaults: {
				name: "Manter padrões",
				description: "Crie notas de fluxo de trabalho ausentes e a base do fluxo de trabalho sem substituir os arquivos existentes.",
			},
		},
		triggers: {
			heading: "Gatilhos",
			tasknotesEvents: {
				name: "Gatilhos de evento TaskNotes",
				description: "Execute fluxos de trabalho de eventos API de tempo de execução TaskNotes, como task.status.changed.",
			},
			scheduled: {
				name: "Gatilhos agendados",
				description: "Execute cron e fluxos de trabalho de intervalo enquanto Obsidian estiver aberto.",
			},
			obsidian: {
				name: "Gatilhos Obsidian avançados",
				description: "Permitir gatilhos de vault e espaço de trabalho Obsidian. Mantenha os filtros de caminho estreitos.",
			},
			minInterval: {
				name: "Intervalo mínimo",
				description: "Frequência de acionamento de intervalo mais baixa permitida em milissegundos.",
			},
		},
		runLogs: {
			heading: "Executar registros",
			folder: {
				name: "Executar pasta de log",
				description: "Caminho opcional do vault para resumos de execução e arquivos detalhados. Deixe em branco para usar a pasta de configuração deste plugin.",
			},
			level: {
				name: "Nível de log de execução",
				description: "Controla quantos detalhes são mantidos nos registros de execução.",
				options: {
					summary: "Resumo",
					inputs: "Entradas",
					inputsAndOutputs: "Entradas e saídas",
				},
			},
			retention: {
				name: "Execuções retidas por fluxo de trabalho",
				description: "Arquivos de detalhes antigos são excluídos após esse limite.",
			},
			clear: {
				name: "Limpar histórico de execução",
				description: "Exclua os logs de execução do fluxo de trabalho plugin-local.",
			},
		},
		language: {
			heading: "Idioma da interface",
			description: "Altere o idioma dos comandos, configurações, avisos e visualizações TaskNotes Workflows.",
			name: "Idioma UI",
			dropdownDescription: "Selecione o idioma usado para o texto da interface TaskNotes Workflows.",
		},
	},
	baseView: {
		title: "Fluxos de trabalho",
		tasknotesAvailable: "O tempo de execução TaskNotes API está disponível.",
		tasknotesUnavailable: "O tempo de execução TaskNotes API não está disponível; As etapas task-writing não podem ser executadas.",
		empty: "Nenhum fluxo de trabalho encontrado",
		newWorkflow: "Novo fluxo de trabalho",
	},
	workflowCard: {
		labels: {
			triggers: "Gatilhos",
			steps: "Passos",
			lastRun: "Última execução",
			noOverlap: "sem sobreposição",
		},
		tooltips: {
			edit: "Editar fluxo de trabalho",
			dryRun: "Fluxo de trabalho de simulação",
			run: "Executar fluxo de trabalho",
			history: "Histórico de execução",
			openNote: "Abrir nota de fluxo de trabalho",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "cada {every}",
			vault: "cofre {event}",
			metadata: "metadados {event}",
			workspace: "área de trabalho {event}",
			manual: "manual",
		},
	},
	runHistory: {
		title: "Histórico de execução",
		runs: "Corre",
		latest: "Mais recente",
		trigger: "Gatilho",
		duration: "Duração",
		runId: "Execute ID",
		dryRun: "ensaio",
		stepCount: {
			one: "Etapa {count}",
			other: "Etapas {count}",
		},
		input: "Entrada",
		output: "Saída",
		empty: {
			diagnostics: "O diagnóstico do fluxo de trabalho deve ser corrigido antes que as execuções possam ser mostradas.",
			loading: "Carregando histórico de execução...",
			noRuns: "Nenhuma corrida registrada ainda.",
			missingDetail: "O detalhe da execução não foi encontrado.",
		},
	},
	engine: {
		workflowInvalid: "O fluxo de trabalho é inválido: {path}",
		workflowAlreadyRunning: "O fluxo de trabalho já está em execução.",
		workflowDisabled: "O fluxo de trabalho está desativado.",
		conditionsDidNotMatch: "As condições do fluxo de trabalho não correspondiam.",
		stepFailed: "Falha na etapa.",
		unknownStepType: "Tipo de etapa desconhecido: {type}",
		forEachNonArray: "forEach resolvido para um valor non-array.",
		forEachTooManyItems: "forEach selecionou itens {count}, acima de run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Editar fluxo de trabalho",
			new: "Novo fluxo de trabalho",
		},
		untitledWorkflow: "Fluxo de trabalho sem título",
		workflowEditor: "Editor de fluxo de trabalho",
		sections: {
			definition: {
				label: "Definição",
				description: "Nome e identidade",
				title: "Definição",
				body: "Dê um nome a esse fluxo de trabalho e mantenha sua identidade estável.",
			},
			triggers: {
				label: "Gatilhos",
				description: "Iniciar eventos",
				title: "Gatilhos",
				body: "Execute o fluxo de trabalho manualmente, de acordo com um agendamento, a partir de eventos TaskNotes ou de eventos Obsidian selecionados.",
			},
			steps: {
				label: "Passos",
				description: "Ações",
				title: "Passos",
				body: "As etapas vão de cima para baixo. As saídas das etapas anteriores podem ser referenciadas pelas etapas posteriores.",
			},
			run: {
				label: "Executar política",
				description: "Limites e erros",
				title: "Executar política",
				body: "Escolha o comportamento de falha padrão. Os limites de segurança podem permanecer nos padrões para a maioria dos fluxos de trabalho.",
			},
		},
		summary: {
			triggerCount: {
				one: "Gatilho {count}",
				other: "Gatilhos {count}",
			},
			stepCount: {
				one: "Etapa {count}",
				other: "Etapas {count}",
			},
			noOverlap: "Sem sobreposição",
			overlapAllowed: "Sobreposição permitida",
			enabledDescription: "Gatilhos manuais, agendados e de eventos podem ser executados.",
			disabledDescription: "Os acionadores manuais, agendados e de eventos não serão executados.",
		},
		definition: {
			name: "Nome",
			description: "Descrição",
			descriptionPlaceholder: "Observação opcional sobre por que esse fluxo de trabalho existe.",
			id: "ID",
			advancedTitle: "Identidade avançada",
			advancedDescription: "IDs estáveis são usados para comandos, execuções salvas e referências de outros fluxos de trabalho.",
		},
		triggers: {
			addTitle: "Adicionar gatilho",
			addDescription: "Gatilhos adicionais iniciam o mesmo fluxo de trabalho.",
			addButton: "Adicionar gatilho",
			type: "Tipo de gatilho",
			id: "ID",
			typeLabel: "Tipo",
			tasknotesEvent: "Evento TaskNotes",
			fromStatus: "Do status",
			toStatus: "Para status",
			pathGlob: "Globo de caminho",
			allowSelfTrigger: "Permitir self-trigger",
			schedule: "Cronograma",
			timezone: "Fuso horário",
			catchUp: "Alcance",
			every: "Cada",
			event: "Evento",
			manualHelp: "As execuções manuais aparecem na paleta de comandos quando o fluxo de trabalho está ativado.",
			valuesAvailable: "Valores de gatilho disponíveis para etapas ({count})",
			advancedTitle: "Opções avançadas de gatilho",
			advancedDescription: "Limite a correspondência, preserve um ID estável e controle o comportamento de reprodução.",
			needsAttention: "Precisa de atenção",
			tooltips: {
				moveUp: "Subir",
				moveDown: "Mover para baixo",
				delete: "Excluir gatilho",
			},
			types: {
				manual: {
					label: "Manuais",
					description: "É executado somente quando iniciado explicitamente.",
				},
				tasknotesEvent: {
					label: "Evento TaskNotes",
					description: "Executa quando TaskNotes emite o evento de tempo de execução selecionado.",
				},
				cron: {
					label: "Cron cronograma",
					description: "É executado quando o agendamento five-part cron corresponde ao minuto atual.",
				},
				interval: {
					label: "Intervalo",
					description: "Executa repetidamente enquanto Obsidian está aberto.",
				},
				obsidianVault: {
					label: "Evento de arquivo do Vault",
					description: "Executa quando Obsidian cria, modifica, exclui ou renomeia um arquivo.",
				},
				obsidianMetadata: {
					label: "Evento de metadados",
					description: "Executado quando os metadados Obsidian são alterados ou resolvidos.",
				},
				obsidianWorkspace: {
					label: "Evento de espaço de trabalho",
					description: "É executado quando ocorre atividade do espaço de trabalho selecionado, como abrir um arquivo ou alterar a folha ativa.",
				},
			},
			events: {
				create: "Criar",
				modify: "Modificar",
				delete: "Excluir",
				rename: "Renomear",
				changed: "Alterado",
				deleted: "Excluído",
				resolve: "Resolver",
				resolved: "Resolvido",
				fileOpen: "Arquivo aberto",
				activeLeafChange: "Folha ativa alterada",
				layoutChange: "Layout alterado",
			},
			tasknotesEvents: {
				task: {
					created: "Tarefa criada",
					updated: "Tarefa atualizada",
					deleted: "Tarefa excluída",
					moved: "Tarefa movida",
					status: {
						changed: "Status da tarefa alterado",
					},
					completed: "Tarefa concluída",
					uncompleted: "Tarefa incompleta",
					archived: "Tarefa arquivada",
					unarchived: "Tarefa desarquivada",
					scheduled: {
						changed: "Data agendada da tarefa alterada",
					},
					due: {
						changed: "Data de vencimento da tarefa alterada",
					},
					priority: {
						changed: "Prioridade da tarefa alterada",
					},
					tags: {
						changed: "Tags de tarefa alteradas",
					},
					contexts: {
						changed: "Contextos de tarefas alterados",
					},
					projects: {
						changed: "Projetos de tarefas alterados",
					},
					reminders: {
						changed: "Lembretes de tarefas alterados",
					},
					dependencies: {
						changed: "Dependências de tarefas alteradas",
					},
					recurrence: {
						changed: "A recorrência da tarefa foi alterada",
					},
				},
				time: {
					started: "O controle de tempo foi iniciado",
					stopped: "O controle de tempo foi interrompido",
				},
				pomodoro: {
					started: "Pomodoro começou",
					completed: "Pomodoro concluído",
					interrupted: "Pomodoro interrompeu",
				},
				recurring: {
					instance: {
						completed: "Instância recorrente concluída",
						skipped: "Instância recorrente ignorada",
					},
				},
			},
			summary: {
				statusFromTo: "Mudanças de status de {from} para {to}",
				statusTo: "Mudanças de status para {to}",
				statusFrom: "Mudanças de status de {from}",
				schedule: "Cronograma {schedule}",
				every: "Cada {every}",
				vaultFile: "Arquivo do cofre {event}",
				metadata: "Metadados {event}",
				workspace: "Espaço de trabalho {event}",
				manual: "Execução manual",
			},
			outputs: {
				type: {
					label: "Tipo",
					description: "Do tipo gatilho.",
				},
				id: {
					label: "ID",
					description: "O gatilho ID deste fluxo de trabalho.",
				},
				event: {
					label: "Evento",
					description: "O nome do evento que iniciou a execução.",
				},
				actualAt: {
					label: "Hora real",
					description: "Quando a execução do fluxo de trabalho foi iniciada.",
				},
				after: {
					path: {
						label: "Caminho da tarefa",
						description: "O caminho da tarefa após o evento.",
					},
					title: {
						label: "Título da tarefa",
						description: "O título da tarefa após o evento.",
					},
					status: {
						label: "Estado atual",
						description: "O status da tarefa após o evento.",
					},
				},
				before: {
					status: {
						label: "Estado anterior",
						description: "O status da tarefa antes do evento.",
					},
				},
				changes: {
					label: "Mudanças",
					description: "Campos alterados digitados por nome de propriedade.",
				},
				source: {
					label: "Fonte",
					description: "A fonte de mutação, quando fornecida.",
				},
				correlationId: {
					label: "Correlação ID",
					description: "A correlação de mutação ID, quando fornecida.",
				},
				scheduledAt: {
					label: "Horário agendado",
					description: "O horário do ticker da programação.",
				},
				path: {
					label: "Caminho",
					description: "O caminho do arquivo do vault correspondente.",
				},
				file: {
					path: {
						label: "Caminho do arquivo",
						description: "O caminho do arquivo correspondente.",
					},
					name: {
						label: "Nome do arquivo",
						description: "O nome do arquivo correspondente.",
					},
					extension: {
						label: "Extensão",
						description: "A extensão de arquivo correspondente.",
					},
				},
				data: {
					label: "Dados",
					description: "Dados extras do evento, quando fornecidos.",
				},
				manual: {
					label: "Manuais",
					description: "Verdadeiro para uma execução manual.",
				},
			},
		},
		steps: {
			addTitle: "Adicionar próxima etapa",
			addDescription: "A nova etapa será executada após as etapas acima.",
			addButton: "Adicionar etapa",
			type: "Tipo de etapa",
			id: "ID",
			advancedTitle: "Opções avançadas de etapas",
			advancedDescription: "IDs estáveis criam referências para etapas posteriores. As execuções em lote usam o opcional para cada valor.",
			forEach: "Para cada",
			forEachHelp: "Referência de matriz opcional para etapas em lote.",
			inputJson: "Insira JSON",
			writes: "escreve",
			needsAttention: "Precisa de atenção",
			outputsAvailable: "Saídas disponíveis para etapas posteriores ({count})",
			tooltips: {
				moveUp: "Subir",
				moveDown: "Mover para baixo",
				delete: "Excluir etapa",
			},
			unknownCategory: "Outro",
			summary: {
				forEach: "para cada {value}",
			},
		},
		runPolicy: {
			noOverlap: "Sem sobreposição",
			onError: "Em caso de erro",
			advancedTitle: "Limites avançados de execução",
			advancedDescription: "Esses valores mantêm as execuções automatizadas identificáveis e limitadas.",
			maxTasks: "Máximo de tarefas",
			source: "Fonte",
		},
		footer: {
			openNote: "Nota aberta",
		},
		templateSuggestions: {
			workflowId: "ID do fluxo de trabalho",
			workflowName: "Nome do fluxo de trabalho",
			today: "Hoje",
			now: "Agora",
			itemPath: "Caminho do item atual",
			triggerValue: "Gatilho {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "O nome é obrigatório.",
			invalidWorkflowId: "Use letras minúsculas, números, pontos, sublinhados ou travessões. Comece com uma carta.",
			duplicateWorkflowId: "Já usado por {path}.",
			triggerRequired: "Adicione pelo menos um gatilho.",
			invalidTriggerId: "O ID do gatilho deve começar com uma letra e usar caracteres id-safe.",
			duplicateTriggerId: "Os IDs de gatilho devem ser exclusivos.",
			tasknotesEventRequired: "Escolha um evento TaskNotes.",
			cronScheduleRequired: "Adicione uma programação cron.",
			intervalRequired: "Adicione um intervalo.",
			stepRequired: "Adicione pelo menos uma etapa.",
			invalidStepId: "O ID da etapa deve começar com uma letra e usar caracteres id-safe.",
			duplicateStepId: "Os IDs das etapas devem ser exclusivos.",
			unknownStepType: "Tipo de etapa desconhecido: {type}",
			fieldRequired: "{field} é obrigatório.",
			positiveNumber: "Use um número positivo.",
			jsonObject: "A entrada da etapa deve ser um objeto JSON.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Relacionamentos de tarefas",
			timeTracking: "Controle de tempo",
			obsidian: "Obsidian",
			controlFlow: "Fluxo de controle",
		},
		common: {
			task: {
				label: "Tarefa",
				description: "Caminho do vault para uma tarefa TaskNotes. Os fluxos de trabalho de tarefas acionadas geralmente usam {{trigger.after.path}}.",
			},
			path: {
				label: "Caminho",
				description: "Caminho do vault para um arquivo Markdown.",
			},
			outputTask: {
				label: "Tarefa",
				description: "Dados da tarefa TaskNotes atualizados.",
			},
			outputPath: {
				label: "Caminho",
				description: "Caminho do cofre da tarefa após a conclusão da etapa.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "Obter tarefa",
					description: "Lê uma tarefa por caminho.",
					examples: {
						0: {
							label: "Leia a tarefa de acionamento",
						},
					},
				},
				query: {
					label: "Tarefas de consulta",
					description: "Seleciona tarefas com a API de consulta em tempo de execução do TaskNotes.",
					input: {
						query: {
							label: "Consulta",
							description: "Consulta de tarefas em tempo de execução usando campos, operadores, ordenação, agrupamento e limite do TaskNotes.",
						},
					},
					output: {
						tasks: {
							label: "Tarefas",
							description: "As tarefas TaskNotes correspondentes.",
						},
						count: {
							label: "Contar",
							description: "Número de tarefas correspondentes.",
						},
					},
					examples: {
						0: {
							label: "Tarefas abertas",
						},
					},
				},
				parents: {
					label: "Obtenha tarefas principais",
					description: "Lê tarefas pai vinculadas aos projetos da tarefa.",
				},
				subtasks: {
					label: "Obtenha subtarefas",
					description: "Lê tarefas que fazem referência a esta tarefa como um projeto.",
				},
				blocking: {
					label: "Obtenha tarefas de bloqueio",
					description: "Lê tarefas bloqueadas por esta tarefa.",
				},
				dependencies: {
					label: "Obtenha dependências",
					description: "Lê as tarefas que bloqueiam esta tarefa.",
					output: {
						dependencies: {
							label: "Dependências",
							description: "Objetos de dependência com dados de tarefa TaskNotes resolvidos, quando disponíveis.",
						},
						tasks: {
							label: "Tarefas",
							description: "Tarefas de dependência resolvidas.",
						},
						count: {
							label: "Contar",
							description: "Número de dependências.",
						},
					},
					examples: {
						0: {
							label: "Leia o acionamento de dependências de tarefas",
						},
					},
				},
				relationships: {
					label: "Obtenha relacionamentos",
					description: "Lê pais, subtarefas, dependências e tarefas de bloqueio para uma tarefa.",
					output: {
						task: {
							label: "Tarefa",
							description: "A tarefa.",
						},
						parents: {
							label: "Pais",
							description: "Tarefas dos pais.",
						},
						subtasks: {
							label: "Subtarefas",
							description: "Subtarefas.",
						},
						dependencies: {
							label: "Dependências",
							description: "Tarefas que bloqueiam esta tarefa.",
						},
						blocking: {
							label: "Bloqueio",
							description: "Tarefas bloqueadas por esta tarefa.",
						},
					},
					examples: {
						0: {
							label: "Leia todos os relacionamentos",
						},
					},
				},
				create: {
					label: "Criar tarefa",
					description: "Cria uma nova tarefa TaskNotes.",
					input: {
						title: {
							label: "Título",
						},
						status: {
							label: "Estado",
						},
						priority: {
							label: "Prioridade",
						},
						due: {
							label: "Devido",
						},
						scheduled: {
							label: "Agendado",
						},
						details: {
							label: "Detalhes",
						},
					},
					examples: {
						0: {
							label: "Crie uma tarefa de caixa de entrada",
						},
					},
				},
				patch: {
					label: "Tarefa de correção",
					description: "Atualiza campos de tarefas.",
					input: {
						patch: {
							label: "Patch",
							description: "Campos de tarefa a serem atualizados, como status, prioridade, vencimento, agendado, tags, projetos ou contextos.",
						},
					},
					examples: {
						0: {
							label: "Marcar como ativo",
						},
					},
				},
				set: {
					label: "Definir campos de tarefa",
					description: "Alias para task.patch.",
					input: {
						patch: {
							label: "Campos",
							description: "Campos de tarefa a serem definidos.",
						},
					},
				},
				move: {
					label: "Mover tarefa",
					description: "Move uma nota de tarefa.",
					input: {
						targetFolder: {
							label: "Pasta de destino",
						},
					},
					examples: {
						0: {
							label: "Mover tarefa de acionamento",
						},
					},
				},
				archive: {
					label: "Tarefa de arquivamento",
					description: "Arquiva uma tarefa.",
				},
				unarchive: {
					label: "Tarefa de desarquivamento",
					description: "Desarquiva uma tarefa.",
				},
				complete: {
					label: "Concluir tarefa",
					description: "Marca uma tarefa como concluída.",
					input: {
						options: {
							status: {
								label: "Status concluído",
							},
						},
					},
				},
				uncomplete: {
					label: "Tarefa incompleta",
					description: "Reabre uma tarefa concluída.",
					input: {
						options: {
							status: {
								label: "Status reaberto",
							},
						},
					},
				},
				reschedule: {
					label: "Reprogramar tarefa",
					description: "Define ou limpa a data agendada.",
					input: {
						date: {
							label: "Data agendada",
						},
					},
				},
				setDue: {
					label: "Definir data de vencimento",
					description: "Definir data de vencimento",
					input: {
						date: {
							label: "Data de vencimento",
						},
					},
				},
				clearDue: {
					label: "Limpar data de vencimento",
					description: "Limpar data de vencimento",
				},
				setScheduled: {
					label: "Definir data agendada",
					description: "Definir data agendada",
					input: {
						date: {
							label: "Data agendada",
						},
					},
				},
				clearScheduled: {
					label: "Limpar data agendada",
					description: "Limpar data agendada",
				},
				addTag: {
					label: "Adicionar etiqueta",
					description: "Adicionar etiqueta",
					input: {
						tag: {
							label: "Etiqueta",
						},
					},
				},
				removeTag: {
					label: "Remover etiqueta",
					description: "Remover etiqueta",
					input: {
						tag: {
							label: "Etiqueta",
						},
					},
				},
				addProject: {
					label: "Adicionar projeto",
					description: "Adicionar projeto",
					input: {
						project: {
							label: "Projeto",
						},
					},
				},
				removeProject: {
					label: "Remover projeto",
					description: "Remover projeto",
					input: {
						project: {
							label: "Projeto",
						},
					},
				},
				addContext: {
					label: "Adicionar contexto",
					description: "Adicionar contexto",
					input: {
						context: {
							label: "Contexto",
						},
					},
				},
				removeContext: {
					label: "Remover contexto",
					description: "Remover contexto",
					input: {
						context: {
							label: "Contexto",
						},
					},
				},
				addDependency: {
					label: "Adicionar dependência",
					description: "Adiciona uma dependência de bloqueio.",
					input: {
						dependency: {
							label: "Dependência",
						},
					},
				},
				removeDependency: {
					label: "Remover dependência",
					description: "Remove uma dependência.",
					input: {
						uid: {
							label: "Dependência ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Iniciar cronômetro",
					description: "Inicia o controle de tempo.",
					input: {
						options: {
							description: {
								label: "Descrição",
							},
						},
					},
					output: {
						startedAt: {
							label: "Começou em",
							description: "Carimbo de data/hora ISO registrado pela execução do fluxo de trabalho.",
						},
					},
				},
				stop: {
					label: "Parar cronômetro",
					description: "Interrompe o monitoramento do tempo.",
					output: {
						stoppedAt: {
							label: "Parou em",
							description: "Carimbo de data/hora ISO registrado pela execução do fluxo de trabalho.",
						},
					},
				},
				appendEntry: {
					label: "Anexar entrada de tempo",
					description: "Adiciona uma entrada de hora.",
					input: {
						entry: {
							label: "Entrada",
						},
					},
				},
			},
			notice: {
				show: {
					label: "Mostrar aviso",
					description: "Mostra um aviso Obsidian.",
					input: {
						message: {
							label: "Mensagem",
						},
					},
					output: {
						message: {
							label: "Mensagem",
						},
					},
					examples: {
						0: {
							label: "Mostrar título da tarefa",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Abrir arquivo",
					description: "Abre um arquivo do vault na área de trabalho.",
					input: {
						newLeaf: {
							label: "Abrir em",
							options: {
								current: "Folha atual",
								tab: "Nova guia",
								split: "Dividir",
								window: "Janela pop-up",
							},
						},
					},
					output: {
						opened: {
							label: "Aberto",
						},
						newLeaf: {
							label: "Alvo aberto",
						},
					},
					examples: {
						0: {
							label: "Abrir arquivo de acionamento",
						},
					},
				},
				createNote: {
					label: "Criar nota",
					description: "Cria uma nota Markdown no vault.",
					input: {
						content: {
							label: "Conteúdo",
						},
					},
					output: {
						created: {
							label: "Criado",
						},
					},
					examples: {
						0: {
							label: "Crie uma nota datada",
						},
					},
				},
				appendNote: {
					label: "Anexar à nota",
					description: "Acrescenta texto a uma nota Markdown existente.",
					input: {
						text: {
							label: "Texto",
						},
					},
					output: {
						appended: {
							label: "Anexado",
						},
						length: {
							label: "Comprimento",
						},
					},
					examples: {
						0: {
							label: "Anexar ao arquivo de acionamento",
						},
					},
				},
				updateFrontmatter: {
					label: "Atualizar frontmatter",
					description: "Aplica um patch top-level frontmatter a uma nota Markdown.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Chaves Top-level para definir. Use null para excluir uma chave.",
						},
					},
					output: {
						updated: {
							label: "Atualizado",
						},
						keys: {
							label: "Chaves",
						},
					},
					examples: {
						0: {
							label: "Marcar arquivo de acionamento como revisado",
						},
					},
				},
				moveFile: {
					label: "Mover arquivo",
					description: "Move ou renomeia um arquivo do vault.",
					input: {
						targetPath: {
							label: "Caminho de destino",
						},
						updateLinks: {
							label: "Atualizar links",
							description: "Use o gerenciador de arquivos do Obsidian para que os links sejam atualizados de acordo com as configurações do vault.",
						},
					},
					output: {
						moved: {
							label: "Movido",
						},
						oldPath: {
							label: "Caminho antigo",
						},
					},
					examples: {
						0: {
							label: "Arquivar arquivo de acionamento",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Interromper o fluxo de trabalho",
					description: "Interrompe a execução do fluxo de trabalho atual.",
					input: {
						reason: {
							label: "Razão",
						},
					},
					output: {
						stopped: {
							label: "Parado",
						},
						reason: {
							label: "Razão",
						},
					},
					examples: {
						0: {
							label: "Pare com a razão",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "O tempo de execução TaskNotes API não está disponível.",
			obsidianUnavailable: "O contexto do aplicativo Obsidian não está disponível.",
			requiredText: "A entrada de etapa requer o texto non-empty: {field}",
		},
	},
};
