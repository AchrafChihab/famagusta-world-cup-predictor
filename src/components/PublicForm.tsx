import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Calendar,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Star,
  ExternalLink,
  Plus,
  Minus
} from 'lucide-react';
import { Match } from '../types';
import { getMatches, createPrediction, checkPredictionExists } from '../firestoreService';
import logoUrl from '../assets/famagusta_logo.jpeg';
import { getFlagEmoji } from '../utils/flagUtils';

export default function PublicForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [predictedScoreA, setPredictedScoreA] = useState(0);
  const [predictedScoreB, setPredictedScoreB] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [duplicateDetected, setDuplicateDetected] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await getMatches();
        setMatches(data);
        const firstOpen = data.find(m => m.status === 'open');
        if (firstOpen) setSelectedMatch(firstOpen);
      } catch (err) {
        console.error('Error loading matches', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setDuplicateDetected(false);

    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setSubmitError('Veuillez remplir tous les champs du formulaire.');
      setIsSubmitting(false);
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
      setSubmitError('Veuillez saisir un numéro de téléphone valide (ex: 06 12 34 56 78).');
      setIsSubmitting(false);
      return;
    }

    try {
      const exists = await checkPredictionExists(selectedMatch.id, cleanPhone);
      if (exists) {
        setDuplicateDetected(true);
        setIsSubmitting(false);
        return;
      }

      await createPrediction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        matchId: selectedMatch.id,
        predictedScoreA,
        predictedScoreB
      });

      setSubmittedSuccessfully(true);
    } catch (err: unknown) {
      console.error(err);
      setSubmitError('Une erreur est survenue lors de la soumission. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setPredictedScoreA(0);
    setPredictedScoreB(0);
    setSubmittedSuccessfully(false);
    setDuplicateDetected(false);
    setSubmitError(null);
  };

  // Masquer les matchs terminés (fermés + score saisi)
  const visibleMatches = matches.filter(
    m => m.status === 'open' || (m.status === 'closed' && (m.scoreA === null || m.scoreB === null))
  );

  const sortedMatches = [...visibleMatches].sort((a, b) => {
    if (a.status === 'open' && b.status === 'closed') return -1;
    if (a.status === 'closed' && b.status === 'open') return 1;
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const googleReviewUrl = "https://www.google.com/search?q=Caf%C3%A9+Famagusta#lrd=0xda62d647f745261:0xd0b3350f450ea695,3,,,,";

  return (
    <div className="bg-[#FDFCF8]">

      {/* ─── MOBILE HEADER (visible only on mobile) ─── */}
      <div className="md:hidden bg-[#2D3A30] text-[#FDFCF8] px-5 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#C5A059]/30 bg-[#FDFCF8] p-1 shrink-0">
            <img src={logoUrl} alt="Café Famagusta" className="w-6 h-6 rounded-full object-cover border border-stone-200/80 shadow-xs" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold leading-tight">Famagusta</h1>
            <div className="h-[2px] w-8 bg-[#C5A059] mt-1"></div>
          </div>
        </div>
        <p className="font-serif italic text-[#FDFCF8]/80 text-sm leading-relaxed">
          Pronostiquezle score exact et tentez de gagner 5 consommations !
        </p>

        {/* Selected match pill on mobile */}
        {selectedMatch && (
          <div className="mt-4 bg-[#FDFCF8]/10 border border-[#FDFCF8]/10 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-serif font-bold text-sm text-white truncate">
              <span className="select-none">{getFlagEmoji(selectedMatch.teamA)}</span>
              <span className="truncate max-w-[70px]">{selectedMatch.teamA}</span>
              <span className="text-[#C5A059] italic font-sans text-xs font-normal">vs</span>
              <span className="select-none">{getFlagEmoji(selectedMatch.teamB)}</span>
              <span className="truncate max-w-[70px]">{selectedMatch.teamB}</span>
            </div>
            <span className="text-[9px] font-mono text-[#FDFCF8]/50 shrink-0 ml-2">{formatDateShort(selectedMatch.dateTime)}</span>
          </div>
        )}
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-8 md:gap-12">

          {/* ─── LEFT SIDEBAR (desktop only) ─── */}
          <div className="hidden md:flex bg-[#2D3A30] text-[#FDFCF8] rounded-3xl p-10 flex-col justify-between space-y-12 shadow-xl card-shadow">
            <div>
              <div className="flex flex-col items-start mb-6">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-[#C5A059]/30 bg-[#FDFCF8] p-1.5 shadow-md mb-4">
                  <img src={logoUrl} alt="Café Famagusta Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <h1 className="font-serif text-5xl font-bold tracking-tight mb-2">Famagusta</h1>
                <div className="h-[2.5px] w-12 bg-[#C5A059] mb-4"></div>
              </div>
              <p className="font-serif italic text-xl text-[#FDFCF8]/90 leading-relaxed font-light">
                Vivez l'émotion de la Coupe du Monde 2026 dans votre café préféré.
              </p>
            </div>

            <div className="space-y-6">
              {selectedMatch ? (
                <div className="p-5 border border-[#FDFCF8]/10 rounded-2xl bg-[#FDFCF8]/5 space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C5A059]">Match sélectionné</span>
                  <div className="flex justify-between items-center text-[#FDFCF8]">
                    <div className="text-center flex-1 space-y-1">
                      <span className="text-2xl block select-none">{getFlagEmoji(selectedMatch.teamA)}</span>
                      <span className="text-sm font-semibold tracking-wide block uppercase truncate max-w-[100px] mx-auto">{selectedMatch.teamA}</span>
                    </div>
                    <div className="text-[#C5A059] font-serif italic text-xl px-2">vs</div>
                    <div className="text-center flex-1 space-y-1">
                      <span className="text-2xl block select-none">{getFlagEmoji(selectedMatch.teamB)}</span>
                      <span className="text-sm font-semibold tracking-wide block uppercase truncate max-w-[100px] mx-auto">{selectedMatch.teamB}</span>
                    </div>
                  </div>
                  <div className="text-center text-[11px] text-[#FDFCF8]/50 pt-2 border-t border-[#FDFCF8]/10">
                    {formatDateTime(selectedMatch.dateTime)}
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-[#FDFCF8]/10 rounded-2xl bg-[#FDFCF8]/5 text-center text-xs text-[#FDFCF8]/60">
                  Aucun match sélectionné
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-[#FDFCF8]/70 pt-2">
                <div className="w-8 h-8 rounded-full border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#FDFCF8]">Pronostics Famagusta</p>
                  <p className="text-[10px] text-[#FDFCF8]/50">5 consommations offertes par match !</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL ─── */}
          <div className="flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#2D3A30]/60 mt-4 text-xs font-mono">Chargement des matchs...</p>
              </div>

            ) : submittedSuccessfully ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-lg card-shadow text-center space-y-6"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-3">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D3A30]">Pronostic enregistré !</h2>
                  <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
                    Merci <span className="text-[#C5A059] font-semibold">{firstName}</span>. Votre pronostic{' '}
                    <span className="font-serif font-bold text-[#2D3A30] text-lg bg-[#FAF9F5] px-2 py-0.5 rounded">
                      {predictedScoreA} - {predictedScoreB}
                    </span>{' '}
                    pour <span className="font-medium">{selectedMatch?.teamA} vs {selectedMatch?.teamB}</span> a été enregistré.
                  </p>
                  <p className="text-xs text-stone-400">
                    Un tirage au sort sera effectué parmi tous les scores exacts à la fin du match.
                  </p>
                </div>

                <div className="pt-5 border-t border-stone-200/60 space-y-4">
                  <div className="text-center">
                    <span className="text-[10px] font-semibold tracking-widest text-[#C5A059] uppercase block mb-1">Un petit clic nous aide</span>
                    <p className="text-xs text-stone-600">Vous appréciez le concept ? Laissez-nous un avis 5 étoiles sur Google !</p>
                  </div>
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 justify-center w-full bg-[#2D3A30] hover:bg-[#3D4F42] text-white font-semibold text-xs py-3.5 px-6 rounded-full shadow-md transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#C5A059] text-[#C5A059]" />
                    Laisser un avis Google
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-[9px] text-stone-400 font-light italic text-center">L'avis est facultatif et n'influence pas le tirage.</p>
                </div>

                <button
                  onClick={handleReset}
                  className="text-[#2D3A30]/60 hover:text-[#2D3A30] text-xs font-semibold underline cursor-pointer"
                >
                  Faire un autre pronostic
                </button>
              </motion.div>

            ) : (
              <div className="space-y-7">

                {/* Title — masqué sur mobile (le header vert le remplace) */}
                <div className="hidden md:block">
                  <h2 className="text-4xl font-serif text-[#2D3A30] tracking-tight mb-2">Pronostiquez le Score</h2>
                  <p className="text-stone-500 text-sm font-light">
                    Choisissez votre rencontre et prédisez le score exact. Un tirage au sort désignera 5 heureux gourmands !
                  </p>
                </div>

                {/* ── Étape 1 : Sélection du match ── */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                    Étape 1 — Choisissez la rencontre
                  </label>

                  {sortedMatches.length === 0 ? (
                    <div className="bg-[#FAF9F5] border border-stone-200 rounded-2xl p-8 text-center space-y-2">
                      <p className="text-stone-600 text-sm font-serif font-semibold">Aucun match disponible pour l'instant.</p>
                      <p className="text-stone-400 text-xs font-light">Les pronostics pour les prochains matchs ouvriront bientôt. Revenez nous voir !</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {sortedMatches.map((match) => {
                        const isOpen = match.status === 'open';
                        const isSelected = selectedMatch?.id === match.id;

                        return (
                          <button
                            key={match.id}
                            onClick={() => isOpen && setSelectedMatch(match)}
                            disabled={!isOpen}
                            className={`text-left rounded-xl border transition-all flex items-center justify-between gap-3 px-4 py-3.5 ${
                              isSelected
                                ? 'bg-[#FAF9F5] border-[#C5A059] shadow-sm'
                                : isOpen
                                  ? 'bg-white border-stone-200 hover:border-[#C5A059]/50 active:bg-[#FAF9F5]'
                                  : 'bg-[#FAF9F5] border-stone-200/50 opacity-55 cursor-not-allowed'
                            }`}
                          >
                            {/* Infos match */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-serif font-bold text-[#2D3A30] text-sm md:text-base truncate">
                                <span className="text-base select-none">{getFlagEmoji(match.teamA)}</span>
                                <span className="truncate">{match.teamA}</span>
                                <span className="text-[#C5A059]/60 font-sans text-[10px] font-normal px-0.5 shrink-0">VS</span>
                                <span className="text-base select-none">{getFlagEmoji(match.teamB)}</span>
                                <span className="truncate">{match.teamB}</span>
                              </div>
                              <div className="flex items-center gap-1 text-stone-400 text-[11px] mt-0.5">
                                <Calendar className="w-3 h-3 text-[#C5A059] shrink-0" />
                                <span className="truncate">{formatDateShort(match.dateTime)}</span>
                              </div>
                            </div>

                            {/* Badge statut */}
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full shrink-0 ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                : 'bg-stone-100 text-stone-500 border border-stone-200/50'
                            }`}>
                              {isOpen ? 'Ouvert' : 'Fermé'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Formulaire (seulement si match ouvert sélectionné) ── */}
                {selectedMatch && selectedMatch.status === 'open' && (
                  <motion.form
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-7"
                  >
                    {/* Étape 2 : Score */}
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400">
                        Étape 2 — Votre pronostic
                      </label>

                      <div className="bg-[#FAF9F5] rounded-3xl border border-stone-200/60 card-shadow px-4 py-6 md:px-8 md:py-8 flex items-center justify-center gap-4">
                        {/* Équipe A */}
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-2xl mb-1 select-none">{getFlagEmoji(selectedMatch.teamA)}</span>
                          <span className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase mb-3 text-center truncate w-full max-w-[100px]">
                            {selectedMatch.teamA}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPredictedScoreA(prev => Math.max(0, prev - 1))}
                              className="w-9 h-9 rounded-full border border-stone-300 bg-white flex items-center justify-center hover:bg-stone-50 active:scale-95 text-[#2D3A30] cursor-pointer transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-serif text-4xl font-black text-[#2D3A30] w-10 text-center select-none tabular-nums">
                              {predictedScoreA}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPredictedScoreA(prev => Math.min(99, prev + 1))}
                              className="w-9 h-9 rounded-full border border-stone-300 bg-white flex items-center justify-center hover:bg-stone-50 active:scale-95 text-[#2D3A30] cursor-pointer transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-2xl font-serif text-stone-300 shrink-0 select-none pb-6">—</div>

                        {/* Équipe B */}
                        <div className="flex flex-col items-center flex-1">
                          <span className="text-2xl mb-1 select-none">{getFlagEmoji(selectedMatch.teamB)}</span>
                          <span className="text-[10px] font-semibold tracking-wide text-stone-500 uppercase mb-3 text-center truncate w-full max-w-[100px]">
                            {selectedMatch.teamB}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPredictedScoreB(prev => Math.max(0, prev - 1))}
                              className="w-9 h-9 rounded-full border border-stone-300 bg-white flex items-center justify-center hover:bg-stone-50 active:scale-95 text-[#2D3A30] cursor-pointer transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-serif text-4xl font-black text-[#2D3A30] w-10 text-center select-none tabular-nums">
                              {predictedScoreB}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPredictedScoreB(prev => Math.min(99, prev + 1))}
                              className="w-9 h-9 rounded-full border border-stone-300 bg-white flex items-center justify-center hover:bg-stone-50 active:scale-95 text-[#2D3A30] cursor-pointer transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Étape 3 : Coordonnées */}
                    <div className="space-y-5">
                      <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block border-b border-stone-100 pb-1">
                        Étape 3 — Vos coordonnées
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block mb-1.5">Nom</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                            placeholder="Ex: Dupont"
                            required
                            className="input-field text-stone-800 text-sm py-2.5 font-sans placeholder-stone-350 w-full"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block mb-1.5">Prénom</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                            placeholder="Ex: Jean"
                            required
                            className="input-field text-stone-800 text-sm py-2.5 font-sans placeholder-stone-350 w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 block mb-1.5">Téléphone</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                          placeholder="Ex: 06 12 34 56 78"
                          required
                          className="input-field text-stone-800 text-sm py-2.5 font-mono placeholder-stone-350 w-full"
                        />
                        <p className="text-[10px] text-stone-400 font-light mt-1.5">
                          Utilisé uniquement pour vous contacter si vous trouvez le score exact.
                        </p>
                      </div>
                    </div>

                    {/* Erreurs */}
                    {submitError && (
                      <div className="bg-red-50 text-red-700 border border-red-100 p-4 rounded-xl text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {duplicateDetected && (
                      <div className="bg-[#FAF9F5] border border-[#C5A059]/40 text-[#2D3A30] p-4 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-2 font-serif text-sm font-bold">
                          <AlertCircle className="w-4 h-4 text-[#C5A059] shrink-0" />
                          <span>Vous avez déjà soumis un pronostic !</span>
                        </div>
                        <p className="text-[11px] text-stone-500 pl-6">
                          Un seul pronostic par numéro de téléphone est autorisé par match.
                        </p>
                      </div>
                    )}

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-1 pb-6 md:pb-0">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 bg-[#2D3A30] hover:bg-[#3D4F42] active:scale-[0.99] text-white font-semibold py-4 px-8 rounded-full tracking-wide transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Validation...
                          </>
                        ) : (
                          <>
                            Valider mon pronostic
                            <ChevronRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <a
                        href={googleReviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#C5A059] font-medium border-b border-[#C5A059]/30 pb-0.5 hover:border-[#C5A059] transition-all flex items-center gap-1 shrink-0"
                      >
                        Laisser un avis Google
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                  </motion.form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
