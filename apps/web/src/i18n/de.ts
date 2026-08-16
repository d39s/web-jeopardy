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
  },

  clue: {
    pointsLabel: (points: number) => `${points} Punkte`,
    revealAnswer: 'Antwort anzeigen',
    answerHeading: 'Musterlösung',
    close: 'Schließen',
    scoreCorrect: (teamName: string) => `${teamName} richtig`,
    scoreWrong: (teamName: string) => `${teamName} falsch`,
    noteHeading: 'Hinweis für die Moderation',
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
