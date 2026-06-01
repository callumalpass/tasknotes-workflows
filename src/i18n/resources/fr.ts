import type { TranslationTree } from "../types";

export const fr: TranslationTree = {
	common: {
		appName: "TaskNotes Workflows",
		cancel: "Annuler",
		clear: "Effacer",
		continue: "Continuer",
		disabled: "Désactivé",
		enabled: "Activé",
		inputs: "Entrées",
		maintain: "Entretenir",
		output: "Sortie",
		outputs: "Sorties",
		save: "Enregistrer",
		saved: "Enregistré",
		stop: "Arrêter",
		summary: "Résumé",
		systemDefault: "Valeur par défaut du système",
		unsavedChanges: "Modifications non enregistrées",
		runStatus: {
			success: "succès",
			failed: "échoué",
			skipped: "ignoré",
			stopped: "arrêté",
		},
		workflowStatus: {
			enabled: "activé",
			disabled: "désactivé",
			invalid: "invalide",
		},
		languages: {
			en: "Anglais",
		},
	},
	commands: {
		openWorkflows: "Flux de travail ouverts",
		newWorkflow: "Nouveau flux de travail",
		reloadWorkflows: "Recharger les flux de travail",
		maintainDefaultWorkflows: "Conserver les fichiers de flux de travail par défaut",
		runWorkflow: "Exécuter : {name}",
	},
	notices: {
		languageChanged: "Langue modifiée en {language}.",
		workflowsReloaded: "Les workflows ont été rechargés.",
		defaultFilesCreated: "Création de {count} par défaut {fileLabel}.",
		defaultFilesAlreadyPresent: "Les fichiers de workflow par défaut sont déjà présents.",
		workflowCommandUnavailable: "La commande Workflow n'est plus disponible.",
		workflowRunCompleted: "Exécutez {status} : {name}",
		workflowDryRunCompleted: "Marche à sec {status} : {name}",
		workflowBaseNotFound: "Base de workflow introuvable : {path}",
		runHistoryCleared: "L'historique d'exécution du workflow a été effacé.",
		workflowSaved: "Flux de travail enregistré : {name}",
		discardChanges: "Modifications non enregistrées. Appuyez à nouveau sur Annuler pour supprimer.",
		discardAndOpenNote: "Modifications non enregistrées. Appuyez à nouveau sur Ouvrir la note pour supprimer et ouvrir la note.",
	},
	settings: {
		workflowFiles: {
			heading: "Fichiers de flux de travail",
			folder: {
				name: "Dossier de flux de travail",
				description: "Dossier Vault contenant les définitions de flux de travail Markdown.",
			},
			base: {
				name: "Base de flux de travail",
				description: "Chemin du coffre-fort pour la vue du workflow des bases générées.",
			},
			createDefaults: {
				name: "Créer des paramètres par défaut du flux de travail",
				description: "Rédigez des exemples de notes de flux de travail lors du chargement du plugin ou lorsque les valeurs par défaut sont conservées.",
			},
			createBase: {
				name: "Créer une base de workflow",
				description: "Écrivez la vue du workflow des bases générées lors du chargement du plugin ou lorsque les valeurs par défaut sont conservées.",
			},
			maintainDefaults: {
				name: "Conserver les valeurs par défaut",
				description: "Créez des notes de flux de travail manquantes et la base de flux de travail sans écraser les fichiers existants.",
			},
		},
		triggers: {
			heading: "Déclencheurs",
			tasknotesEvents: {
				name: "Déclencheurs d'événements TaskNotes",
				description: "Exécutez des flux de travail à partir d’événements API d’exécution TaskNotes tels que task.status.changed.",
			},
			scheduled: {
				name: "Déclencheurs programmés",
				description: "Exécutez cron et les workflows par intervalles pendant que Obsidian est ouvert.",
			},
			obsidian: {
				name: "Déclencheurs Obsidian avancés",
				description: "Autoriser les déclencheurs de coffre-fort et d'espace de travail Obsidian. Gardez les filtres de chemin étroits.",
			},
			minInterval: {
				name: "Intervalle minimum",
				description: "Fréquence de déclenchement d'intervalle la plus basse autorisée en millisecondes.",
			},
		},
		runLogs: {
			heading: "Exécuter des journaux",
			folder: {
				name: "Exécuter le dossier du journal",
				description: "Chemin du coffre-fort facultatif pour les résumés d’exécution et les fichiers détaillés. Laissez vide pour utiliser le dossier de configuration de ce plugin.",
			},
			level: {
				name: "Niveau de journalisation d'exécution",
				description: "Contrôle la quantité de détails conservés dans les enregistrements d’exécution.",
				options: {
					summary: "Résumé",
					inputs: "Entrées",
					inputsAndOutputs: "Entrées et sorties",
				},
			},
			retention: {
				name: "Exécutions conservées par workflow",
				description: "Les anciens fichiers de détails sont supprimés après cette limite.",
			},
			clear: {
				name: "Effacer l'historique des exécutions",
				description: "Supprimez les journaux d’exécution du flux de travail plugin-local.",
			},
		},
		language: {
			heading: "Langue de l'interface",
			description: "Modifiez la langue des commandes, paramètres, notifications et vues TaskNotes Workflows.",
			name: "Langue UI",
			dropdownDescription: "Sélectionnez la langue utilisée pour le texte de l'interface TaskNotes Workflows.",
		},
	},
	baseView: {
		title: "Flux de travail",
		tasknotesAvailable: "Le runtime TaskNotes API est disponible.",
		tasknotesUnavailable: "L'environnement d'exécution TaskNotes API n'est pas disponible ; Les étapes task-writing ne peuvent pas s'exécuter.",
		empty: "Aucun flux de travail trouvé",
		newWorkflow: "Nouveau flux de travail",
	},
	workflowCard: {
		labels: {
			triggers: "Déclencheurs",
			steps: "Étapes",
			lastRun: "Dernière course",
			noOverlap: "pas de chevauchement",
		},
		tooltips: {
			edit: "Modifier le flux de travail",
			dryRun: "Flux de travail de simulation",
			run: "Exécuter le flux de travail",
			history: "Historique d'exécution",
			openNote: "Note de flux de travail ouvert",
		},
		summary: {
			tasknotesEvent: "TaskNotes {event}{to}",
			tasknotesTo: "-> {value}",
			cron: "cron {schedule}",
			interval: "chaque {every}",
			vault: "coffre-fort {event}",
			metadata: "métadonnées {event}",
			workspace: "espace de travail {event}",
			manual: "manuel",
		},
	},
	runHistory: {
		title: "Historique d'exécution",
		runs: "Fonctionne",
		latest: "Dernier",
		trigger: "Déclencheur",
		duration: "Durée",
		runId: "Exécutez ID",
		dryRun: "essai à sec",
		stepCount: {
			one: "Étape {count}",
			other: "Étapes {count}",
		},
		input: "Entrée",
		output: "Sortie",
		empty: {
			diagnostics: "Les diagnostics du workflow doivent être corrigés avant que les exécutions puissent être affichées.",
			loading: "Chargement de l'historique des exécutions...",
			noRuns: "Aucune course enregistrée pour le moment.",
			missingDetail: "Le détail de l'exécution n'a pas été trouvé.",
		},
	},
	engine: {
		workflowInvalid: "Le flux de travail n'est pas valide : {path}",
		workflowAlreadyRunning: "Le workflow est déjà en cours d'exécution.",
		workflowDisabled: "Le flux de travail est désactivé.",
		conditionsDidNotMatch: "Les conditions de flux de travail ne correspondaient pas.",
		stepFailed: "L'étape a échoué.",
		unknownStepType: "Type d'étape inconnu : {type}",
		forEachNonArray: "forEach résolu en une valeur non-array.",
		forEachTooManyItems: "forEach a sélectionné les éléments {count}, au-dessus de run.maxTasks {max}.",
	},
	editor: {
		title: {
			edit: "Modifier le flux de travail",
			new: "Nouveau flux de travail",
		},
		untitledWorkflow: "Flux de travail sans titre",
		workflowEditor: "Éditeur de flux de travail",
		sections: {
			definition: {
				label: "Définition",
				description: "Nom et identité",
				title: "Définition",
				body: "Nommez ce workflow et conservez son identité stable.",
			},
			triggers: {
				label: "Déclencheurs",
				description: "Démarrer les événements",
				title: "Déclencheurs",
				body: "Exécutez le flux de travail manuellement, selon une planification, à partir d'événements TaskNotes ou d'événements Obsidian sélectionnés.",
			},
			steps: {
				label: "Étapes",
				description: "Actions",
				title: "Étapes",
				body: "Les marches vont de haut en bas. Les résultats des étapes précédentes peuvent être référencés par les étapes ultérieures.",
			},
			run: {
				label: "Exécuter la stratégie",
				description: "Limites et erreurs",
				title: "Exécuter la stratégie",
				body: "Choisissez le comportement d'échec par défaut. Les limites de sécurité peuvent rester sur leurs valeurs par défaut pour la plupart des flux de travail.",
			},
		},
		summary: {
			triggerCount: {
				one: "Déclencheur {count}",
				other: "Déclencheurs {count}",
			},
			stepCount: {
				one: "Étape {count}",
				other: "Étapes {count}",
			},
			noOverlap: "Pas de chevauchement",
			overlapAllowed: "Chevauchement autorisé",
			enabledDescription: "Les déclencheurs manuels, planifiés et événementiels peuvent être exécutés.",
			disabledDescription: "Les déclencheurs manuels, planifiés et événementiels ne seront pas exécutés.",
		},
		definition: {
			name: "Nom",
			description: "Descriptif",
			descriptionPlaceholder: "Remarque facultative expliquant pourquoi ce flux de travail existe.",
			id: "ID",
			advancedTitle: "Identité avancée",
			advancedDescription: "Les identifiants stables sont utilisés pour les commandes, les exécutions enregistrées et les références d'autres flux de travail.",
		},
		triggers: {
			addTitle: "Ajouter un déclencheur",
			addDescription: "Des déclencheurs supplémentaires démarrent le même flux de travail.",
			addButton: "Ajouter un déclencheur",
			type: "Type de déclencheur",
			id: "ID",
			typeLabel: "Tapez",
			tasknotesEvent: "Événement TaskNotes",
			fromStatus: "Du statut",
			toStatus: "Vers le statut",
			pathGlob: "Chemin global",
			allowSelfTrigger: "Autoriser self-trigger",
			schedule: "Calendrier",
			timezone: "Fuseau horaire",
			catchUp: "Rattraper",
			every: "Chaque",
			event: "Événement",
			manualHelp: "Les exécutions manuelles apparaissent dans la palette de commandes lorsque le flux de travail est activé.",
			valuesAvailable: "Valeurs de déclenchement disponibles pour les étapes ({count})",
			advancedTitle: "Options de déclenchement avancées",
			advancedDescription: "Limitez la correspondance, préservez un identifiant stable et contrôlez le comportement de relecture.",
			needsAttention: "A besoin d'attention",
			tooltips: {
				moveUp: "Monter",
				moveDown: "Descendre",
				delete: "Supprimer le déclencheur",
			},
			types: {
				manual: {
					label: "Manuel",
					description: "S'exécute uniquement lorsqu'il est explicitement démarré.",
				},
				tasknotesEvent: {
					label: "Événement TaskNotes",
					description: "S'exécute lorsque TaskNotes émet l'événement d'exécution sélectionné.",
				},
				cron: {
					label: "Calendrier Cron",
					description: "S'exécute lorsque le calendrier five-part cron correspond à la minute en cours.",
				},
				interval: {
					label: "Intervalle",
					description: "S'exécute à plusieurs reprises lorsque Obsidian est ouvert.",
				},
				obsidianVault: {
					label: "Événement de fichier Vault",
					description: "S'exécute lorsque Obsidian crée, modifie, supprime ou renomme un fichier.",
				},
				obsidianMetadata: {
					label: "Événement de métadonnées",
					description: "S'exécute lorsque les métadonnées Obsidian sont modifiées ou résolues.",
				},
				obsidianWorkspace: {
					label: "Événement d'espace de travail",
					description: "S'exécute lorsqu'une activité de l'espace de travail sélectionné se produit, comme l'ouverture d'un fichier ou la modification de la feuille active.",
				},
			},
			events: {
				create: "Créer",
				modify: "Modifier",
				delete: "Supprimer",
				rename: "Renommer",
				changed: "Changé",
				deleted: "Supprimé",
				resolve: "Résoudre",
				resolved: "Résolu",
				fileOpen: "Fichier ouvert",
				activeLeafChange: "Feuille active modifiée",
				layoutChange: "Mise en page modifiée",
			},
			tasknotesEvents: {
				task: {
					created: "Tâche créée",
					updated: "Tâche mise à jour",
					deleted: "Tâche supprimée",
					moved: "Tâche déplacée",
					status: {
						changed: "Statut de la tâche modifié",
					},
					completed: "Tâche terminée",
					uncompleted: "Tâche inachevée",
					archived: "Tâche archivée",
					unarchived: "Tâche désarchivée",
					scheduled: {
						changed: "La date planifiée de la tâche a été modifiée",
					},
					due: {
						changed: "La date d'échéance de la tâche a été modifiée",
					},
					priority: {
						changed: "Priorité de la tâche modifiée",
					},
					tags: {
						changed: "Balises de tâche modifiées",
					},
					contexts: {
						changed: "Les contextes de tâches ont été modifiés",
					},
					projects: {
						changed: "Les projets de tâches ont été modifiés",
					},
					reminders: {
						changed: "Les rappels de tâches ont été modifiés",
					},
					dependencies: {
						changed: "Les dépendances des tâches ont été modifiées",
					},
					recurrence: {
						changed: "La récurrence des tâches a été modifiée",
					},
				},
				time: {
					started: "Le suivi du temps a commencé",
					stopped: "Le suivi du temps s'est arrêté",
				},
				pomodoro: {
					started: "Pomodoro a commencé",
					completed: "Pomodoro terminé",
					interrupted: "Pomodoro interrompu",
				},
				recurring: {
					instance: {
						completed: "Instance récurrente terminée",
						skipped: "Instance récurrente ignorée",
					},
				},
			},
			summary: {
				statusFromTo: "Changements de statut de {from} à {to}",
				statusTo: "Changements de statut en {to}",
				statusFrom: "Changements de statut à partir de {from}",
				schedule: "Horaires {schedule}",
				every: "Chaque {every}",
				vaultFile: "Fichier de coffre-fort {event}",
				metadata: "Métadonnées {event}",
				workspace: "Espace de travail {event}",
				manual: "Exécution manuelle",
			},
			outputs: {
				type: {
					label: "Tapez",
					description: "Le genre déclencheur.",
				},
				id: {
					label: "ID",
					description: "Le déclencheur ID de ce flux de travail.",
				},
				event: {
					label: "Événement",
					description: "Le nom de l'événement qui a démarré l'exécution.",
				},
				actualAt: {
					label: "Heure réelle",
					description: "Heure à laquelle l'exécution du flux de travail a démarré.",
				},
				after: {
					path: {
						label: "Chemin de tâche",
						description: "Le chemin des tâches après l'événement.",
					},
					title: {
						label: "Titre de la tâche",
						description: "Le titre de la tâche après l'événement.",
					},
					status: {
						label: "Statut actuel",
						description: "Le statut de la tâche après l'événement.",
					},
				},
				before: {
					status: {
						label: "Statut précédent",
						description: "L'état de la tâche avant l'événement.",
					},
				},
				changes: {
					label: "Changements",
					description: "Champs modifiés saisis par nom de propriété.",
				},
				source: {
					label: "Source",
					description: "La source de la mutation, lorsqu'elle est fournie.",
				},
				correlationId: {
					label: "Corrélation ID",
					description: "La corrélation de mutation ID, lorsqu'elle est fournie.",
				},
				scheduledAt: {
					label: "Heure prévue",
					description: "L’heure du tick du planning.",
				},
				path: {
					label: "Chemin",
					description: "Le chemin du fichier de coffre-fort correspondant.",
				},
				file: {
					path: {
						label: "Chemin du fichier",
						description: "Le chemin du fichier correspondant.",
					},
					name: {
						label: "Nom du fichier",
						description: "Le nom du fichier correspondant.",
					},
					extension: {
						label: "Rallonge",
						description: "L'extension de fichier correspondante.",
					},
				},
				data: {
					label: "Données",
					description: "Données d'événement supplémentaires, lorsqu'elles sont fournies.",
				},
				manual: {
					label: "Manuel",
					description: "Vrai pour une exécution manuelle.",
				},
			},
		},
		steps: {
			addTitle: "Ajouter l'étape suivante",
			addDescription: "La nouvelle étape s'exécutera après les étapes ci-dessus.",
			addButton: "Ajouter une étape",
			type: "Type d'étape",
			id: "ID",
			advancedTitle: "Options d'étape avancées",
			advancedDescription: "Les identifiants stables créent des références pour les étapes ultérieures. Les exécutions par lots utilisent l'option facultative pour chaque valeur.",
			forEach: "Pour chacun",
			forEachHelp: "Référence de tableau facultative pour les étapes par lots.",
			inputJson: "Entrée JSON",
			writes: "écrit",
			needsAttention: "A besoin d'attention",
			outputsAvailable: "Sorties disponibles pour les étapes ultérieures ({count})",
			tooltips: {
				moveUp: "Monter",
				moveDown: "Descendre",
				delete: "Supprimer l'étape",
			},
			unknownCategory: "Autre",
			summary: {
				forEach: "pour chaque {value}",
			},
		},
		runPolicy: {
			noOverlap: "Pas de chevauchement",
			onError: "Sur erreur",
			advancedTitle: "Limites d'exécution avancées",
			advancedDescription: "Ces valeurs maintiennent les exécutions automatisées identifiables et délimitées.",
			maxTasks: "Tâches maximales",
			source: "Source",
		},
		footer: {
			openNote: "Ouvrir la note",
		},
		templateSuggestions: {
			workflowId: "ID du flux de travail",
			workflowName: "Nom du flux de travail",
			today: "Aujourd'hui",
			now: "Maintenant",
			itemPath: "Chemin d'accès actuel à l'élément",
			triggerValue: "Déclencheur {label}",
			stepValue: "{stepId} {label}",
		},
		validation: {
			nameRequired: "Le nom est requis.",
			invalidWorkflowId: "Utilisez des lettres minuscules, des chiffres, des points, des traits de soulignement ou des tirets. Commencez par une lettre.",
			duplicateWorkflowId: "Déjà utilisé par {path}.",
			triggerRequired: "Ajoutez au moins un déclencheur.",
			invalidTriggerId: "L'identifiant du déclencheur doit commencer par une lettre et utiliser les caractères id-safe.",
			duplicateTriggerId: "Les identifiants de déclencheur doivent être uniques.",
			tasknotesEventRequired: "Choisissez un événement TaskNotes.",
			cronScheduleRequired: "Ajoutez un planning cron.",
			intervalRequired: "Ajoutez un intervalle.",
			stepRequired: "Ajoutez au moins une étape.",
			invalidStepId: "L'identifiant de l'étape doit commencer par une lettre et utiliser les caractères id-safe.",
			duplicateStepId: "Les identifiants d'étape doivent être uniques.",
			unknownStepType: "Type d'étape inconnu : {type}",
			fieldRequired: "{field} est requis.",
			positiveNumber: "Utilisez un nombre positif.",
			jsonObject: "L’entrée étape doit être un objet JSON.",
		},
	},
	steps: {
		categories: {
			tasknotes: "TaskNotes",
			taskRelationships: "Relations de tâches",
			timeTracking: "Suivi du temps",
			obsidian: "Obsidian",
			controlFlow: "Flux de contrôle",
		},
		common: {
			task: {
				label: "Tâche",
				description: "Chemin du coffre-fort vers une tâche TaskNotes. Les workflows de tâches déclenchées utilisent généralement {{trigger.after.path}}.",
			},
			path: {
				label: "Chemin",
				description: "Chemin du coffre-fort vers un fichier Markdown.",
			},
			outputTask: {
				label: "Tâche",
				description: "Données de tâche TaskNotes mises à jour.",
			},
			outputPath: {
				label: "Chemin",
				description: "Chemin du coffre-fort de la tâche une fois l'étape terminée.",
			},
		},
		definitions: {
			task: {
				get: {
					label: "Obtenir la tâche",
					description: "Lit une tâche par chemin.",
					examples: {
						0: {
							label: "Lire la tâche déclenchante",
						},
					},
				},
				query: {
					label: "Tâches de requête",
					description: "Sélectionne les tâches avec une requête de workflow compacte.",
					input: {
						query: {
							label: "Requête",
							description: "Objet saisi par les champs de tâches. Les valeurs peuvent être des littéraux ou des filtres { operator, value }.",
						},
					},
					output: {
						tasks: {
							label: "Tâches",
							description: "Les tâches TaskNotes correspondantes.",
						},
						count: {
							label: "Compter",
							description: "Nombre de tâches correspondantes.",
						},
					},
					examples: {
						0: {
							label: "Tâches ouvertes",
						},
					},
				},
				parents: {
					label: "Obtenir les tâches parentales",
					description: "Lit les tâches parent liées aux projets de la tâche.",
				},
				subtasks: {
					label: "Obtenir des sous-tâches",
					description: "Lit les tâches qui font référence à cette tâche en tant que projet.",
				},
				blocking: {
					label: "Obtenez des tâches bloquantes",
					description: "Lit les tâches bloquées par cette tâche.",
				},
				dependencies: {
					label: "Obtenir les dépendances",
					description: "Lit les tâches qui bloquent cette tâche.",
					output: {
						dependencies: {
							label: "Dépendances",
							description: "Objets de dépendance avec les données de tâche TaskNotes résolues lorsqu'elles sont disponibles.",
						},
						tasks: {
							label: "Tâches",
							description: "Tâches de dépendance résolues.",
						},
						count: {
							label: "Compter",
							description: "Nombre de dépendances.",
						},
					},
					examples: {
						0: {
							label: "Lire les dépendances des tâches de déclenchement",
						},
					},
				},
				relationships: {
					label: "Obtenez des relations",
					description: "Lit les parents, les sous-tâches, les dépendances et les tâches bloquantes pour une tâche.",
					output: {
						task: {
							label: "Tâche",
							description: "La tâche.",
						},
						parents: {
							label: "Parents",
							description: "Tâches parentales.",
						},
						subtasks: {
							label: "Sous-tâches",
							description: "Sous-tâches.",
						},
						dependencies: {
							label: "Dépendances",
							description: "Tâches qui bloquent cette tâche.",
						},
						blocking: {
							label: "Blocage",
							description: "Tâches bloquées par cette tâche.",
						},
					},
					examples: {
						0: {
							label: "Lire toutes les relations",
						},
					},
				},
				create: {
					label: "Créer une tâche",
					description: "Crée une nouvelle tâche TaskNotes.",
					input: {
						title: {
							label: "Titre",
						},
						status: {
							label: "Statut",
						},
						priority: {
							label: "Priorité",
						},
						due: {
							label: "Due",
						},
						scheduled: {
							label: "Programmé",
						},
						details: {
							label: "Détails",
						},
					},
					examples: {
						0: {
							label: "Créer une tâche de boîte de réception",
						},
					},
				},
				patch: {
					label: "Tâche de correctif",
					description: "Met à jour les champs de tâches.",
					input: {
						patch: {
							label: "Pièce",
							description: "Champs de tâches à mettre à jour, tels que le statut, la priorité, l'échéance, la planification, les balises, les projets ou les contextes.",
						},
					},
					examples: {
						0: {
							label: "Marquer comme actif",
						},
					},
				},
				set: {
					label: "Définir les champs de tâches",
					description: "Alias pour task.patch.",
					input: {
						patch: {
							label: "Champs",
							description: "Champs de tâches à définir.",
						},
					},
				},
				move: {
					label: "Déplacer la tâche",
					description: "Déplace une note de tâche.",
					input: {
						targetFolder: {
							label: "Dossier cible",
						},
					},
					examples: {
						0: {
							label: "Déplacer la tâche déclenchante",
						},
					},
				},
				archive: {
					label: "Tâche d'archivage",
					description: "Archive une tâche.",
				},
				unarchive: {
					label: "Tâche de désarchivage",
					description: "Désarchive une tâche.",
				},
				complete: {
					label: "Tâche terminée",
					description: "Marque une tâche terminée.",
					input: {
						options: {
							status: {
								label: "Statut terminé",
							},
						},
					},
				},
				uncomplete: {
					label: "Tâche incomplète",
					description: "Rouvre une tâche terminée.",
					input: {
						options: {
							status: {
								label: "Statut réouvert",
							},
						},
					},
				},
				reschedule: {
					label: "Replanifier la tâche",
					description: "Définit ou efface la date programmée.",
					input: {
						date: {
							label: "Date prévue",
						},
					},
				},
				setDue: {
					label: "Fixer la date d'échéance",
					description: "Fixer la date d'échéance",
					input: {
						date: {
							label: "Date d'échéance",
						},
					},
				},
				clearDue: {
					label: "Effacer la date d'échéance",
					description: "Effacer la date d'échéance",
				},
				setScheduled: {
					label: "Définir la date programmée",
					description: "Définir la date programmée",
					input: {
						date: {
							label: "Date prévue",
						},
					},
				},
				clearScheduled: {
					label: "Effacer la date programmée",
					description: "Effacer la date programmée",
				},
				addTag: {
					label: "Ajouter une balise",
					description: "Ajouter une balise",
					input: {
						tag: {
							label: "Étiquette",
						},
					},
				},
				removeTag: {
					label: "Supprimer la balise",
					description: "Supprimer la balise",
					input: {
						tag: {
							label: "Étiquette",
						},
					},
				},
				addProject: {
					label: "Ajouter un projet",
					description: "Ajouter un projet",
					input: {
						project: {
							label: "Projet",
						},
					},
				},
				removeProject: {
					label: "Supprimer le projet",
					description: "Supprimer le projet",
					input: {
						project: {
							label: "Projet",
						},
					},
				},
				addContext: {
					label: "Ajouter du contexte",
					description: "Ajouter du contexte",
					input: {
						context: {
							label: "Contexte",
						},
					},
				},
				removeContext: {
					label: "Supprimer le contexte",
					description: "Supprimer le contexte",
					input: {
						context: {
							label: "Contexte",
						},
					},
				},
				addDependency: {
					label: "Ajouter une dépendance",
					description: "Ajoute une dépendance bloquante.",
					input: {
						dependency: {
							label: "Dépendance",
						},
					},
				},
				removeDependency: {
					label: "Supprimer la dépendance",
					description: "Supprime une dépendance.",
					input: {
						uid: {
							label: "Dépendance ID",
						},
					},
				},
			},
			time: {
				start: {
					label: "Démarrer la minuterie",
					description: "Démarre le suivi du temps.",
					input: {
						options: {
							description: {
								label: "Descriptif",
							},
						},
					},
					output: {
						startedAt: {
							label: "Commencé à",
							description: "Horodatage ISO enregistré par l’exécution du workflow.",
						},
					},
				},
				stop: {
					label: "Arrêter le minuteur",
					description: "Arrête le suivi du temps.",
					output: {
						stoppedAt: {
							label: "Arrêté à",
							description: "Horodatage ISO enregistré par l’exécution du workflow.",
						},
					},
				},
				appendEntry: {
					label: "Ajouter une entrée de temps",
					description: "Ajoute une entrée de temps.",
					input: {
						entry: {
							label: "Entrée",
						},
					},
				},
			},
			notice: {
				show: {
					label: "Afficher l'avis",
					description: "Affiche un avis Obsidian.",
					input: {
						message: {
							label: "Message",
						},
					},
					output: {
						message: {
							label: "Message",
						},
					},
					examples: {
						0: {
							label: "Afficher le titre de la tâche",
						},
					},
				},
			},
			obsidian: {
				openFile: {
					label: "Ouvrir le fichier",
					description: "Ouvre un fichier coffre-fort dans l'espace de travail.",
					input: {
						newLeaf: {
							label: "Ouvrir dans",
							options: {
								current: "Feuille actuelle",
								tab: "Nouvel onglet",
								split: "Diviser",
								window: "Fenêtre contextuelle",
							},
						},
					},
					output: {
						opened: {
							label: "Ouvert",
						},
						newLeaf: {
							label: "Cible ouverte",
						},
					},
					examples: {
						0: {
							label: "Ouvrir le fichier de déclenchement",
						},
					},
				},
				createNote: {
					label: "Créer une note",
					description: "Crée une note Markdown dans le coffre-fort.",
					input: {
						content: {
							label: "Contenu",
						},
					},
					output: {
						created: {
							label: "Créé",
						},
					},
					examples: {
						0: {
							label: "Créer une note datée",
						},
					},
				},
				appendNote: {
					label: "Ajouter à la note",
					description: "Ajoute du texte à une note Markdown existante.",
					input: {
						text: {
							label: "Texte",
						},
					},
					output: {
						appended: {
							label: "En annexe",
						},
						length: {
							label: "Longueur",
						},
					},
					examples: {
						0: {
							label: "Ajouter au fichier de déclenchement",
						},
					},
				},
				updateFrontmatter: {
					label: "Mettre à jour frontmatter",
					description: "Applique un patch top-level frontmatter à une note Markdown.",
					input: {
						frontmatter: {
							label: "Frontmatter",
							description: "Touches Top-level à définir. Utilisez null pour supprimer une clé.",
						},
					},
					output: {
						updated: {
							label: "Mis à jour",
						},
						keys: {
							label: "Clés",
						},
					},
					examples: {
						0: {
							label: "Fichier de déclenchement de marquage examiné",
						},
					},
				},
				moveFile: {
					label: "Déplacer le fichier",
					description: "Déplace ou renomme un fichier du coffre-fort.",
					input: {
						targetPath: {
							label: "Chemin cible",
						},
						updateLinks: {
							label: "Mettre à jour les liens",
							description: "Utilisez le gestionnaire de fichiers de Obsidian pour que les liens soient mis à jour en fonction des paramètres du coffre-fort.",
						},
					},
					output: {
						moved: {
							label: "Déplacé",
						},
						oldPath: {
							label: "Ancien chemin",
						},
					},
					examples: {
						0: {
							label: "Fichier de déclenchement d'archive",
						},
					},
				},
			},
			workflow: {
				stop: {
					label: "Arrêter le flux de travail",
					description: "Arrête l'exécution du flux de travail en cours.",
					input: {
						reason: {
							label: "Raison",
						},
					},
					output: {
						stopped: {
							label: "Arrêté",
						},
						reason: {
							label: "Raison",
						},
					},
					examples: {
						0: {
							label: "Arrêtez avec raison",
						},
					},
				},
			},
		},
		errors: {
			tasknotesUnavailable: "L'environnement d'exécution TaskNotes API n'est pas disponible.",
			obsidianUnavailable: "Le contexte de l'application Obsidian n'est pas disponible.",
			requiredText: "La saisie des étapes nécessite le texte non-empty : {field}",
		},
	},
};
