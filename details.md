ich benötige ein technisches konzept für ein jeopardy


das eigentliche spiel
Technische Anforderungen – exakt so umsetzen, nicht abweichen:
- DESIGN: Dunkler Hintergrund 
#10141F, Kartenoptik, abgerundete Ecken, keine externen Schriften (nur system-ui / Arial). Kategoriefarben: 
#2EC4B6 / 
#FF7F50 / 
#B388EB / 
#7AE582 / 
#FFD166.
- SPIELFELD: 5x5-Grid. Kategorie-Header oben, darunter die Punktekarten. Karten werden erst grau, wenn ein Punktebutton gedrückt wurde – nicht beim bloßen Öffnen.
- POPUP: Öffnet beim Klick auf eine Karte. Zeigt Kategorie, Punktzahl und Frage. Button „Antwort anzeigen" – erst danach erscheinen Musterlösung UND die vier Punktebuttons.
- PUNKTEBUTTONS: „Team A richtig", „Team A falsch", „Team B richtig", „Team B falsch". Punkte werden addiert (richtig) oder abgezogen (falsch), niemals unter 0. Teamnamen sind oben direkt editierbar.

die frageen bzw. das spielfeld soll zu spielbeginn geladen werden können.
dafür benötigt man ein grundkonzept, was ein einer json gespeichert werden soll.

die startseite
simple startseite, auf der die anzahl der Teams und ihre Namen gewählt werden können.
außerdem soll dort das thema ausgewählt werden können.

technologien: wähle ein modenernes css / javascript framework um die anwendung zu realisieren.
später soll ein multiplayer bzw. eine online funktion integriert werden.
dist läuft über einen docker container.



