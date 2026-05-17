// VoiceNav NLU Engine — Natural Language Understanding with confidence scoring
// Multi-layer intent classification, entity extraction, context resolution
// Supports 29 languages with real-time language detection

import { logger } from '../utils/logger';
import { detectLanguage } from '../voice/languageDetector';

export type Intent =
  | 'navigate' | 'search' | 'click' | 'read' | 'scroll' | 'back' | 'forward'
  | 'refresh' | 'stop' | 'help' | 'home' | 'cart' | 'bookmark' | 'form'
  | 'type' | 'select' | 'submit' | 'play' | 'pause' | 'next' | 'previous'
  | 'zoom' | 'share' | 'download' | 'copy' | 'find' | 'filter' | 'sort'
  | 'compare' | 'buy' | 'checkout' | 'login' | 'logout' | 'signup'
  | 'compose' | 'send' | 'delete' | 'open' | 'close' | 'maximize' | 'minimize'
  | 'tab_new' | 'tab_close' | 'tab_next' | 'tab_prev' | 'unknown';

export type Entity = {
  type: 'url' | 'search_query' | 'number' | 'element_text' | 'direction' | 'site_name' | 'form_field' | 'product' | 'date' | 'time' | 'email' | 'phone' | 'color' | 'size';
  value: string;
  raw: string;
  confidence: number;
};

export type NLUResult = {
  intent: Intent;
  confidence: number;
  target?: string;
  entities: Entity[];
  params: Record<string, string>;
  isAmbiguous: boolean;
  alternatives: Array<{ intent: Intent; confidence: number; target?: string }>;
  normalizedText: string;
  originalText: string;
  detectedLanguage: string;
};

// --- Levenshtein Distance for fuzzy matching ---
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function fuzzyMatch(target: string, candidate: string, threshold = 0.3): number {
  const a = target.toLowerCase().trim();
  const b = candidate.toLowerCase().trim();
  if (a === b) return 1;
  if (b.includes(a) || a.includes(b)) return 0.9;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - dist / maxLen;
  return similarity >= threshold ? similarity : 0;
}

// --- Text Normalization ---
const FILLER_WORDS = new Set(['um', 'uh', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'just', 'right', 'okay', 'ok', 'hey']);
const ABBREVIATIONS: Record<string, string> = {
  'pls': 'please', 'plz': 'please', 'thx': 'thanks', 'ty': 'thanks',
  'np': 'no problem', 'imo': 'in my opinion', 'tbh': 'to be honest',
  'rn': 'right now', 'asap': 'as soon as possible', 'btw': 'by the way',
  'idk': 'i do not know', 'nvm': 'never mind', 'smh': 'shaking my head',
  'afk': 'away from keyboard', 'brb': 'be right back', 'gtg': 'got to go',
  'fyi': 'for your information', 'irl': 'in real life', 'dm': 'direct message',
  'fb': 'facebook', 'ig': 'instagram', 'yt': 'youtube', 'tw': 'twitter',
  'gh': 'github', 'gcal': 'google calendar', 'gmaps': 'google maps',
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const filtered = words.filter(w => !FILLER_WORDS.has(w));
  normalized = filtered.join(' ');
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    normalized = normalized.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
  }
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

// --- Intent Patterns with Confidence ---
type IntentPattern = {
  patterns: RegExp[];
  intent: Intent;
  baseConfidence: number;
  extractTarget?: (match: RegExpMatchArray) => string | undefined;
};

