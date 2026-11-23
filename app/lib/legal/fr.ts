/**
 * French legal prose.
 *
 * This module is content, not an interface label: the legal documents are
 * published in French only, and the English routes render the same text with a
 * translated notice. The i18n catalogs keep the navigation, the date label and
 * the notice; they never contain this prose.
 *
 * Every factual sentence is backed by a document in `docs/` or a code path,
 * as recorded in `docs/decisions/0004-s6-legal.md` of the API repository.
 */

export type LegalSlug =
  | 'notice'
  | 'terms'
  | 'aup'
  | 'privacy'
  | 'subcontractors'
  | 'client-clause'

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  updatedAt: string
  sections: LegalSection[]
}

/** ISO date, formatted by the page in the active locale. */
export const LEGAL_UPDATED_AT = '2026-11-23'

export const LEGAL_DOCUMENTS: Record<LegalSlug, LegalDocument> = {
  notice: {
    title: 'Mentions légales',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Éditeur du site',
        paragraphs: [
          'Le site url.infinityproject.fr et le service Infinity URL sont édités par InfinityApp, entrepreneur individuel (micro-entreprise).',
          'SIREN : 934 964 255. SIRET : 934 964 255 00012. RNE : 934 964 255. RCS : 934 964 255 R.C.S. Paris, inscrit le 7 novembre 2024.',
          'Adresse : 8 B rue Abel, 75012 Paris.',
          'Contact : the.fortytwo_dev@proton.me.',
          'Directeur de la publication : InfinityApp.',
        ],
      },
      {
        heading: 'Marque',
        paragraphs: [
          '« Infinity Project » est la marque publique de la maison. « Infinity URL » est le nom du produit. La partie contractante est InfinityApp.',
        ],
      },
      {
        heading: 'Hébergement',
        paragraphs: [
          'Le service est hébergé par OVH SAS, 2 rue Kellermann, 59100 Roubaix, France. Téléphone : 1007, ou +33 9 72 10 10 07 depuis l’étranger.',
        ],
      },
      {
        heading: 'Nature du service',
        paragraphs: [
          'Infinity URL raccourcit des URL et redirige les visiteurs vers la destination choisie par le créateur du lien. Le domaine iurl.fr ne sert que des redirections et des pages d’erreur statiques : il ne dépose aucun cookie, ne charge aucun script tiers et ne sert aucune page marketing.',
          'Le dashboard et les pages publiques sont sur url.infinityproject.fr. L’API est sur api.url.infinityproject.fr.',
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        paragraphs: [
          'Le code source est publié sous licence AGPL-3.0-only. Le lien « Code source » du pied de page mène au dépôt. Le nom, l’identité visuelle et les textes restent la propriété de l’éditeur, sauf mention contraire.',
        ],
      },
      {
        heading: 'Données personnelles et cookies',
        paragraphs: [
          'La politique de confidentialité détaille les traitements, les bases légales, les durées de conservation et les droits.',
          'Aucun cookie n’est déposé sur iurl.fr. Le site mémorise seulement votre préférence d’affichage (clair ou sombre) dans le stockage local de votre navigateur ; cette valeur n’est jamais transmise et ne permet pas de vous identifier.',
        ],
      },
      {
        heading: 'Signalement',
        paragraphs: [
          'Pour signaler un lien : la page /report ou l’adresse abuse@iurl.fr. La procédure est décrite sur la page /abuse.',
        ],
      },
      {
        heading: 'Responsabilité',
        paragraphs: [
          'L’éditeur ne contrôle pas les contenus vers lesquels les liens redirigent. Le service est fourni sans garantie de disponibilité ; les conditions générales précisent les limites de responsabilité.',
        ],
      },
    ],
  },

  terms: {
    title: 'Conditions générales d’utilisation',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Objet',
        paragraphs: [
          'Les présentes conditions régissent l’utilisation du service Infinity URL, accessible sur url.infinityproject.fr. Le service permet de créer des liens courts sur iurl.fr, de consulter des statistiques agrégées et de générer un QR code dans le navigateur.',
          'Le service est gratuit en v0.1. Aucune offre payante n’est proposée et aucun engagement de niveau de service (SLA) n’est souscrit.',
        ],
      },
      {
        heading: 'Compte',
        paragraphs: [
          'La création d’un lien exige un compte et une adresse email vérifiée. Les inscriptions peuvent être fermées à tout moment.',
          'Un espace de travail est créé par utilisateur. Les équipes, les rôles et les invitations ne sont pas disponibles en v0.1.',
          'Vous êtes responsable de la confidentialité de votre mot de passe, de vos codes de récupération et de vos jetons API. L’authentification à deux facteurs TOTP est disponible.',
        ],
      },
      {
        heading: 'Liens et quota',
        paragraphs: [
          'Le quota est de cinq liens actifs par espace de travail. Un lien supprimé libère sa place.',
          'Les domaines personnalisés ne sont pas disponibles en v0.1. Tous les liens vivent sur iurl.fr.',
          'Un lien peut expirer. Un lien supprimé ou expiré répond 410 ; un slug supprimé n’est jamais réattribué.',
          'Les slugs sont en minuscules et certains slugs sont réservés.',
        ],
      },
      {
        heading: 'Usage acceptable',
        paragraphs: [
          'L’utilisation du service est soumise à la politique d’usage acceptable (/legal/aup). Le propriétaire du lien est responsable de sa destination.',
        ],
      },
      {
        heading: 'Disponibilité',
        paragraphs: [
          'Le service est fourni en l’état, sans engagement de disponibilité, de performance ou de support. Il peut être interrompu pour maintenance ou en cas d’incident.',
          'Aucun SLA n’est proposé en v0.1.',
        ],
      },
      {
        heading: 'Modération, blocage et suspension',
        paragraphs: [
          'Un signalement est qualifié par un humain sous 48 heures. Un lien malveillant peut être bloqué et répondre 403 ; le compte peut être suspendu. La suspension bloque la création de liens, mais laisse l’accès au compte, l’export des données et les jetons.',
          'La décision est motivée. Vous pouvez la contester à abuse@iurl.fr.',
          'Aucun signalement ne bloque automatiquement un lien.',
        ],
      },
      {
        heading: 'Responsabilité',
        paragraphs: [
          'L’éditeur ne garantit pas que la destination d’un lien est sûre, licite ou disponible. Il ne contrôle pas les contenus tiers.',
          'Dans les limites permises par la loi, la responsabilité de l’éditeur ne peut être engagée qu’en cas de faute prouvée et pour les dommages directs et prévisibles causés par l’exécution du service. Cette limitation ne couvre pas les sanctions réglementaires.',
        ],
      },
      {
        heading: 'Données personnelles',
        paragraphs: [
          'La politique de confidentialité (/legal/privacy) décrit les traitements. Vous pouvez exporter vos données depuis le dashboard et supprimer votre compte. La suppression est logique pendant 30 jours, puis physique.',
        ],
      },
      {
        heading: 'Résiliation',
        paragraphs: [
          'Vous pouvez supprimer votre compte à tout moment. La suppression révoque les jetons et libère l’adresse email après 30 jours. Les liens sont supprimés et leurs slugs restent en tombstone.',
          'L’éditeur peut suspendre un compte en cas d’usage interdit, sans supprimer les données nécessaires à l’export.',
        ],
      },
      {
        heading: 'Propriété intellectuelle et licence',
        paragraphs: [
          'Le code est publié sous licence AGPL-3.0-only. Le nom et l’identité visuelle ne sont pas couverts par cette licence.',
        ],
      },
      {
        heading: 'Droit applicable',
        paragraphs: [
          'Les présentes conditions sont soumises au droit français. Les tribunaux compétents sont ceux de Paris, sous réserve des règles impératives applicables.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Questions générales : the.fortytwo_dev@proton.me. Signalements : abuse@iurl.fr.',
        ],
      },
    ],
  },

  aup: {
    title: 'Politique d’usage acceptable',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Champ d’application',
        paragraphs: [
          'Cette politique s’applique à tous les liens créés avec Infinity URL et à tous les comptes. Elle complète les conditions générales d’utilisation.',
        ],
      },
      {
        heading: 'Usages interdits',
        paragraphs: [
          'Il est interdit de créer un lien vers un contenu illicite, un site d’hameçonnage ou de phishing, un logiciel malveillant, un contenu frauduleux, une usurpation d’identité ou de marque, du spam, ou un contenu qui contourne une mesure de blocage.',
          'Il est interdit d’utiliser le service pour masquer la destination réelle d’un lien ou pour tromper un utilisateur sur la destination.',
          'Le propriétaire du lien est responsable de la destination et de la conformité du lien.',
        ],
      },
      {
        heading: 'Vérification de destination',
        paragraphs: [
          'À la création d’un lien, nous pouvons envoyer une requête HEAD, puis un GET partiel, à l’adresse fournie. Nous résolvons le DNS, refusons les adresses privées, consultons des blocklists locales, le domaine enregistrable via RDAP, le certificat TLS et les redirections.',
          'Le site cible voit notre adresse IP, l’URL testée et l’en-tête InfinityURL-AbuseCheck/1.0 ; les redirections suivies reçoivent la requête. RDAP ne reçoit que le domaine enregistrable.',
          'Un timeout ou un échec DNS n’est pas une preuve de danger : le lien peut être accepté. La vérification n’est pas une garantie de sûreté.',
          'La vérification a lieu à la création. Une page propre au moment de la création peut devenir malveillante ensuite.',
        ],
      },
      {
        heading: 'Signalement et retrait',
        paragraphs: [
          'Signalez un lien via la page /report ou l’adresse abuse@iurl.fr. Le formulaire ne demande aucun compte, aucun cookie et ne conserve aucune adresse IP. La réponse est toujours 202, que le lien existe ou non.',
          'Un humain qualifie le signalement sous 48 heures. Aucun lien n’est bloqué automatiquement.',
          'Si le lien est malveillant, il passe en 403 avec une page d’explication ; le compte peut être suspendu. La décision est motivée et peut être contestée à abuse@iurl.fr.',
        ],
      },
      {
        heading: 'Quota et comptes',
        paragraphs: [
          'Cinq liens actifs par espace de travail. L’adresse email doit être vérifiée avant le premier lien. Les inscriptions peuvent être fermées sans préavis.',
          'Un compte suspendu ne peut plus créer de liens, mais conserve l’accès, l’export des données et les jetons.',
        ],
      },
      {
        heading: 'Sanctions',
        paragraphs: [
          'Un lien peut être bloqué ; un compte peut être suspendu. Les statistiques du lien bloqué sont conservées pour la traçabilité. Les données nécessaires à l’export restent accessibles.',
        ],
      },
      {
        heading: 'DSA',
        paragraphs: [
          'Infinity URL est un service d’hébergement au sens du Digital Services Act. Nous disposons d’un point de contact, d’un mécanisme de notification et d’action, et nous motivons les restrictions. Nous ne sommes pas soumis à une obligation générale de surveillance.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Signalements : abuse@iurl.fr ou la page /report. Questions générales : the.fortytwo_dev@proton.me.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Politique de confidentialité',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Qui est responsable ?',
        paragraphs: [
          'InfinityApp, entrepreneur individuel, 8 B rue Abel, 75012 Paris, est responsable des traitements nécessaires au compte, aux journaux de sécurité et à l’anti-abus.',
          'Pour la mesure d’audience des liens, le client qui a créé le lien est responsable ; InfinityApp agit comme sous-traitant. L’accord de sous-traitance est disponible sur demande.',
        ],
      },
      {
        heading: 'Redirection d’un lien',
        paragraphs: [
          'Lorsqu’un visiteur ouvre un lien iurl.fr, nous recevons son adresse IP, le slug et son user-agent. L’adresse IP et le user-agent sont utilisés en mémoire pour fournir la redirection et classer l’appareil, puis jetés. Aucune adresse IP n’est écrite en base, aucun cookie n’est déposé et aucune ligne par clic n’existe.',
          'Base légale : exécution du contrat avec le client.',
        ],
      },
      {
        heading: 'Mesure d’audience',
        paragraphs: [
          'Nous conservons un compteur de clics, une classe d’appareil (mobile, tablette ou ordinateur) et une date. Pour compter les visiteurs uniques, l’adresse IP est transformée en deux empreintes HMAC avec un sel secret : une journalière et une hebdomadaire. La clé contient l’identifiant interne du lien, jamais le slug, l’email ou le nom du client.',
          'Le pays n’est pas traité en v0.1. Aucun referer, aucun parcours, aucune page vue et aucun profil visiteur ne sont enregistrés.',
          'Base légale : intérêt légitime du client, documenté par l’analyse d’intérêt légitime fournie aux clients.',
        ],
      },
      {
        heading: 'Comptes',
        paragraphs: [
          'L’adresse email est chiffrée au repos, avec un index aveugle pour garantir l’unicité. Le mot de passe est haché en Argon2id. Le secret TOTP est chiffré. Les codes de récupération, les jetons API et les jetons de rafraîchissement sont hachés.',
          'Base légale : exécution du contrat.',
        ],
      },
      {
        heading: 'Emails transactionnels',
        paragraphs: [
          'Nous envoyons uniquement des emails transactionnels : vérification de l’adresse, réinitialisation du mot de passe et notification de blocage d’un lien. Aucune image et aucun pixel ne sont inclus.',
          'L’expéditeur est noreply@infinityproject.fr et l’adresse de réponse est contact@infinityproject.fr. Les messages sont envoyés par OVH MX Plan.',
          'Base légale : exécution du contrat ; obligation légale de motivation pour la notification de blocage.',
        ],
      },
      {
        heading: 'Signalements',
        paragraphs: [
          'Un signalement contient le slug signalé, la catégorie, un texte libre et, si vous le souhaitez, une adresse email. L’adresse email est facultative et chiffrée au repos.',
          'Nous ne stockons ni votre adresse IP, ni votre user-agent, ni votre referer, ni une empreinte de rate limiting dans le signalement. Le rate limiting utilise une empreinte HMAC du sel analytique, avec le contexte report, qui vit une heure et n’est pas enregistrée.',
          'Un signalement est conservé 12 mois ; 90 jours s’il est rejeté.',
          'Base légale : intérêt légitime (anti-abus).',
        ],
      },
      {
        heading: 'Vérification de destination',
        paragraphs: [
          'À la création d’un lien, nous envoyons une requête HEAD, puis un GET partiel, à la destination fournie, avec l’en-tête InfinityURL-AbuseCheck/1.0. Le site cible voit notre adresse IP, l’URL testée et les redirections suivies.',
          'Nous consultons le DNS, les blocklists locales, le certificat TLS et RDAP. RDAP ne reçoit que le domaine enregistrable, jamais l’URL complète. Aucune URL client n’est envoyée à un service de réputation.',
          'En cas d’échec technique du contrôle, l’adresse testée peut apparaître dans les journaux applicatifs, conservés 72 heures.',
          'Base légale : intérêt légitime (anti-abus).',
        ],
      },
      {
        heading: 'Journaux techniques',
        paragraphs: [
          'Les journaux d’accès de l’hébergeur contiennent l’adresse IP, la date, la méthode, l’URI sans query string et le statut, pendant 72 heures. L’application n’écrit jamais l’adresse IP dans ses propres journaux.',
          'Base légale : intérêt légitime (sécurité et diagnostic).',
        ],
      },
      {
        heading: 'Sauvegardes',
        paragraphs: [
          'Un dump quotidien chiffré est tiré sur la machine de l’exploitant, conservé 30 jours, avec un objectif de point de reprise de 24 heures. Aucun stockage objet n’est utilisé en v0.1.',
          'Base légale : intérêt légitime (continuité du service) et exécution du contrat.',
        ],
      },
      {
        heading: 'Destinataires et sous-traitants',
        paragraphs: [
          'OVH héberge le service en France. OVH MX Plan envoie les emails transactionnels depuis la France. URLhaus / abuse.ch fournit un dump public de blocklist, téléchargé une fois par jour ; aucune donnée client ne lui est envoyée et la Suisse bénéficie d’une décision d’adéquation. Prometheus, Grafana et ntfy sont auto-hébergés sur le même serveur, en UE ; ils reçoivent des métriques agrégées et des alertes internes avec la référence, le slug et la catégorie d’un signalement, jamais le texte, l’email ni l’adresse du rapporteur.',
          'Le site cible et le service RDAP sont des destinataires du contrôle de destination, pas des sous-traitants. La liste complète est sur la page /legal/subcontractors.',
        ],
      },
      {
        heading: 'Transferts',
        paragraphs: [
          'Aucune donnée de navigation ne quitte l’Union européenne sur le chemin des clics. URLhaus / abuse.ch est en Suisse, couverte par une décision d’adéquation.',
          'Le site cible et le service RDAP peuvent être hors UE ; ils reçoivent la requête de contrôle, pas les données d’un visiteur.',
        ],
      },
      {
        heading: 'Cookies et stockage local',
        paragraphs: [
          'Aucun cookie n’est déposé sur iurl.fr. Aucun script tiers, aucun pixel et aucun outil de mesure d’audience ne sont chargés.',
          'Le site mémorise votre préférence d’affichage (clair ou sombre) dans le stockage local de votre navigateur, sous la clé iurl:theme. Cette valeur n’est jamais transmise et ne permet pas de vous identifier. Vous pouvez l’effacer dans les réglages de votre navigateur.',
        ],
      },
      {
        heading: 'Durées de conservation',
        paragraphs: [
          'Empreinte de déduplication : jusqu’à la rotation du sel, au plus 7 jours. Agrégats : 30 jours. Journaux techniques : 72 heures. Emails transactionnels : durée d’envoi, puis 30 jours chez le fournisseur. Comptes : durée du compte, puis 30 jours de grâce. Signalements : 12 mois, 90 jours si rejetés. Sauvegardes : 30 jours. Empreinte de rate limiting des signalements : 1 heure.',
        ],
      },
      {
        heading: 'Vos droits',
        paragraphs: [
          'Vous disposez des droits d’accès, de rectification, d’effacement, de portabilité et d’opposition. L’export JSON est disponible depuis le dashboard. La suppression du compte ouvre un délai de 30 jours ; une connexion pendant ce délai réactive le compte.',
          'Pour exercer vos droits : the.fortytwo_dev@proton.me. Vous pouvez également introduire une réclamation auprès de la CNIL.',
        ],
      },
      {
        heading: 'Sécurité',
        paragraphs: [
          'Les emails sont chiffrés au repos, l’index aveugle utilise une clé distincte de la clé applicative, les mots de passe sont hachés en Argon2id, la 2FA TOTP est disponible, les jetons sont révocables, le sel analytique est détruit à la rotation, aucune adresse IP n’est persistée et les sauvegardes sont chiffrées.',
        ],
      },
      {
        heading: 'Modification',
        paragraphs: [
          'Cette politique peut évoluer. La date en haut de page indique la dernière version.',
        ],
      },
    ],
  },

  subcontractors: {
    title: 'Sous-traitants',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Sous-traitants actifs',
        paragraphs: [
          'OVH : hébergement du service, en France. Toutes les données hébergées, en transit et au repos.',
          'OVH MX Plan : envoi des emails transactionnels, en France. Adresse email et contenu des messages.',
          'URLhaus / abuse.ch : dump public de blocklist, téléchargé une fois par jour. Localisation : Suisse, couverte par une décision d’adéquation. Aucune donnée client : le dump est public et identique pour tous.',
          'Prometheus, Grafana et ntfy : supervision auto-hébergée sur le même serveur, en UE. Métriques agrégées et alertes internes avec la référence, le slug et la catégorie d’un signalement, jamais le texte, l’email ni l’adresse du rapporteur.',
        ],
      },
      {
        heading: 'Ce qui n’est pas un sous-traitant',
        paragraphs: [
          'Lors du contrôle de destination, le site cible reçoit notre adresse IP et l’URL testée, et le service RDAP reçoit le domaine enregistrable seul. Ils ne traitent pas de données pour notre compte : ce sont des destinataires de la requête, pas des sous-traitants.',
        ],
      },
      {
        heading: 'Ce qui n’est pas actif en v0.1',
        paragraphs: [
          'Aucun stockage objet : la sauvegarde est un dump local chiffré tiré depuis la machine de l’exploitant. Aucun prestataire de paiement : il n’y a pas d’offre payante en v0.1. Aucun assistant de tri par modèle de langage : il est prévu pour la v0.2 et désactivé par défaut.',
        ],
      },
      {
        heading: 'Accord de sous-traitance',
        paragraphs: [
          'Un modèle d’accord de sous-traitance est disponible sur demande. Il précise l’objet, la durée, les sous-traitants ultérieurs, les mesures de sécurité et les durées de conservation.',
        ],
      },
      {
        heading: 'Transferts',
        paragraphs: [
          'Aucune donnée de navigation ne quitte l’Union européenne sur le chemin des clics. URLhaus / abuse.ch est en Suisse, couverte par une décision d’adéquation. Le site cible et RDAP peuvent être hors UE ; ils reçoivent la requête de contrôle, pas les données d’un visiteur.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Pour toute question sur un sous-traitant ou pour demander l’accord de sous-traitance : the.fortytwo_dev@proton.me.',
        ],
      },
    ],
  },

  'client-clause': {
    title: 'Clause client — mesure d’audience des liens',
    updatedAt: LEGAL_UPDATED_AT,
    sections: [
      {
        heading: 'Texte à publier',
        paragraphs: [
          'Les liens courts créés avec ce service enregistrent, lors de chaque ouverture, des statistiques agrégées : nombre de clics et type d’appareil. Ces statistiques servent uniquement à mesurer l’audience de nos liens.',
          'Aucun cookie n’est déposé sur votre appareil. Aucune adresse IP n’est conservée. L’adresse IP est utilisée de façon transitoire pour produire une empreinte technique associée à un seul lien. Cette empreinte est supprimée au plus tard au bout d’une semaine et ne peut plus être recalculée ensuite.',
          'Ces statistiques ne permettent pas de vous identifier et ne sont jamais recoupées entre plusieurs liens. Vous pouvez vous opposer à ce traitement en nous contactant à l’adresse indiquée dans notre politique de confidentialité.',
        ],
      },
      {
        heading: 'Comment l’utiliser',
        paragraphs: [
          'Le client qui crée un lien est responsable de la mesure d’audience de ce lien. Il insère ce texte dans sa propre politique de confidentialité, veille à ce que son adresse de contact y figure et traite les demandes d’opposition.',
          'Sans cette mention chez le client, l’analyse d’intérêt légitime fournie par InfinityApp ne lui est pas opposable. Le client reste responsable de l’information des personnes concernées.',
        ],
      },
      {
        heading: 'Accord de sous-traitance',
        paragraphs: [
          'L’accord de sous-traitance qui encadre ce traitement est disponible sur demande. Il précise les rôles, les sous-traitants ultérieurs, les mesures de sécurité et les durées de conservation.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [
          'Pour toute question sur cette clause ou pour demander l’accord de sous-traitance : the.fortytwo_dev@proton.me.',
        ],
      },
    ],
  },
}

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCUMENTS) as LegalSlug[]

export function isLegalSlug(value: string): value is LegalSlug {
  return Object.hasOwn(LEGAL_DOCUMENTS, value)
}
