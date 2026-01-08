# 📑 Tab Session Manager

Un'estensione per Chrome/Edge che ti permette di salvare e ripristinare schede e gruppi di schede, riprendendole esattamente dal punto dove le hai lasciate.

## ✨ Funzionalità

- **Salva Scheda Corrente**: Salva la scheda attualmente attiva
- **Salva Tutte le Schede**: Salva tutte le schede della finestra corrente
- **Salva Finestra Corrente**: Salva l'intera finestra con tutte le schede e le sue proprietà (dimensioni, posizione, stato)
- **Salva Gruppo**: Salva un intero gruppo di schede con le sue proprietà (nome, colore, stato)
- **Seleziona Schede da Salvare**: Scegli manualmente quali schede salvare tramite un'interfaccia interattiva
- **Ripristina Sessioni**: Riapri le schede salvate esattamente come erano
- **Ripristina Finestre**: Le finestre salvate vengono ripristinate in nuove finestre separate con dimensioni e posizione originali
- **Memorizzazione Posizione**: Le schede vengono ripristinate nella loro posizione originale
- **Sostituzione Sessioni**: Se salvi una sessione con un nome già esistente, puoi scegliere di sostituirla
- **Aggiornamento Sessioni**: Aggiorna sessioni esistenti con lo stato attuale delle schede senza creare duplicati
- **Rinomina Sessioni**: Rinomina le sessioni salvate con un click
- **Riordina Sessioni**: Sposta le sessioni su/giù per organizzarle a piacimento
- **Gestione Sessioni**: Visualizza, ripristina ed elimina le sessioni salvate

## 🚀 Installazione

### Chrome / Edge

1. Apri Chrome/Edge e vai su `chrome://extensions/` (o `edge://extensions/`)
2. Attiva la **Modalità sviluppatore** (interruttore in alto a destra)
3. Clicca su **Carica estensione non pacchettizzata**
4. Seleziona la cartella contenente i file dell'estensione
5. L'estensione sarà ora installata e visibile nella barra degli strumenti

## 📖 Come Usare

1. **Salvare schede**:
   - Clicca sull'icona dell'estensione nella barra degli strumenti
   - (Opzionale) Inserisci un nome per la sessione
   - Scegli cosa salvare:
     - **Scheda Corrente**: Salva solo la scheda attiva
     - **Tutte le Schede**: Salva tutte le schede della finestra
     - **Finestra Corrente**: Salva l'intera finestra con tutte le schede, dimensioni, posizione e stato
     - **Gruppo Corrente**: Salva il gruppo di schede a cui appartiene la scheda attiva
     - **Seleziona Schede da Salvare**: Apre una finestra modale dove puoi scegliere manualmente quali schede salvare
   - Le schede verranno automaticamente chiuse dopo il salvataggio (per "Finestra Corrente", l'intera finestra verrà chiusa)

2. **Selezionare schede specifiche**:
   - Clicca su **Seleziona Schede da Salvare**
   - Nella finestra modale, vedrai tutte le schede aperte con titolo e URL
   - Usa le checkbox per selezionare/deselezionare le schede
   - Usa "Seleziona tutte" per selezionare/deselezionare tutte le schede rapidamente
   - (Opzionale) Inserisci un nome per la sessione
   - Clicca su **Salva Selezionate**

3. **Ripristinare sessioni**:
   - Clicca sull'icona dell'estensione
   - Nella sezione "Sessioni Salvate", trova la sessione che vuoi ripristinare
   - Clicca su **Ripristina**
   - Le schede verranno riaperte esattamente come erano

4. **Aggiornare sessioni**:
   - Apri le schede che vuoi aggiornare nella sessione
   - Clicca sull'icona dell'estensione
   - Trova la sessione da aggiornare nella lista
   - Clicca su **Aggiorna**
   - Conferma l'aggiornamento
   - La sessione verrà aggiornata con lo stato attuale delle schede (senza chiuderle)

5. **Eliminare sessioni**:
   - Clicca sull'icona dell'estensione
   - Trova la sessione da eliminare
   - Clicca su **Elimina**
   - Conferma l'eliminazione

6. **Rinominare sessioni**:
   - Clicca sull'icona dell'estensione
   - Trova la sessione da rinominare
   - Clicca sull'icona **✏️** (matita) accanto al nome
   - Inserisci il nuovo nome
   - Conferma

7. **Riordinare sessioni**:
   - Clicca sull'icona dell'estensione
   - Usa le frecce **⬆️** e **⬇️** per spostare le sessioni
   - L'ordine viene salvato automaticamente

## 🎨 Caratteristiche

- **Design Moderno**: Interfaccia con gradiente viola e effetti glassmorphism
- **Notifiche Toast**: Feedback visivo per ogni azione
- **Timestamp Intelligenti**: Mostra quando è stata salvata ogni sessione
- **Supporto Gruppi**: Mantiene la struttura dei gruppi di schede (nome, colore, stato)
- **Posizionamento Preciso**: Le schede vengono ripristinate nella loro posizione originale
- **Ripristino Finestre**: Le finestre salvate vengono riaperte in nuove finestre con dimensioni e posizione originali
- **Selezione Interattiva**: Interfaccia modale per scegliere quali schede salvare
- **Indicatori Visivi**: Le sessioni finestra sono contrassegnate con l'icona 🪟
- **Responsive**: Interfaccia fluida e animazioni smooth

## 🔧 Struttura File

```
tab-session-manager/
├── manifest.json       # Configurazione estensione
├── popup.html          # Interfaccia popup
├── popup.css           # Stili
├── popup.js            # Logica principale
├── icons/              # Icone estensione
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Questo file
```

## 💾 Archiviazione

Le sessioni vengono salvate localmente usando `chrome.storage.local`, quindi i dati rimangono sul tuo computer e non vengono sincronizzati.

## 🛠️ Permessi Richiesti

- **tabs**: Per accedere e gestire le schede
- **tabGroups**: Per gestire i gruppi di schede
- **storage**: Per salvare le sessioni localmente

## 📝 Note

- Le schede vengono automaticamente chiuse dopo il salvataggio
- Quando salvi una finestra, l'intera finestra viene chiusa
- Le finestre salvate vengono ripristinate in nuove finestre separate con dimensioni, posizione e stato originali
- I gruppi di schede vengono ricreati con le stesse proprietà (nome, colore, stato)
- Le schede pinnate mantengono il loro stato
- Le schede vengono ripristinate nella loro posizione originale (indice)
- Se salvi una sessione con un nome personalizzato già esistente, ti verrà chiesto se vuoi sostituire quella esistente
- Le sessioni con nomi automatici (es. "Scheda - 29/12/2025") non attivano il controllo duplicati
- Il pulsante **Aggiorna** permette di aggiornare una sessione esistente senza chiudere le schede correnti
- L'estensione funziona solo con URL normali (non funziona con pagine interne del browser come `chrome://` o `edge://`)
- La selezione interattiva mostra favicon, titolo e URL di ogni scheda

## 🎯 Casi d'Uso

- **Ricerca**: Salva tutte le schede di una ricerca per riprenderla in seguito
- **Progetti**: Organizza schede per progetti diversi
- **Lettura**: Salva articoli da leggere in seguito
- **Lavoro/Studio**: Separa le schede di lavoro da quelle personali
- **Pulizia**: Libera memoria chiudendo schede che riaprirai dopo

Buon utilizzo! 🎉
