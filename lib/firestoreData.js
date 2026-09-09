import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Struttura dati su Firestore:
// households/{codice}                          -> { settings: { threshold } }
// households/{codice}/products/{id}            -> prodotti in dispensa/frigo/freezer/casa
// households/{codice}/shoppingList/{id}         -> lista della spesa

function productsRef(code) {
  return collection(db, 'households', code, 'products');
}
function shoppingRef(code) {
  return collection(db, 'households', code, 'shoppingList');
}
function householdDoc(code) {
  return doc(db, 'households', code);
}

export function subscribeProducts(code, onData, onError) {
  const q = query(productsRef(code), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function addProduct(code, data) {
  await addDoc(productsRef(code), { ...data, createdAt: serverTimestamp() });
}

export async function updateProduct(code, id, data) {
  await updateDoc(doc(db, 'households', code, 'products', id), data);
}

export async function deleteProduct(code, id) {
  await deleteDoc(doc(db, 'households', code, 'products', id));
}

export async function getProduct(code, id) {
  const snap = await getDoc(doc(db, 'households', code, 'products', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeShoppingList(code, onData, onError) {
  const q = query(shoppingRef(code), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function addShoppingItem(code, data) {
  await addDoc(shoppingRef(code), { ...data, createdAt: serverTimestamp() });
}

export async function updateShoppingItem(code, id, data) {
  await updateDoc(doc(db, 'households', code, 'shoppingList', id), data);
}

// Segna un articolo come comprato/da comprare, registrando quando è stato
// comprato (per mostrarlo nello storico della lista della spesa).
export async function setShoppingItemChecked(code, id, checked) {
  await updateDoc(doc(db, 'households', code, 'shoppingList', id), {
    checked,
    boughtAt: checked ? serverTimestamp() : null,
  });
}

export async function deleteShoppingItem(code, id) {
  await deleteDoc(doc(db, 'households', code, 'shoppingList', id));
}

export function subscribeSettings(code, onData) {
  return onSnapshot(householdDoc(code), (snap) => {
    onData(snap.exists() && snap.data().settings ? snap.data().settings : { threshold: 3 });
  });
}

export async function updateSettings(code, settings) {
  await setDoc(householdDoc(code), { settings }, { merge: true });
}
