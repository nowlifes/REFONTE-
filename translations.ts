
export type Language = 'en' | 'fr';

export const TRANSLATIONS = {
  en: {
    // General
    loading: "Loading Quest...",
    close: "Close",
    back: "Back",
    validate: "Validate",
    confirm: "Confirm",
    new_achievement: "NEW ACHIEVEMENT!",
    sensational_btn: "SENSATIONAL!",
    certified_adventurer: "CERTIFIED ADVENTURER",
    achievements: "ACHIEVEMENTS",
    active: "ACTIVE",
    progress: "PROGRESS",
    scan_witness: "SCAN WITNESS",
    scan: "SCAN",
    find_player_badge: "Find another Player's Badge",
    
    // Landing
    landing_title: "Your Official Playbook",
    start_btn: "Start Quest",
    
    // Nickname / Avatar
    your_identity: "Your Identity",
    your_card: "YOUR CARD",
    player_name_label: "Player Name",
    placeholder_name: "Ex: Arthur",
    placeholder_name_input: "YOUR NAME",
    lets_go_btn: "LET'S GO",
    join_adventure: "Join the Adventure",
    select_language: "Select Language",
    gm_access: "Game Master Access",
    unlock: "Unlock",
    master_access_title: "Master Access",
    
    // Header & Navigation
    score: "Score",
    grid_view: "Grid",
    list_view: "List",
    zoom: "Zoom",
    reset: "Reset",
    tap_rules: "Tap to view rules",
    
    // Roles & Modes (Brand Names)
    mode_solo_title: "SOLO MODE",
    mode_solo_desc: "HONEST SELF-VALIDATION 👀",
    mode_social_title: "SOCIAL CLUB",
    mode_social_desc: "GET A FRIEND TO SIGN",
    mode_master_title: "BINGO MASTER",
    mode_master_desc: "FIND THE MASTER FOR CODE",
    
    // Game Master Dashboard
    leave: "Leave",
    royal_seal: "Royal Seal",
    scan_instruction: "Players scan this to validate 'Master' challenges.",
    session_active: "Master Session Active",
    manual_code_title: "Manual Override Code",
    master_control: "MASTER CONTROL",
    open: "OPEN",
    back_to_game: "BACK TO GAME",
    show_master_code_desc: "SHOW THIS CODE TO VALIDATE MASTER CHALLENGES",
    
    // Tutorial / Rewards
    tutorial_got_it: "GOT IT",
    rewards_title: "REWARDS MENU",
    rewards_subtitle: "BIG EFFORT, BIG COMFORT", 
    reward_row_1: "1ST COMPLETED ROW",
    reward_row_1_desc: "1 FREE SHOT 🥃",
    reward_row_2: "EVERY 2 ROWS",
    reward_row_2_desc: "1 MYSTERY GIFT 🎁",
    reward_full_grid: "FULL GRID",
    reward_full_grid_desc: "BINGO KING / QUEEN 👑",
    cheers_btn: "CHEERS! LET'S GO",
    disclaimer: "Drink responsibly.",
    
    // Legends / Rules
    code_title: "The Crawl Code",
    rules_title: "RULES OF",
    chill_mode: "Chill Mode",
    chill_desc: "You do it, you click it. No cheating, Karma is watching 👀.",
    social_club: "Social Club",
    social_desc: "Hand phone to a friend. They sign, it counts.",
    big_boss: "The Big Boss",
    big_boss_desc: "Find the Bingo Master for the special code.",
    not_in_game: "Not in the game yet?",
    scan_join: "Scan to join immediately.",
    direct_access: "Direct Access",
    tap_close: "Tap anywhere to close",
    share: "SHARE",
    invite_friends: "INVITE YOUR FRIENDS",
    
    // Validation Modal
    social_feat: "Social Feat",
    solo_feat: "Solo Feat",
    i_did_it: "I DID IT!",
    find_witness: "FIND A WITNESS",
    cool_down: "Cool down",
    swap_challenge: "Swap Challenge",
    social_proof: "Social Proof",
    get_friend: "Get a friend to confirm your feat.",
    witness_name: "Witness Name",
    witness_placeholder: "Ex: The Bartender",
    signature_area: "Signature or Doodle",
    validated: "Validated!",
    
    // Rune Pad
    security_gate: "Security Gate",
    security_desc: "Positions change on every attempt.",
    
    // Scanner
    scan_entry: "SCAN ENTRY",
    find_master: "FIND MASTER",
    find_poster: "Find the poster at the entrance.",
    locate_person: "Locate the person with the Golden Badge.",
    simulate_scan: "Simulate Scan",
    verifying: "Verifying...",
    camera_error: "Camera access is required for the Quest.",

    // Badge UI
    status_active: "ACTIVE",
    show_master: "Show to Game Master for Validation",
    sensational: "SENSATIONAL!",

    // Badge Titles & Descriptions
    badge_title_FIRST_BLOOD: "First Blood",
    badge_desc_FIRST_BLOOD: "First cell validated in the event",
    badge_title_SPEED_DEMON: "Speed Demon",
    badge_desc_SPEED_DEMON: "5 cells in under 30 min",
    badge_title_BIG_BRAIN: "Big Brain",
    badge_desc_BIG_BRAIN: "Strategic use of jokers",
    badge_title_PARTY_ANIMAL: "Party Animal",
    badge_desc_PARTY_ANIMAL: "10 cells validated",
    badge_title_NIGHT_OWL: "Night Owl",
    badge_desc_NIGHT_OWL: "Validated after midnight",
    badge_title_EARLY_BIRD: "Early Bird",
    badge_desc_EARLY_BIRD: "Validated before 10 AM",
    badge_title_SOCIAL_BUTTERFLY: "Social Butterfly",
    badge_desc_SOCIAL_BUTTERFLY: "5 witness validations",
    badge_title_PERFECTIONIST: "Perfectionist",
    badge_desc_PERFECTIONIST: "Full grid without jokers",
    
    // Logo
    logo_top: "THE",
    logo_middle: "BINGO",
    logo_bottom: "CRAWL",
    logo_ribbon: "LIVE THE QUEST. IGNORE THE REST.",

    // Leaderboard
    leaderboard_title: "TOP PLAYERS",
    active_players: "Active Players",
    rank: "Rank",
    player: "Player",
    time: "Time",
    jokers: "JOKERS",
    help: "HELP",
    you: "YOU",
    no_players: "No players yet. Be the first!",

    // Locked Page
    closed: "Closed",
    closed_desc: "The gates are closed for now.",
    waiting_master: "Waiting for Game Master",
    refresh_status: "Refresh Status",
    polishing_crowns: "Polishing Crowns...",
    brewing_potions: "Brewing Potions...",
    summoning_players: "Summoning Players...",
    securing_gates: "Securing the Gates...",
    access_restricted: "Access Restricted",
    glory_awaits: "Glory awaits those who are patient.",
    checking_signal: "Checking Signal...",
    scan_to_unlock: "Scan to Unlock",

    // Tutorial Steps
    tut_styles_text: "Each square is a mission. Some are solo, others need friends!",
    tut_rewards_text: "Claim your rewards as you complete lines! 🎁",
    tut_grid_text: "Choose a challenge to begin your journey! 🎯",
    tut_challenge_text: "SOCIAL PROOF! For this challenge, you MUST hand your phone to a witness so they can sign!",
    tut_score_text: "Your progress is tracked here. Go for the blackout! 👑",

    // Session Start
    session_start_title: "The Adventure Begins!",
    session_start_subtitle: "The gates are open. Glory awaits!",

    // Landscape
    rotate_device: "Rotate Device",
    rotate_desc: "This quest is designed for Portrait Mode. Please rotate your phone.",

    // Network / Sync
    offline_mode: "Offline Mode",
    syncing: "Synchronizing...",
    connected: "Connected",
    data_saved: "Data saved locally"
  },
  fr: {
    // General
    loading: "Chargement de la Quête...",
    close: "Fermer",
    back: "Retour",
    validate: "Valider",
    confirm: "Confirmer",
    new_achievement: "NOUVEAU SUCCÈS !",
    sensational_btn: "SENSATIONNEL !",
    certified_adventurer: "AVENTURIER CERTIFIÉ",
    achievements: "HAUTS FAITS",
    active: "ACTIF",
    progress: "PROGRESSION",
    scan_witness: "SCAN TÉMOIN",
    scan: "SCAN",
    find_player_badge: "Trouvez le badge d'un autre joueur",
    
    // Landing
    landing_title: "Votre Grimoire Officiel",
    start_btn: "Lancer la Quête",
    
    // Nickname / Avatar
    your_identity: "Votre Identité",
    your_card: "VOTRE CARTE",
    player_name_label: "Nom du Joueur",
    placeholder_name: "Ex: Arthur",
    placeholder_name_input: "TON NOM",
    lets_go_btn: "C'EST PARTI",
    join_adventure: "Rejoindre l'Aventure",
    select_language: "Choisir Langue",
    gm_access: "Accès Maître du Jeu",
    unlock: "Déverrouiller",
    master_access_title: "Accès Maître",
    
    // Header & Navigation
    score: "Score",
    grid_view: "Grille",
    list_view: "Liste",
    zoom: "Zoom",
    reset: "Reset",
    tap_rules: "Voir les règles",
    
    // Roles & Modes (Brand Names)
    mode_solo_title: "SOLO MODE",
    mode_solo_desc: "AUTO-CLIC SANS TRICHE 👀",
    mode_social_title: "SOCIAL CLUB",
    mode_social_desc: "FAITES SIGNER UN AMI",
    mode_master_title: "BINGO MASTER",
    mode_master_desc: "TROUVEZ LE MAÎTRE POUR LE CODE",
    
    // Game Master Dashboard
    leave: "Quitter",
    royal_seal: "Sceau Royal",
    scan_instruction: "Les joueurs scannent ceci pour valider les défis.",
    session_active: "Session Maître Active",
    manual_code_title: "Code Manuel (Secours)",
    master_control: "CONTRÔLE MAÎTRE",
    open: "OUVERT",
    back_to_game: "RETOUR AU JEU",
    show_master_code_desc: "MONTREZ CE CODE POUR VALIDER LES DÉFIS MAÎTRE",
    
    // Tutorial / Rewards
    tutorial_got_it: "COMPRIS",
    rewards_title: "MENU DES GAINS",
    rewards_subtitle: "À GRANDS EFFORTS, GRAND RÉCONFORT", 
    reward_row_1: "PREMIÈRE LIGNE",
    reward_row_1_desc: "1 SHOT OFFERT 🥃",
    reward_row_2: "TOUTES LES 2 LIGNES",
    reward_row_2_desc: "1 CADEAU MYSTÈRE 🎁",
    reward_full_grid: "GRILLE COMPLÈTE",
    reward_full_grid_desc: "ROI / REINE DU BINGO 👑",
    cheers_btn: "SANTÉ ! C'EST PARTI",
    disclaimer: "L'abus d'alcool est dangereux pour la santé.",
    
    // Legends / Rules
    code_title: "Le Code du Crawl",
    rules_title: "RÈGLES DU",
    chill_mode: "Mode Détente",
    chill_desc: "Tu le fais, tu cliques. Pas de triche, le Karma t'observe 👀.",
    social_club: "Club Social",
    social_desc: "Passe ton tel à un pote. Il signe, c'est validé.",
    big_boss: "Le Grand Patron",
    big_boss_desc: "Trouve le Maître du Bingo pour le code spécial.",
    not_in_game: "Pas encore dans la partie ?",
    scan_join: "Scannez pour rejoindre.",
    direct_access: "Accès Direct",
    tap_close: "Touchez pour fermer",
    share: "PARTAGER",
    invite_friends: "INVITE TES POTES",
    
    // Validation Modal
    social_feat: "Défi Social",
    solo_feat: "Défi Solo",
    i_did_it: "JE L'AI FAIT !",
    find_witness: "TROUVER UN TÉMOIN",
    cool_down: "Pause",
    swap_challenge: "Échanger le Défi",
    social_proof: "Preuve Sociale",
    get_friend: "Faites valider votre exploit par un ami.",
    witness_name: "Nom du Témoin",
    witness_placeholder: "Ex: Le Tavernier",
    signature_area: "Signature ou Gribouillage",
    validated: "Validé !",
    
    // Rune Pad
    security_gate: "Porte de Sécurité",
    security_desc: "Les positions changent à chaque tentative.",
    
    // Scanner
    scan_entry: "SCAN ENTRÉE",
    find_master: "TROUVER LE MAÎTRE",
    find_poster: "Trouvez l'affiche à l'entrée.",
    locate_person: "Trouvez la personne avec le Badge Doré.",
    simulate_scan: "Simuler Scan",
    verifying: "Vérification...",
    camera_error: "Accès caméra requis pour la quête.",

    // Badge UI
    status_active: "ACTIF",
    show_master: "Montrer au Maître pour Validation",
    sensational: "SENSATIONNEL !",

    // Badge Titles & Descriptions
    badge_title_FIRST_BLOOD: "First Blood",
    badge_desc_FIRST_BLOOD: "Première case validée de l'event",
    badge_title_SPEED_DEMON: "Speed Demon",
    badge_desc_SPEED_DEMON: "5 cases en moins de 30 min",
    badge_title_BIG_BRAIN: "Gros Cerveau",
    badge_desc_BIG_BRAIN: "Utilisation stratégique des jokers",
    badge_title_PARTY_ANIMAL: "Fêtard",
    badge_desc_PARTY_ANIMAL: "10 cases validées",
    badge_title_NIGHT_OWL: "Oiseau de Nuit",
    badge_desc_NIGHT_OWL: "Validation après minuit",
    badge_title_EARLY_BIRD: "Lève-tôt",
    badge_desc_EARLY_BIRD: "Validation avant 10h du matin",
    badge_title_SOCIAL_BUTTERFLY: "Papillon Social",
    badge_desc_SOCIAL_BUTTERFLY: "5 validations par témoin",
    badge_title_PERFECTIONIST: "Perfectionniste",
    badge_desc_PERFECTIONIST: "Grille complète sans joker",

    // Logo
    logo_top: "LE",
    logo_middle: "BINGO",
    logo_bottom: "CRAWL",
    logo_ribbon: "VIVEZ LA QUÊTE. OUBLIEZ LE RESTE.",
    
    // Leaderboard
    leaderboard_title: "TOP JOUEURS",
    active_players: "Joueurs Actifs",
    rank: "Rang",
    player: "Joueur",
    time: "Temps",
    jokers: "JOKERS",
    help: "AIDE",
    you: "VOUS",
    no_players: "Aucun joueur. Soyez le premier !",

    // Locked Page
    closed: "Fermée",
    closed_desc: "Les portes sont closes pour le moment.",
    waiting_master: "En attente du Maître du Jeu",
    refresh_status: "Rafraîchir Statut",
    polishing_crowns: "Polissage des Couronnes...",
    brewing_potions: "Préparation des Potions...",
    summoning_players: "Appel des Joueurs...",
    securing_gates: "Sécurisation des Portes...",
    access_restricted: "Accès Restreint",
    glory_awaits: "La gloire attend les patients.",
    checking_signal: "Vérification du Signal...",
    scan_to_unlock: "Scanner pour Débloquer",

    // Tutorial Steps
    tut_styles_text: "Chaque case est une mission. Certaines sont solo, d'autres sociales !",
    tut_rewards_text: "Réclame tes gains à chaque ligne complétée ! 🎁",
    tut_grid_text: "Choisis un défi pour commencer ton aventure ! 🎯",
    tut_challenge_text: "PREUVE SOCIALE ! Pour ce défi, tu DOIS donner ton téléphone à un témoin pour qu'il signe !",
    tut_score_text: "Ta progression est ici. Vise la grille complète ! 👑",

    // Session Start
    session_start_title: "L'Aventure Commence !",
    session_start_subtitle: "Les portes sont ouvertes. À vous la gloire !",

    // Landscape
    rotate_device: "Pivotez l'appareil",
    rotate_desc: "Cette quête est conçue pour le mode Portrait. Merci de pivoter votre téléphone.",

    // Network / Sync
    offline_mode: "Mode Hors-ligne",
    syncing: "Synchronisation...",
    connected: "Connecté",
    data_saved: "Données sauvées localement"
  }
};
