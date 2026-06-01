import type { TranslationTree } from "../types";

export const es: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Cancelar",
		clear: "Borrar",
		continue: "Continuar",
		disabled: "Discapacitado",
		enabled: "Habilitado",
		inputs: "Entradas",
		maintain: "mantener",
		output: "Salida",
		outputs: "Salidas",
		save: "Guardar",
		saved: "Guardado",
		stop: "Detener",
		summary: "Resumen",
		systemDefault: "Valor predeterminado del sistema",
		unsavedChanges: "Cambios no guardados",
		runStatus: {
			success: "éxito",
			failed: "falló",
			skipped: "saltado",
			stopped: "detenido",
		},
		workflowStatus: {
			enabled: "habilitado",
			disabled: "discapacitado",
			invalid: "inválido",
		},
		languages: {
			en: "ingles",
		},
	},
	commands: {
		openWorkflows: "Abrir flujos de trabajo",
		newWorkflow: "Nuevo flujo de trabajo",
		reloadWorkflows: "Recargar flujos de trabajo",
		maintainDefaultWorkflows: "Mantener archivos de flujo de trabajo predeterminados",
		runWorkflow: "Ejecutar: {name}",
	},
	notices: {
		languageChanged: "El idioma cambió a {language}.",
		workflowsReloaded: "Flujos de trabajo recargados.",
		defaultFilesCreated: "Creado {count} predeterminado {fileLabel}.",
		defaultFilesAlreadyPresent: "Los archivos de flujo de trabajo predeterminados ya están presentes.",
		workflowCommandUnavailable: "El comando de flujo de trabajo ya no está disponible.",
		workflowRunCompleted: "Ejecute {status}: {name}",
		workflowDryRunCompleted: "Ejecución en seco {status}: {name}",
		workflowBaseNotFound: "Base de flujo de trabajo no encontrada: {path}",
		runHistoryCleared: "Se borró el historial de ejecución del flujo de trabajo.",
		workflowSaved: "Flujo de trabajo guardado: {name}",
		discardChanges: "Cambios no guardados. Presione Cancelar nuevamente para descartar.",
		discardAndOpenNote: "Cambios no guardados. Presione Abrir nota nuevamente para descartar y abrir la nota.",
	},
	settings: {
		workflowFiles: {
			heading: "Archivos de flujo de trabajo",
			folder: {
				name: "Carpeta de flujo de trabajo",
				description: "Carpeta de almacén que contiene definiciones de flujo de trabajo Markdown.",
			},
			base: {
				name: "Base de flujo de trabajo",
				description: "Ruta de la bóveda para la vista del flujo de trabajo de bases generadas.",
			},
			createDefaults: {
				name: "Crear valores predeterminados de flujo de trabajo",
				description: "Escriba notas de flujo de trabajo de ejemplo cuando se cargue el complemento o cuando se mantengan los valores predeterminados.",
			},
			createBase: {
				name: "Crear una base de flujo de trabajo",
				description: "Escriba la vista del flujo de trabajo de las bases generadas cuando se carga el complemento o cuando se mantienen los valores predeterminados.",
			},
			maintainDefaults: {
				name: "Mantener valores predeterminados",
				description: "Cree notas de flujo de trabajo faltantes y la base del flujo de trabajo sin sobrescribir archivos existentes.",
			},
		},
		triggers: {
			heading: "Desencadenantes",
			tasknotesEvents: {
				name: "Activadores de eventos TaskNotes",
				description: "Ejecute flujos de trabajo desde eventos API en tiempo de ejecución de TaskNotes, como task.status.changed.",
			},
			scheduled: {
				name: "Desencadenantes programados",
				description: "Ejecute cron y flujos de trabajo de intervalos mientras Obsidian esté abierto.",
			},
			obsidian: {
				name: "Activadores avanzados Obsidian",
				description: "Permitir activadores de bóveda y espacio de trabajo Obsidian. Mantenga los filtros de ruta estrechos.",
			},
			minInterval: {
				name: "Intervalo mínimo",
				description: "Frecuencia de activación de intervalo más baja permitida en milisegundos.",
			},
		},
		runLogs: {
			heading: "Ejecutar registros",
			folder: {
				name: "Ejecutar carpeta de registro",
				description: "Ruta de bóveda opcional para resúmenes de ejecución y archivos de detalles. Déjelo en blanco para usar la carpeta de configuración de este complemento.",
			},
			level: {
				name: "Ejecutar nivel de registro",
				description: "Controla cuántos detalles se mantienen en los registros de ejecución.",
				options: {
					summary: "Resumen",
					inputs: "Entradas",
					inputsAndOutputs: "Entradas y salidas",
				},
			},
			retention: {
				name: "Ejecuciones retenidas por flujo de trabajo",
				description: "Los archivos de detalles antiguos se eliminan después de este límite.",
			},
			clear: {
				name: "Borrar historial de ejecución",
				description: "Elimine los registros de ejecución del flujo de trabajo plugin-local.",
			},
		},
		language: {
			heading: "Idioma de la interfaz",
			description: "Cambie el idioma de los comandos, configuraciones, avisos y vistas de TaskNotes Workflows.",
			name: "Idioma UI",
			dropdownDescription: "Seleccione el idioma utilizado para el texto de la interfaz TaskNotes Workflows.",
		},
	},
	baseView: {
		title: "Flujos de trabajo",
		tasknotesAvailable: "El tiempo de ejecución TaskNotes API está disponible.",
		tasknotesUnavailable: "El tiempo de ejecución TaskNotes API no está disponible; Los pasos task-writing no se pueden ejecutar.",
		empty: "No se encontraron flujos de trabajo",
		newWorkflow: "Nuevo flujo de trabajo",
	},
	workflowCard: {
		labels: {
			triggers: "Desencadenantes",
			steps: "Pasos",
			lastRun: "última ejecución",
			noOverlap: "sin superposición",
		},
		tooltips: {
			edit: "Editar flujo de trabajo",
			dryRun: "Flujo de trabajo de ejecución en seco",
			run: "Ejecutar flujo de trabajo",
			history: "Historial de ejecución",
			openNote: "Abrir nota de flujo de trabajo",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "cada {every}",
			vault: "bóveda {event}",
			metadata: "metadatos {event}",
			workspace: "espacio de trabajo {event}",
			manual: "manuales",
		},
	},
	runHistory: {
		title: "Historial de ejecución",
		runs: "Corre",
		latest: "Lo último",
		trigger: "gatillo",
		duration: "Duración",
		runId: "Ejecute ID",
		dryRun: "ejecución en seco",
		stepCount: {
			one: "Paso {count}",
			other: "Pasos {count}",
		},
		input: "Entrada",
		output: "Salida",
		empty: {
			diagnostics: "Los diagnósticos del flujo de trabajo deben corregirse antes de que se puedan mostrar las ejecuciones.",
			loading: "Cargando historial de ejecución...",
			noRuns: "Aún no se han registrado carreras.",
			missingDetail: "No se encontraron detalles de la ejecución.",
		},
	},
	engine: {
		workflowInvalid: "El flujo de trabajo no es válido: {path}",
		workflowAlreadyRunning: "El flujo de trabajo ya se está ejecutando.",
		workflowDisabled: "El flujo de trabajo está deshabilitado.",
		conditionsDidNotMatch: "Las condiciones del flujo de trabajo no coincidieron.",
		stepFailed: "Paso fallido.",
		unknownStepType: "Tipo de paso desconocido: {type}",
		forEachNonArray: "forEach se resolvió en un valor non-array.",
		forEachTooManyItems: "forEach elementos seleccionados de {count}, arriba de run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Editar flujo de trabajo",
			new: "Nuevo flujo de trabajo",
		},
		untitledWorkflow: "Flujo de trabajo sin título",
		workflowEditor: "editor de flujo de trabajo",
		sections: {
			definition: {
				label: "Definición",
				description: "Nombre e identidad",
				title: "Definición",
				body: "Asigne un nombre a este flujo de trabajo y mantenga su identidad estable.",
			},
			triggers: {
				label: "Desencadenantes",
				description: "Iniciar eventos",
				title: "Desencadenantes",
				body: "Ejecute el flujo de trabajo manualmente, según una programación, desde eventos TaskNotes o desde eventos Obsidian seleccionados.",
			},
			steps: {
				label: "Pasos",
				description: "Acciones",
				title: "Pasos",
				body: "Los escalones van de arriba a abajo. Se puede hacer referencia a los resultados de pasos anteriores en pasos posteriores.",
			},
			run: {
				label: "Ejecutar política",
				description: "Límites y errores",
				title: "Ejecutar política",
				body: "Elija el comportamiento de falla predeterminado. Los límites de seguridad pueden permanecer en sus valores predeterminados para la mayoría de los flujos de trabajo.",
			},
		},
		summary: {
			triggerCount: {
				one: "Gatillo {count}",
				other: "Disparadores {count}",
			},
			stepCount: {
				one: "Paso {count}",
				other: "Pasos {count}",
			},
			noOverlap: "Sin superposición",
			overlapAllowed: "Superposición permitida",
			enabledDescription: "Se pueden ejecutar activadores manuales, programados y de eventos.",
			disabledDescription: "Los activadores manuales, programados y de eventos no se ejecutarán.",
		},
		definition: {
			name: "Nombre",
			description: "Descripción",
			descriptionPlaceholder: "Nota opcional sobre por qué existe este flujo de trabajo.",
			id: "ID",
			advancedTitle: "Identidad avanzada",
			advancedDescription: "Los identificadores estables se utilizan para comandos, ejecuciones guardadas y referencias de otros flujos de trabajo.",
		},
		triggers: {
			addTitle: "Agregar disparador",
			addDescription: "Los activadores adicionales inician el mismo flujo de trabajo.",
			addButton: "Agregar disparador",
			type: "Tipo de disparador",
			id: "ID",
			typeLabel: "Tipo",
			tasknotesEvent: "Evento TaskNotes",
			fromStatus: "Del estado",
			toStatus: "Al estado",
			pathGlob: "Globo de ruta",
			allowSelfTrigger: "Permitir self-trigger",
			schedule: "Horario",
			timezone: "Zona horaria",
			catchUp: "ponerse al día",
			every: "cada",
			event: "Evento",
			manualHelp: "Las ejecuciones manuales aparecen en la paleta de comandos cuando el flujo de trabajo está habilitado.",
			valuesAvailable: "Valores de activación disponibles para los pasos ({count})",
			advancedTitle: "Opciones de activación avanzadas",
			advancedDescription: "Limite las coincidencias, preserve una identificación estable y controle el comportamiento de reproducción.",
			needsAttention: "necesita atencion",
			tooltips: {
				moveUp: "Subir",
				moveDown: "Bajar",
				delete: "Eliminar disparador",
			},
			types: {
				manual: {
					label: "manuales",
					description: "Se ejecuta sólo cuando se inicia explícitamente.",
				},
				tasknotesEvent: {
					label: "Evento TaskNotes",
					description: "Se ejecuta cuando TaskNotes emite el evento de tiempo de ejecución seleccionado.",
				},
				cron: {
					label: "programación de Cron",
					description: "Se ejecuta cuando el horario five-part cron coincide con el minuto actual.",
				},
				interval: {
					label: "Intervalo",
					description: "Se ejecuta repetidamente mientras Obsidian está abierto.",
				},
				obsidianVault: {
					label: "Evento de archivo de almacén",
					description: "Se ejecuta cuando Obsidian crea, modifica, elimina o cambia el nombre de un archivo.",
				},
				obsidianMetadata: {
					label: "Evento de metadatos",
					description: "Se ejecuta cuando los metadatos de Obsidian cambian o se resuelven.",
				},
				obsidianWorkspace: {
					label: "Evento del espacio de trabajo",
					description: "Se ejecuta cuando se produce la actividad del espacio de trabajo seleccionado, como abrir un archivo o cambiar la hoja activa.",
				},
			},
			events: {
				create: "crear",
				modify: "Modificar",
				delete: "Eliminar",
				rename: "Cambiar nombre",
				changed: "cambiado",
				deleted: "Eliminado",
				resolve: "resolver",
				resolved: "Resuelto",
				fileOpen: "Archivo abierto",
				activeLeafChange: "Hoja activa cambiada",
				layoutChange: "Diseño cambiado",
			},
			tasknotesEvents: {
				task: {
					created: "Tarea creada",
					updated: "Tarea actualizada",
					deleted: "Tarea eliminada",
					moved: "Tarea movida",
					status: {
						changed: "El estado de la tarea cambió",
					},
					completed: "Tarea completada",
					uncompleted: "Tarea incompleta",
					archived: "Tarea archivada",
					unarchived: "Tarea desarchivada",
					scheduled: {
						changed: "La fecha programada de la tarea cambió",
					},
					due: {
						changed: "La fecha de vencimiento de la tarea cambió",
					},
					priority: {
						changed: "La prioridad de la tarea cambió",
					},
					tags: {
						changed: "Se cambiaron las etiquetas de tareas",
					},
					contexts: {
						changed: "Los contextos de las tareas cambiaron",
					},
					projects: {
						changed: "Los proyectos de tareas cambiaron.",
					},
					reminders: {
						changed: "Los recordatorios de tareas cambiaron",
					},
					dependencies: {
						changed: "Las dependencias de tareas cambiaron",
					},
					recurrence: {
						changed: "La recurrencia de la tarea cambió",
					},
				},
				time: {
					started: "Se inició el seguimiento del tiempo",
					stopped: "Se detuvo el seguimiento del tiempo",
				},
				pomodoro: {
					started: "Pomodoro empezó",
					completed: "Pomodoro completado",
					interrupted: "Pomodoro interrumpió",
				},
				recurring: {
					instance: {
						completed: "Instancia recurrente completada",
						skipped: "Instancia recurrente omitida",
					},
				},
			},
			summary: {
				statusFromTo: "Cambios de estado de {from} a {to}",
				statusTo: "Cambios de estado a {to}",
				statusFrom: "Cambios de estado desde {from}",
				schedule: "Horario {schedule}",
				every: "Cada {every}",
				vaultFile: "Archivo de bóveda {event}",
				metadata: "Metadatos {event}",
				workspace: "Espacio de trabajo {event}",
				manual: "Ejecución manual",
			},
			outputs: {
				type: {
					label: "Tipo",
					description: "El tipo de gatillo.",
				},
				id: {
					label: "ID",
					description: "El desencadenante ID de este flujo de trabajo.",
				},
				event: {
					label: "Evento",
					description: "El nombre del evento que inició la ejecución.",
				},
				actualAt: {
					label: "tiempo real",
					description: "Cuando comenzó la ejecución del flujo de trabajo.",
				},
				after: {
					path: {
						label: "Ruta de tareas",
						description: "La ruta de la tarea después del evento.",
					},
					title: {
						label: "Título de la tarea",
						description: "El título de la tarea después del evento.",
					},
					status: {
						label: "Estado actual",
						description: "El estado de la tarea después del evento.",
					},
				},
				before: {
					status: {
						label: "Estado anterior",
						description: "El estado de la tarea antes del evento.",
					},
				},
				changes: {
					label: "Cambios",
					description: "Campos modificados codificados por nombre de propiedad.",
				},
				source: {
					label: "Fuente",
					description: "La fuente de la mutación, cuando se proporcione.",
				},
				correlationId: {
					label: "Correlación ID",
					description: "La correlación de mutación ID, cuando se proporcione.",
				},
				scheduledAt: {
					label: "hora programada",
					description: "El horario marca la hora.",
				},
				path: {
					label: "Camino",
					description: "La ruta del archivo de almacén coincidente.",
				},
				file: {
					path: {
						label: "Ruta del archivo",
						description: "La ruta del archivo coincidente.",
					},
					name: {
						label: "Nombre de archivo",
						description: "El nombre del archivo coincidente.",
					},
					extension: {
						label: "Extensión",
						description: "La extensión de archivo coincidente.",
					},
				},
				data: {
					label: "Datos",
					description: "Datos de eventos adicionales, cuando se proporcionen.",
				},
				manual: {
					label: "manuales",
					description: "Verdadero para una ejecución manual.",
				},
			},
		},
		steps: {
			addTitle: "Agregar el siguiente paso",
			addDescription: "El nuevo paso se ejecutará después de los pasos anteriores.",
			addButton: "Agregar paso",
			type: "tipo de paso",
			id: "ID",
			advancedTitle: "Opciones de pasos avanzadas",
			advancedDescription: "Los identificadores estables crean referencias para pasos posteriores. Las ejecuciones por lotes utilizan el opcional para cada valor.",
			forEach: "para cada",
			forEachHelp: "Referencia de matriz opcional para pasos por lotes.",
			inputJson: "Entrada JSON",
			writes: "escribe",
			needsAttention: "necesita atencion",
			outputsAvailable: "Salidas disponibles para pasos posteriores ({count})",
			tooltips: {
				moveUp: "Subir",
				moveDown: "Bajar",
				delete: "Eliminar paso",
			},
			unknownCategory: "Otro",
			summary: {
				forEach: "para cada {value}",
			},
		},
		runPolicy: {
			noOverlap: "Sin superposición",
			onError: "Por error",
			advancedTitle: "Límites de ejecución avanzados",
			advancedDescription: "Estos valores mantienen las ejecuciones automatizadas identificables y delimitadas.",
			maxTasks: "Tareas máximas",
			source: "Fuente",
		},
		footer: {
			openNote: "nota abierta",
		},
		templateSuggestions: {
			workflowId: "Identificación del flujo de trabajo",
			workflowName: "Nombre del flujo de trabajo",
			today: "hoy",
			now: "ahora",
			itemPath: "Ruta del elemento actual",
			triggerValue: "Gatillo {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "El nombre es obligatorio.",
			invalidWorkflowId: "Utilice letras minúsculas, números, puntos, guiones bajos o guiones. Comience con una letra.",
			duplicateWorkflowId: "Ya utilizado por {path}.",
			triggerRequired: "Agregue al menos un activador.",
			invalidTriggerId: "La identificación del activador debe comenzar con una letra y utilizar caracteres id-safe.",
			duplicateTriggerId: "Los identificadores de desencadenador deben ser únicos.",
			tasknotesEventRequired: "Elija un evento TaskNotes.",
			cronScheduleRequired: "Agregue un horario cron.",
			intervalRequired: "Añade un intervalo.",
			stepRequired: "Añade al menos un paso.",
			invalidStepId: "La identificación del paso debe comenzar con una letra y utilizar caracteres id-safe.",
			duplicateStepId: "Los ID de los pasos deben ser únicos.",
			unknownStepType: "Tipo de paso desconocido: {type}",
			fieldRequired: "Se requiere {field}.",
			positiveNumber: "Utilice un número positivo.",
			jsonObject: "La entrada de paso debe ser un objeto JSON.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Relaciones de tareas",
			timeTracking: "Seguimiento del tiempo",
			obsidian: "Obsidian",
			controlFlow: "Controlar el flujo",
		},
		common: {
			task: {
				label: "Tarea",
				description: "Ruta de la bóveda a una tarea TaskNotes. Los flujos de trabajo de tareas activadas suelen utilizar {{trigger.after.path}}.",
			},
			path: {
				label: "Camino",
				description: "Ruta de la bóveda a un archivo Markdown.",
			},
			outputTask: {
				label: "Tarea",
				description: "Datos de la tarea TaskNotes actualizados.",
			},
			outputPath: {
				label: "Camino",
				description: "Ruta de acceso a la bóveda de la tarea una vez completado el paso.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "obtener tarea",
					description: "Lee una tarea por ruta.",
					examples: {
						0: {
							label: "Leer la tarea desencadenante",
						},
					},
				},
				query: {
					label: "Tareas de consulta",
					description: "Selecciona tareas con una consulta de flujo de trabajo compacta.",
					input: {
						query: {
							label: "Consulta",
							description: "Objeto codificado por campos de tarea. Los valores pueden ser literales o filtros { operator, value }.",
						},
					},
					output: {
						tasks: {
							label: "Tareas",
							description: "Las tareas TaskNotes coincidentes.",
						},
						count: {
							label: "contar",
							description: "Número de tareas coincidentes.",
						},
					},
					examples: {
						0: {
							label: "Tareas abiertas",
						},
					},
				},
				parents: {
					label: "Obtener tareas para padres",
					description: "Lee las tareas principales vinculadas desde los proyectos de la tarea.",
				},
				subtasks: {
					label: "Obtener subtareas",
					description: "Lee tareas que hacen referencia a esta tarea como un proyecto.",
				},
				blocking: {
					label: "Obtener tareas de bloqueo",
					description: "Lee tareas que están bloqueadas por esta tarea.",
				},
				dependencies: {
					label: "Obtener dependencias",
					description: "Lee las tareas que bloquean esta tarea.",
					output: {
						dependencies: {
							label: "Dependencias",
							description: "Objetos de dependencia con datos de tareas TaskNotes resueltas cuando estén disponibles.",
						},
						tasks: {
							label: "Tareas",
							description: "Tareas de dependencia resueltas.",
						},
						count: {
							label: "contar",
							description: "Número de dependencias.",
						},
					},
					examples: {
						0: {
							label: "Leer dependencias de tareas desencadenantes",
						},
					},
				},
				relationships: {
					label: "conseguir relaciones",
					description: "Lee padres, subtareas, dependencias y tareas de bloqueo para una tarea.",
					output: {
						task: {
							label: "Tarea",
							description: "La tarea.",
						},
						parents: {
							label: "padres",
							description: "Tareas de los padres.",
						},
						subtasks: {
							label: "Subtareas",
							description: "Subtareas.",
						},
						dependencies: {
							label: "Dependencias",
							description: "Tareas que bloquean esta tarea.",
						},
						blocking: {
							label: "Bloqueo",
							description: "Tareas bloqueadas por esta tarea.",
						},
					},
					examples: {
						0: {
							label: "Leer todas las relaciones",
						},
					},
				},
				create: {
					label: "Crear tarea",
					description: "Crea una nueva tarea TaskNotes.",
					input: {
						title: {
							label: "Título",
						},
						status: {
							label: "Estado",
						},
						priority: {
							label: "Prioridad",
						},
						due: {
							label: "debido",
						},
						scheduled: {
							label: "Programado",
						},
						details: {
							label: "Detalles",
						},
					},
					examples: {
						0: {
							label: "Crear una tarea en la bandeja de entrada",
						},
					},
				},
				patch: {
					label: "Tarea de parche",
					description: "Actualiza los campos de tareas.",
					input: {
						patch: {
							label: "Parche",
							description: "Campos de tareas para actualizar, como estado, prioridad, vencimiento, programado, etiquetas, proyectos o contextos.",
						},
					},
					examples: {
						0: {
							label: "Marcar activo",
						},
					},
				},
				set: {
					label: "Establecer campos de tarea",
					description: "Alias de task.patch.",
					input: {
						patch: {
							label: "Campos",
							description: "Campos de tarea para configurar.",
						},
					},
				},
				move: {
					label: "Mover tarea",
					description: "Mueve una nota de tarea.",
					input: {
						targetFolder: {
							label: "Carpeta de destino",
						},
					},
					examples: {
						0: {
							label: "Mover tarea desencadenante",
						},
					},
				},
				archive: {
					label: "Tarea de archivo",
					description: "Archiva una tarea.",
				},
				unarchive: {
					label: "Tarea de desarchivar",
					description: "Desarchiva una tarea.",
				},
				complete: {
					label: "tarea completa",
					description: "Marca una tarea completa.",
					input: {
						options: {
							status: {
								label: "Estado completado",
							},
						},
					},
				},
				uncomplete: {
					label: "Tarea incompleta",
					description: "Vuelve a abrir una tarea completada.",
					input: {
						options: {
							status: {
								label: "Estado reabierto",
							},
						},
					},
				},
				reschedule: {
					label: "Reprogramar tarea",
					description: "Establece o borra la fecha programada.",
					input: {
						date: {
							label: "fecha programada",
						},
					},
				},
				setDue: {
					label: "Establecer fecha de vencimiento",
					description: "Establecer fecha de vencimiento",
					input: {
						date: {
							label: "fecha de vencimiento",
						},
					},
				},
				clearDue: {
					label: "Borrar fecha de vencimiento",
					description: "Borrar fecha de vencimiento",
				},
				setScheduled: {
					label: "Establecer fecha programada",
					description: "Establecer fecha programada",
					input: {
						date: {
							label: "fecha programada",
						},
					},
				},
				clearScheduled: {
					label: "Borrar fecha programada",
					description: "Borrar fecha programada",
				},
				addTag: {
					label: "Agregar etiqueta",
					description: "Agregar etiqueta",
					input: {
						tag: {
							label: "Etiqueta",
						},
					},
				},
				removeTag: {
					label: "Quitar etiqueta",
					description: "Quitar etiqueta",
					input: {
						tag: {
							label: "Etiqueta",
						},
					},
				},
				addProject: {
					label: "Agregar proyecto",
					description: "Agregar proyecto",
					input: {
						project: {
							label: "Proyecto",
						},
					},
				},
				removeProject: {
					label: "Eliminar proyecto",
					description: "Eliminar proyecto",
					input: {
						project: {
							label: "Proyecto",
						},
					},
				},
				addContext: {
					label: "Agregar contexto",
					description: "Agregar contexto",
					input: {
						context: {
							label: "Contexto",
						},
					},
				},
				removeContext: {
					label: "Eliminar contexto",
					description: "Eliminar contexto",
					input: {
						context: {
							label: "Contexto",
						},
					},
				},
				addDependency: {
					label: "Agregar dependencia",
					description: "Agrega una dependencia de bloqueo.",
					input: {
						dependency: {
							label: "dependencia",
						},
					},
				},
				removeDependency: {
					label: "Eliminar dependencia",
					description: "Elimina una dependencia.",
					input: {
						uid: {
							label: "Dependencia ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Iniciar temporizador",
					description: "Inicia el seguimiento del tiempo.",
					input: {
						options: {
							description: {
								label: "Descripción",
							},
						},
					},
					output: {
						startedAt: {
							label: "Comenzó en",
							description: "Marca de tiempo ISO registrada por la ejecución del flujo de trabajo.",
						},
					},
				},
				stop: {
					label: "detener el cronómetro",
					description: "Detiene el seguimiento del tiempo.",
					output: {
						stoppedAt: {
							label: "Se detuvo en",
							description: "Marca de tiempo ISO registrada por la ejecución del flujo de trabajo.",
						},
					},
				},
				appendEntry: {
					label: "Agregar entrada de tiempo",
					description: "Agrega una entrada de tiempo.",
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
					description: "Muestra un aviso Obsidian.",
					input: {
						message: {
							label: "Mensaje",
						},
					},
					output: {
						message: {
							label: "Mensaje",
						},
					},
					examples: {
						0: {
							label: "Mostrar título de la tarea",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Abrir archivo",
					description: "Abre un archivo de almacén en el espacio de trabajo.",
					input: {
						newLeaf: {
							label: "Abrir en",
							options: {
								current: "hoja actual",
								tab: "Nueva pestaña",
								split: "dividir",
								window: "ventana emergente",
							},
						},
					},
					output: {
						opened: {
							label: "Abierto",
						},
						newLeaf: {
							label: "Objetivo abierto",
						},
					},
					examples: {
						0: {
							label: "Abrir archivo desencadenante",
						},
					},
				},
				createNote: {
					label: "Crear nota",
					description: "Crea una nota Markdown en la bóveda.",
					input: {
						content: {
							label: "Contenido",
						},
					},
					output: {
						created: {
							label: "Creado",
						},
					},
					examples: {
						0: {
							label: "Crear una nota fechada",
						},
					},
				},
				appendNote: {
					label: "Agregar a la nota",
					description: "Agrega texto a una nota Markdown existente.",
					input: {
						text: {
							label: "Texto",
						},
					},
					output: {
						appended: {
							label: "Adjunto",
						},
						length: {
							label: "Longitud",
						},
					},
					examples: {
						0: {
							label: "Agregar al archivo desencadenante",
						},
					},
				},
				updateFrontmatter: {
					label: "Actualización frontmatter",
					description: "Aplica un parche top-level frontmatter a una nota Markdown.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Teclas Top-level para configurar. Utilice null para eliminar una clave.",
						},
					},
					output: {
						updated: {
							label: "Actualizado",
						},
						keys: {
							label: "llaves",
						},
					},
					examples: {
						0: {
							label: "Marcar el archivo de activación como revisado",
						},
					},
				},
				moveFile: {
					label: "Mover archivo",
					description: "Mueve o cambia el nombre de un archivo de almacén.",
					input: {
						targetPath: {
							label: "Ruta de destino",
						},
						updateLinks: {
							label: "Enlaces de actualización",
							description: "Utilice el administrador de archivos de Obsidian para que los enlaces se actualicen de acuerdo con la configuración de la bóveda.",
						},
					},
					output: {
						moved: {
							label: "movido",
						},
						oldPath: {
							label: "viejo camino",
						},
					},
					examples: {
						0: {
							label: "Archivar archivo de activación",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Detener el flujo de trabajo",
					description: "Detiene la ejecución del flujo de trabajo actual.",
					input: {
						reason: {
							label: "Razón",
						},
					},
					output: {
						stopped: {
							label: "Detenido",
						},
						reason: {
							label: "Razón",
						},
					},
					examples: {
						0: {
							label: "detenerse con razon",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "El tiempo de ejecución TaskNotes API no está disponible.",
			obsidianUnavailable: "El contexto de la aplicación Obsidian no está disponible.",
			requiredText: "La entrada de pasos requiere texto non-empty: {field}",
		},
	},
};
