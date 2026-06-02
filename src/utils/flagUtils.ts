export const getFlagEmoji = (countryName: string): string => {
  // Normalize string to strip accents (e.g. "brésil" becomes "bresil")
  const normalize = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const cleanName = normalize(countryName.trim().toLowerCase());
  
  const flagMap: Record<string, string> = {
    france: '🇫🇷',
    allemagne: '🇩🇪',
    espagne: '🇪🇸',
    italie: '🇮🇹',
    angleterre: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    portugal: '🇵🇹',
    belgique: '🇧🇪',
    maroc: '🇲🇦',
    bresil: '🇧🇷',
    brasil: '🇧🇷',
    brazil: '🇧🇷',
    argentine: '🇦🇷',
    senegal: '🇸🇳',
    cameroun: '🇨🇲',
    canada: '🇨🇦',
    usa: '🇺🇸',
    'etats-unis': '🇺🇸',
    mexique: '🇲🇽',
    croatie: '🇭🇷',
    suisse: '🇨🇭',
    'pays-bas': '🇳🇱',
    uruguay: '🇺🇾',
    japon: '🇯🇵',
    tunisie: '🇹🇳',
    coree: '🇰🇷',
    'arabie saoudite': '🇸🇦',
    arabie: '🇸🇦',
    ghana: '🇬🇭',
    danemark: '🇩🇰',
    pologne: '🇵🇱',
    australie: '🇦🇺',
    equateur: '🇪🇨',
    espana: '🇪🇸',
    germany: '🇩🇪',
    spain: '🇪🇸',
    italy: '🇮🇹',
    england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    morocco: '🇲🇦',
    croatia: '🇭🇷',
    switzerland: '🇨🇭',
    netherlands: '🇳🇱',
    japan: '🇯🇵',
    tunisia: '🇹🇳',
    korea: '🇰🇷',
    saudi: '🇸🇦',
    denmark: '🇩🇰',
    poland: '🇵🇱',
    australia: '🇦🇺',
    ecuador: '🇪🇨'
  };

  if (flagMap[cleanName]) return flagMap[cleanName];

  // Look for partial matches
  for (const [key, value] of Object.entries(flagMap)) {
    const cleanKey = normalize(key);
    if (cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
      return value;
    }
  }

  return '⚽';
};
