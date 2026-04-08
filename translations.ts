
export type Language = 'en' | 'fr';

export const TRANSLATIONS = {
  en: {
    // General
    loading: "Loading...",
    close: "Close",
    back: "Back",
    validate: "Validate",
    confirm: "Confirm",
    new_achievement: "NEW BADGE!",
    sensational_btn: "HELL YEAH!",
    certified_adventurer: "CERTIFIED LEGEND",
    achievements: "BADGES",
    active: "ACTIVE",
    progress: "PROGRESS",
    scan_witness: "SCAN WITNESS",
    scan: "SCAN",
    find_player_badge: "Find another player's badge",

    // Landing
    landing_title: "Your Official Playbook",
    start_btn: "Let's Go",

    // Nickname / Avatar
    your_identity: "Who are you?",
    your_card: "YOUR CARD",
    player_name_label: "Your name",
    placeholder_name: "Ex: Arthur",
    placeholder_name_input: "YOUR NAME",
    lets_go_btn: "LET'S GO",
    join_adventure: "Jump in",
    select_language: "Language",
    gm_access: "Game Master",
    unlock: "Unlock",
    master_access_title: "Master Access",

    // Header & Navigation
    score: "Score",
    grid_view: "Grid",
    list_view: "List",
    zoom: "Zoom",
    reset: "Reset",
    tap_rules: "Rules",

    // Roles & Modes (Brand Names)
    mode_solo_title: "SOLO",
    mode_solo_desc: "YOU DID IT. YOU CLICK IT. 👀",
    mode_social_title: "SOCIAL",
    mode_social_desc: "GET A MATE TO SIGN",
    mode_master_title: "MASTER",
    mode_master_desc: "FIND THE GAME MASTER",

    // Game Master Dashboard
    leave: "Leave",
    royal_seal: "Master QR",
    scan_instruction: "Players scan this to validate Master challenges.",
    session_active: "Session Active",
    manual_code_title: "Manual Code",
    master_control: "MASTER CONTROL",
    open: "OPEN",
    back_to_game: "BACK TO GAME",
    show_master_code_desc: "SHOW THIS CODE TO VALIDATE MASTER CHALLENGES",
    reset_session: "RESET SESSION",
    reset_session_confirm: "ARE YOU SURE? This wipes all players and scores forever.",
    reset_session_btn: "YES, WIPE EVERYTHING",
    cancel: "CANCEL",

    // Tutorial / Rewards
    tutorial_got_it: "GOT IT",
    rewards_title: "REWARDS",
    rewards_subtitle: "COMPLETE LINES. GET STUFF.",
    reward_row_1: "1 COMPLETE LINE",
    reward_row_1_desc: "FREE SHOT AT THE BAR 🥃",
    reward_row_2: "EVERY 2 LINES",
    reward_row_2_desc: "MYSTERY REWARD 🎁",
    reward_full_grid: "FULL GRID",
    reward_full_grid_desc: "BINGO KING / QUEEN 👑",
    cheers_btn: "CHEERS! LET'S GO",
    disclaimer: "Drink responsibly.",

    // Legends / Rules
    code_title: "How It Works",
    rules_title: "RULES",
    chill_mode: "Solo",
    chill_desc: "You did it, you tap it. No BS, karma's watching 👀",
    social_club: "Witness",
    social_desc: "Pass your phone to a mate. They sign, it counts.",
    big_boss: "Master",
    big_boss_desc: "Track down the Game Master for the special code.",
    not_in_game: "Not in yet?",
    scan_join: "Scan & jump in.",
    direct_access: "Direct Link",
    tap_close: "Tap to close",
    share: "SHARE",
    invite_friends: "INVITE YOUR CREW",

    // Taunts / Tones
    taunts_section_title: "TAUNTS",
    taunts_section_desc: "2 taunts per session. Pick a tone from the leaderboard and send it.",
    taunt_freeze_title: "Freeze",
    taunt_freeze_desc: "Target is locked out for 30 seconds. Can't validate anything.",
    taunt_ice_title: "Ice Block",
    taunt_ice_desc: "Grid covered in ice. Tap each block to melt it before playing.",
    taunt_tiny_title: "Tiny Target",
    taunt_tiny_desc: "Validation button shrinks and runs away. Catch it 3 times to unlock.",
    taunt_blob_title: "Blob",
    taunt_blob_desc: "A mystery splash covers the screen. Wipe it off to play.",

    // Validation Modal
    social_feat: "Witness Challenge",
    solo_feat: "Solo Challenge",
    i_did_it: "DONE IT!",
    find_witness: "GET A WITNESS",
    cool_down: "Skip",
    swap_challenge: "Swap",
    social_proof: "Witness",
    get_friend: "Pass your phone to someone. They sign, you score.",
    witness_name: "Witness",
    witness_placeholder: "Ex: The bartender",
    signature_area: "Sign here",
    validated: "Done!",

    // Rune Pad
    security_gate: "Master Code",
    security_desc: "Positions shuffle on every attempt.",

    // Scanner
    scan_entry: "SCAN",
    find_master: "FIND MASTER",
    find_poster: "Look for the poster near the entrance.",
    locate_person: "Find the one with the golden badge.",
    simulate_scan: "Simulate",
    verifying: "Checking...",
    camera_error: "Need camera access to scan.",

    // Badge UI
    status_active: "ACTIVE",
    show_master: "Show this to the Game Master",
    sensational: "NICE ONE!",

    // Badge Titles & Descriptions
    badge_title_FIRST_BLOOD: "First Blood",
    badge_desc_FIRST_BLOOD: "First challenge done tonight",
    badge_title_SPEED_DEMON: "Speed Demon",
    badge_desc_SPEED_DEMON: "5 challenges in under 30 min",
    badge_title_BIG_BRAIN: "Big Brain",
    badge_desc_BIG_BRAIN: "Used jokers strategically",
    badge_title_PARTY_ANIMAL: "Party Animal",
    badge_desc_PARTY_ANIMAL: "10 challenges done",
    badge_title_NIGHT_OWL: "Night Owl",
    badge_desc_NIGHT_OWL: "Still going after midnight",
    badge_title_EARLY_BIRD: "Early Bird",
    badge_desc_EARLY_BIRD: "First challenge before 10pm",
    badge_title_SOCIAL_BUTTERFLY: "Social Butterfly",
    badge_desc_SOCIAL_BUTTERFLY: "5 witness sign-offs",
    badge_title_PERFECTIONIST: "Perfectionist",
    badge_desc_PERFECTIONIST: "Full grid, zero jokers used",

    // Logo
    logo_top: "THE",
    logo_middle: "BINGO",
    logo_bottom: "CRAWL",
    logo_ribbon: "PLAY. DRINK. WIN.",

    // Leaderboard
    leaderboard_title: "TOP PLAYERS",
    active_players: "Playing now",
    rank: "Rank",
    player: "Player",
    time: "Time",
    jokers: "JOKERS",
    help: "RULES",
    you: "YOU",
    no_players: "No one yet. Be first!",

    // Locked Page
    closed: "Closed",
    closed_desc: "Not open yet. Hang tight.",
    waiting_master: "Waiting for Game Master",
    refresh_status: "Refresh",
    polishing_crowns: "Getting things ready...",
    brewing_potions: "Almost there...",
    summoning_players: "Gathering the crew...",
    securing_gates: "Setting up...",
    access_restricted: "Not yet!",
    glory_awaits: "Good things come to those who show up.",
    checking_signal: "Connecting...",
    scan_to_unlock: "Scan to enter",

    // Tutorial Steps
    tut_styles_text: "25 challenges. Some you do solo, some need a witness.",
    tut_rewards_text: "Finish a full line to claim a reward! 🎁",
    tut_grid_text: "Pick a challenge and get going! 🎯",
    tut_challenge_text: "WITNESS REQUIRED! Pass your phone to someone — they need to sign to validate this one.",
    tut_score_text: "Track your score here. Go for the full 25! 👑",

    // Session Start
    session_start_title: "Let's go!",
    session_start_subtitle: "Night's on. Go get it.",

    // Landscape
    rotate_device: "Flip your phone",
    rotate_desc: "Bingo Crawl runs in portrait mode. Rotate your phone to play.",

    // Network / Sync
    offline_mode: "Offline",
    syncing: "Syncing...",
    connected: "Back online",
    data_saved: "Saved locally",
    line_completed_msg: "LINE DONE!",
    grid_completed_msg: "FULL GRID!",
    players_tab: "PLAYERS",
    nations_tab: "NATIONS",
    monthly_nation_war: "NATION WAR",
    players_label: "PLAYERS",
    mission_report: "RECAP",
    create_new_session: "NEW SESSION",
    create_new_session_confirm: "This wipes ALL data and starts fresh. You sure?",
    create_new_session_btn: "START FRESH"
  },
  fr: {
    // General
    loading: "Chargement...",
    close: "Fermer",
    back: "Retour",
    validate: "Valider",
    confirm: "Confirmer",
    new_achievement: "NOUVEAU BADGE !",
    sensational_btn: "TROP BIEN !",
    certified_adventurer: "LÉGENDE CERTIFIÉE",
    achievements: "BADGES",
    active: "ACTIF",
    progress: "PROGRESSION",
    scan_witness: "SCAN TÉMOIN",
    scan: "SCAN",
    find_player_badge: "Trouve le badge d'un autre joueur",

    // Landing
    landing_title: "Le guide officiel",
    start_btn: "C'est parti",

    // Nickname / Avatar
    your_identity: "Tu t'appelles ?",
    your_card: "TA CARTE",
    player_name_label: "Ton prénom",
    placeholder_name: "Ex: Arthur",
    placeholder_name_input: "TON NOM",
    lets_go_btn: "C'EST PARTI",
    join_adventure: "Je rejoins",
    select_language: "Langue",
    gm_access: "Game Master",
    unlock: "Déverrouiller",
    master_access_title: "Accès Master",

    // Header & Navigation
    score: "Score",
    grid_view: "Grille",
    list_view: "Liste",
    zoom: "Zoom",
    reset: "Reset",
    tap_rules: "Règles",

    // Roles & Modes (Brand Names)
    mode_solo_title: "SOLO",
    mode_solo_desc: "TU L'AS FAIT, TU CLIQUES 👀",
    mode_social_title: "TÉMOIN",
    mode_social_desc: "UN POTE SIGNE SUR TON ÉCRAN",
    mode_master_title: "MASTER",
    mode_master_desc: "TROUVE LE GAME MASTER",

    // Game Master Dashboard
    leave: "Quitter",
    royal_seal: "QR Master",
    scan_instruction: "Les joueurs scannent ça pour valider les défis Master.",
    session_active: "Session en cours",
    manual_code_title: "Code manuel",
    master_control: "CONTRÔLE MASTER",
    open: "OUVERT",
    back_to_game: "RETOUR AU JEU",
    show_master_code_desc: "MONTRE CE CODE POUR VALIDER LES DÉFIS MASTER",
    reset_session: "RESET SESSION",
    reset_session_confirm: "T'es sûr ? Ça efface tous les joueurs et scores définitivement.",
    reset_session_btn: "OUI, TOUT EFFACER",
    cancel: "ANNULER",

    // Tutorial / Rewards
    tutorial_got_it: "OK C'EST BON",
    rewards_title: "LES RÉCOMPENSES",
    rewards_subtitle: "FAIS DES LIGNES. GAGNE DES TRUCS.",
    reward_row_1: "1 LIGNE COMPLÈTE",
    reward_row_1_desc: "1 SHOT OFFERT AU BAR 🥃",
    reward_row_2: "TOUTES LES 2 LIGNES",
    reward_row_2_desc: "1 CADEAU MYSTÈRE 🎁",
    reward_full_grid: "GRILLE COMPLÈTE",
    reward_full_grid_desc: "STATUT LÉGENDAIRE 👑",
    cheers_btn: "SANTÉ ! ON Y VA",
    disclaimer: "L'abus d'alcool est dangereux pour la santé.",

    // Legends / Rules
    code_title: "Comment ça marche",
    rules_title: "LES RÈGLES",
    chill_mode: "Solo",
    chill_desc: "Tu l'as fait, tu cliques. Pas de triche, le karma t'observe 👀",
    social_club: "Témoin",
    social_desc: "Passe ton tel à un pote. Il signe, ça compte.",
    big_boss: "Master",
    big_boss_desc: "Trouve le Game Master de la soirée pour le code.",
    not_in_game: "Pas encore dans la partie ?",
    scan_join: "Scanne et rejoins.",
    direct_access: "Lien direct",
    tap_close: "Touche pour fermer",
    share: "PARTAGER",
    invite_friends: "INVITE TES POTES",

    // Taunts / Tones
    taunts_section_title: "TAUNTS",
    taunts_section_desc: "2 taunts par session. Choisis un type dans le classement et envoie-le.",
    taunt_freeze_title: "Freeze",
    taunt_freeze_desc: "La cible est bloquée 30 secondes. Elle ne peut rien valider.",
    taunt_ice_title: "Ice Block",
    taunt_ice_desc: "La grille se couvre de glace. Il faut tapoter chaque bloc pour le faire fondre.",
    taunt_tiny_title: "Tiny Target",
    taunt_tiny_desc: "Le bouton de validation rétrécit et se sauve. Il faut l'attraper 3 fois.",
    taunt_blob_title: "Blob",
    taunt_blob_desc: "Une éclaboussure mystérieuse envahit l'écran. Il faut la frotter pour jouer.",

    // Validation Modal
    social_feat: "Défi Témoin",
    solo_feat: "Défi Solo",
    i_did_it: "C'EST FAIT !",
    find_witness: "TROUVER UN TÉMOIN",
    cool_down: "Passer",
    swap_challenge: "Changer",
    social_proof: "Témoin",
    get_friend: "Passe ton tel à quelqu'un. Il signe, tu scores.",
    witness_name: "Témoin",
    witness_placeholder: "Ex: Le barman",
    signature_area: "Signe ici",
    validated: "Validé !",

    // Rune Pad
    security_gate: "Code Master",
    security_desc: "Les positions changent à chaque tentative.",

    // Scanner
    scan_entry: "SCANNER",
    find_master: "TROUVER LE MASTER",
    find_poster: "Cherche l'affiche près de l'entrée.",
    locate_person: "Trouve la personne avec le badge doré.",
    simulate_scan: "Simuler",
    verifying: "Vérification...",
    camera_error: "Besoin de l'accès caméra pour scanner.",

    // Badge UI
    status_active: "ACTIF",
    show_master: "Montre ça au Game Master",
    sensational: "TROP FORT !",

    // Badge Titles & Descriptions
    badge_title_FIRST_BLOOD: "First Blood",
    badge_desc_FIRST_BLOOD: "Premier défi validé de la soirée",
    badge_title_SPEED_DEMON: "Speed Demon",
    badge_desc_SPEED_DEMON: "5 défis en moins de 30 min",
    badge_title_BIG_BRAIN: "Big Brain",
    badge_desc_BIG_BRAIN: "Jokers utilisés au bon moment",
    badge_title_PARTY_ANIMAL: "Party Animal",
    badge_desc_PARTY_ANIMAL: "10 défis validés",
    badge_title_NIGHT_OWL: "Night Owl",
    badge_desc_NIGHT_OWL: "Encore en jeu après minuit",
    badge_title_EARLY_BIRD: "Early Bird",
    badge_desc_EARLY_BIRD: "Premier défi avant 22h",
    badge_title_SOCIAL_BUTTERFLY: "Social Butterfly",
    badge_desc_SOCIAL_BUTTERFLY: "5 validations par témoin",
    badge_title_PERFECTIONIST: "Perfectionniste",
    badge_desc_PERFECTIONIST: "Grille complète sans joker",

    // Logo
    logo_top: "LE",
    logo_middle: "BINGO",
    logo_bottom: "CRAWL",
    logo_ribbon: "JOUE. BOIS. GAGNE.",

    // Leaderboard
    leaderboard_title: "TOP JOUEURS",
    active_players: "En jeu",
    rank: "Rang",
    player: "Joueur",
    time: "Temps",
    jokers: "JOKERS",
    help: "RÈGLES",
    you: "TOI",
    no_players: "Personne encore. Sois le premier !",

    // Locked Page
    closed: "Pas encore ouvert",
    closed_desc: "C'est pas encore lancé. Patience.",
    waiting_master: "Le Game Master arrive...",
    refresh_status: "Actualiser",
    polishing_crowns: "On prépare le terrain...",
    brewing_potions: "Presque prêt...",
    summoning_players: "On rassemble les joueurs...",
    securing_gates: "Mise en place en cours...",
    access_restricted: "Pas encore !",
    glory_awaits: "Les meilleurs moments arrivent à ceux qui se pointent.",
    checking_signal: "Connexion...",
    scan_to_unlock: "Scanner pour entrer",

    // Tutorial Steps
    tut_styles_text: "25 défis. Certains tu les fais seul, d'autres avec un témoin.",
    tut_rewards_text: "Complète une ligne entière pour gagner une récompense ! 🎁",
    tut_grid_text: "Choisis un défi et lance-toi ! 🎯",
    tut_challenge_text: "TÉMOIN OBLIGATOIRE ! Passe ton tel à quelqu'un — il doit signer pour valider ce défi.",
    tut_score_text: "Suis ton score ici. Vise les 25 ! 👑",

    // Session Start
    session_start_title: "C'est parti !",
    session_start_subtitle: "La soirée est lancée. Bonne chance.",

    // Landscape
    rotate_device: "Tourne ton téléphone",
    rotate_desc: "Bingo Crawl fonctionne en mode portrait. Retourne ton téléphone pour jouer.",

    // Network / Sync
    offline_mode: "Hors-ligne",
    syncing: "Sync en cours...",
    connected: "De retour en ligne",
    data_saved: "Sauvegardé localement",
    line_completed_msg: "LIGNE COMPLÈTE !",
    grid_completed_msg: "GRILLE COMPLÈTE !",
    players_tab: "JOUEURS",
    nations_tab: "NATIONS",
    monthly_nation_war: "GUERRE DES NATIONS",
    players_label: "JOUEURS",
    mission_report: "RÉCAP",
    create_new_session: "NOUVELLE SESSION",
    create_new_session_confirm: "Ça efface TOUT et repart de zéro. T'es sûr ?",
    create_new_session_btn: "REPARTIR À ZÉRO"
  }
};
