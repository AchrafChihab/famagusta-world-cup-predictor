import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  Lock, 
  Mail, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  Trophy, 
  Check, 
  X, 
  Sparkles, 
  Gift, 
  Users, 
  ChevronDown, 
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Download
} from 'lucide-react';
import { auth } from '../firebase';
import { Match, Prediction } from '../types';
import {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getAllPredictions,
  saveRaffle,
  getRafflesByMatch,
} from '../firestoreService';
import { Raffle } from '../types';
import logoUrl from '../assets/famagusta_logo.jpeg';
import { getFlagEmoji } from '../utils/flagUtils';

export default function AdminPanel() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // UI state for Match Creation / Edition
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  
  // Match form fields
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');
  const [stage, setStage] = useState<'groups' | 'round_16' | 'quarters' | 'semis' | 'final'>('groups');
  const [matchError, setMatchError] = useState<string | null>(null);

  // Selected match for participant view & raffle
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [matchRaffles, setMatchRaffles] = useState<Raffle[]>([]);
  const [raffleLoading, setRaffleLoading] = useState(false);

  // Search, filter and pagination states for predictions list
  const [predSearch, setPredSearch] = useState('');
  const [predFilter, setPredFilter] = useState<'all' | 'exact' | 'incorrect'>('all');
  const [predPage, setPredPage] = useState(1);
  const itemsPerPage = 24;

  // Reset pagination when selection, search or filter changes
  useEffect(() => {
    setPredPage(1);
  }, [selectedMatchId, predSearch, predFilter]);

  // Load raffles for the selected match
  useEffect(() => {
    if (!selectedMatchId) return;
    setRaffleLoading(true);
    getRafflesByMatch(selectedMatchId)
      .then(setMatchRaffles)
      .finally(() => setRaffleLoading(false));
  }, [selectedMatchId]);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch all matches and predictions if logged in
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const matchData = await getMatches();
      setMatches(matchData);
      
      const predictionData = await getAllPredictions();
      setPredictions(predictionData);

      if (matchData.length > 0 && !selectedMatchId) {
        setSelectedMatchId(matchData[0].id);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Login handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Cet email est déjà enregistré.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Erreur : L’authentification par Email/Mot de passe n’est pas activée sur votre projet Firebase. Veuillez vous rendre sur la console Firebase > Authentication > Sign-in Method (Mode de connexion) et y activer "Adresse e-mail/Mot de passe".');
      } else {
        setAuthError('Une erreur est survenue lors de l’authentification.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMatchRaffles([]);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  // Create or Update Match
  const saveMatchForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatchError(null);

    if (!teamA.trim() || !teamB.trim() || !dateTime) {
      setMatchError('Veuillez remplir les équipes et l’heure du match.');
      return;
    }

    const matchPayload = {
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      dateTime,
      status,
      scoreA: scoreA !== '' ? Number(scoreA) : null,
      scoreB: scoreB !== '' ? Number(scoreB) : null,
      stage,
    };

    try {
      if (editingMatch) {
         // Update existing match
         await updateMatch(editingMatch.id, matchPayload);
      } else {
         // Create new match
         const generatedId = `match_${Date.now()}`;
         await createMatch({ id: generatedId, ...matchPayload });
      }

      // Close modal & reload data
      closeMatchModal();
      await loadAllData();
    } catch (err) {
      console.error('Save match error', err);
      setMatchError('Erreur lors de la sauvegarde du match. Vérifiez vos droits d’accès.');
    }
  };

  const openNewMatchModal = () => {
    setEditingMatch(null);
    setTeamA('');
    setTeamB('');
    setDateTime('');
    setStatus('open');
    setScoreA('');
    setScoreB('');
    setStage('groups');
    setMatchError(null);
    setIsMatchModalOpen(true);
  };

  const openEditMatchModal = (match: Match) => {
    setEditingMatch(match);
    setTeamA(match.teamA);
    setTeamB(match.teamB);
    setDateTime(match.dateTime);
    setStatus(match.status);
    setScoreA(match.scoreA !== null ? String(match.scoreA) : '');
    setScoreB(match.scoreB !== null ? String(match.scoreB) : '');
    setStage(match.stage || 'groups');
    setMatchError(null);
    setIsMatchModalOpen(true);
  };

  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setEditingMatch(null);
  };

  const handleDeleteMatch = async (id: string, matchLabel: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le match ${matchLabel} et toutes les prédictions associées ?`)) {
      try {
        await deleteMatch(id);
        await loadAllData();
        if (selectedMatchId === id) {
          setSelectedMatchId(matches.filter(m => m.id !== id)[0]?.id || '');
        }
      } catch (err) {
        console.error('Echec suppression match', err);
      }
    }
  };

  const testRulesError = async () => {
    // This is for error testing mentioned in instructions, but we have clean CRUD
  };

  // Raffle Mechanism — par match, par jour, persisté dans Firestore
  const handleRaffle = async () => {
    if (!selectedMatchId) return;
    const currentMatch = matches.find(m => m.id === selectedMatchId);
    if (!currentMatch) return;

    if (currentMatch.scoreA === null || currentMatch.scoreB === null) {
      alert("Veuillez d'abord saisir le Score Final du match dans le panneau d'édition pour pouvoir calculer les gagnants du score exact.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const alreadyToday = matchRaffles.find(r => r.date === today);
    if (alreadyToday) {
      alert(`Un tirage a déjà été effectué aujourd'hui (${today}) pour ce match. Le résultat est affiché ci-dessous.`);
      return;
    }

    const candidates = predictions.filter(pred =>
      pred.matchId === selectedMatchId &&
      pred.predictedScoreA === currentMatch.scoreA &&
      pred.predictedScoreB === currentMatch.scoreB
    );

    if (candidates.length === 0) {
      alert("Aucun participant n'a trouvé le score exact pour ce match.");
      return;
    }

    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(5, shuffled.length));
    const winners = picked.map(p => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      predictedScoreA: p.predictedScoreA,
      predictedScoreB: p.predictedScoreB,
    }));

    await saveRaffle(selectedMatchId, today, winners);
    const updated = await getRafflesByMatch(selectedMatchId);
    setMatchRaffles(updated);
  };


  const getStageLabel = (s?: string) => {
    switch (s) {
      case 'round_16': return '8ème de finale';
      case 'quarters': return 'Quart de finale';
      case 'semis': return 'Demi-finale';
      case 'final': return 'Finale';
      default: return 'Phase de groupes';
    }
  };

  const currentSelectedMatch = matches.find(m => m.id === selectedMatchId);

  // 1. Get predictions for selected match
  const matchPredictions = predictions.filter(p => p.matchId === selectedMatchId);

  // 2. Filter by search query
  const searchedPredictions = matchPredictions.filter(p => {
    const term = predSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.phone.toLowerCase().includes(term)
    );
  });

  // Stats computation
  const exactCount = currentSelectedMatch && currentSelectedMatch.scoreA !== null && currentSelectedMatch.scoreB !== null
    ? matchPredictions.filter(p => 
        p.predictedScoreA === currentSelectedMatch.scoreA && 
        p.predictedScoreB === currentSelectedMatch.scoreB
      ).length
    : 0;

  // 3. Filter by correctness
  const filteredPredictions = searchedPredictions.filter(p => {
    if (predFilter === 'all') return true;
    const isExact = currentSelectedMatch && 
      currentSelectedMatch.scoreA !== null && 
      currentSelectedMatch.scoreB !== null &&
      p.predictedScoreA === currentSelectedMatch.scoreA &&
      p.predictedScoreB === currentSelectedMatch.scoreB;
    
    return predFilter === 'exact' ? isExact : !isExact;
  });

  // 4. Paginate
  const totalPredsCount = filteredPredictions.length;
  const totalPages = Math.ceil(totalPredsCount / itemsPerPage) || 1;
  const currentPage = Math.min(predPage, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPredictions = filteredPredictions.slice(startIndex, startIndex + itemsPerPage);

  // CSV Export logic
  const exportToCSV = () => {
    if (filteredPredictions.length === 0) return;
    const headers = ['Prenom', 'Nom', 'Telephone', 'Pronostic', 'Date de soumission'];
    const rows = filteredPredictions.map(p => [
      p.firstName,
      p.lastName,
      p.phone,
      `${p.predictedScoreA}-${p.predictedScoreB}`,
      p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString('fr-FR') : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `predictions_${currentSelectedMatch?.teamA}_vs_${currentSelectedMatch?.teamB}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-20 bg-[#FDFCF8]">
        <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#2D3A30]/60 mt-4 text-xs font-mono">Vérification de l’administrateur...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-[#2D3A30]">
      {/* 1. NOT LOGGED IN: LOGIN CARD */}
      {!user ? (
        <div className="max-w-md mx-auto py-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FAF9F5] border border-stone-200/80 rounded-3xl shadow-xl overflow-hidden card-shadow"
          >
            {/* Header Identity */}
            <div className="p-8 text-center border-b border-stone-200/60 bg-[#2D3A30] text-[#FDFCF8] flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#C5A059]/30 bg-[#FDFCF8] p-1 shadow-md mb-3 flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Café Famagusta Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h2 className="font-serif text-3xl font-bold text-white">Console Famagusta</h2>
              <p className="text-xs text-[#FDFCF8]/70 mt-1">Accès réservé au gérant et administrateurs</p>
            </div>

            {/* Email / PW Auth Form */}
            <form onSubmit={handleAuth} className="p-8 space-y-5 bg-[#FAF9F5]">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 text-stone-400 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gérant@famagustacafe.com"
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#C5A059] text-stone-800 placeholder-stone-400 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-stone-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#C5A059] text-stone-800 placeholder-stone-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-150 text-rose-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Action buttons */}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-[#2D3A30] hover:bg-[#3D4F42] active:translate-y-0 text-white font-semibold p-3.5 rounded-full transition-all shadow-md mt-2 text-sm cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {authSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : isRegistering ? (
                  "Créer le compte Administrateur"
                ) : (
                  "Se connecter"
                )}
              </button>

              {/* Double purpose toggle to allow easy seed creation on first start */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError(null);
                  }}
                  className="text-[#C5A059] hover:underline text-xs font-semibold"
                >
                  {isRegistering 
                    ? "Déjà un compte ? Se connecter" 
                    : "Premier lancement ? Créer un compte gérant"}
                </button>
              </div>

              {/* Dev Note to allow direct testing under achihab's email */}
              <div className="bg-[#2D3A30]/5 border border-[#2D3A30]/10 rounded-2xl p-4 text-[11px] text-[#2D3A30]/80 leading-relaxed text-center">
                <strong className="text-[#2D3A30] font-sans font-semibold">Email requis de l'utilisateur :</strong> <code className="bg-white/80 border border-stone-200 px-1.5 py-0.5 rounded text-[#2D3A30] text-[10px] font-mono select-all font-bold">achihab@digitalia.solutions</code><br/><span className="text-stone-500 font-light mt-1 block">Renseignez ce compte dans votre Firebase Auth</span>
              </div>
            </form>
          </motion.div>
        </div>
      ) : (
        /* 2. LOGGED IN STATUS: FULL CONSOLE */
        <div className="space-y-8 text-[#2D3A30]">
          
          {/* Header Title Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-stone-200 bg-white p-0.5 shadow-sm">
                <img 
                  src={logoUrl} 
                  alt="Café Famagusta Logo" 
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs uppercase font-semibold font-mono text-[#C5A059] tracking-wider">Administration</span>
                <h1 className="font-serif text-3.5xl font-bold text-[#2D3A30]">Dashboard Famagusta</h1>
                <p className="text-xs text-stone-500">
                  Connecté en tant que : <span className="text-[#2D3A30] font-semibold">{user.email}</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#FAF9F5] border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:text-[#2D3A30] hover:bg-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#2D3A30]/60" />
              Se déconnecter
            </button>
          </div>

          {/* Matches lists Grid & creation entry point */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="flex justify-between items-center bg-[#FAF9F5] p-5 border border-stone-200/80 rounded-2xl">
                <div className="space-y-0.5">
                  <h2 className="font-serif text-xl font-bold text-[#2D3A30]">Matchs de la Coupe du Monde</h2>
                  <p className="text-[11px] text-stone-500">Configurez les rencontres et fermez les pronostics</p>
                </div>
                
                <button
                  onClick={openNewMatchModal}
                  className="px-4 py-2 bg-[#2D3A30] hover:bg-[#3D4F42] text-white font-semibold rounded-full text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  Nouveau Match
                </button>
              </div>

              {/* Matches Table */}
              {dataLoading && matches.length === 0 ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : matches.length === 0 ? (
                <div className="bg-[#FAF9F5] border border-stone-200/80 rounded-2xl p-8 text-center text-stone-400 text-sm font-serif italic">
                  Aucun match n'a encore été programmé. Cliquez sur "Nouveau Match" pour ajouter le premier !
                </div>
              ) : (
                <div className="overflow-x-auto border border-stone-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] border-b border-stone-200 text-[#2D3A30] text-xs font-semibold tracking-wider">
                        <th className="p-4 font-serif text-sm">Équipes</th>
                        <th className="p-4 font-serif text-sm">Date et Heure</th>
                        <th className="p-4 font-serif text-sm">Statut</th>
                        <th className="p-4 text-center font-serif text-sm">Score exact</th>
                        <th className="p-4 text-right font-serif text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-150 text-sm">
                      {matches.map((m) => {
                        const isSelected = selectedMatchId === m.id;
                        return (
                          <tr 
                            key={m.id}
                            className={`hover:bg-[#FAF9F5]/40 transition-colors ${
                              isSelected ? 'bg-[#FAF9F5]/80' : ''
                            }`}
                          >
                             <td className="p-4">
                              <button
                                onClick={() => setSelectedMatchId(m.id)}
                                className="font-serif font-bold text-[#2D3A30] hover:text-[#C5A059] hover:underline cursor-pointer text-left block text-base"
                              >
                                <span className="mr-1.5 select-none">{getFlagEmoji(m.teamA)}</span>
                                {m.teamA} 
                                <span className="text-[#C5A059] font-medium mx-1.5">vs</span> 
                                <span className="mr-1.5 select-none">{getFlagEmoji(m.teamB)}</span>
                                {m.teamB}
                              </button>
                              <span className="block text-[9px] text-[#C5A059] font-bold uppercase tracking-wider mt-0.5">
                                {getStageLabel(m.stage)}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-stone-500">
                              {new Date(m.dateTime).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${
                                m.status === 'open'
                                  ? 'bg-emerald-55 text-emerald-700 border border-emerald-250/50'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {m.status === 'open' ? 'Ouvert' : 'Fermé'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-[#2D3A30] text-base">
                              {m.scoreA !== null && m.scoreB !== null 
                                ? `${m.scoreA} - ${m.scoreB}` 
                                : '—'}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              <button
                                onClick={() => openEditMatchModal(m)}
                                className="p-1.5 hover:bg-stone-100 text-stone-500 hover:text-[#2D3A30] rounded transition-colors cursor-pointer inline-flex"
                                title="Modifier le match/score"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(m.id, `${m.teamA} vs ${m.teamB}`)}
                                className="p-1.5 hover:bg-stone-50 text-stone-500 hover:text-red-700 rounded transition-colors cursor-pointer inline-flex"
                                title="Supprimer le match"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sweepstake (Tirage au sort) Section */}
            <div className="space-y-6">
              <div className="bg-[#2D3A30] border border-[#2D3A30]/80 rounded-3xl p-6 text-[#FDFCF8] space-y-6 shadow-md card-shadow">
                <div>
                  <div className="flex items-center gap-1.5 text-[#C5A059] text-xs font-semibold mb-1">
                    <Trophy className="w-4 h-4 text-[#C5A059]" />
                    Tirage au sort
                  </div>
                  <h3 className="font-serif font-bold text-white text-xl">Sélectionner les gagnants</h3>
                  <p className="text-[11px] text-[#FDFCF8]/75 mt-1">
                    Choisissez une ligne pour charger ses participants et tirer au sort les adresses exactes.
                  </p>
                </div>

                {currentSelectedMatch ? (
                  <div className="space-y-4 pt-1">
                    {/* Match Mini-card summary */}
                    <div className="bg-[#FAF9F5]/10 p-4 rounded-2xl border border-white/10 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-[#FAF9F5]/50">Match sélectionné</span>
                      <div className="font-semibold text-white mt-1 text-base flex items-center justify-center gap-1.5">
                        <span className="select-none">{getFlagEmoji(currentSelectedMatch.teamA)}</span>
                        <span>{currentSelectedMatch.teamA}</span> 
                        <span className="text-[#C5A059] font-serif italic text-sm">VS</span> 
                        <span className="select-none">{getFlagEmoji(currentSelectedMatch.teamB)}</span>
                        <span>{currentSelectedMatch.teamB}</span>
                      </div>
                      
                      {currentSelectedMatch.scoreA !== null && currentSelectedMatch.scoreB !== null ? (
                        <div className="mt-2 text-sm font-bold text-[#C5A059] font-serif">
                          Score final : {currentSelectedMatch.scoreA} - {currentSelectedMatch.scoreB}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-rose-300 flex items-center justify-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Score final non défini</span>
                        </div>
                      )}
                    </div>

                    {/* Stats counters */}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-[#FAF9F5]/5 p-3 rounded-xl border border-white/5">
                        <span className="block text-2xl font-bold text-white font-serif">{filteredPredictions.length}</span>
                        <span className="text-[9px] text-[#FDFCF8]/60 uppercase tracking-widest font-medium">Participants</span>
                      </div>
                      <div className="bg-[#FAF9F5]/5 p-3 rounded-xl border border-white/5">
                        <span className="block text-2xl font-bold text-[#C5A059] font-serif">{exactCount}</span>
                        <span className="text-[9px] text-[#FDFCF8]/60 uppercase tracking-widest font-medium">Exacts</span>
                      </div>
                    </div>

                    {/* Raffle action button */}
                    {(() => {
                      const today = new Date().toISOString().slice(0, 10);
                      const alreadyToday = matchRaffles.find(r => r.date === today);
                      return (
                        <>
                          <button
                            onClick={handleRaffle}
                            disabled={exactCount === 0 || !!alreadyToday}
                            className="w-full py-3.5 px-4 bg-[#C5A059] hover:bg-[#d6b472] disabled:opacity-30 disabled:pointer-events-none text-[#2D3A30] font-bold rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-[#2D3A30] fill-[#2D3A30]" />
                            Tirer au sort (5 max)
                          </button>
                          {alreadyToday && (
                            <p className="text-[10px] text-[#C5A059] text-center leading-normal italic">
                              Tirage du jour déjà effectué. Résultat affiché ci-dessous.
                            </p>
                          )}
                          {!alreadyToday && exactCount === 0 && (
                            <p className="text-[10px] text-rose-300 text-center leading-normal italic">
                              Proclamez le score exact dans le match et assurez-vous de la présence de bonnes prédictions avant le tirage.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-[#FDFCF8]/40 text-xs py-10 font-serif italic">
                    Veuillez ajouter un match pour commencer le tirage au sort.
                  </div>
                )}
              </div>

              {/* Historique des tirages pour ce match */}
              {raffleLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : matchRaffles.length > 0 && (
                <div className="space-y-4">
                  {matchRaffles.map((raffle) => (
                    <motion.div
                      key={raffle.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1 }}
                      className="bg-[#2D3A30]/5 border border-[#2D3A30]/15 rounded-3xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#C5A059]">
                          <Gift className="w-4 h-4 text-[#C5A059]" />
                          <h4 className="font-serif font-bold text-[#2D3A30] text-sm">Gagnants du {raffle.date}</h4>
                        </div>
                        <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">
                          {raffle.winners.length} gagnant{raffle.winners.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {raffle.winners.map((winner, idx) => (
                          <div
                            key={winner.id}
                            className="bg-white border border-stone-200 p-3 rounded-2xl flex items-center gap-3 shadow-sm"
                          >
                            <div className="w-6 h-6 bg-[#C5A059] rounded-full flex items-center justify-center text-[#FDFCF8] font-serif font-black text-xs shrink-0">
                              {idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#2D3A30] truncate">
                                {winner.firstName} {winner.lastName}
                              </p>
                              <a
                                href={`tel:${winner.phone}`}
                                className="text-[10px] text-[#C5A059] font-mono font-bold hover:underline block"
                              >
                                {winner.phone}
                              </a>
                            </div>
                            <span className="font-serif font-bold text-[#2D3A30] text-xs bg-[#FAF9F5] px-2 py-0.5 rounded border border-stone-200 shrink-0">
                              {winner.predictedScoreA}-{winner.predictedScoreB}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div> {/* Closes Sweepstake column */}
          </div> {/* Closes columns grid */}

          {/* Detailed Participants List for selected match */}
          {currentSelectedMatch && (
            <div className="space-y-4 pt-6 border-t border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-stone-400" />
                  <h3 className="font-serif font-bold text-xl text-[#2D3A30]">
                    Prédictions ({filteredPredictions.length})
                  </h3>
                </div>

                {matchPredictions.length > 0 && (
                  <button
                    type="button"
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-1.5 justify-center bg-white border border-stone-250 hover:bg-[#FAF9F5] text-stone-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exporter la liste (.csv)
                  </button>
                )}
              </div>

              {matchPredictions.length === 0 ? (
                <div className="bg-[#FAF9F5] border border-stone-200 p-8 rounded-2xl text-center text-stone-400 text-xs italic font-serif">
                  Aucun participant n'a soumis de prédiction pour ce match.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search and Filters Layout */}
                  <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-[#FAF9F5] p-3 rounded-2xl border border-stone-200/60">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-stone-400" />
                      </span>
                      <input
                        type="text"
                        placeholder="Rechercher par nom, prénom ou téléphone..."
                        value={predSearch}
                        onChange={(e) => setPredSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059]"
                      />
                    </div>

                    <div className="flex bg-stone-200/50 p-0.5 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setPredFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                          predFilter === 'all'
                            ? 'bg-white text-[#2D3A30] shadow-xs'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        Tous ({matchPredictions.length})
                      </button>
                      {currentSelectedMatch.scoreA !== null && currentSelectedMatch.scoreB !== null && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPredFilter('exact')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                              predFilter === 'exact'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-emerald-700 hover:bg-emerald-50/50'
                            }`}
                          >
                            Exacts ({exactCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setPredFilter('incorrect')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                              predFilter === 'incorrect'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-rose-700 hover:bg-rose-50/50'
                            }`}
                          >
                            Incorrects ({matchPredictions.length - exactCount})
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {filteredPredictions.length === 0 ? (
                    <div className="bg-white border border-stone-200 border-dashed p-8 rounded-2xl text-center text-stone-400 text-xs italic font-serif">
                      Aucun résultat ne correspond aux filtres de recherche.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {paginatedPredictions.map((p) => {
                          const isExact = currentSelectedMatch.scoreA !== null && currentSelectedMatch.scoreB !== null &&
                            p.predictedScoreA === currentSelectedMatch.scoreA &&
                            p.predictedScoreB === currentSelectedMatch.scoreB;
                          
                          const calculated = currentSelectedMatch.scoreA !== null && currentSelectedMatch.scoreB !== null;

                          return (
                            <div 
                              key={p.id}
                              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 bg-white transition-all hover:shadow-xs ${
                                isExact 
                                  ? 'border-emerald-250 bg-emerald-50/65 text-emerald-950' 
                                  : calculated 
                                    ? 'border-stone-200 opacity-60' 
                                    : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide">Participant</span>
                                  <p className="font-semibold text-[#2D3A30] text-xs truncate">{p.firstName} {p.lastName}</p>
                                  <a href={`tel:${p.phone}`} className="text-[10px] text-stone-500 font-mono hover:text-[#C5A059] transition-colors">{p.phone}</a>
                                </div>
                                
                                <div className="text-right">
                                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wide block">Pronostic</span>
                                  <span className="font-serif font-bold text-[#2D3A30] text-base bg-[#FAF9F5] px-2 py-0.5 rounded border border-stone-200">
                                    {p.predictedScoreA} - {p.predictedScoreB}
                                  </span>
                                </div>
                              </div>

                              {calculated && (
                                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100 text-[9px] font-mono justify-end">
                                  {isExact ? (
                                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                      <Check className="w-3 h-3" /> Score Exact
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 flex items-center gap-1">
                                      <X className="w-3.5 h-3.5" /> Incorrect
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-stone-200 pt-4 gap-3">
                          <div className="text-xs text-stone-500">
                            Affichage de <span className="font-semibold text-[#2D3A30]">{startIndex + 1}</span> à{' '}
                            <span className="font-semibold text-[#2D3A30]">
                              {Math.min(startIndex + itemsPerPage, totalPredsCount)}
                            </span>{' '}
                            sur <span className="font-semibold text-[#2D3A30]">{totalPredsCount}</span> participants
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={currentPage === 1}
                              onClick={() => setPredPage(prev => Math.max(1, prev - 1))}
                              className="px-3 py-1.5 text-xs border border-stone-250 rounded-lg bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                              Précédent
                            </button>
                            <div className="text-xs font-semibold text-stone-700 px-1">
                              Page {currentPage} / {totalPages}
                            </div>
                            <button
                              type="button"
                              disabled={currentPage === totalPages}
                              onClick={() => setPredPage(prev => Math.min(totalPages, prev + 1))}
                              className="px-3 py-1.5 text-xs border border-stone-250 rounded-lg bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- MATCH MODAL DIALOG --- */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#FDFCF8] border border-stone-200 rounded-3xl shadow-2xl overflow-hidden text-[#2D3A30]"
          >
            <div className="p-5 border-b border-stone-150 flex justify-between items-center bg-[#FAF9F5]">
              <h3 className="font-serif font-bold text-lg text-[#2D3A30]">
                {editingMatch ? 'Modifier le Match' : 'Créer un Match'}
              </h3>
              <button onClick={closeMatchModal} className="text-stone-400 hover:text-[#2D3A30] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveMatchForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 font-medium">Équipe A (Domicile)</label>
                  <input
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    placeholder="France"
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-[#C5A059] focus:outline-none text-[#2D3A30]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 font-medium">Équipe B (Extérieur)</label>
                  <input
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    placeholder="Espagne"
                    required
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-[#C5A059] focus:outline-none text-[#2D3A30]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-medium">Date et heure du coup d’envoi</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-[#C5A059] focus:outline-none text-[#2D3A30] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-medium">Statut des pronostics</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-[#C5A059] focus:outline-none text-[#2D3A30]"
                >
                  <option value="open">Ouvert aux pronostics</option>
                  <option value="closed">Fermé aux pronostics</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-medium">Phase du tournoi</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as 'groups' | 'round_16' | 'quarters' | 'semis' | 'final')}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm focus:border-[#C5A059] focus:outline-none text-[#2D3A30]"
                >
                  <option value="groups">Phase de Groupes</option>
                  <option value="round_16">Huitième de finale</option>
                  <option value="quarters">Quart de finale</option>
                  <option value="semis">Demi-finale</option>
                  <option value="final">Finale</option>
                </select>
              </div>

              {/* Final Scores (ONLY Editable easily when match is closed/finished) */}
              <div className="bg-[#FAF9F5] border border-stone-200/80 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059]">
                  Scores finals (Après match)
                </span>
                
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500">{teamA || 'Équipe A'}</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      placeholder="Non joué"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-[#2D3A30] placeholder-stone-400 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500">{teamB || 'Équipe B'}</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      placeholder="Non joué"
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-[#2D3A30] placeholder-stone-400 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[9px] text-stone-400 leading-normal font-light">
                  Laissez ces champs vides si la rencontre n'a pas encore eu lieu ou est en cours.
                </p>
              </div>

              {matchError && (
                <div className="bg-rose-50 border border-rose-150 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{matchError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={closeMatchModal}
                  className="px-4 py-2 bg-stone-100 border border-stone-250 text-stone-600 font-semibold rounded-full hover:bg-stone-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D3A30] text-white font-bold rounded-full hover:bg-[#3D4F42] shadow cursor-pointer"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
