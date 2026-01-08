# 🔍 Guida Debug - Finestra Non Si Riapre

## Come Vedere i Log di Debug

Ho aggiunto log dettagliati per capire esattamente cosa sta succedendo. Segui questi passi:

### 📋 Passi per il Debug:

1. **Apri l'estensione** cliccando sull'icona nella barra degli strumenti

2. **Clicca con il tasto destro** sulla popup dell'estensione

3. **Seleziona "Ispeziona"** (o "Inspect")
   - Si aprirà la console degli strumenti per sviluppatori

4. **Vai alla tab "Console"** nella finestra degli strumenti

5. **Clicca sul pulsante "Ripristina Finestra"** della finestra problematica

6. **Guarda i log nella console** - vedrai messaggi come:
   ```
   === RESTORE SESSION DEBUG ===
   Session ID: ...
   Total sessions found: 3
   Session found: ...
   Session type: WINDOW
   Session data: { ... }
   
   === RESTORE WINDOW DEBUG ===
   Window session name: ...
   ✓ Session data valid, tabs count: X
   ✓ Window state exists: { ... }
   Window state: ... -> normalized: normal
   Creating window with first tab: ...
   ```

7. **Cerca messaggi di errore in rosso** - questi ti diranno esattamente cosa non funziona

8. **Copia tutti i log** e mandameli così posso vedere esattamente cosa sta succedendo

## 🎯 Cosa Cercare:

- ❌ **Errori in rosso** - indicano il problema
- ⚠️ **Warning in giallo** - schede saltate (URL non validi)
- ✅ **Messaggi con ✓** - passi completati con successo

## 📸 Alternative:

Se preferisci, puoi anche fare uno screenshot della console e mandarmelo!