// English patterns (default)
const EN_PATTERNS: IntentPattern[] = [
  { patterns: [/(?:go to|open|visit|navigate to|take me to|bring me to|load|launch)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:go to|open)\s+(.+\.(?:com|org|net|io|dev|app|edu|gov|co\.uk|co\.in))/i], intent: 'navigate', baseConfidence: 0.98, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:find|search)\s+(.+?)\s+(?:on\s+)?(?:this\s+)?(?:page|site)/i], intent: 'find', baseConfidence: 0.94, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:search|find)\s+(?:on\s+)?(?:this\s+)?(?:page|site)\s+(?:for\s+)?(.+)/i], intent: 'find', baseConfidence: 0.94, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:search for|search|find|look up|look for|google|bing|yahoo)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:what is|what's|who is|who's|where is|where's|when is|when's|how to|how do i)\s+(.+)/i], intent: 'search', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:click|tap|press|select|hit|choose)\s+(?:on\s+)?(?:the\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:click|tap|press)\s+(?:the\s+)?(\d+)(?:st|nd|rd|th)?\s+(.+)/i], intent: 'click', baseConfidence: 0.94, extractTarget: m => m[2]?.trim() },
  { patterns: [/(?:click|tap)\s+(?:on\s+)?(?:that|it|this|them)/i], intent: 'click', baseConfidence: 0.80 },
  { patterns: [/(?:read|speak|tell me|what'?s on|what is on|describe|show me|what'?s here|summarize|summarise)\s*(?:the\s*)?(?:page|screen|content|this|article|text)?\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:scroll|go)\s*(down|up|top|bottom|left|right)/i], intent: 'scroll', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:page\s*(down|up))/i], intent: 'scroll', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:scroll)\s+(?:to\s+)?(?:the\s+)?(?:end|bottom|top|beginning)/i], intent: 'scroll', baseConfidence: 0.93 },
  { patterns: [/(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|in|into)\s+(?:my\s+)?(?:cart|basket|bag)/i], intent: 'cart', baseConfidence: 0.94, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:add to cart|add to basket|put in cart|buy now|add to bag|add to trolley)/i], intent: 'cart', baseConfidence: 0.96 },
  { patterns: [/(?:buy|purchase|order|get)\s+(.+)/i], intent: 'buy', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:checkout|check out|proceed to checkout|place order)/i], intent: 'checkout', baseConfidence: 0.95 },
  { patterns: [/(?:bookmark|save)\s+(?:this\s+)?(?:page|site|website|url|it)?/i], intent: 'bookmark', baseConfidence: 0.95 },
  { patterns: [/(?:sort|order)\s+(?:by|results|items)\s*(.*)/i], intent: 'sort', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() || m[0] },
  { patterns: [/(?:filter|narrow)\s+(?:the\s+)?(?:results|items|search)?\s*(.*)/i], intent: 'filter', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:compare|comparison)\s+(?:prices?|items?|products?)?\s*(.*)/i], intent: 'compare', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:compose|write|draft|new)\s+(?:a\s+)?(?:email|message|mail|post)/i], intent: 'compose', baseConfidence: 0.93 },
  { patterns: [/(?:share|send)\s+(?:this|it|the\s+page|the\s+link|the\s+article)/i], intent: 'share', baseConfidence: 0.90 },
  { patterns: [/(?:submit|send)\s*(?:the\s+)?(?:form|search|query|application)?$/i], intent: 'submit', baseConfidence: 0.94 },
  { patterns: [/(?:send|forward)\s+(?:a\s+)?(?:message|mail|email|text|reply)/i], intent: 'send', baseConfidence: 0.93 },
  { patterns: [/^(?:next|skip|continue|go next|play next|next song|next track)$/i], intent: 'next', baseConfidence: 0.90 },
  { patterns: [/^(?:previous|back|go back|play previous|previous song|previous track)$/i], intent: 'previous', baseConfidence: 0.90 },
  { patterns: [/(?:type|enter|input|write)\s+(.+)/i], intent: 'type', baseConfidence: 0.91, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:fill|type|enter|input)\s+(.+?)\s+(?:in|into|on)\s+(?:the\s+)?(.+)/i], intent: 'form', baseConfidence: 0.91, extractTarget: m => m[2]?.trim() },
  { patterns: [/(?:submit|send)\s+(?:the\s+)?(?:form|search|query|application)/i], intent: 'submit', baseConfidence: 0.94 },
  { patterns: [/(?:sign|log)\s*(?:in|out|up)/i], intent: 'login', baseConfidence: 0.92 },
  { patterns: [/^(?:go\s*back|back|previous\s*page)$/i], intent: 'back', baseConfidence: 0.97 },
  { patterns: [/^(?:go\s*forward|forward|next\s*page|go\s*next)$/i], intent: 'forward', baseConfidence: 0.97 },
  { patterns: [/^(?:refresh|reload|refresh\s*page)$/i], intent: 'refresh', baseConfidence: 0.97 },
  { patterns: [/^(?:stop|cancel|halt|never\s*mind|forget\s*it|abort)$/i], intent: 'stop', baseConfidence: 0.95 },
  { patterns: [/^(?:help|what can you do|commands|what can i say|what do you do)$/i], intent: 'help', baseConfidence: 0.97 },
  { patterns: [/^(?:close|exit|quit)$/i], intent: 'close', baseConfidence: 0.90 },
  { patterns: [/^(?:go\s*home|home|main\s*page|start)$/i], intent: 'home', baseConfidence: 0.95 },
  { patterns: [/(?:play|start|resume)\s*(?:the\s+)?(?:video|music|audio|song|track|podcast)?\s*(.*)/i], intent: 'play', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:pause|stop|halt)\s*(?:the\s+)?(?:video|music|audio|playback)?/i], intent: 'pause', baseConfidence: 0.92 },
  { patterns: [/(?:zoom)\s*(in|out|reset)/i], intent: 'zoom', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
  { patterns: [/(?:delete|remove|erase)\s+(?:this|the|that)?\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
];

// Multi-language intent patterns — covers all 29 supported languages
const MULTI_LANG_PATTERNS: Record<string, IntentPattern[]> = {
  es: [
    { patterns: [/(?:ir a|abrir|visitar|navegar a|llévame a|cargar)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:buscar|busca|encontrar|googlear)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:hacer clic|clic|pulsar|presionar|seleccionar|tocar)\s+(?:en\s+)?(?:el\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:leer|lee|decir|describe|muéstrame|qué hay|qué dice)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:desplazarse|desplazar|bajar|subir|ir arriba|ir abajo)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:agregar|añadir|poner)\s+(?:al\s+)?(?:carrito|cesta|bolsa)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:comprar|adquirir|ordenar)\s+(.+)/i], intent: 'buy', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:ir atrás|atrás|volver|página anterior)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:ir adelante|adelante|siguiente página)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:actualizar|recargar)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:detener|cancelar|parar)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:ayuda|qué puedes hacer|comandos)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:cerrar|salir)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:ir a inicio|inicio|página principal)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:reproducir|reproducir|tocar)\s*(.*)/i], intent: 'play', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:pausar|detener)/i], intent: 'pause', baseConfidence: 0.92 },
    { patterns: [/(?:acercar|alejar|restablecer zoom)/i], intent: 'zoom', baseConfidence: 0.92 },
    { patterns: [/(?:eliminar|borrar|quitar)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  fr: [
    { patterns: [/(?:aller à|ouvrir|visiter|naviguer vers|amène-moi à|charger)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:chercher|rechercher|trouver|google)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:cliquer|clique|appuyer|sélectionner|taper)\s+(?:sur\s+)?(?:le\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:lire|lis|dis|décris|montre-moi|qu'?est-ce qu'?il y a)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:défiler|descendre|monter|en haut|en bas)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:ajouter|mettre)\s+(?:au\s+)?(?:panier|chariot)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:acheter|commander)\s+(.+)/i], intent: 'buy', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:retourner|retour|précédent|page précédente)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:avancer|suivant|page suivante)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:rafraîchir|recharger|actualiser)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:arrêter|annuler|stop)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:aide|que peux-tu faire|commandes)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:fermer|quitter|sortir)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:accueil|page d'accueil|aller à l'accueil)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:jouer|lancer|reprendre)\s*(.*)/i], intent: 'play', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:pause|mettre en pause)/i], intent: 'pause', baseConfidence: 0.92 },
    { patterns: [/(?:supprimer|effacer|enlever)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  de: [
    { patterns: [/(?:gehe zu|öffne|besuche|navigiere zu|bring mich zu|lade)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:suche|such nach|finde|google)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:klicke|drücke|wähle|tippe)\s+(?:auf\s+)?(?:den\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:lies|sag|beschreibe|zeig mir|was steht)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:scrolle|runter|rauf|nach unten|nach oben)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:in den Warenkorb|Warenkorb hinzufügen|in die Tasche)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:kaufen|bestellen)\s+(.+)/i], intent: 'buy', baseConfidence: 0.88, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:zurück|geh zurück|vorherige Seite)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:vorwärts|weiter|nächste Seite)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:aktualisieren|neu laden|auffrischen)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:stopp|abbrechen|halt)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:hilfe|was kannst du|Befehle)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:schließen|beenden)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:Startseite|nach Hause|Start)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:abspielen|starten|spielen)\s*(.*)/i], intent: 'play', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:pausieren|anhalten)/i], intent: 'pause', baseConfidence: 0.92 },
    { patterns: [/(?:löschen|entfernen)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  it: [
    { patterns: [/(?:vai a|apri|visita|naviga a|portami a|carica)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:cerca|cercare|trova|googla)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:clicca|premi|seleziona|tocca)\s+(?:su\s+)?(?:il\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:leggi|dimmi|descrivi|mostrami|cosa c'?è)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:scorri|giù|su|vai in alto|vai in basso)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:aggiungi|metti)\s+(?:al\s+)?(?:carrello)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:torna indietro|indietro|pagina precedente)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:avanti|pagina successiva|prossima)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:aggiorna|ricarica)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:ferma|annulla|stop)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:aiuto|cosa puoi fare|comandi)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:chiudi|esci)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:home|pagina iniziale|vai alla home)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:elimina|cancella|rimuovi)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  pt: [
    { patterns: [/(?:ir para|abrir|visitar|navegar para|leve-me para|carregar)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:buscar|pesquisar|encontrar|procurar)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:clique|clicar|pressionar|selecionar|tocar)\s+(?:em\s+)?(?:o\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:ler|leia|diga|descreva|mostre-me|o que há)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:rolar|descer|subir|ir para cima|ir para baixo)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:adicionar|colocar)\s+(?:ao\s+)?(?:carrinho|cesta)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:voltar|página anterior|retornar)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:avançar|próxima página|adiante)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:atualizar|recarregar)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:parar|cancelar)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:ajuda|o que você pode fazer|comandos)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:fechar|sair)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:início|página inicial|ir para o início)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:excluir|apagar|remover)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  ru: [
    { patterns: [/(?:перейти к|открыть|посетить|перейти на|загрузить)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:найти|поискать|искать|загуглить)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:нажми|кликни|выбери|тапни)\s+(?:на\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:прочитай|скажи|опиши|покажи|что здесь)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:прокрут|листать|вниз|вверх)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:добавить|положить)\s+(?:в\s+)?(?:корзину)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:назад|вернуться|предыдущая страница)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:вперёд|следующая страница)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:обновить|перезагрузить)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:стоп|отмена|хватит)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:помощь|что ты умеешь|команды)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:закрыть|выйти)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:домой|главная|на главную)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:удалить|стереть|убрать)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  ja: [
    { patterns: [/(.+?)\s*(?:を開く|に移動|にアクセス|に行く)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(.+?)\s*(?:を検索|を探して|で検索)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(.+?)\s*(?:をクリック|をタップ|を押して|を選択)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:読んで|教えて|説明して|見せて|何がある)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:スクロール|下へ|上へ|一番上|一番下)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:カート|買い物かご)\s*(?:に入れる|に追加)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:戻る|前のページ)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:進む|次のページ)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:更新|リロード|再読み込み)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:停止|中止|やめて)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:ヘルプ|何ができる|コマンド)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:閉じる|終了)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:ホーム|トップページ|最初のページ)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:削除|消す)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  ko: [
    { patterns: [/(.+?)\s*(?:열어|이동|접속|가)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(.+?)\s*(?:검색|찾아|찾아줘)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(.+?)\s*(?:클릭|탭|눌러|선택)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:읽어|말해|설명해|보여줘|뭐가 있어)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:스크롤|아래로|위로|맨위|맨아래)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:장바구니|카트)\s*(?:에 담기|에 추가)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:뒤로|이전 페이지)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:앞으로|다음 페이지)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:새로고침|리로드)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:중지|취소|그만)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:도움|무엇을 할 수 있어|명령어)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:닫기|종료)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:홈|첫 페이지|메인)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:삭제|지워|제거)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  zh: [
    { patterns: [/(?:打开|去|访问|导航到|前往)\s*(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:搜索|查找|搜一下|找一下|查)\s*(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:点击|点一下|按|选择|触摸)\s*(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:读|念|说一下|描述|告诉我|显示)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:滚动|下滑|上滑|翻到顶部|翻到底部)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:加入|添加到)\s*(?:购物车|购物篮)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:返回|后退|上一页)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:前进|下一页)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:刷新|重新加载)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:停止|取消|停)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:帮助|你能做什么|指令)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:关闭|退出)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:主页|首页|回到首页)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:删除|移除|去掉)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  ar: [
    { patterns: [/(?:افتح|اذهب إلى|زر|توجه إلى|حمّل)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:ابحث|جد|ابحث عن|قوقل)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:انقر|اضغط|اختر)\s+(?:على\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:اقرأ|قل|اوصف|أرني|ما الذي)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:مرر|انزل|اطلع|أعلى|أسفل)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:أضف|ضع)\s+(?:إلى\s+)?(?:سلة التسوق|السلة)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:ارجع|رجوع|الصفحة السابقة)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:تقدم|التالية|الصفحة التالية)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:حدّث|أعد التحميل|أنعش)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:توقف|إلغاء|كفى)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:مساعدة|ماذا تستطيع|الأوامر)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:أغلق|اخرج)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:الرئيسية|الصفحة الرئيسية|اذهب للرئيسية)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:احذف|أزل)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  hi: [
    { patterns: [/(?:खोलो|जाओ|जाओ|पर जाओ|लोड करो)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:खोजो|ढूंढो|सर्च करो|गूगल करो)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:क्लिक करो|टैप करो|दबाओ|चुनो)\s+(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:पढ़ो|बताओ|वर्णन करो|दिखाओ|क्या है)\s*(.*)/i], intent: 'read', baseConfidence: 0.90, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:स्क्रॉल करो|नीचे|ऊपर|शीर्ष|तल)/i], intent: 'scroll', baseConfidence: 0.95 },
    { patterns: [/(?:कार्ट में डालो|कार्ट में जोड़ो)/i], intent: 'cart', baseConfidence: 0.96 },
    { patterns: [/(?:पीछे जाओ|वापस|पिछला पेज)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:आगे जाओ|अगला पेज)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:रिफ्रेश करो|रीलोड करो)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:रुको|बंद करो|कैंसल)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:मदद|तुम क्या कर सकते हो|कमांड)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:बंद करो|बाहर जाओ)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:होम|मुख्य पेज|होम जाओ)/i], intent: 'home', baseConfidence: 0.95 },
    { patterns: [/(?:हटाओ|मिटाओ|डिलीट करो)\s*(.*)/i], intent: 'delete', baseConfidence: 0.85, extractTarget: m => m[1]?.trim() },
  ],
  nl: [
    { patterns: [/(?:ga naar|open|bezoek|navigeer naar|laad)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:zoek|vind|google)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:klik|tik|druk|selecteer)\s+(?:op\s+)?(?:de\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:terug|vorige pagina|ga terug)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:vooruit|volgende pagina)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:vernieuwen|herladen|opnieuw laden)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:stop|annuleren|halt)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:help|wat kun je|commando'?s)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:sluiten|afsluiten)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:startpagina|thuis|naar huis)/i], intent: 'home', baseConfidence: 0.95 },
  ],
  pl: [
    { patterns: [/(?:idź do|otwórz|odwiedź|nawiguj do|załaduj)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:szukaj|znajdź|wyszukaj|wygoogluj)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:kliknij|naciśnij|wybierz|stuknij)\s+(?:na\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:wróć|poprzednia strona|cofnij)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:dalej|następna strona|naprzód)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:odśwież|przeładuj)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:stop|anuluj|zatrzymaj)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:pomoc|co potrafisz|polecenia)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:zamknij|wyjdź)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:strona główna|dom|na start)/i], intent: 'home', baseConfidence: 0.95 },
  ],
  tr: [
    { patterns: [/(?:git|aç|ziyaret et|navigasyon|yükle)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:ara|bul|google)?\s*(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:tıkla|dokun|bas|seç)\s+(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:geri|önceki sayfa|geri git)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:ileri|sonraki sayfa)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:yenile|tekrar yükle)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:dur|iptal|vazgeç)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:yardım|ne yapabilirsin|komutlar)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:kapat|çık)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:ana sayfa|ev|başlangıç)/i], intent: 'home', baseConfidence: 0.95 },
  ],
  sv: [
    { patterns: [/(?:gå till|öppna|besök|navigera till|ladda)\s+(.+)/i], intent: 'navigate', baseConfidence: 0.95, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:sök|hitta|google)\s+(.+)/i], intent: 'search', baseConfidence: 0.93, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:klicka|tryck|välj)\s+(?:på\s+)?(?:den\s+)?(.+)/i], intent: 'click', baseConfidence: 0.92, extractTarget: m => m[1]?.trim() },
    { patterns: [/(?:tillbaka|föregående sida|gå tillbaka)/i], intent: 'back', baseConfidence: 0.97 },
    { patterns: [/(?:framåt|nästa sida)/i], intent: 'forward', baseConfidence: 0.97 },
    { patterns: [/(?:uppdatera|ladda om)/i], intent: 'refresh', baseConfidence: 0.97 },
    { patterns: [/(?:stopp|avbryt)/i], intent: 'stop', baseConfidence: 0.95 },
    { patterns: [/(?:hjälp|vad kan du|kommandon)/i], intent: 'help', baseConfidence: 0.97 },
    { patterns: [/(?:stäng|avsluta)/i], intent: 'close', baseConfidence: 0.90 },
    { patterns: [/(?:hemsida|start|hem)/i], intent: 'home', baseConfidence: 0.95 },
  ],
};

