# Expiwise — app iOS

App per tenere traccia di cibo e prodotti per la casa in frigo, dispensa, freezer,
con lista della spesa collegata. Pensata per essere usata insieme a chi vive con te:
i dati sono condivisi in tempo reale tra i vostri telefoni tramite un "codice famiglia".

Tecnologie: **Expo (React Native) + expo-router + Firebase (Firestore)**.

---

## 1. Requisiti

- Un Mac con [Node.js](https://nodejs.org) installato (versione 20 o superiore)
- L'app **Expo Go** gratuita, scaricata sul tuo iPhone (e su quello di chi vive con te)
  dall'App Store
- Un account Google gratuito, per creare il progetto Firebase

Non serve Xcode per iniziare: con Expo Go puoi provare l'app da subito.
Xcode servirà solo più avanti, se vorrai creare una build definitiva per
TestFlight o l'App Store.

**Non hai Node.js?** Apri il Terminale e controlla con `node -v`. Se dà errore
"command not found", installalo con [Homebrew](https://brew.sh):
```bash
brew install node
```
(Se non hai nemmeno Homebrew, il sito [brew.sh](https://brew.sh) mostra il
comando da incollare per installarlo — richiede un paio di minuti.)

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

7. Nel menu a sinistra della console Firebase, cerca **Firestore Database**
   (nelle versioni più recenti della console si trova sotto la categoria
   **"Database e spazio di archiviazione"** invece che sotto "Build" — se
   non trovi una voce, guarda dentro l'altra). Clicca **"Crea database"**,
   scegli una zona vicina a te (es. `europe-west`) e avvialo in
   **modalità produzione**.

8. Sempre nel menu a sinistra, cerca **Authentication** (categoria
   **"Sicurezza"** o "Build", a seconda della versione della console) →
   scheda **"Sign-in method"**, e attiva il provider **"Anonimo"**. Serve
   solo per far rispettare le regole di sicurezza qui sotto — non chiederà
   mai email o password a te o a chi vive con te.

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
   codice famiglia a 6 caratteri può leggere/scrivere i vostri dati.

---

## 3. Installa le dipendenze e avvia l'app

Da terminale, nella cartella del progetto:

```bash
npm install
npx expo start
```

> ⚠️ Se `npm install` si ferma con un errore `ERESOLVE` (conflitto di versioni),
> è un problema noto di alcune dipendenze di `expo-router` e non riguarda il
> codice di questo progetto. Rilancia con:
> ```bash
> npm install --legacy-peer-deps
> ```

Si aprirà un QR code nel terminale (o in una pagina del browser).

- **Sul tuo iPhone**: apri l'app **fotocamera** di iOS e inquadra il QR code,
  poi tocca la notifica che appare per aprirlo in **Expo Go**.
- Fai lo stesso sul telefono di chi vive con te.

> ⚠️ Le versioni recenti di **Expo Go** possono chiedere di effettuare il
> login (anche solo per aprire un progetto in locale, sulla stessa wifi).
> Se succede: crea un account Expo gratuito (o usane uno esistente), accedi
> con quello **sia nell'app Expo Go sul telefono** sia da terminale con
> `npx expo login`, poi riprova a inquadrare il QR code.

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

## 6. Idee per il futuro e personalizzazioni

**Facile da personalizzare fin da subito:**

- 🎨 Colori e font dell'app → `lib/theme.js`
- 🏷️ Le 4 zone (Frigo/Dispensa/Freezer/Casa: nomi, icone, colori) → `lib/locations.js`
  — aggiungerne una nuova (es. "Bagno" o "Garage") è questione di una riga
- ⏰ Soglia di avviso predefinita per la scadenza → schermata Impostazioni
  dentro l'app (si può cambiare senza toccare codice)

**Funzionalità non ancora presenti, ma che avrebbero senso in futuro:**

- 🔔 Notifiche push quando un prodotto sta per scadere (oggi l'avviso si
  vede solo aprendo l'app)
- 📊 Statistiche su cosa scade/si spreca più spesso
- 🌙 Modalità scura
- 🤖 Supporto Android (Expo/React Native lo permettono con pochissime
  modifiche, il progetto oggi è pensato solo per iOS)
- 📸 Foto del prodotto oltre al nome
- 🗂️ Categorie personalizzabili invece delle 4 fisse

Sono solo idee, non un impegno di sviluppo — se vuoi proporne altre o
contribuire con una modifica, apri pure una **Issue** o una **Pull Request**
su questo repository.

**Hai un suggerimento, un consiglio o un'idea di miglioramento?** Il posto
giusto dove lasciarlo è la sezione Discussions del repository:

[![Suggerimenti e idee](https://img.shields.io/badge/💬_Discussions-Lascia_un_suggerimento-8250DF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/felisariaurora/ExpiWise/discussions)

---

## 7. Pubblicazione su App Store

Sto lavorando alla pubblicazione di Expiwise come app "vera" (icona sulla
home, niente Expo Go) — a presto! 🚀

*— Aurora*

---

## 8. Sostieni il progetto

Expiwise è gratuito e open source. Se ti va di offrirmi un caffè per il
tempo speso a svilupparlo, clicca il bottone oppure inquadra il QR code
con il telefono:

<p>
  <a href="https://paypal.me/AuroraFelisari">
    <img src="https://img.shields.io/badge/PayPal-Offrimi_un_caffè-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Dona con PayPal" />
  </a>
</p>

<a href="https://paypal.me/AuroraFelisari">
  <img src="assets/readme/paypal-qr.png" alt="QR code PayPal" width="160" />
</a>

Non è richiesto in alcun modo per usare l'app — è solo un modo per chi
volesse sostenere il progetto.
