/**
 * Alle sichtbaren Texte. Beschriftungen, die von Daten abhängen, sind
 * Funktionen – so gilt eine Regel für beliebig viele Teams.
 */
export const de = {
  app: {
    title: 'Jeopardy',
  },

  setup: {
    heading: 'Jeopardy',
    intro: 'Teams festlegen, Thema wählen, los geht es.',
    teamsHeading: 'Teams',
    teamsHint: 'Ein Team genügt – dann läuft das Spiel als Übungsmodus.',
    practiceBadge: 'Übungsmodus – Solo-Training, kein Ranking',
    teamLabel: (index: number) => `Name von Team ${index + 1}`,
    addTeam: 'Team hinzufügen',
    removeTeam: (name: string) => `${name} entfernen`,
    maxTeamsReached: (max: number) => `Mehr als ${max} Teams passen nicht auf das Spielfeld.`,
    duplicateName: 'Dieser Name wird bereits verwendet – die Punktebuttons sehen dann gleich aus.',
    timerHeading: 'Bedenkzeit',
    timerHint:
      'Gilt je Frage und Team. Läuft die Zeit ab, ist das nächste Team an der Reihe; ' +
      'antwortet niemand, gilt die Frage als gespielt.',
    timerLabel: 'Bedenkzeit je Frage',
    timerOff: 'Ohne Zeitbegrenzung',
    timerScaleOff: 'Aus',
    timerSeconds: (seconds: number) => `${seconds} Sekunden`,
    timerMinutes: (minutes: number) => (minutes === 1 ? '1 Minute' : `${minutes} Minuten`),
    timerMinutesSeconds: (minutes: number, seconds: number) =>
      `${minutes}:${String(seconds).padStart(2, '0')} Minuten`,

    vetoHeading: 'Veto-Zeit',
    vetoHint:
      'Gilt für ein Team, das per Veto übernimmt. Ohne eigene Angabe bekommt es ' +
      'dieselbe Zeit wie das Team, das die Frage begonnen hat.',
    vetoLabel: 'Veto-Zeit je Übernahme',
    vetoLinked: 'Wie die Bedenkzeit',
    vetoScaleLinked: 'Gekoppelt',
    /** Zweite Zeile unter dem Regler, solange die Zeit gekoppelt ist. */
    vetoDerived: (label: string) => `Damit gilt: ${label}`,
    /** Ein Satz für Abzeichen und Vorlesetexte, in denen keine zweite Zeile passt. */
    vetoLinkedWith: (label: string) => `Wie die Bedenkzeit (${label})`,
    vetoNoTimerHint:
      'Ohne Bedenkzeit läuft auch im Veto keine Uhr – erst mit einer Bedenkzeit ' +
      'lässt sich hier etwas einstellen.',
    sharedVeto: (label: string) => `Veto-Zeit: ${label}`,

    rulesHeading: 'Spielregeln',
    rulesHint: 'Was passiert bei einer falschen Antwort?',
    rulesGroupLabel: 'Verhalten bei falscher Antwort',
    rulesDeductTitle: 'Punkte werden abgezogen',
    rulesDeductDescription:
      'Die Punktzahl der Frage wird abgezogen – der Stand fällt nie unter null.',
    rulesKeepTitle: 'Punktestand bleibt',
    rulesKeepDescription: 'Eine falsche Antwort ändert den Punktestand nicht.',
    sharedRuleDeduct: 'Falsche Antwort kostet Punkte',
    sharedRuleNoDeduct: 'Falsche Antwort kostet keine Punkte',

    shareHeading: 'Spiel teilen',
    shareHint: 'Der Link enthält Thema, Teams, Bedenkzeit und Veto-Zeit.',
    shareLinkLabel: 'Link zur Spielkonfiguration',
    shareCopy: 'Link kopieren',
    shareCopied: 'Link kopiert.',
    shareFailed: 'Der Link konnte nicht kopiert werden.',
    shareUploadWarning:
      'Ein selbst geladenes Fragenset lässt sich nicht per Link teilen – bitte die Datei mitgeben.',
    sharedHeading: 'Geteiltes Spiel',
    sharedIntro: 'Diese Konfiguration wurde geteilt. Bitte die Teamnamen prüfen und anpassen.',
    sharedTopic: (title: string) => `Thema: ${title}`,
    sharedTimer: (label: string) => `Bedenkzeit: ${label}`,
    sharedConfirm: 'Namen übernehmen',
    sharedDiscard: 'Nicht übernehmen',
    sharedInvalid: 'Der geteilte Link ist unvollständig oder fehlerhaft.',

    topicsHeading: 'Thema',
    topicsLoading: 'Themen werden geladen …',
    topicsEmpty: 'Es sind noch keine Fragensets vorhanden.',
    topicsError: 'Die Themenliste konnte nicht geladen werden.',
    uploadHeading: 'Eigenes Fragenset laden',
    uploadHint: 'JSON-Datei nach dem Schema aus der Dokumentation.',
    uploadLabel: 'JSON-Datei auswählen',
    uploadSuccess: (title: string) => `Eigenes Fragenset geladen: ${title}`,
    start: 'Spiel starten',
    startHint: 'Bitte zuerst ein Thema auswählen.',
    resumeHeading: 'Laufendes Spiel gefunden',
    resumeText: (title: string) => `Zuletzt gespielt: ${title}`,
    resume: 'Fortsetzen',
    discard: 'Verwerfen',
  },

  board: {
    newGame: 'Neues Spiel',
    newGameConfirm: 'Das laufende Spiel wird beendet und alle Punkte gehen verloren. Fortfahren?',
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    cardLabel: (category: string, points: number) => `${category}, ${points} Punkte`,
    cardScoredLabel: (category: string, points: number) =>
      `${category}, ${points} Punkte – bereits gespielt`,
    teamNameLabel: (name: string) => `Name von ${name}`,
    scoreLabel: (name: string, score: number) => `${name}: ${score} Punkte`,
    points: 'Punkte',

    // Ausgang einer gespielten Karte
    resultCorrect: (team: string, points: number) => `${team} richtig, plus ${points} Punkte`,
    resultWrong: (team: string, points: number) => `${team} falsch, minus ${points} Punkte`,
    resultNobody: 'Niemand richtig',
    resultNobodyLong: (points: number) => `Niemand richtig, ${points} Punkte`,
    resultTeamCount: (count: number) => `${count} Teams`,
    /** Zeichen auf der Karte – Farbe allein darf den Ausgang nicht tragen. */
    resultMarkCorrect: '✓',
    resultMarkWrong: '✗',

    // Zugreihenfolge
    turnLabel: (name: string) => `${name} ist am Zug`,
    turnNext: (name: string) => `Nächste Frage beginnt bei ${name}`,
    turnBadge: 'Am Zug',
  },

  clue: {
    pointsLabel: (points: number) => `${points} Punkte`,
    revealAnswer: 'Antwort anzeigen',
    answerHeading: 'Musterlösung',
    close: 'Schließen',
    noteHeading: 'Hinweis für die Moderation',

    // Veto-Runde
    vetoButton: (teamName: string) => `Veto: ${teamName}`,
    noVeto: 'Kein Veto – Antwort aufdecken',
    participants: (names: string) => `Bereits dran: ${names}`,

    // Wertung
    settleHeading: 'Wer lag richtig?',
    settleNobody: 'Keine richtige Antwort gegeben',
    settleHintDeduct: (points: number) =>
      `Die übrigen beteiligten Teams verlieren ${points} Punkte.`,
    settleHintKeep: 'Die übrigen beteiligten Teams erhalten keine Punkte.',

    // Bedenkzeit
    timerLabel: (teamName: string) => `Bedenkzeit für ${teamName}`,
    vetoTimerLabel: (teamName: string) => `Veto-Zeit für ${teamName}`,
    timeUp: 'Zeit abgelaufen',
    timerRemaining: (seconds: number) => `noch ${seconds} Sekunden`,
    timerExpiredForTeam: (teamName: string) => `Zeit für ${teamName} abgelaufen`,
    timerPause: 'Pause',
    timerResume: 'Weiter',
  },

  result: {
    heading: 'Endstand',
    practiceHeading: 'Ergebnis',
    practiceSummary: (correct: number, total: number) =>
      `${correct} von ${total} Fragen richtig beantwortet`,
    scoreSummary: (score: number) => `${score} Punkte`,
    rank: (rank: number) => `${rank}.`,
    tie: 'Unentschieden',
    backToBoard: 'Zurück zum Spielfeld',
    newGame: 'Neues Spiel',
  },

  errors: {
    topicLoad: (title: string) => `Das Fragenset "${title}" konnte nicht geladen werden.`,
    invalidFile: 'Die Datei entspricht nicht dem erwarteten Format.',
    notJson: 'Die Datei ist kein gültiges JSON.',
    issuesHeading: 'Gefundene Probleme:',
    unexpected: 'Unerwarteter Fehler.',
    boundary: 'Es ist ein Fehler aufgetreten. Bitte die Seite neu laden.',
  },
} as const;