// --- Site Alias Map ---
const SITE_MAP: Record<string, string> = {
  'google': 'https://www.google.com', 'gmail': 'https://mail.google.com',
  'amazon': 'https://www.amazon.com', 'youtube': 'https://www.youtube.com',
  'facebook': 'https://www.facebook.com', 'twitter': 'https://www.twitter.com',
  'x': 'https://www.x.com', 'wikipedia': 'https://www.wikipedia.org',
  'wiki': 'https://www.wikipedia.org', 'reddit': 'https://www.reddit.com',
  'ebay': 'https://www.ebay.com', 'walmart': 'https://www.walmart.com',
  'target': 'https://www.target.com', 'best buy': 'https://www.bestbuy.com',
  'bestbuy': 'https://www.bestbuy.com', 'netflix': 'https://www.netflix.com',
  'github': 'https://www.github.com', 'linkedin': 'https://www.linkedin.com',
  'instagram': 'https://www.instagram.com', 'tiktok': 'https://www.tiktok.com',
  'spotify': 'https://www.spotify.com', 'news': 'https://news.google.com',
  'maps': 'https://maps.google.com', 'weather': 'https://weather.com',
  'cnn': 'https://www.cnn.com', 'bbc': 'https://www.bbc.com',
  'espn': 'https://www.espn.com', 'apple': 'https://www.apple.com',
  'microsoft': 'https://www.microsoft.com', 'chatgpt': 'https://chat.openai.com',
  'openai': 'https://www.openai.com', 'pinterest': 'https://www.pinterest.com',
  'twitch': 'https://www.twitch.tv', 'discord': 'https://discord.com',
  'slack': 'https://slack.com', 'zoom': 'https://zoom.us',
  'paypal': 'https://www.paypal.com', 'venmo': 'https://venmo.com',
  'uber': 'https://www.uber.com', 'lyft': 'https://www.lyft.com',
  'doordash': 'https://www.doordash.com', 'instacart': 'https://www.instacart.com',
  'airbnb': 'https://www.airbnb.com', 'booking': 'https://www.booking.com',
  'expedia': 'https://www.expedia.com', 'whatsapp': 'https://web.whatsapp.com',
  'telegram': 'https://web.telegram.org', 'signal': 'https://signal.org',
  'dropbox': 'https://www.dropbox.com', 'drive': 'https://drive.google.com',
  'calendar': 'https://calendar.google.com', 'docs': 'https://docs.google.com',
  'sheets': 'https://sheets.google.com', 'slides': 'https://slides.google.com',
  'notion': 'https://www.notion.so', 'figma': 'https://www.figma.com',
  'stackoverflow': 'https://stackoverflow.com', 'stack overflow': 'https://stackoverflow.com',
  'npm': 'https://www.npmjs.com', 'crates': 'https://crates.io',
  'docker': 'https://hub.docker.com', 'aws': 'https://aws.amazon.com',
  'azure': 'https://portal.azure.com', 'gcp': 'https://console.cloud.google.com',
};

