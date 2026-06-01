import type { TranslationTree } from "../types";

export const de: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Abbrechen",
		clear: "Klar",
		continue: "Weiter",
		disabled: "Deaktiviert",
		enabled: "Aktiviert",
		inputs: "Eingaben",
		maintain: "Pflegen",
		output: "Ausgabe",
		outputs: "Ausgänge",
		save: "Speichern",
		saved: "Gespeichert",
		stop: "Stopp",
		summary: "Zusammenfassung",
		systemDefault: "Systemstandard",
		unsavedChanges: "Nicht gespeicherte Änderungen",
		runStatus: {
			success: "Erfolg",
			failed: "gescheitert",
			skipped: "übersprungen",
			stopped: "gestoppt",
		},
		workflowStatus: {
			enabled: "aktiviert",
			disabled: "deaktiviert",
			invalid: "ungültig",
		},
		languages: {
			en: "Englisch",
		},
	},
	commands: {
		openWorkflows: "Offene Arbeitsabläufe",
		newWorkflow: "Neuer Arbeitsablauf",
		reloadWorkflows: "Workflows neu laden",
		maintainDefaultWorkflows: "Behalten Sie Standard-Workflowdateien bei",
		runWorkflow: "Ausführen: {name}",
	},
	notices: {
		languageChanged: "Die Sprache wurde in {language} geändert.",
		workflowsReloaded: "Arbeitsabläufe neu geladen.",
		defaultFilesCreated: "Erstellte den Standardwert {count} {fileLabel}.",
		defaultFilesAlreadyPresent: "Standard-Workflowdateien sind bereits vorhanden.",
		workflowCommandUnavailable: "Der Workflow-Befehl ist nicht mehr verfügbar.",
		workflowRunCompleted: "Führen Sie {status}: {name} aus",
		workflowDryRunCompleted: "Trockenlauf {status}: {name}",
		workflowBaseNotFound: "Workflow-Basis nicht gefunden: {path}",
		runHistoryCleared: "Der Workflow-Ausführungsverlauf wurde gelöscht.",
		workflowSaved: "Gespeicherter Workflow: {name}",
		discardChanges: "Nicht gespeicherte Änderungen. Drücken Sie erneut „Abbrechen“, um den Vorgang zu verwerfen.",
		discardAndOpenNote: "Nicht gespeicherte Änderungen. Drücken Sie erneut „Notiz öffnen“, um die Notiz zu verwerfen und zu öffnen.",
	},
	settings: {
		workflowFiles: {
			heading: "Workflow-Dateien",
			folder: {
				name: "Workflow-Ordner",
				description: "Tresorordner mit Markdown-Workflowdefinitionen.",
			},
			base: {
				name: "Workflow-Basis",
				description: "Tresorpfad für die Arbeitsablaufansicht der generierten Basen.",
			},
			createDefaults: {
				name: "Erstellen Sie Workflow-Standards",
				description: "Schreiben Sie Beispiel-Workflow-Notizen, wenn das Plugin geladen wird oder wenn Standardeinstellungen beibehalten werden.",
			},
			createBase: {
				name: "Erstellen Sie eine Workflow-Basis",
				description: "Schreiben Sie die generierte Basis-Workflow-Ansicht, wenn das Plugin geladen wird oder wenn Standardeinstellungen beibehalten werden.",
			},
			maintainDefaults: {
				name: "Behalten Sie die Standardeinstellungen bei",
				description: "Erstellen Sie fehlende Workflow-Notizen und die Workflow-Basis, ohne vorhandene Dateien zu überschreiben.",
			},
		},
		triggers: {
			heading: "Auslöser",
			tasknotesEvents: {
				name: "TaskNotes-Ereignisauslöser",
				description: "Führen Sie Workflows über TaskNotes-Laufzeit-API-Ereignisse wie task.status.changed aus.",
			},
			scheduled: {
				name: "Geplante Auslöser",
				description: "Führen Sie cron und Intervall-Workflows aus, während Obsidian geöffnet ist.",
			},
			obsidian: {
				name: "Erweiterte Obsidian-Trigger",
				description: "Obsidian Tresor- und Arbeitsbereichsauslöser zulassen. Halten Sie die Pfadfilter eng.",
			},
			minInterval: {
				name: "Mindestintervall",
				description: "Niedrigste zulässige Intervall-Triggerfrequenz in Millisekunden.",
			},
		},
		runLogs: {
			heading: "Führen Sie Protokolle aus",
			folder: {
				name: "Führen Sie den Protokollordner aus",
				description: "Optionaler Tresorpfad für Laufzusammenfassungen und Detaildateien. Lassen Sie das Feld leer, um den Konfigurationsordner dieses Plugins zu verwenden.",
			},
			level: {
				name: "Protokollebene ausführen",
				description: "Steuert, wie viele Details in Laufaufzeichnungen gespeichert werden.",
				options: {
					summary: "Zusammenfassung",
					inputs: "Eingaben",
					inputsAndOutputs: "Ein- und Ausgänge",
				},
			},
			retention: {
				name: "Läufe pro Workflow beibehalten",
				description: "Nach Ablauf dieser Grenze werden alte Detaildateien gelöscht.",
			},
			clear: {
				name: "Laufverlauf löschen",
				description: "Löschen Sie die plugin-local-Workflow-Ausführungsprotokolle.",
			},
		},
		language: {
			heading: "Schnittstellensprache",
			description: "Ändern Sie die Sprache der TaskNotes Workflows-Befehle, Einstellungen, Hinweise und Ansichten.",
			name: "UI-Sprache",
			dropdownDescription: "Wählen Sie die Sprache aus, die für den TaskNotes Workflows-Benutzeroberflächentext verwendet wird.",
		},
	},
	baseView: {
		title: "Arbeitsabläufe",
		tasknotesAvailable: "TaskNotes-Laufzeit API ist verfügbar.",
		tasknotesUnavailable: "TaskNotes-Laufzeit API ist nicht verfügbar; task-writing-Schritte können nicht ausgeführt werden.",
		empty: "Keine Workflows gefunden",
		newWorkflow: "Neuer Arbeitsablauf",
	},
	workflowCard: {
		labels: {
			triggers: "Auslöser",
			steps: "Schritte",
			lastRun: "Letzter Lauf",
			noOverlap: "keine Überschneidung",
		},
		tooltips: {
			edit: "Workflow bearbeiten",
			dryRun: "Probelauf-Workflow",
			run: "Workflow ausführen",
			history: "Laufverlauf",
			openNote: "Workflow-Notiz öffnen",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "jeden {every}",
			vault: "Tresor {event}",
			metadata: "Metadaten {event}",
			workspace: "Arbeitsbereich {event}",
			manual: "Handbuch",
		},
	},
	runHistory: {
		title: "Laufverlauf",
		runs: "Läuft",
		latest: "Neueste",
		trigger: "Auslöser",
		duration: "Dauer",
		runId: "Führen Sie ID aus",
		dryRun: "Trockenlauf",
		stepCount: {
			one: "{count} Schritt",
			other: "{count} Schritte",
		},
		input: "Eingabe",
		output: "Ausgabe",
		empty: {
			diagnostics: "Die Workflow-Diagnose muss behoben werden, bevor Läufe angezeigt werden können.",
			loading: "Laufverlauf wird geladen...",
			noRuns: "Es wurden noch keine Läufe aufgezeichnet.",
			missingDetail: "Ausführungsdetail wurde nicht gefunden.",
		},
	},
	engine: {
		workflowInvalid: "Der Workflow ist ungültig: {path}",
		workflowAlreadyRunning: "Der Workflow läuft bereits.",
		workflowDisabled: "Der Workflow ist deaktiviert.",
		conditionsDidNotMatch: "Die Workflow-Bedingungen stimmten nicht überein.",
		stepFailed: "Schritt fehlgeschlagen.",
		unknownStepType: "Unbekannter Schritttyp: {type}",
		forEachNonArray: "forEach wurde in einen non-array-Wert aufgelöst.",
		forEachTooManyItems: "forEach ausgewählte {count}-Elemente, oben run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Workflow bearbeiten",
			new: "Neuer Arbeitsablauf",
		},
		untitledWorkflow: "Arbeitsablauf ohne Titel",
		workflowEditor: "Workflow-Editor",
		sections: {
			definition: {
				label: "Definition",
				description: "Name und Identität",
				title: "Definition",
				body: "Benennen Sie diesen Workflow und behalten Sie seine stabile Identität bei.",
			},
			triggers: {
				label: "Auslöser",
				description: "Veranstaltungen starten",
				title: "Auslöser",
				body: "Führen Sie den Workflow manuell, nach einem Zeitplan, über TaskNotes-Ereignisse oder über ausgewählte Obsidian-Ereignisse aus.",
			},
			steps: {
				label: "Schritte",
				description: "Aktionen",
				title: "Schritte",
				body: "Die Stufen verlaufen von oben nach unten. Auf Ausgaben früherer Schritte kann in späteren Schritten verwiesen werden.",
			},
			run: {
				label: "Richtlinie ausführen",
				description: "Grenzen und Fehler",
				title: "Richtlinie ausführen",
				body: "Wählen Sie das Standardfehlerverhalten. Die Sicherheitsgrenzwerte können für die meisten Arbeitsabläufe auf ihren Standardwerten bleiben.",
			},
		},
		summary: {
			triggerCount: {
				one: "{count}-Trigger",
				other: "{count}-Trigger",
			},
			stepCount: {
				one: "{count} Schritt",
				other: "{count} Schritte",
			},
			noOverlap: "Keine Überschneidung",
			overlapAllowed: "Überlappung erlaubt",
			enabledDescription: "Es können manuelle, geplante und Ereignisauslöser ausgeführt werden.",
			disabledDescription: "Manuelle, geplante und Ereignisauslöser werden nicht ausgeführt.",
		},
		definition: {
			name: "Name",
			description: "Beschreibung",
			descriptionPlaceholder: "Optionaler Hinweis, warum dieser Workflow existiert.",
			id: "ID",
			advancedTitle: "Erweiterte Identität",
			advancedDescription: "Stabile IDs werden für Befehle, gespeicherte Läufe und Referenzen aus anderen Workflows verwendet.",
		},
		triggers: {
			addTitle: "Auslöser hinzufügen",
			addDescription: "Weitere Trigger starten denselben Workflow.",
			addButton: "Auslöser hinzufügen",
			type: "Triggertyp",
			id: "ID",
			typeLabel: "Typ",
			tasknotesEvent: "TaskNotes-Ereignis",
			fromStatus: "Vom Status",
			toStatus: "Zum Status",
			pathGlob: "Pfadglobus",
			allowSelfTrigger: "Erlaube self-trigger",
			schedule: "Zeitplan",
			timezone: "Zeitzone",
			catchUp: "Aufholen",
			every: "Jeder",
			event: "Veranstaltung",
			manualHelp: "Manuelle Ausführungen werden in der Befehlspalette angezeigt, wenn der Workflow aktiviert ist.",
			valuesAvailable: "Für Schritte verfügbare Triggerwerte ({count})",
			advancedTitle: "Erweiterte Triggeroptionen",
			advancedDescription: "Beschränken Sie den Abgleich, bewahren Sie eine stabile ID und steuern Sie das Wiedergabeverhalten.",
			needsAttention: "Braucht Aufmerksamkeit",
			tooltips: {
				moveUp: "Bewegen Sie sich nach oben",
				moveDown: "Bewegen Sie sich nach unten",
				delete: "Trigger löschen",
			},
			types: {
				manual: {
					label: "Handbuch",
					description: "Wird nur ausgeführt, wenn es explizit gestartet wird.",
				},
				tasknotesEvent: {
					label: "TaskNotes-Ereignis",
					description: "Wird ausgeführt, wenn TaskNotes das ausgewählte Laufzeitereignis ausgibt.",
				},
				cron: {
					label: "Cron-Zeitplan",
					description: "Wird ausgeführt, wenn der five-part cron-Zeitplan mit der aktuellen Minute übereinstimmt.",
				},
				interval: {
					label: "Intervall",
					description: "Wird wiederholt ausgeführt, während Obsidian geöffnet ist.",
				},
				obsidianVault: {
					label: "Tresordateiereignis",
					description: "Wird ausgeführt, wenn Obsidian eine Datei erstellt, ändert, löscht oder umbenennt.",
				},
				obsidianMetadata: {
					label: "Metadatenereignis",
					description: "Wird ausgeführt, wenn sich Obsidian-Metadaten ändern oder aufgelöst werden.",
				},
				obsidianWorkspace: {
					label: "Arbeitsbereich-Ereignis",
					description: "Wird ausgeführt, wenn eine ausgewählte Arbeitsbereichsaktivität stattfindet, z. B. das Öffnen einer Datei oder das Ändern des aktiven Blatts.",
				},
			},
			events: {
				create: "Erstellen",
				modify: "Ändern",
				delete: "Löschen",
				rename: "Umbenennen",
				changed: "Geändert",
				deleted: "Gelöscht",
				resolve: "Lösen",
				resolved: "Gelöst",
				fileOpen: "Datei geöffnet",
				activeLeafChange: "Gangflügel geändert",
				layoutChange: "Layout geändert",
			},
			tasknotesEvents: {
				task: {
					created: "Aufgabe erstellt",
					updated: "Aufgabe aktualisiert",
					deleted: "Aufgabe gelöscht",
					moved: "Aufgabe verschoben",
					status: {
						changed: "Aufgabenstatus geändert",
					},
					completed: "Aufgabe abgeschlossen",
					uncompleted: "Aufgabe nicht abgeschlossen",
					archived: "Aufgabe archiviert",
					unarchived: "Aufgabe nicht archiviert",
					scheduled: {
						changed: "Das geplante Datum der Aufgabe wurde geändert",
					},
					due: {
						changed: "Fälligkeitsdatum der Aufgabe geändert",
					},
					priority: {
						changed: "Aufgabenpriorität geändert",
					},
					tags: {
						changed: "Aufgaben-Tags geändert",
					},
					contexts: {
						changed: "Aufgabenkontexte haben sich geändert",
					},
					projects: {
						changed: "Aufgabenprojekte geändert",
					},
					reminders: {
						changed: "Aufgabenerinnerungen geändert",
					},
					dependencies: {
						changed: "Aufgabenabhängigkeiten geändert",
					},
					recurrence: {
						changed: "Aufgabenwiederholung geändert",
					},
				},
				time: {
					started: "Die Zeiterfassung wurde gestartet",
					stopped: "Die Zeiterfassung wurde gestoppt",
				},
				pomodoro: {
					started: "Pomodoro begann",
					completed: "Pomodoro abgeschlossen",
					interrupted: "Pomodoro unterbrach ihn",
				},
				recurring: {
					instance: {
						completed: "Wiederkehrende Instanz abgeschlossen",
						skipped: "Wiederkehrende Instanz übersprungen",
					},
				},
			},
			summary: {
				statusFromTo: "Status ändert sich von {from} zu {to}",
				statusTo: "Status ändert sich zu {to}",
				statusFrom: "Statusänderungen von {from}",
				schedule: "Zeitplan {schedule}",
				every: "Jeder {every}",
				vaultFile: "Tresordatei {event}",
				metadata: "Metadaten {event}",
				workspace: "Arbeitsbereich {event}",
				manual: "Manueller Lauf",
			},
			outputs: {
				type: {
					label: "Typ",
					description: "Die Art des Auslösers.",
				},
				id: {
					label: "ID",
					description: "Der Auslöser ID aus diesem Workflow.",
				},
				event: {
					label: "Veranstaltung",
					description: "Der Ereignisname, der die Ausführung gestartet hat.",
				},
				actualAt: {
					label: "Tatsächliche Zeit",
					description: "Wann die Workflow-Ausführung gestartet wurde.",
				},
				after: {
					path: {
						label: "Aufgabenpfad",
						description: "Der Aufgabenpfad nach dem Ereignis.",
					},
					title: {
						label: "Aufgabentitel",
						description: "Der Aufgabentitel nach dem Ereignis.",
					},
					status: {
						label: "Aktueller Stand",
						description: "Der Aufgabenstatus nach dem Ereignis.",
					},
				},
				before: {
					status: {
						label: "Vorheriger Stand",
						description: "Der Aufgabenstatus vor dem Ereignis.",
					},
				},
				changes: {
					label: "Änderungen",
					description: "Geänderte Felder, die nach Eigenschaftsnamen sortiert sind.",
				},
				source: {
					label: "Quelle",
					description: "Die Mutationsquelle, sofern angegeben.",
				},
				correlationId: {
					label: "Korrelation ID",
					description: "Die Mutationskorrelation ID, sofern angegeben.",
				},
				scheduledAt: {
					label: "Geplante Zeit",
					description: "Die Tickzeit des Zeitplans.",
				},
				path: {
					label: "Pfad",
					description: "Der entsprechende Tresordateipfad.",
				},
				file: {
					path: {
						label: "Dateipfad",
						description: "Der passende Dateipfad.",
					},
					name: {
						label: "Dateiname",
						description: "Der passende Dateiname.",
					},
					extension: {
						label: "Erweiterung",
						description: "Die passende Dateierweiterung.",
					},
				},
				data: {
					label: "Daten",
					description: "Zusätzliche Ereignisdaten, sofern bereitgestellt.",
				},
				manual: {
					label: "Handbuch",
					description: "Gilt für einen manuellen Lauf.",
				},
			},
		},
		steps: {
			addTitle: "Nächsten Schritt hinzufügen",
			addDescription: "Der neue Schritt wird nach den oben genannten Schritten ausgeführt.",
			addButton: "Schritt hinzufügen",
			type: "Schritttyp",
			id: "ID",
			advancedTitle: "Erweiterte Schrittoptionen",
			advancedDescription: "Stabile IDs erstellen Referenzen für spätere Schritte. Bei Batchläufen wird für jeden Wert das optionale Element verwendet.",
			forEach: "Für jeden",
			forEachHelp: "Optionale Array-Referenz für Batch-Schritte.",
			inputJson: "Geben Sie JSON ein",
			writes: "schreibt",
			needsAttention: "Braucht Aufmerksamkeit",
			outputsAvailable: "Für spätere Schritte verfügbare Ausgänge ({count})",
			tooltips: {
				moveUp: "Bewegen Sie sich nach oben",
				moveDown: "Bewegen Sie sich nach unten",
				delete: "Schritt löschen",
			},
			unknownCategory: "Andere",
			summary: {
				forEach: "für jeden {value}",
			},
		},
		runPolicy: {
			noOverlap: "Keine Überschneidung",
			onError: "Auf Fehler",
			advancedTitle: "Erweiterte Lauflimits",
			advancedDescription: "Diese Werte sorgen dafür, dass automatisierte Läufe identifizierbar und begrenzt sind.",
			maxTasks: "Maximale Aufgaben",
			source: "Quelle",
		},
		footer: {
			openNote: "Notiz öffnen",
		},
		templateSuggestions: {
			workflowId: "Workflow-ID",
			workflowName: "Workflowname",
			today: "Heute",
			now: "Jetzt",
			itemPath: "Aktueller Artikelpfad",
			triggerValue: "Trigger {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "Name ist erforderlich.",
			invalidWorkflowId: "Verwenden Sie Kleinbuchstaben, Zahlen, Punkte, Unterstriche oder Bindestriche. Beginnen Sie mit einem Brief.",
			duplicateWorkflowId: "Wird bereits von {path} verwendet.",
			triggerRequired: "Fügen Sie mindestens einen Auslöser hinzu.",
			invalidTriggerId: "Die Trigger-ID muss mit einem Buchstaben beginnen und die Zeichen id-safe verwenden.",
			duplicateTriggerId: "Trigger-IDs müssen eindeutig sein.",
			tasknotesEventRequired: "Wählen Sie ein TaskNotes-Ereignis.",
			cronScheduleRequired: "Fügen Sie einen cron-Zeitplan hinzu.",
			intervalRequired: "Fügen Sie ein Intervall hinzu.",
			stepRequired: "Fügen Sie mindestens einen Schritt hinzu.",
			invalidStepId: "Die Schritt-ID muss mit einem Buchstaben beginnen und die Zeichen id-safe enthalten.",
			duplicateStepId: "Schritt-IDs müssen eindeutig sein.",
			unknownStepType: "Unbekannter Schritttyp: {type}",
			fieldRequired: "{field} ist erforderlich.",
			positiveNumber: "Verwenden Sie eine positive Zahl.",
			jsonObject: "Die Schritteingabe muss ein JSON-Objekt sein.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Aufgabenbeziehungen",
			timeTracking: "Zeiterfassung",
			obsidian: "Obsidian",
			controlFlow: "Kontrollfluss",
		},
		common: {
			task: {
				label: "Aufgabe",
				description: "Tresorpfad zu einer TaskNotes-Aufgabe. Ausgelöste Aufgabenworkflows verwenden normalerweise {{trigger.after.path}}.",
			},
			path: {
				label: "Pfad",
				description: "Tresorpfad zu einer Markdown-Datei.",
			},
			outputTask: {
				label: "Aufgabe",
				description: "Aktualisierte TaskNotes-Aufgabendaten.",
			},
			outputPath: {
				label: "Pfad",
				description: "Tresorpfad der Aufgabe nach Abschluss des Schritts.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "Aufgabe erhalten",
					description: "Liest eine Aufgabe nach Pfad.",
					examples: {
						0: {
							label: "Lesen Sie die auslösende Aufgabe",
						},
					},
				},
				query: {
					label: "Abfrageaufgaben",
					description: "Wählt Aufgaben mit einer kompakten Workflow-Abfrage aus.",
					input: {
						query: {
							label: "Abfrage",
							description: "Durch Aufgabenfelder verschlüsseltes Objekt. Werte können Literale oder { operator, value }-Filter sein.",
						},
					},
					output: {
						tasks: {
							label: "Aufgaben",
							description: "Die passenden TaskNotes-Aufgaben.",
						},
						count: {
							label: "Zählen",
							description: "Anzahl passender Aufgaben.",
						},
					},
					examples: {
						0: {
							label: "Offene Aufgaben",
						},
					},
				},
				parents: {
					label: "Holen Sie sich übergeordnete Aufgaben",
					description: "Liest übergeordnete Aufgaben, die mit den Projekten der Aufgabe verknüpft sind.",
				},
				subtasks: {
					label: "Holen Sie sich Unteraufgaben",
					description: "Liest Aufgaben, die diese Aufgabe als Projekt referenzieren.",
				},
				blocking: {
					label: "Erhalten Sie blockierende Aufgaben",
					description: "Liest Aufgaben, die von dieser Aufgabe blockiert werden.",
				},
				dependencies: {
					label: "Holen Sie sich Abhängigkeiten",
					description: "Liest die Aufgaben, die diese Aufgabe blockieren.",
					output: {
						dependencies: {
							label: "Abhängigkeiten",
							description: "Abhängigkeitsobjekte mit aufgelösten TaskNotes-Aufgabendaten, sofern verfügbar.",
						},
						tasks: {
							label: "Aufgaben",
							description: "Abhängigkeitsaufgaben gelöst.",
						},
						count: {
							label: "Zählen",
							description: "Anzahl der Abhängigkeiten.",
						},
					},
					examples: {
						0: {
							label: "Auslösende Aufgabenabhängigkeiten lesen",
						},
					},
				},
				relationships: {
					label: "Beziehungen aufbauen",
					description: "Liest übergeordnete Aufgaben, Unteraufgaben, Abhängigkeiten und blockierende Aufgaben für eine Aufgabe.",
					output: {
						task: {
							label: "Aufgabe",
							description: "Die Aufgabe.",
						},
						parents: {
							label: "Eltern",
							description: "Elternaufgaben.",
						},
						subtasks: {
							label: "Unteraufgaben",
							description: "Unteraufgaben.",
						},
						dependencies: {
							label: "Abhängigkeiten",
							description: "Aufgaben, die diese Aufgabe blockieren.",
						},
						blocking: {
							label: "Blockieren",
							description: "Von dieser Aufgabe blockierte Aufgaben.",
						},
					},
					examples: {
						0: {
							label: "Lesen Sie alle Beziehungen",
						},
					},
				},
				create: {
					label: "Aufgabe erstellen",
					description: "Erstellt eine neue TaskNotes-Aufgabe.",
					input: {
						title: {
							label: "Titel",
						},
						status: {
							label: "Status",
						},
						priority: {
							label: "Priorität",
						},
						due: {
							label: "Fällig",
						},
						scheduled: {
							label: "Geplant",
						},
						details: {
							label: "Einzelheiten",
						},
					},
					examples: {
						0: {
							label: "Erstellen Sie eine Posteingangsaufgabe",
						},
					},
				},
				patch: {
					label: "Patch-Aufgabe",
					description: "Aktualisiert Aufgabenfelder.",
					input: {
						patch: {
							label: "Patch",
							description: "Zu aktualisierende Aufgabenfelder, z. B. Status, Priorität, fällig, geplant, Tags, Projekte oder Kontexte.",
						},
					},
					examples: {
						0: {
							label: "Als aktiv markieren",
						},
					},
				},
				set: {
					label: "Aufgabenfelder festlegen",
					description: "Alias für task.patch.",
					input: {
						patch: {
							label: "Felder",
							description: "Aufgabenfelder zum Festlegen.",
						},
					},
				},
				move: {
					label: "Aufgabe verschieben",
					description: "Verschiebt eine Aufgabennotiz.",
					input: {
						targetFolder: {
							label: "Zielordner",
						},
					},
					examples: {
						0: {
							label: "Auslösende Aufgabe verschieben",
						},
					},
				},
				archive: {
					label: "Archivierungsaufgabe",
					description: "Archiviert eine Aufgabe.",
				},
				unarchive: {
					label: "Aufgabe zum Dearchivieren",
					description: "Entarchiviert eine Aufgabe.",
				},
				complete: {
					label: "Aufgabe abschließen",
					description: "Markiert eine Aufgabe als abgeschlossen.",
					input: {
						options: {
							status: {
								label: "Status „Abgeschlossen“.",
							},
						},
					},
				},
				uncomplete: {
					label: "Unvollendete Aufgabe",
					description: "Öffnet eine abgeschlossene Aufgabe erneut.",
					input: {
						options: {
							status: {
								label: "Wiedereröffneter Status",
							},
						},
					},
				},
				reschedule: {
					label: "Aufgabe neu planen",
					description: "Legt das geplante Datum fest oder löscht es.",
					input: {
						date: {
							label: "Geplanter Termin",
						},
					},
				},
				setDue: {
					label: "Fälligkeitsdatum festlegen",
					description: "Fälligkeitsdatum festlegen",
					input: {
						date: {
							label: "Fälligkeitsdatum",
						},
					},
				},
				clearDue: {
					label: "Klares Fälligkeitsdatum",
					description: "Klares Fälligkeitsdatum",
				},
				setScheduled: {
					label: "Geplantes Datum festlegen",
					description: "Geplantes Datum festlegen",
					input: {
						date: {
							label: "Geplanter Termin",
						},
					},
				},
				clearScheduled: {
					label: "Klares geplantes Datum",
					description: "Klares geplantes Datum",
				},
				addTag: {
					label: "Tag hinzufügen",
					description: "Tag hinzufügen",
					input: {
						tag: {
							label: "Etikett",
						},
					},
				},
				removeTag: {
					label: "Tag entfernen",
					description: "Tag entfernen",
					input: {
						tag: {
							label: "Etikett",
						},
					},
				},
				addProject: {
					label: "Projekt hinzufügen",
					description: "Projekt hinzufügen",
					input: {
						project: {
							label: "Projekt",
						},
					},
				},
				removeProject: {
					label: "Projekt entfernen",
					description: "Projekt entfernen",
					input: {
						project: {
							label: "Projekt",
						},
					},
				},
				addContext: {
					label: "Kontext hinzufügen",
					description: "Kontext hinzufügen",
					input: {
						context: {
							label: "Kontext",
						},
					},
				},
				removeContext: {
					label: "Kontext entfernen",
					description: "Kontext entfernen",
					input: {
						context: {
							label: "Kontext",
						},
					},
				},
				addDependency: {
					label: "Abhängigkeit hinzufügen",
					description: "Fügt eine blockierende Abhängigkeit hinzu.",
					input: {
						dependency: {
							label: "Abhängigkeit",
						},
					},
				},
				removeDependency: {
					label: "Abhängigkeit entfernen",
					description: "Entfernt eine Abhängigkeit.",
					input: {
						uid: {
							label: "Abhängigkeit ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Timer starten",
					description: "Startet die Zeiterfassung.",
					input: {
						options: {
							description: {
								label: "Beschreibung",
							},
						},
					},
					output: {
						startedAt: {
							label: "Begonnen um",
							description: "ISO-Zeitstempel, der vom Workflow-Lauf aufgezeichnet wurde.",
						},
					},
				},
				stop: {
					label: "Stoppen Sie den Timer",
					description: "Stoppt die Zeiterfassung.",
					output: {
						stoppedAt: {
							label: "Angehalten bei",
							description: "ISO-Zeitstempel, der vom Workflow-Lauf aufgezeichnet wurde.",
						},
					},
				},
				appendEntry: {
					label: "Zeiteintrag anhängen",
					description: "Fügt einen Zeiteintrag hinzu.",
					input: {
						entry: {
							label: "Eintrag",
						},
					},
				},
			},
			notice: {
				show: {
					label: "Hinweis anzeigen",
					description: "Zeigt einen Obsidian-Hinweis an.",
					input: {
						message: {
							label: "Nachricht",
						},
					},
					output: {
						message: {
							label: "Nachricht",
						},
					},
					examples: {
						0: {
							label: "Aufgabentitel anzeigen",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Datei öffnen",
					description: "Öffnet eine Tresordatei im Arbeitsbereich.",
					input: {
						newLeaf: {
							label: "Öffnen Sie in",
							options: {
								current: "Aktuelles Blatt",
								tab: "Neuer Tab",
								split: "Geteilt",
								window: "Popout-Fenster",
							},
						},
					},
					output: {
						opened: {
							label: "Geöffnet",
						},
						newLeaf: {
							label: "Ziel öffnen",
						},
					},
					examples: {
						0: {
							label: "Auslösende Datei öffnen",
						},
					},
				},
				createNote: {
					label: "Notiz erstellen",
					description: "Erstellt eine Markdown-Notiz im Tresor.",
					input: {
						content: {
							label: "Inhalt",
						},
					},
					output: {
						created: {
							label: "Erstellt",
						},
					},
					examples: {
						0: {
							label: "Erstellen Sie eine datierte Notiz",
						},
					},
				},
				appendNote: {
					label: "An Notiz anhängen",
					description: "Fügt Text an eine vorhandene Markdown-Notiz an.",
					input: {
						text: {
							label: "Text",
						},
					},
					output: {
						appended: {
							label: "Angehängt",
						},
						length: {
							label: "Länge",
						},
					},
					examples: {
						0: {
							label: "An auslösende Datei anhängen",
						},
					},
				},
				updateFrontmatter: {
					label: "Aktualisieren Sie frontmatter",
					description: "Wendet einen top-level frontmatter-Patch auf eine Markdown-Note an.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Top-level-Tasten zum Einstellen. Verwenden Sie null, um einen Schlüssel zu löschen.",
						},
					},
					output: {
						updated: {
							label: "Aktualisiert",
						},
						keys: {
							label: "Schlüssel",
						},
					},
					examples: {
						0: {
							label: "Auslösende Datei als überprüft markieren",
						},
					},
				},
				moveFile: {
					label: "Datei verschieben",
					description: "Verschiebt oder benennt eine Tresordatei um.",
					input: {
						targetPath: {
							label: "Zielpfad",
						},
						updateLinks: {
							label: "Links aktualisieren",
							description: "Verwenden Sie den Dateimanager von Obsidian, damit Links entsprechend den Tresoreinstellungen aktualisiert werden.",
						},
					},
					output: {
						moved: {
							label: "Verschoben",
						},
						oldPath: {
							label: "Alter Weg",
						},
					},
					examples: {
						0: {
							label: "Auslösende Datei archivieren",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Stoppen Sie den Arbeitsablauf",
					description: "Stoppt die aktuelle Workflow-Ausführung.",
					input: {
						reason: {
							label: "Grund",
						},
					},
					output: {
						stopped: {
							label: "Angehalten",
						},
						reason: {
							label: "Grund",
						},
					},
					examples: {
						0: {
							label: "Hören Sie mit der Vernunft auf",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "TaskNotes-Laufzeit API ist nicht verfügbar.",
			obsidianUnavailable: "Der Obsidian-App-Kontext ist nicht verfügbar.",
			requiredText: "Schritteingabe erfordert non-empty-Text: {field}",
		},
	},
};
