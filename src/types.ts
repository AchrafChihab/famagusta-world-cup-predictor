export interface Match {
  id: string;         // Unique id
  teamA: string;      // e.g. "France"
  teamB: string;      // e.g. "Espagne"
  dateTime: string;   // ISO String or readable date string
  status: 'open' | 'closed';
  scoreA: number | null; // Final score Team A (null if match pending/no score yet)
  scoreB: number | null; // Final score Team B
  stage?: 'groups' | 'round_16' | 'quarters' | 'semis' | 'final';
}

export interface Prediction {
  id: string;              // Compound key: matchId_phone to enforce duplicate prevention
  firstName: string;       // Prénom
  lastName: string;        // Nom
  phone: string;           // Téléphone
  matchId: string;         // Match association
  predictedScoreA: number; // Prediction Team A
  predictedScoreB: number; // Prediction Team B
  createdAt: any;          // Firestore server timestamp or Date
}

export interface RaffleWinner {
  id: string;        // prediction id
  firstName: string;
  lastName: string;
  phone: string;
  predictedScoreA: number;
  predictedScoreB: number;
}

export interface Raffle {
  id: string;          // matchId_YYYY-MM-DD
  matchId: string;
  date: string;        // YYYY-MM-DD
  winners: RaffleWinner[];
  drawnAt: any;        // Firestore server timestamp
}