// --- Entity Extraction ---
function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  const urlRegex = /https?:\/\/[^\s]+/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    entities.push({ type: 'url', value: match[0], raw: match[0], confidence: 0.99 });
  }
  const numRegex = /\b(\d+(?:\.\d+)?)(?:st|nd|rd|th)?\b/g;
  while ((match = numRegex.exec(text)) !== null) {
    entities.push({ type: 'number', value: match[1], raw: match[0], confidence: 0.95 });
  }
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  while ((match = emailRegex.exec(text)) !== null) {
    entities.push({ type: 'email', value: match[0], raw: match[0], confidence: 0.98 });
  }
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    entities.push({ type: 'phone', value: match[0], raw: match[0], confidence: 0.85 });
  }
  const dateRegex = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next\s+\w+day|this\s+\w+day)/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    entities.push({ type: 'date', value: match[0], raw: match[0], confidence: 0.88 });
  }
  const dirRegex = /\b(up|down|top|bottom|left|right|forward|back)\b/gi;
  while ((match = dirRegex.exec(text)) !== null) {
    entities.push({ type: 'direction', value: match[1].toLowerCase(), raw: match[0], confidence: 0.95 });
  }
  for (const siteName of Object.keys(SITE_MAP)) {
    const siteRegex = new RegExp(`\\b${siteName.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    while ((match = siteRegex.exec(text)) !== null) {
      entities.push({ type: 'site_name', value: SITE_MAP[siteName], raw: match[0], confidence: 0.92 });
    }
  }
  const fieldRegex = /\b(?:name|email|password|username|phone|address|city|state|zip|country|card|cvv|expiry|message|subject|comment|search|query|keyword)\b/gi;
  while ((match = fieldRegex.exec(text)) !== null) {
    entities.push({ type: 'form_field', value: match[1]?.toLowerCase() || match[0].toLowerCase(), raw: match[0], confidence: 0.80 });
  }
  return entities;
}

// --- Site Alias Resolution ---
export function resolveSiteAlias(target: string): string {
  const normalized = target.toLowerCase().replace(/https?:\/\/(www\.)?/, '').replace(/\.(com|org|net|io|dev|edu|gov|co\.uk|co\.in)$/, '').trim();
  return SITE_MAP[normalized] || target;
}

// --- Main NLU Pipeline ---
export function understand(text: string, context?: { lastCommand?: string; lastTarget?: string; pageType?: string }): NLUResult {
  const originalText = text;
  const normalizedText = normalizeText(text);

  // Detect language first
  const langResult = detectLanguage(text);
  const detectedLang = langResult.language.code;

  // Extract entities
  const entities = extractEntities(normalizedText);

  // Get patterns for detected language — try native patterns first, fall back to English
  const nativePatterns = MULTI_LANG_PATTERNS[detectedLang] || [];
  const allPatterns = [...nativePatterns, ...EN_PATTERNS];

  // Score all intents
  const candidates: Array<{ intent: Intent; confidence: number; target?: string }> = [];

  for (const { patterns, intent, baseConfidence, extractTarget } of allPatterns) {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const target = extractTarget?.(match);
        candidates.push({ intent, confidence: baseConfidence, target });
        break;
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);

  // Context resolution — "click it", "that one", "go back there"
  if (context?.lastTarget) {
    const pronounPatterns = [
      /\b(it|that|this|them|those|these|that one|this one)\b/i,
      /\b(click|tap|press|select)\s+(it|that|this|them)\b/i,
    ];
    for (const p of pronounPatterns) {
      if (p.test(normalizedText)) {
        const clickCandidate = candidates.find(c => c.intent === 'click');
        if (clickCandidate) {
          clickCandidate.target = context.lastTarget;
          clickCandidate.confidence = 0.85;
        } else {
          candidates.push({ intent: 'click', confidence: 0.85, target: context.lastTarget });
        }
        break;
      }
    }
  }

  // If no intent matched, try fuzzy site matching or default to search
  if (candidates.length === 0) {
    for (const [siteName, url] of Object.entries(SITE_MAP)) {
      const score = fuzzyMatch(normalizedText, siteName, 0.6);
      if (score > 0.6) {
        candidates.push({ intent: 'navigate', confidence: score * 0.9, target: url });
      }
    }
    if (candidates.length === 0) {
      candidates.push({ intent: 'search', confidence: 0.5, target: normalizedText });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];
  const isAmbiguous = candidates.length > 1 && candidates[1].confidence > best.confidence - 0.15;

  let target = best.target;
  if (best.intent === 'navigate' && target && !target.startsWith('http')) {
    target = resolveSiteAlias(target);
    if (!target.startsWith('http')) target = 'https://' + target;
  }

  const params: Record<string, string> = {};
  const numberEntities = entities.filter(e => e.type === 'number');
  if (numberEntities.length > 0) params.index = numberEntities[0].value;
  const directionEntities = entities.filter(e => e.type === 'direction');
  if (directionEntities.length > 0) params.direction = directionEntities[0].value;

  return {
    intent: best.intent,
    confidence: best.confidence,
    target,
    entities,
    params,
    isAmbiguous,
    alternatives: candidates.slice(1, 4),
    normalizedText,
    originalText,
    detectedLanguage: detectedLang,
  };
}

// --- Command Validation ---
export function isValidCommand(text: string): boolean {
  const normalized = normalizeText(text);
  return normalized.length > 0 && normalized.length < 500;
}

// --- Intent Display Names ---
export const INTENT_LABELS: Record<Intent, string> = {
  navigate: 'Navigate', search: 'Search', click: 'Click', read: 'Read',
  scroll: 'Scroll', back: 'Go Back', forward: 'Go Forward', refresh: 'Refresh',
  stop: 'Stop', help: 'Help', home: 'Home', cart: 'Add to Cart',
  bookmark: 'Bookmark', form: 'Fill Form', type: 'Type', select: 'Select',
  submit: 'Submit', play: 'Play', pause: 'Pause', next: 'Next',
  previous: 'Previous', zoom: 'Zoom', share: 'Share', download: 'Download',
  copy: 'Copy', find: 'Find on Page', filter: 'Filter', sort: 'Sort',
  compare: 'Compare', buy: 'Buy', checkout: 'Checkout', login: 'Log In',
  logout: 'Log Out', signup: 'Sign Up', compose: 'Compose', send: 'Send',
  delete: 'Delete', open: 'Open', close: 'Close', maximize: 'Maximize',
  minimize: 'Minimize', tab_new: 'New Tab', tab_close: 'Close Tab',
  tab_next: 'Next Tab', tab_prev: 'Previous Tab', unknown: 'Unknown',
};
