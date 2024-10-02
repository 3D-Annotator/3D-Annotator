import type { Translation } from "../i18n-types";

const de: Translation = {
	ENGLISH: "Englisch",
	GERMAN: "Deutsch",
	CONFIRM_RELOAD_ON_LANGUAGE_CHANGE:
		"Um die Sprache zu ändern, wird die Seite neu geladen. Alle ungesicherten Änderungen gehen verloren. Möchten Sie fortfahren?",

	PASSWORD: "Passwort",
	USERNAME: "Benutzername",
	LOG_IN: "Anmelden",
	INVALID_LOGIN_CREDENTIALS: "Falsche Anmeldedaten",

	REGISTER: "Registrieren",
	EMAIL_ADDRESS: "E-Mail-Adresse",

	LOG_OUT: "Abmelden",
	MY_PROJECTS: "Meine Projekte",
	ADD_PROJECT: "Projekt hinzufügen",
	OWNER: "BesitzerIn",
	OPEN: "Öffnen",
	NAME: "Name",
	DESCRIPTION: "Beschreibung",

	UPLOAD_MODELS: "Modelle hochladen",
	LABELS: "Label",
	EDIT_LABELS: "Labels bearbeiten",
	COLOR: "Farbe",
	MEMBERS: "Mitglieder",
	EDIT_MEMBERS: "Mitglieder bearbeiten",
	EDIT_PROJECT: "Projekt bearbeiten",
	DELETE_PROJECT: "Projekt löschen",
	LEAVE_PROJECT: "Projekt verlassen",
	EDIT: "Bearbeiten",
	EXPORT: "Exportieren",
	DELETE: "Löschen",
	UNLOCK: "Entsperren",

	EDIT_MODEL: "Modell bearbeiten",
	ANNOTATION_FILE: "Annotationsdatei",
	UPLOAD_ANNOTATION_FILE: "Annotationsdatei hochladen",
	FILE_DESCRIPTION_3D_MODEL: "3D-Modell",
	FILE_DESCRIPTION_TEXTURE: "Textur",
	FILE_DESCRIPTION_ANNOTATION: "Annotation",
	NO_MODEL_DATA_PREVIEWS_MSG: "Keine Dateien ausgewählt",
	NO_MODEL_TYPE_MSG: "Kein Modelltyp ausgewählt",
	UNNAMED_MODEL_DATA_PREVIEW_MSG: "Unbenannte Dateien",

	TRIANGLE_MESH: "Dreiecksnetz (Mesh)",
	POINT_CLOUD: "Punktwolke",

	SELECT_DIRECTORY: "Ordner auswählen",
	SELECT_FILES: "Dateien auswählen",
	UPLOAD: "Hochladen",

	MODEL_FILE_NAME: "Modelldateiname",
	TEXTURE_FILE_NAME: "Texturdateiname",
	ANNOTATION_FILE_NAME: "Annotationsdateiname",

	NEW_LABEL: "Neues Label",
	ANNOTATION_CLASS: "Annotationsklasse",
	ADD: "Hinzufügen",

	ADD_MEMBER: "Mitglied hinzufügen",

	PAGE_NOT_FOUND: "404 Seite nicht gefunden",
	START_PAGE: "Startseite",

	// Error texts

	FILL_ALL_FIELDS: "Bitte füllen Sie alle Felder aus.",
	ANNOTATION_CLASS_ALREADY_EXISTS: "Annotationsklasse existiert bereits.",
	SPECIFY_NAME: "Bitte geben Sie den Namen für das Modell an.",
	USER_NAME_ALREADY_TAKEN: "Benutzername ist bereits vergeben.",
	EMAIL_NOT_VALID: "E-Mail-Adresse ist nicht gültig.",
	PASSWORD_INSECURE: "Passwort ist nicht sicher genug.",

	// Toast messages

	NETWORK_ERROR:
		"Netzwerk Fehler, bitte überprüfen Sie Ihre Internetverbindung.",
	LOCKED_BY: "Gesperrt von",
	MODEL_LOCKED: "Modell ist gesperrt",
	BIG_FILES_WARNING:
		"Große Dateien können zum Absturz des Browserfensters führen.",
	PARSER_ANNOTATION_CLASS_MISSING:
		"Parser: Annotationsklasse {annotationClass} fehlt.",
	PARSER_ANNOTATION_CLASS_DUPLICATE:
		"Parser: Doppelte Annotationsklasse {annotationClass}.",
	PARSER_UNSUPPORTED_FILE_FORMAT:
		"Parser: Nicht unterstütztes Dateiformat {format} {version}.",
	PARSER_ERROR: "Fehler beim Parsen der Annotationsdatei.",
	MODEL_FILE_TOO_BIG: "Modelldatei ist zu groß.",
	SAVING: "Speichern...",
	UPLOAD_ERROR: "Fehler beim Hochladen der Datei.",
	SAVING_SUCCESS: "Gespeichert",
	COMPRESSING: "Komprimieren...",
	UPLOADING: "Hochladen...",
	ANNOTATION_FILE_TOO_BIG: "Annotationsdatei ist zu groß.",
	UPLOAD_SUCCESS: "Hochgeladen",
	BASE_FILE_ALREADY_EXISTS: "Basisdatei existiert bereits.",
	DOWNLOAD_SUCCESS: "Heruntergeladen",
	NO_ANNOTATION_FILE: "Keine Annotationsdatei gefunden",
	NO_LABELS_FOUND: "Keine Label gefunden",

	// Loading states

	FETCHING_MODEL_INFORMATION: "Modellinformationen abrufen...",
	LOCKING_MODEL: "Modell sperren...",
	NO_LABELS: "Keine Label gefunden, Abbruch...",
	DOWNLOADING_MODEL: "Modell herunterladen...",
	WRITING_MODEL_TO_STORAGE: "Modell in Speicher schreiben...",
	DOWNLOADING_ANNOTATION: "Annotationsdatei herunterladen...",
	WRITING_ANNOTATION_TO_STORAGE: "Annotationsdatei in Speicher schreiben...",
	SETTING_UP_ANNOTATOR: "Annotator starten...",
	SETTING_UP_ANNOTATOR_ABORTED: "Annotator starten, Abbruch...",
	UNKNOWN_LABEL: "Unbekannte Annotationsklasse gefunden, Abbruch...",
	DUPLICATE_LABEL: "Doppelte Annotationsklasse gefunden, Abbruch...",
	UNSUPPORTED_FILE_FORMAT:
		"Nicht unterstütztes Annotationsdateiformat, Abbruch...",
	PARSING_ERROR: "Fehler beim Parsen der Annotationsdatei, Abbruch...",
	UNSUPPORTED_FILE_SIZE: "Die Dateigröße des Modells wird nicht unterstützt.",
	FINISHED_SETUP: "Setup abgeschlossen",

	// Annotator

	LASSO: "Lasso",
	POLYGON: "Polygon",
	BRUSH_3D: "3D-Pinsel",
	BRUSH: "Pinsel",

	SAVE: "Speichern",
	RENDER: "Rendern",
	ERASER: "Radierer",
	SHOW_HIDE: "Ein-/Ausblenden",
	SELECTION_MODE: "Auswahlmodus",
	CENTROID: "Schwerpunkt",
	CENTROID_DESCRIPTION:
		"Wählt eine Fläche aus, wenn sein Schwerpunkt enthalten ist.",
	INTERSECTION: "Schnitt",
	INTERSECTION_DESCRIPTION:
		"Wählt eine Fläche aus, wenn das Polygon es schneidet (Übermenge von Umfassen).",
	CONTAIN: "Umfassen",
	CONTAIN_DESCRIPTION:
		"Wählt eine Fläche aus, wenn alle seine Eckpunkte enthalten sind.",
	REMOVE_CORNER: "Ecke entfernen",
	CLOSE: "Schließen",
	ANNOTATE: "Annotieren",
	CANCEL: "Abbrechen",
	DELETE_KEY: "entf",
	SIZE: "Größe",
	ADD_CORNER: "Ecke hinzufügen",
	LEFT_MOUSE_BUTTON: "Linke Maustaste",
	POLYGON_PREVIEW: "Polygon-Vorschau",
	SHIFT_KEY: "umschalt",
	DELETE_LAST_CORNER: "Letzte Ecke löschen",
	OR: "oder",
	CLOSE_POLYGON: "Polygon schließen",
	ENTER_KEY: "enter",
	ESCAPE_KEY: "esc",
	VIEWS: "Ansichten",
	TOP: "Oben",
	BOTTOM: "Unten",
	LEFT: "Links",
	RIGHT: "Rechts",
	FRONT: "Vorne",
	BACK: "Hinten",
	CAMERA: "Kamera",
	GIZMO: "Gizmo",
	PERSPECTIVE: "Perspektivisch",
	ORTHOGRAPHIC: "Orthografisch",
	FOV: "FOV",
	LIGHTING: "Licht",
	GLOBAL_BRIGHTNESS: "Globale Helligkeit",
	SUN: "Sonne",
	BRIGHTNESS: "Helligkeit",
	AXIS_POSITION: "Achsenposition",
	CAMERA_CONTROLLED_SUN: "Kameragesteuerte Sonne",
	SET_POSITION: "Position setzen",
	FOLLOW_CAMERA: "Kamera folgen",
	POINTS: "Punkte",
	POINT_SIZE: "Punktgröße",
	OPACITY: "Deckkraft",
} satisfies Translation;

// eslint-disable-next-line import/no-default-export
export default de;
