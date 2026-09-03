import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore with specified databaseId if available
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const SYSTEM_STATE_DOC = "current";
export const SYSTEM_STATE_COLLECTION = "system_state";
export const DOCUMENTS_COLLECTION = "documents";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null = null
): FirestoreErrorInfo {
  const err = error as { code?: string; message?: string };
  const info: FirestoreErrorInfo = {
    error: err.message || "An unexpected database error occurred.",
    operationType,
    path,
  };
  console.error("Firestore operation failed:", JSON.stringify(info));
  return info;
}

export {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
};
export default app;
