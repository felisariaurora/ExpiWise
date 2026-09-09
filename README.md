# Expiwise — app iOS

App per tenere traccia di cibo e prodotti per la casa in frigo, dispensa, freezer,
con lista della spesa collegata. Pensata per essere usata insieme a chi vive con te:
i dati sono condivisi in tempo reale tra i vostri telefoni tramite un "codice famiglia".

Tecnologie: **Expo (React Native) + expo-router + Firebase (Firestore)**.

---

## 1. Requisiti

- Un Mac con [Node.js](https://nodejs.org) installato (versione 20 o superiore)
- L'app **Expo Go** gratuita, scaricata sul tuo iPhone (e su quello del tuo ragazzo)
  dall'App Store
- Un account Google gratuito, per creare il progetto Firebase

Non serve Xcode per iniziare: con Expo Go puoi provare l'app da subito.
Xcode servirà solo più avanti, se vorrai creare una build definitiva per
TestFlight o l'App Store.

---

## 2. Crea il progetto Firebase (gratis, ~5 minuti)

Questo è il passaggio che rende i dati condivisi tra i vostri due telefoni.

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e accedi
   con un account Google.
2. Clicca **"Aggiungi progetto"**, dagli un nome (es. "expiwise") e crealo
   (puoi disattivare Google Analytics, non serve).
3. Nella pagina del progetto, clicca l'icona **`</>`** ("Web") per aggiungere una
   app web al progetto — sì, anche se la nostra è un'app iOS: è solo il modo in
   cui Firebase genera le chiavi di configurazione che useremo.
4. Dai un nome all'app (es. "expiwise-mobile") e clicca **"Registra app"**.
5. Firebase ti mostrerà un blocco di codice `firebaseConfig` con delle chiavi
   simili a questo:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "expiwise.firebaseapp.com",
     projectId: "expiwise",
     storageBucket: "expiwise.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```

   Copia questi valori.

6. In questo progetto, copia il file **`.env.example`** e rinominalo in **`.env`**,
   poi incolla lì i valori che hai appena copiato (ogni riga corrisponde a una
   chiave del blocco `firebaseConfig`). Il file `.env` non viene mai caricato su
   GitHub (è escluso in `.gitignore`), quindi le tue chiavi restano solo sul
   tuo computer.

7. Nel menu a sinistra della console Firebase, vai su **Build → Firestore Database**,
   clicca **"Crea database"**, scegli una zona vicina a te (es. `europe-west`) e
   avvialo in **modalità produzione**.

8. Nel menu a sinistra vai su **Build → Authentication → Sign-in method**,
   e attiva il provider **"Anonimo"**. Serve solo per far rispettare le regole
   di sicurezza qui sotto — non chiederà mai email o password a te o al tuo ragazzo.

9. Sempre in Firestore, vai sulla scheda **"Regole"** e incolla queste regole,
   poi clicca **"Pubblica"**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /households/{code}/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   ⚠️ **Nota sulla sicurezza**: con queste regole, chiunque conosca il vostro
   codice famiglia a 6 caratteri può leggere/scrivere i vostri dati (nessuno
   dovrebbe indovinarlo per caso, ma non è un segreto a prova di attacco
   mirato). Va benissimo per un uso personale tra voi due. Se in futuro
   pubblichi l'app per altri utenti, vale la pena irrobustire questa parte
   (es. autenticazione vera con email, regole legate all'utente autenticato).

---

## 3. Installa le dipendenze e avvia l'app

Da terminale, nella cartella del progetto:

```bash
npm install
npx expo start
```

Si aprirà un QR code nel terminale (o in una pagina del browser).

- **Sul tuo iPhone**: apri l'app **fotocamera** di iOS e inquadra il QR code,
  poi tocca la notifica che appare per aprirlo in **Expo Go**.
- Fai lo stesso sul telefono del tuo ragazzo.

La prima volta, l'app vi chiederà di **creare una nuova dispensa** (genera un
codice a 6 caratteri) oppure di **inserire un codice** esistente. Crealo su un
telefono, condividilo (c'è un pulsante apposta) e inseriscilo sull'altro: da
quel momento vedrete entrambi la stessa dispensa e la stessa lista della spesa,
aggiornate in tempo reale.

> 💡 Per dare un'occhiata rapida all'interfaccia dal computer, senza telefono,
> puoi anche lanciare `npm run web` e aprire la pagina nel browser (lo scanner
> del codice a barre non funziona da browser, il resto sì).

---

## 4. Come è organizzato il progetto

```
app/                    -> schermate (routing automatico di expo-router)
  _layout.js            -> layout radice: font, login Firebase, navigazione
  onboarding.js         -> crea/entra in una dispensa condivisa
  (tabs)/
    _layout.js          -> le 3 tab in basso
    index.js            -> Dispensa
    shopping.js         -> Lista della spesa
    settings.js         -> Impostazioni (soglia avvisi, codice famiglia)
  product-form.js        -> modulo aggiungi/modifica prodotto (con scanner fotocamera)
  shopping-form.js        -> modulo aggiungi/modifica prodotto nella lista spesa

lib/
  firebaseConfig.js      -> inizializza Firebase leggendo le chiavi da .env
  firestoreData.js        -> tutte le letture/scritture su Firestore
  HouseholdContext.js      -> gestisce il "codice famiglia" salvato sul telefono
  locations.js             -> le 4 zone (Frigo/Dispensa/Freezer/Casa): etichette, icone, colori
  dates.js                -> calcolo giorni alla scadenza, formattazione date
  theme.js                -> colori e font condivisi

components/               -> pezzi di interfaccia riutilizzati tra le schermate
```

---

## 5. Funzionalità incluse

- Aggiunta prodotti a mano o **scansionando il codice a barre con la fotocamera
  vera** (cerca automaticamente il nome su Open Food Facts)
- Frigo / Dispensa / Freezer / **Casa** (per detersivi, carta igienica ecc.,
  senza obbligo di data di scadenza)
- Avviso configurabile (1/3/5/7 giorni prima della scadenza)
- Lista della spesa collegata: un tocco per aggiungere un prodotto dalla
  dispensa alla lista, un tocco per rimandare un acquisto fatto in dispensa
- **Dati condivisi in tempo reale** tra i telefoni collegati con lo stesso
  codice famiglia

---

## 6. Prossimo passo: TestFlight / App Store

Quando sarete pronti ad avere un'app "vera" (icona sulla home, niente Expo Go,
eventualmente pubblicata sull'App Store), il percorso è:

1. Crea un account [Apple Developer](https://developer.apple.com/programs/) (99$/anno).
2. Installa lo strumento di build in cloud di Expo:
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```
3. In `app.json`, cambia `ios.bundleIdentifier` da `com.tuonome.expiwise`
   a qualcosa di univoco tuo (es. `com.marcorossi.expiwise`).
4. Avvia una build iOS in cloud (non serve toccare Xcode):
   ```bash
   eas build --platform ios
   ```
5. Quando la build è pronta, puoi caricarla su **TestFlight** per installarla
   sui vostri iPhone come app definitiva, oppure inviarla in revisione per
   l'App Store con:
   ```bash
   eas submit --platform ios
   ```

Se in quel momento vuoi una mano a configurare `eas.json`, gli screenshot per
l'App Store o la scheda del prodotto, chiedi pure.
