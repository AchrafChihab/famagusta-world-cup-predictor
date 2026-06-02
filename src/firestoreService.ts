import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Match, Prediction, Raffle, RaffleWinner } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation function required by skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

// --- MATCH SERVICES ---

export async function getMatches(): Promise<Match[]> {
  const path = 'matches';
  try {
    const q = query(collection(db, path), orderBy('dateTime', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

export async function createMatch(match: Omit<Match, 'id'> & { id: string }): Promise<void> {
  const path = `matches/${match.id}`;
  try {
    await setDoc(doc(db, 'matches', match.id), {
      id: match.id,
      teamA: match.teamA,
      teamB: match.teamB,
      dateTime: match.dateTime,
      status: match.status,
      scoreA: match.scoreA ?? null,
      scoreB: match.scoreB ?? null,
      stage: match.stage ?? 'groups',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateMatch(id: string, updates: Partial<Omit<Match, 'id'>>): Promise<void> {
  const path = `matches/${id}`;
  try {
    await updateDoc(doc(db, 'matches', id), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteMatch(id: string): Promise<void> {
  const path = `matches/${id}`;
  try {
    await deleteDoc(doc(db, 'matches', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- PREDICTION SERVICES ---

// Check if a prediction already exists for this match + phone number
export async function checkPredictionExists(matchId: string, phone: string): Promise<boolean> {
  const docId = `${matchId}_${phone.replace(/\s+/g, '')}`;
  const path = `predictions/${docId}`;
  try {
    const docRef = doc(db, 'predictions', docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return false;
  }
}

// Create a prediction. Use matchId_phone as the document ID to prevent duplicate submissions cleanly
export async function createPrediction(prediction: Omit<Prediction, 'id' | 'createdAt'>): Promise<void> {
  const phoneClean = prediction.phone.replace(/\s+/g, '');
  const docId = `${prediction.matchId}_${phoneClean}`;
  const path = `predictions/${docId}`;
  try {
    await setDoc(doc(db, 'predictions', docId), {
      id: docId,
      firstName: prediction.firstName,
      lastName: prediction.lastName,
      phone: phoneClean,
      matchId: prediction.matchId,
      predictedScoreA: Number(prediction.predictedScoreA),
      predictedScoreB: Number(prediction.predictedScoreB),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

// --- RAFFLE SERVICES ---

// Save or overwrite a raffle for a given match + date
export async function saveRaffle(matchId: string, date: string, winners: RaffleWinner[]): Promise<void> {
  const docId = `${matchId}_${date}`;
  const path = `raffles/${docId}`;
  try {
    await setDoc(doc(db, 'raffles', docId), {
      id: docId,
      matchId,
      date,
      winners,
      drawnAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Get all raffles for a given match, sorted by date desc (client-side — no composite index needed)
export async function getRafflesByMatch(matchId: string): Promise<Raffle[]> {
  const path = 'raffles';
  try {
    const q = query(
      collection(db, path),
      where('matchId', '==', matchId)
    );
    const snapshot = await getDocs(q);
    const raffles = snapshot.docs.map(d => d.data() as Raffle);
    return raffles.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Get all predictions (Admin only)
export async function getAllPredictions(): Promise<Prediction[]> {
  const path = 'predictions';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        matchId: data.matchId,
        predictedScoreA: data.predictedScoreA,
        predictedScoreB: data.predictedScoreB,
        createdAt: data.createdAt,
      } as Prediction;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}
