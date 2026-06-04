const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, PageNumber, ImageRun,
        BorderStyle, ShadingType, WidthType, TableOfContents, SectionType,
        NumberFormat } = require("docx");
const fs = require("fs");
const path = require("path");

// ===== PALETTE (Academic: pure black body) =====
const P = { primary: "000000", body: "000000", secondary: "333333", accent: "8B7E5A", surface: "F5F7FA" };
const c = (hex) => hex.replace("#","");

// ===== IMAGE LOADER =====
const imgDir = path.join(__dirname, "ch3_images");
function loadImg(name) {
  const p = path.join(imgDir, name);
  if (fs.existsSync(p)) return fs.readFileSync(p);
  console.warn(`Image not found: ${p}`);
  return null;
}

// ===== BORDERS =====
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const threeLineBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: NB, right: NB, insideHorizontal: NB, insideVertical: NB,
};
const headerBottomBorder = {
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  top: NB, left: NB, right: NB,
};

// ===== HELPERS =====
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360, line: 360 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 240, line: 360 },
    children: [new TextRun({ text, bold: true, size: 30, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120, line: 360 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })]
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 360, after: 60 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
  });
}

function bodyNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 60 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
  });
}

function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 360, after: 60 },
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.body, bold: true })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 720 + level * 360, hanging: 240 },
    spacing: { line: 360, after: 40 },
    children: [
      new TextRun({ text: "\u2022 ", size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body }),
      new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body }),
    ]
  });
}

function numberedItem(num, text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 720, hanging: 360 },
    spacing: { line: 360, after: 40 },
    children: [new TextRun({ text: `${num}. ${text}`, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
  });
}

function imgParagraph(imgName, widthTwips = 8500) {
  const data = loadImg(imgName);
  if (!data) return body(`[Figure: ${imgName} non disponible]`);
  const ext = path.extname(imgName).slice(1);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data, transformation: { width: 580, height: 400 }, type: ext })]
  });
}

function figCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200, line: 360 },
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.secondary, italics: true })]
  });
}

function makeThreeLineTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: threeLineBorders,
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map(h => new TableCell({
          borders: headerBottomBorder,
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })] })]
        }))
      }),
      ...rows.map(row => new TableRow({
        cantSplit: true,
        children: row.map(cell => new TableCell({
          borders: { top: NB, bottom: NB, left: NB, right: NB },
          margins: { top: 40, bottom: 40, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: 312 },
            children: [new TextRun({ text: String(cell), size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })] })]
        }))
      }))
    ]
  });
}

function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60, line: 360 },
    keepNext: true,
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.secondary, italics: true })]
  });
}

function spacer(h = 100) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

// ===== HEADER / FOOTER =====
function buildHeader(title) {
  return new Header({ children: [
    new Paragraph({ alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" } },
      children: [new TextRun({ text: title, size: 18, color: "999999", font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
    })
  ]});
}

function buildFooter() {
  return new Footer({ children: [
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "- ", size: 21 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 21 }),
        new TextRun({ text: " -", size: 21 }),
      ]
    })
  ]});
}

// ===== DOCUMENT CONTENT =====
const content = [];

// ==========================================
// 3.1 Présentation générale
// ==========================================
content.push(heading1("CHAPITRE III : IMPLEMENTATION DE LA SOLUTION GED-ISIPA"));

content.push(heading2("3.1 Presentation generale de la solution realisee"));

content.push(body("Le present chapitre est consacre a la presentation detaillee de la solution informatique developpee dans le cadre de ce travail de fin d'etudes. Cette solution, denommee GED-ISIPA (Gestion Electronique de Documents de l'ISIPA), repond a la problematicique identifiee au Chapitre I, a savoir l'absence d'un systeme numerique centralise pour la gestion documentaire au sein de l'Institut Superieur Informatique et Programmique Appliquee (ISIPA). L'application realisee constitue une plateforme web complete de gestion electronique de documents, concue selon une architecture multi-tenant SaaS (Software as a Service) permettant a plusieurs organisations de types differents d'utiliser la meme instance tout en beneficiant d'une isolation totale de leurs donnees."));

content.push(body("La solution GED-ISIPA se distingue par sa capacite a s'adapter a differents contextes organisationnels. En effet, la plateforme prend en charge huit types d'organisations : universite, hopital, entreprise, gouvernement, PME, institution, ONG et cabinet juridique. Chaque type d'organisation beneficie d'un tableau de bord specifique, de modules fonctionnalitaires adaptes et de roles metier correspondant a sa realite operationnelle. Cette approche constitue un choix architectural majeur qui depasse le cadre initial du cahier des charges, puisqu'elle transforme une application mono-organisation en une plateforme multi-organisation evolutive."));

content.push(body("Les objectifs atteints par cette implementation peuvent etre resumes comme suit : premierement, la numerisation complete du cycle de vie documentaire, depuis la creation d'un brouillon jusqu'a l'archivage final, en passant par les etapes de revision, d'approbation et de publication ; deuxiemement, la mise en place d'un moteur de workflow configurable permettant de definir des circuits de validation adaptes a chaque organisation ; troisiemement, l'implementation d'un systeme de controle d'acces base sur les roles (RBAC) comprenant quatorze roles distincts couvrant l'ensemble des profils metier identifies ; quatriemement, la creation d'un systeme de modules activables a la demande, permettant a chaque organisation de personnaliser sa plateforme selon ses besoins specifiques ; et cinquiemement, le deploiement simplifie de l'application sur serveur VPS via un script d'installation automatise."));

content.push(body("La valeur ajoutee de cette solution reside dans sa capacite a unifier, au sein d'une plateforme coherente, des fonctionnalites qui etaient jusqu'alors disjointes ou inexistantes. L'ISIPA, comme de nombreuses institutions congolaises, fonctionnait avec des processus documentaires essentiellement manuels, generant des retards, des pertes de documents et une tracabilite insuffisante. La solution developpee apporte une reponse concrete a ces problemes en offrant un outil numerique centralise, securise et adapte au contexte local."));

// ==========================================
// 3.2 Architecture generale
// ==========================================
content.push(heading2("3.2 Architecture generale du systeme"));

content.push(heading3("3.2.1 Architecture logique"));

content.push(body("L'architecture logique du systeme GED-ISIPA est organisee en cinq couches distinctes, chacune assurant une responsabilite specifique et communiquant avec les couches adjacentes selon des interfaces bien definies. Cette decomposition en couches respecte le principe de separation des preoccupations (Separation of Concerns), favorisant ainsi la maintenabilite, la testabilite et l'evolutivite du systeme. La Figure 3-1 illustre cette architecture en couches."));

const img1 = loadImg("fig3-1_architecture_logique.png");
if (img1) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img1, transformation: { width: 520, height: 370 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-1 : Architecture logique en couches du systeme GED-ISIPA"));

content.push(body("La couche de presentation constitue l'interface utilisateur de l'application. Elle est implementee a l'aide du framework React 19 avec le systeme de routage App Router de Next.js 16. Les composants d'interface sont construits sur la bibliotheque shadcn/ui, qui fournit des composants accessibles et personnalisables bases sur Radix UI, le tout style avec Tailwind CSS 4. Cette couche comprend egalement six tableaux de bord adaptatifs, chacun adapte a un type d'organisation specifique (universite, hopital, entreprise, gouvernement, PME, cabinet juridique), affichant des indicateurs et statistiques pertinents pour le contexte concerne."));

content.push(body("La couche API et metier regroupe l'ensemble de la logique fonctionnelle de l'application. Elle est implementee sous forme de Route Handlers Next.js, exposant des endpoints RESTful pour les operations de creation, lecture, mise a jour et suppression (CRUD) sur les differentes entites du systeme. Cette couche integre egalement le moteur de workflow, le moteur de modules, la matrice de permissions RBAC et le systeme de journalisation d'audit. Chaque endpoint verifie systematiquement les permissions de l'utilisateur authentifie avant d'executer toute operation, garantissant ainsi le respect des politiques de securite."));

content.push(body("La couche d'authentification et de securite assure la gestion des identites et le controle d'acces. Elle repose sur NextAuth.js en strategie JWT, avec un middleware implementant le rate limiting, l'injection d'en-tetes de securite (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection) et la protection des routes selon le role de l'utilisateur. L'isolation multi-tenant est assuree par le filtre systematique de toutes les requetes sur la base de l'identifiant d'organisation contenu dans le jeton JWT."));

content.push(body("La couche d'acces aux donnees est assuree par Prisma ORM, qui fournit une abstraction type-safe au-dessus de la base de donnees. En environnement de developpement, SQLite est utilise pour sa simplicite de mise en oeuvre, tandis que PostgreSQL est utilise en production via Docker Compose pour sa robustesse et sa conformite aux exigences d'un environnement multi-utilisateurs. Le schema Prisma definit quatorze modeles de donnees, huit enumerations et les relations entre entites, assurant la coherence referentielle de l'ensemble."));

content.push(body("Enfin, la couche infrastructure englobe l'ensemble des composants de deploiement : conteneurisation Docker, reverse proxy Nginx avec support SSL/TLS, et script d'installation automatise permettant le deploiement en une seule commande sur un serveur VPS Linux."));

content.push(heading3("3.2.2 Architecture physique et de deploiement"));

content.push(body("L'architecture physique de deploiement du systeme GED-ISIPA repose sur une stack Docker Compose orchestreant cinq services conteneurises. Cette architecture a ete concue pour garantir la portabilite, la reproductibilite et la facilite de deploiement, conformement aux bonnes pratiques DevOps. La Figure 3-2 presente cette architecture de deploiement."));

const img2 = loadImg("fig3-2_architecture_deploiement.png");
if (img2) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img2, transformation: { width: 520, height: 300 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-2 : Architecture de deploiement Docker Compose"));

content.push(body("Le service applicatif principal est l'application Next.js, construite selon un processus de build multi-etapes (multi-stage build) produisant une image Docker optimisee. L'etape de build installe les dependances, genere le client Prisma, compile l'application Next.js en mode standalone et prepare les fichiers statiques. L'etape de production copie uniquement les artefacts necessaires, reduisant ainsi la taille de l'image finale et la surface d'attaque."));

content.push(body("Le service de base de donnees PostgreSQL assure le stockage persistant des donnees applicatives en production. Le service Redis fournit un cache en memoire pour les sessions et les donnees frequemment consultees. Le service MinIO offre un stockage d'objets compatible S3 pour les fichiers telecharges. Enfin, le service Nginx agit comme reverse proxy, assurant la terminaison SSL, la compression gzip, la mise en cache des assets statiques et le routage des requetes vers le service applicatif."));

content.push(heading3("3.2.3 Architecture logicielle"));

content.push(body("L'architecture logicielle du systeme GED-ISIPA suit le patron d'architecture de l'App Router Next.js, qui organise le code selon une structure basee sur le systeme de fichiers. Chaque repertoire sous le chemin app/ correspond a une route de l'application, et les fichiers page.tsx definissent les composants de page, tandis que les fichiers layout.tsx definissent les mises en page englobantes. Les fichiers route.ts sous api/ definissent les endpoints de l'API RESTful."));

content.push(body("L'application est organisee en trois groupes de routes principaux : le groupe (auth) qui regroupe les pages d'authentification (connexion et inscription), le groupe (dashboard) qui contient l'espace de travail des utilisateurs d'une organisation, et le groupe admin reserve aux super-administrateurs de la plateforme. Cette separation permet d'appliquer des logiques de mise en page et de securite distinctes a chaque contexte d'utilisation."));

content.push(body("Les bibliotheques metier sont centralisees dans le repertoire src/lib/, avec des modules dedies pour la configuration d'authentification (auth.ts), la matrice de permissions (permissions.ts), le moteur de workflow (workflow.ts), le moteur de modules (module-engine.ts), le generateur de jetons d'organisation (token-engine.ts) et les constantes de l'application (constants.ts). Cette organisation favorise la cohesion et reduit le couplage entre les differentes preoccupations fonctionnelles."));

content.push(heading3("3.2.4 Flux de donnees"));

content.push(body("Le flux de donnees typique dans le systeme GED-ISIPA suit le pattern suivant : lorsqu'un utilisateur effectue une action sur l'interface, la requete HTTP est d'abord interceptee par le middleware Next.js, qui verifie l'authenticite du jeton JWT, applique le rate limiting et injecte les en-tetes de securite. La requete est ensuite dirigee vers le Route Handler correspondant, qui extrait les informations d'identite du jeton (identifiant utilisateur, role, organisation), verifie les permissions via la matrice RBAC, execute la logique metier en interrogeant la base de donnees via Prisma, cree une entree dans le journal d'audit si necessaire, et retourne la reponse au client."));

content.push(body("Pour les operations de workflow, le flux est legerement different : l'utilisateur declenche une transition de workflow via l'interface, la requete est transmise a l'endpoint /api/workflows/[id]/execute, qui charge la transition avec ses etats source et cible, verifie que le role de l'utilisateur est autorise a effectuer cette transition (les super-administrateurs et administrateurs d'organisation contournent cette verification), met a jour l'etat du workflow du document, synchronise automatiquement le statut du document en fonction du nouvel etat, et enregistre l'action dans le journal d'audit. Ce mecanisme garantit que chaque changement d'etat est trace et que seuls les roles autorises peuvent faire avancer le processus documentaire."));

// ==========================================
// 3.3 Technologies utilisées
// ==========================================
content.push(heading2("3.3 Technologies utilisees"));

content.push(body("Le choix des technologies utilisees pour le developpement de GED-ISIPA a ete guide par plusieurs criteres : la productivite du developpeur, la performance de l'application, la disponibilite de la communaute et de la documentation, la compatibilite avec les contraintes de deploiement (serveur VPS a ressources limitees), et la coherence avec les besoins fonctionnels identifies au Chapitre I. Ce choix a fait l'objet d'un pivot technologique par rapport au planning initial, qui preconisait Spring Boot avec React et PostgreSQL. L'adoption de Next.js en tant que framework full-stack a permis de reunir le frontend et le backend au sein d'un meme projet, simplifiant considerablement l'architecture et le deploiement."));

content.push(heading3("3.3.1 Stack technologique principal"));

content.push(tableCaption("Tableau 3-1 : Stack technologique de GED-ISIPA"));
content.push(makeThreeLineTable(
  ["Composant", "Technologie", "Version", "Role"],
  [
    ["Framework", "Next.js", "16.1.1", "Framework full-stack React"],
    ["Bibliotheque UI", "React", "19.0.0", "Construction d'interfaces composables"],
    ["ORM", "Prisma", "6.11.1", "Mapping objet-relationnel type-safe"],
    ["Base de donnees (dev)", "SQLite", "3.x", "Stockage local leger"],
    ["Base de donnees (prod)", "PostgreSQL", "16", "Base relationnelle robuste"],
    ["Authentification", "NextAuth.js", "4.24.11", "Gestion des sessions JWT"],
    ["Style CSS", "Tailwind CSS", "4.x", "Utilitaires CSS atomiques"],
    ["Composants UI", "shadcn/ui", "Derniere", "Composants accessibles personnalisables"],
    ["Validation", "Zod", "4.0.2", "Validation de schemas TypeScript"],
    ["Conteneurisation", "Docker", "Derniere", "Isolation et deploiement"],
    ["Reverse Proxy", "Nginx", "Alpine", "Routage, SSL, compression"],
    ["Langage", "TypeScript", "5.x", "Typage statique et securite"],
  ]
));

content.push(heading3("3.3.2 Justification des choix"));

content.push(body("Le choix de Next.js comme framework principal se justifie par plusieurs avantages determinants. Premierement, Next.js offre un mode de rendu hybride (Server-Side Rendering et Client-Side Rendering) permettant d'optimiser les performances de chargement des pages tout en conservant l'interactivite d'une application monopage. Deuxiemement, l'App Router introduit un systeme de layouts imbriques qui facilite la gestion des permissions au niveau de la mise en page, chaque groupe de routes pouvant avoir son propre layout avec sa logique d'authentification. Troisiemement, les Route Handlers permettent d'implementer l'API RESTful directement dans le meme projet, eliminant le besoin de maintenir un backend separe. Quatriemement, le mode standalone de Next.js produit un serveur optimise pour le deploiement en conteneur, reduisant la taille de l'image Docker et le temps de demarrage."));

content.push(body("Le choix de Prisma comme ORM est justifie par son approche declarative du schema de donnees, sa generation automatique de types TypeScript a partir du schema, et son support natif de SQLite en developpement et PostgreSQL en production. Le schema Prisma centralise la definition de tous les modeles, enumerations et relations, servant de source de verite unique pour la structure des donnees. Cette approche elimine le decalage entre le code et la base de donnees, probleme recurrent dans les projets utilisant des requetes SQL brutes."));

content.push(body("Le choix de NextAuth.js repond a la necessite d'integrer rapidement un systeme d'authentification robuste dans l'ecosysteme Next.js. La strategie JWT a ete privilegiee par rapport aux sessions en base de donnees pour des raisons de performance et de simplicite de deploiement : les jetons JWT contiennent toutes les informations necessaires (identifiant, role, organisation) sans necessiter de consultation de base de donnees a chaque requete, ce qui est particulierement avantageux dans un contexte multi-tenant ou l'identifiant d'organisation doit etre disponible immediatement."));

content.push(body("L'adoption de shadcn/ui plutot que d'une bibliotheque de composants traditionnelle (comme Material UI ou Ant Design) se justifie par le fait que shadcn/ui ne constitue pas une dependance externe : les composants sont copies dans le projet et peuvent etre librement modifies. Cette approche offre un controle total sur le code source des composants, evitant les problemes de personnalisation limitee et de dependance a une bibliotheque tierce."));

content.push(heading3("3.3.3 Limites identifiees"));

content.push(body("Malgre les avantages presentes, certaines limites technologiques doivent etre mentionnees de maniere transparente. Premierement, l'authentification actuelle utilise une comparaison de mots de passe en texte clair, une approche acceptable en phase de developpement mais qui necessite l'implementation de hachage bcrypt pour toute mise en production reelle. Cette limitation est documentee dans le code source par un commentaire explicite. Deuxiemement, le systeme de rate limiting est implemente en memoire, ce qui signifie qu'il est reinitialise a chaque redemarrage du serveur et ne se partage pas entre les instances en cas de scalabilite horizontale. Troisiemement, le telechargement de fichiers est actuellement gere au niveau metadata (les informations sur le fichier sont stockees en base de donnees, mais le stockage reel des fichiers require l'integration avec MinIO en production). Quatriemement, certains modules (Facturation, Analytique) sont presentes sous forme de pages placeholder, en attente d'implementation complete."));

// ==========================================
// 3.4 Modélisation finale
// ==========================================
content.push(heading2("3.4 Modelisation finale"));

content.push(heading3("3.4.1 Modele Conceptuel de Donnees (MCD)"));

content.push(body("Le modele conceptuel de donnees de GED-ISIPA comprend quatorze entites principales, reliees par des associations reflechissant les regles de gestion du systeme. Ce modele a ete elabore en suivant la methode MERISE presentee au Chapitre I, avec une approche iterative affinant les entites et les relations au fur et a mesure de l'avancement du developpement. La Figure 3-4 presente une vue synthetique du MCD."));

const img4 = loadImg("fig3-4_mcd.png");
if (img4) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img4, transformation: { width: 540, height: 340 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-4 : Modele Conceptuel de Donnees (MCD)"));

content.push(body("L'entite Organization est l'entite centrale de l'architecture multi-tenant. Chaque organisation possede un identifiant unique (id), un nom, un slug unique pour les URLs, un code AEIP generé automatiquement (par exemple AEIP-UNI-ENT85G pour l'ISIPA), un type parmi huit possibilites, un statut (ACTIVE, SUSPENDED, TRIAL, CHURNED), et un plan d'abonnement. L'organisation est reliee aux utilisateurs, departements, documents, modules, workflows, abonnements et journaux d'audit, formant le coeur du systeme."));

content.push(body("L'entite User represente un utilisateur du systeme, caracterise par son adresse email (unique), son nom, son mot de passe, et surtout son role parmi quatorze possibilites. Chaque utilisateur est obligatoirement rattache a une organisation et optionnellement a un departement. La relation entre User et Organization est de type plusieurs-a-un (N:1), signifiant qu'un utilisateur appartient a une et une seule organisation, mais qu'une organisation peut compter plusieurs utilisateurs."));

content.push(body("L'entite Document constitue le coeur fonctionnel de l'application. Un document est defini par son titre, sa reference unique generee automatiquement, son type parmi quatorze categories (dossier academique, administratif, financier, correspondance, rapport, contrat, certificat, note de service, politique, dossier medical, memoire juridique, facture, proposition, autre), son statut dans le cycle de vie (DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, ARCHIVED, REJECTED), et sa classification de securite (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED). Le document est relie a son auteur (User), a son departement, a son etat de workflow, et conserve les informations d'archivage (date, auteur de l'archivage, reference d'archive, periode de retention)."));

content.push(body("Les entites Workflow, WorkflowState et WorkflowTransition forment le moteur de workflow. Un Workflow appartient a une organisation et contient des etats (WorkflowState) et des transitions (WorkflowTransition). Chaque transition definit un etat source, un etat cible, un nom d'action (Soumettre, Approuver, Rejeter, Publier, Reviser) et les roles autorises a effectuer cette transition, stockes sous forme de tableau JSON."));

content.push(heading3("3.4.2 Modele Logique de Donnees (MLD)"));

content.push(body("Le modele logique de donnees constitue la traduction du MCD en termes de tables relationnelles. Chaque entite du MCD correspond a une table, et chaque association de type un-a-plusieurs est traduite par l'ajout d'une cle etrangere dans la table du cote plusieurs. Les associations de type plusieurs-a-plusieurs sont traduites par des tables de liaison, bien que le schema actuel ne comporte pas de telles associations directes entre entites principales."));

content.push(tableCaption("Tableau 3-2 : Correspondance MCD - MLD"));
content.push(makeThreeLineTable(
  ["Entite MCD", "Table MLD", "Cle primaire", "Cles etrangeres"],
  [
    ["Organization", "Organization", "id (CUID)", "—"],
    ["User", "User", "id (CUID)", "organizationId, departmentId"],
    ["Department", "Department", "id (CUID)", "organizationId"],
    ["Document", "Document", "id (CUID)", "organizationId, authorId, departmentId, workflowStateId"],
    ["DocumentVersion", "DocumentVersion", "id (CUID)", "documentId"],
    ["Workflow", "Workflow", "id (CUID)", "organizationId, initialStateId"],
    ["WorkflowState", "WorkflowState", "id (CUID)", "workflowId"],
    ["WorkflowTransition", "WorkflowTransition", "id (CUID)", "workflowId, fromStateId, toStateId"],
    ["OrganizationModule", "OrganizationModule", "id (CUID)", "organizationId"],
    ["Subscription", "Subscription", "id (CUID)", "organizationId"],
    ["AuditLog", "AuditLog", "id (CUID)", "organizationId, userId, documentId"],
    ["AccessLog", "AccessLog", "id (CUID)", "documentId, userId"],
    ["Notification", "Notification", "id (CUID)", "userId"],
    ["SystemSetting", "SystemSetting", "id (CUID)", "—"],
  ]
));

content.push(heading3("3.4.3 Dictionnaire de donnees"));

content.push(body("Le dictionnaire de donnees presente de maniere exhaustive l'ensemble des proprietes de chaque entite, incluant le nom du champ, le type de donnees, les contraintes d'integrite et la description fonctionnelle. Le Tableau 3-3 presente le dictionnaire de l'entite Document, qui constitue l'entite la plus riche du systeme."));

content.push(tableCaption("Tableau 3-3 : Dictionnaire de donnees - Entite Document"));
content.push(makeThreeLineTable(
  ["Champ", "Type", "Contrainte", "Description"],
  [
    ["id", "String (CUID)", "PK, Auto", "Identifiant unique du document"],
    ["title", "String", "NOT NULL", "Titre du document"],
    ["reference", "String", "UNIQUE, NOT NULL", "Reference unique auto-generee"],
    ["description", "String?", "Nullable", "Description du document"],
    ["type", "DocumentType", "NOT NULL", "Type parmi 14 categories"],
    ["status", "DocumentStatus", "DEFAULT DRAFT", "Statut dans le cycle de vie"],
    ["classification", "Classification", "DEFAULT INTERNAL", "Niveau de confidentialite"],
    ["filePath", "String", "NOT NULL", "Chemin du fichier"],
    ["fileName", "String", "NOT NULL", "Nom du fichier original"],
    ["fileSize", "Int", "NOT NULL", "Taille en octets"],
    ["mimeType", "String", "NOT NULL", "Type MIME du fichier"],
    ["fileHash", "String", "NOT NULL", "Empreinte numerique du fichier"],
    ["version", "Int", "DEFAULT 1", "Numero de version"],
    ["tags", "String", "DEFAULT ''", "Tags separes par des virgules"],
    ["metadata", "String?", "Nullable", "Metadonnees JSON"],
    ["organizationId", "String", "FK, NOT NULL", "Organisation proprietaire"],
    ["authorId", "String", "FK, NOT NULL", "Auteur du document"],
    ["departmentId", "String", "FK, NOT NULL", "Departement rattache"],
    ["workflowStateId", "String?", "FK, Nullable", "Etat courant du workflow"],
    ["isArchived", "Boolean", "DEFAULT false", "Indicateur d'archivage"],
    ["archivedAt", "DateTime?", "Nullable", "Date d'archivage"],
    ["archivedBy", "String?", "Nullable", "Auteur de l'archivage"],
    ["archiveRef", "String?", "Nullable", "Reference d'archive"],
    ["retentionPeriod", "Int?", "Nullable", "Periode de retention (jours)"],
    ["expiresAt", "DateTime?", "Nullable", "Date d'expiration"],
    ["createdAt", "DateTime", "Auto (now)", "Date de creation"],
    ["updatedAt", "DateTime", "Auto (updatedAt)", "Date de derniere modification"],
  ]
));

content.push(heading3("3.4.4 Enumerations du systeme"));

content.push(body("Le systeme GED-ISIPA definit dix enumerations au niveau du schema Prisma, chacune representant un ensemble fini de valeurs autorisees pour un champ donne. Le Tableau 3-4 presente les enumerations et leurs valeurs."));

content.push(tableCaption("Tableau 3-4 : Enumerations du schema Prisma"));
content.push(makeThreeLineTable(
  ["Enumeration", "Nombre de valeurs", "Valeurs principales"],
  [
    ["OrganizationType", "8", "UNIVERSITY, HOSPITAL, COMPANY, GOVERNMENT, SME, INSTITUTION, NGO, LAW_FIRM"],
    ["Role", "14", "SUPER_ADMIN, ORG_ADMIN, MANAGER, USER, VIEWER, DEAN, PROFESSOR, DOCTOR, NURSE, LAWYER, PARALEGAL, CFO, HR_MANAGER, CIVIL_SERVANT"],
    ["DocumentType", "14", "ACADEMIC_RECORD, ADMINISTRATIVE, FINANCIAL, CORRESPONDENCE, REPORT, CONTRACT, CERTIFICATE, MEMO, POLICY, MEDICAL_RECORD, LEGAL_BRIEF, INVOICE, PROPOSAL, OTHER"],
    ["DocumentStatus", "6", "DRAFT, PENDING_REVIEW, APPROVED, PUBLISHED, ARCHIVED, REJECTED"],
    ["Classification", "4", "PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED"],
    ["AuditAction", "17", "CREATE, READ, UPDATE, DELETE, ARCHIVE, RESTORE, DOWNLOAD, SHARE, APPROVE, REJECT, LOGIN, LOGOUT, MODULE_ACTIVATE, MODULE_SUSPEND, WORKFLOW_EXECUTE, ORGANIZATION_CREATE, ORGANIZATION_SUSPEND"],
    ["SubscriptionPlan", "4", "FREE, STARTER, PROFESSIONAL, ENTERPRISE"],
    ["OrganizationStatus", "4", "ACTIVE, SUSPENDED, TRIAL, CHURNED"],
    ["ModuleStatus", "3", "ACTIVE, SUSPENDED, INACTIVE"],
    ["SubscriptionStatus", "4", "ACTIVE, PAST_DUE, CANCELED, TRIAL"],
  ]
));

// ==========================================
// 3.5 Réalisation et implémentation
// ==========================================
content.push(heading2("3.5 Realisation et implementation"));

content.push(heading3("3.5.1 Structure du projet"));

content.push(body("Le projet GED-ISIPA est organise selon la structure standard d'une application Next.js 16 avec App Router. Le repertoire source (src/) contient les sous-repertoires app/ pour les routes et pages, components/ pour les composants React, lib/ pour les modules metier, hooks/ pour les hooks personnalises, et middleware.ts pour le middleware de securite. Le repertoire prisma/ contient le schema de base de donnees et le script de seed. Le repertoire public/ contient les assets statiques, et le repertoire docker/ contient la configuration Nginx. Le fichier docker-compose.yml a la racine orchestre les services de production."));

content.push(body("L'organisation du code suit le principe de proximite fonctionnelle : les fichiers lies a une meme fonctionnalite sont regroupes dans un meme repertoire. Par exemple, les composants d'interface lies aux documents sont dans components/documents/, les composants de tableau de bord dans components/dashboards/, et les composants d'authentification dans components/auth/. Cette organisation facilite la navigation dans le code et la maintenance."));

content.push(heading3("3.5.2 Gestion des roles et permissions"));

content.push(body("Le systeme de gestion des roles et permissions de GED-ISIPA constitue l'un des aspects les plus elabores de l'application. Il repose sur une matrice de permissions statique definie dans le fichier permissions.ts, qui croise quatorze roles avec neuf ressources et douze types d'actions. La Figure 3-5 presente la hierarchie des roles et leurs niveaux d'autorite."));

const img5 = loadImg("fig3-5_rbac.png");
if (img5) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img5, transformation: { width: 520, height: 260 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-5 : Hierarchie des roles RBAC avec niveaux d'autorite"));

content.push(body("Le systeme de permissions est implemente sous la forme d'une matrice statique (PERMISSION_MATRIX) ou chaque role est associe a un dictionnaire de ressources, chaque ressource etant associee a un tableau d'actions autorisees. Les fonctions utilitaires hasPermission(role, resource, action), getAllowedActions(role, resource), isSuperAdmin(role), isOrgAdmin(role), canManageUsers(role) et canApproveDocuments(role) fournissent une interface programmatique claire pour la verification des permissions dans les Route Handlers et les composants React."));

content.push(tableCaption("Tableau 3-5 : Synthese des permissions par role"));
content.push(makeThreeLineTable(
  ["Role", "Niveau", "Actions cles sur documents", "Gestion utilisateurs"],
  [
    ["SUPER_ADMIN", "100", "Toutes (CRUD + approbation + publication + archivage)", "Plein controle + organisations"],
    ["ORG_ADMIN", "80", "CRUD + approbation + publication + archivage", "CRUD utilisateurs + departements"],
    ["DEAN", "70", "CRUD + approbation + publication + archivage + export", "Lecture + gestion"],
    ["CFO / HR_MANAGER", "65", "CRUD + approbation + archivage + export", "Lecture / Creation + gestion"],
    ["CIVIL_SERVANT / DOCTOR / LAWYER", "60", "CRUD + approbation + archivage + export", "Lecture uniquement"],
    ["MANAGER", "50", "CRUD + approbation + rejet + archivage + export", "Lecture uniquement"],
    ["PROFESSOR / NURSE / PARALEGAL", "30-40", "CRUD + partage", "Lecture uniquement"],
    ["USER", "20", "Create + read + update + share", "Lecture uniquement"],
    ["VIEWER", "10", "Lecture uniquement", "Lecture uniquement"],
  ]
));

content.push(heading3("3.5.3 Moteur de workflow"));

content.push(body("Le moteur de workflow de GED-ISIPA est un systeme configurable de machines a etats finis permettant de modeliser les circuits de validation documentaire. Chaque organisation dispose d'au moins un workflow, cree automatiquement lors du seed de la base de donnees. Le workflow par defaut comporte cinq etats (Brouillon, En revision, Approuve, Publie, Rejete) et cinq transitions, chacune restreinte a un ensemble de roles autorises. La Figure 3-3 presente ce workflow."));

const img3 = loadImg("fig3-3_workflow.png");
if (img3) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img3, transformation: { width: 520, height: 220 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-3 : Cycle de vie documentaire - Workflow par defaut"));

content.push(body("L'implementation du moteur de workflow repose sur trois modeles Prisma : Workflow, WorkflowState et WorkflowTransition. Le workflow est cree a partir d'une configuration typee (WorkflowConfig) via la fonction createWorkflowFromConfig, qui cree le workflow, ses etats et ses transitions en une seule operation transactionnelle. L'execution d'une transition est assuree par la fonction executeWorkflowTransition, qui charge la transition avec ses etats source et cible, met a jour l'etat du workflow du document, synchronise automatiquement le statut du document (par exemple, un etat Approuve correspond au statut APPROVED), et enregistre l'action dans le journal d'audit avec le detail de la transition effectuee."));

content.push(body("Le systeme de transitions est extensible : chaque organisation peut definir des workflows personnalises via l'interface de creation de workflows, avec des etats et des transitions adaptes a ses besoins specifiques. Par exemple, le workflow medical de l'hopital et le workflow gouvernemental du ministere sont des variantes du workflow par defaut avec des noms et descriptions adaptes au contexte."));

content.push(heading3("3.5.4 Moteur de modules"));

content.push(body("Le systeme de modules de GED-ISIPA permet a chaque organisation d'activer ou de desactiver des fonctionnalites selon ses besoins specifiques. Seize modules sont definis dans le catalogue, chacun associe a un ou plusieurs types d'organisations et potentiellement a des dependances envers d'autres modules. La Figure 3-6 presente la repartition des modules par type d'organisation."));

const img6 = loadImg("fig3-6_modules.png");
if (img6) {
  content.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 },
    children: [new ImageRun({ data: img6, transformation: { width: 520, height: 300 }, type: "png" })] }));
}
content.push(figCaption("Figure 3-6 : Systeme de modules par type d'organisation"));

content.push(body("Le moteur de modules gere automatiquement les dependances entre modules. Par exemple, le module Bibliotheque depend du module Academique : il ne peut etre active que si le module Academique est deja actif. De meme, la desactivation d'un module qui est une dependance d'un autre module actif est refusee par le systeme. Cette logique est implementee dans les fonctions activateModule, suspendModule et deactivateModule du fichier module-engine.ts."));

content.push(heading3("3.5.5 Authentification et securite"));

content.push(body("Le systeme d'authentification de GED-ISIPA est base sur NextAuth.js en strategie JWT. Lorsqu'un utilisateur soumet ses identifiants (email et mot de passe, avec un code d'organisation optionnel), le fournisseur d'identite CredentialsProvider effectue les verifications suivantes : existence du compte email, statut actif du compte, correspondance du mot de passe, et optionnellement validite du code d'organisation. En cas de succes, un jeton JWT est genere contenant l'identifiant de l'utilisateur, son role, son identifiant d'organisation, le nom et le type de l'organisation, le slug, le code d'organisation et l'identifiant du departement. Ces informations sont propagees dans la session cote client via les callbacks jwt et session de NextAuth."));

content.push(body("Le middleware Next.js (middleware.ts) constitue la premiere ligne de defense de l'application. Il intercepte chaque requete entrante et applique les mesures de securite suivantes : injection d'en-tetes de securite HTTP (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, X-XSS-Protection: 1; mode=block), rate limiting en memoire (30 requetes par minute pour les endpoints d'authentification, 100 requetes par minute pour les endpoints API), redirection des utilisateurs non authentifies vers la page de connexion, redirection des utilisateurs authentifies hors des pages d'authentification vers leur tableau de bord specifique, et restriction des routes d'administration aux super-administrateurs."));

content.push(body("L'isolation multi-tenant est assuree par le filtre systematique de toutes les requetes de base de donnees sur la base de l'identifiant d'organisation extrait du jeton JWT. Chaque endpoint API recupere l'organisationId du jeton et l'utilise comme filtre dans toutes les requetes Prisma, garantissant qu'un utilisateur ne peut acceder qu'aux donnees de sa propre organisation. Cette isolation est implementee au niveau applicatif plutot qu'au niveau de la base de donnees, ce qui est approprie pour un systeme SQLite partage mais devrait etre renforce par des schemas PostgreSQL separes en production pour une isolation plus stricte."));

content.push(heading3("3.5.6 API RESTful"));

content.push(body("L'API de GED-ISIPA est exposee via dix-sept fichiers de Route Handlers, couvrant plus de trente endpoints. Chaque endpoint suit le pattern REST standard : GET pour la lecture, POST pour la creation, PUT pour la mise a jour, DELETE pour la suppression. Tous les endpoints sont proteges par authentification JWT et verifient les permissions de l'utilisateur avant d'executer toute operation."));

content.push(tableCaption("Tableau 3-6 : Endpoints API principaux"));
content.push(makeThreeLineTable(
  ["Endpoint", "Methodes", "Description", "Permission requise"],
  [
    ["/api/documents", "GET, POST", "Liste paginee + creation", "read / create (documents)"],
    ["/api/documents/[id]", "GET, PUT, DELETE", "CRUD document individuel", "read / update / delete"],
    ["/api/documents/[id]/submit", "POST", "Soumettre en revision", "create (documents)"],
    ["/api/documents/[id]/approve", "POST", "Approuver un document", "approve (documents)"],
    ["/api/documents/[id]/publish", "POST", "Publier un document", "publish (documents)"],
    ["/api/documents/[id]/archive", "POST", "Archiver un document", "archive (documents)"],
    ["/api/documents/[id]/restore", "POST", "Restaurer depuis archive", "restore (documents)"],
    ["/api/documents/[id]/versions", "GET", "Historique des versions", "read (documents)"],
    ["/api/users", "GET, POST", "Liste + creation utilisateurs", "read / create (users)"],
    ["/api/organizations", "GET, POST", "Liste + creation organisations", "SUPER_ADMIN uniquement"],
    ["/api/workflows", "GET, POST", "Liste + creation workflows", "read / create (workflows)"],
    ["/api/workflows/[id]/execute", "POST", "Executer une transition", "role dans allowedRoles"],
    ["/api/audit", "GET", "Journal d'audit filtre", "read (audit)"],
    ["/api/dashboard", "GET", "Statistiques du tableau de bord", "Authentification requise"],
    ["/api/search", "GET", "Recherche globale", "Authentification requise"],
    ["/api/health", "GET", "Verification de sante", "Aucune"],
  ]
));

content.push(body("L'endpoint de tableau de bord (/api/dashboard) merite une mention particuliere car il implemente une logique de statistiques adaptee au type d'organisation. Pour une universite, il calcule des indicateurs academiques (nombre d'etudiants, de cours, de recherches) ; pour un hopital, des indicateurs medicaux (patients, consultations, urgences) ; pour un gouvernement, des indicateurs administratifs (procedures, decrets, arretes). Cette adaptativite est implemente par la fonction getTypeSpecificStats qui, en fonction du type d'organisation, retourne des labels et des valeurs contextuellement pertinents."));

content.push(heading3("3.5.7 Systeme de jetons d'organisation"));

content.push(body("Chaque organisation recoit un code d'identification unique genere automatiquement au format AEIP-PREFIX-CODE, ou PREFIX est un code de trois lettres correspondant au type d'organisation (UNI pour universite, HOS pour hopital, COR pour entreprise, GOV pour gouvernement, PME pour PME, INS pour institution, ONG pour ONG, JUR pour cabinet juridique) et CODE est une chaine de six caracteres alphanumeriques (excluant les caracteres ambigus I, O, 0, 1). Ce systeme de jetons est implemente dans le fichier token-engine.ts avec les fonctions generateAEIPToken et validateAEIPToken."));

content.push(tableCaption("Tableau 3-7 : Correspondance des prefixes de jetons AEIP"));
content.push(makeThreeLineTable(
  ["Type d'organisation", "Prefixe", "Exemple de jeton"],
  [
    ["Universite", "UNI", "AEIP-UNI-ENT85G"],
    ["Hopital", "HOS", "AEIP-HOS-LZYNWA"],
    ["Entreprise", "COR", "AEIP-COR-XK4M7P"],
    ["Gouvernement", "GOV", "AEIP-GOV-ELHBGX"],
    ["PME", "PME", "AEIP-PME-9FH3NR"],
    ["Institution", "INS", "AEIP-INS-KW5TV8"],
    ["ONG", "ONG", "AEIP-ONG-Q7YD2S"],
    ["Cabinet juridique", "JUR", "AEIP-JUR-BM6PA4"],
  ]
));

// ==========================================
// 3.6 Présentation détaillée des fonctionnalités
// ==========================================
content.push(heading2("3.6 Presentation detaillee des fonctionnalites"));

content.push(body("Cette section presente de maniere detaillee les principales fonctionnalites de la plateforme GED-ISIPA, en decrivant pour chacune son objectif, son processus de fonctionnement et sa valeur metier."));

content.push(heading3("3.6.1 Gestion documentaire"));

content.push(body("La gestion documentaire constitue le coeur fonctionnel de la plateforme. Elle permet aux utilisateurs de creer, consulter, modifier, approuver, publier et archiver des documents electroniques. Chaque document est caracterise par un titre, une reference unique auto-generee, un type parmi quatorze categories, une classification de securite et un statut dans le cycle de vie. Le systeme offre des fonctionnalites de recherche, de filtrage (par statut, type, classification, departement) et de pagination, permettant de gerer efficacement de grands volumes de documents."));

content.push(body("L'objectif de cette fonctionnalite est de remplacer les processus manuels de gestion documentaire par un systeme numerique centralise, offrant tracabilite, securite et accessibilite. La valeur metier est considerable : reduction du temps de recherche des documents, elimination des pertes de documents, garantie de conformite aux processus de validation, et amelioration de la collaboration entre les differents acteurs de la chaine documentaire."));

content.push(heading3("3.6.2 Workflow de validation"));

content.push(body("Le workflow de validation permet de definir et d'executer des circuits de validation documentaire adaptés aux besoins de chaque organisation. Le workflow par defaut comporte cinq etats et cinq transitions, mais le systeme est extensible et permet la creation de workflows personnalises. Chaque transition est soumise a une verification de role : seul un utilisateur disposant du role approprie peut effectuer la transition. Cette fonctionnalite assure que les documents suivent un processus de validation rigoureux avant leur publication, conformement aux regles de gestion de l'organisation."));

content.push(body("La valeur metier de cette fonctionnalite reside dans la formalisation et l'automatisation des processus de validation, qui etaient auparavant informels et sujets a des erreurs ou des oublis. Le systeme garantit qu'aucun document ne peut etre publie sans avoir ete approuve par un autorite competente, et que chaque etape du processus est tracee dans le journal d'audit."));

content.push(heading3("3.6.3 Systeme multi-tenant"));

content.push(body("Le systeme multi-tenant constitue l'innovation architecturale majeure de la plateforme. Il permet a plusieurs organisations de types differents d'utiliser la meme instance de l'application, tout en beneficiant d'une isolation totale de leurs donnees. Chaque organisation dispose de son propre espace de travail, avec ses utilisateurs, departements, documents, workflows, modules et journaux d'audit. L'isolation est assuree au niveau applicatif par le filtre systematique de l'identifiant d'organisation dans toutes les requetes de base de donnees."));

content.push(body("L'objectif de cette fonctionnalite est de transformer l'application d'un outil mono-organisation en une plateforme SaaS evolutive, capable de servir plusieurs clients avec une seule instance. La valeur metier est double : pour l'editeur, elle permet de servir plusieurs organisations avec des couts d'infrastructure reduits ; pour chaque organisation cliente, elle offre une solution cle en main sans les contraintes de deploiement et de maintenance d'une instance dediee."));

content.push(heading3("3.6.4 Tableaux de bord adaptatifs"));

content.push(body("La plateforme offre six tableaux de bord specialises, chacun adapte a un type d'organisation specifique. Le tableau de bord universitaire affiche des indicateurs academiques, le tableau de bord hospitalier presente des statistiques medicales, et le tableau de bord gouvernemental montre des metriques administratives. Chaque tableau de bord comprend des cartes de statistiques, des graphiques de repartition des documents par statut et par type, une liste des documents recents et un fil d'activite."));

content.push(body("L'objectif de cette fonctionnalite est de fournir a chaque utilisateur un point d'entree personnalise dans la plateforme, affichant les informations les plus pertinentes pour son contexte professionnel. La valeur metier reside dans la capacite de prise de decision rapide basee sur des indicateurs visuels en temps reel, evitant la necessite de naviguer dans de multiples ecrans pour obtenir une vue d'ensemble de l'activite documentaire."));

content.push(heading3("3.6.5 Journal d'audit"));

content.push(body("Le journal d'audit enregistre de maniere exhaustive toutes les actions effectuees sur la plateforme, incluant la creation, lecture, modification, suppression, archivage, restauration, telechargement, partage, approbation et rejet de documents, ainsi que les connexions, deconnexions, activations et suspensions de modules, les executions de workflow, et les operations sur les organisations. Chaque entree du journal d'audit contient l'action effectuee, le type et l'identifiant de l'entite concernee, les details de l'operation, l'identifiant de l'utilisateur et de l'organisation, l'adresse IP et le user-agent du client."));

content.push(body("La valeur metier du journal d'audit est cruciale dans un contexte de gestion documentaire : il fournit une tracabilite complete de toutes les operations, permet de detecter les comportements anormaux, facilite les investigations en cas d'incident, et satisfait aux exigences reglementaires de tenue de registres. Dix-sept types d'actions sont traces, couvrant l'ensemble des operations sensibles du systeme."));

content.push(heading3("3.6.6 Gestion des utilisateurs et des departements"));

content.push(body("Le module de gestion des utilisateurs permet aux administrateurs d'organisation de creer, modifier et supprimer des comptes utilisateurs, de leur attribuer des roles et de les affecter a des departements. La gestion des departements permet de creer une structure organisationnelle refletant la realite de l'organisation, avec des codes de departement uniques au sein de chaque organisation. Chaque utilisateur est identifie par son adresse email (unique dans le systeme), son nom, son role et son rattachement organisationnel et departmental."));

content.push(body("L'objectif de cette fonctionnalite est de fournir aux administrateurs un outil de gestion des acces granulaire, permettant de controler precisement qui peut faire quoi dans le systeme. La valeur metier reside dans la capacite d'adapter les permissions de chaque utilisateur a ses responsabilites reelles, limitant les risques d'acces non autorise tout en facilitant le travail collaboratif."));

// ==========================================
// 3.7 Présentation des interfaces
// ==========================================
content.push(heading2("3.7 Presentation des interfaces"));

content.push(body("Les interfaces utilisateur de GED-ISIPA ont ete concues selon les principes de l'ergonomie web moderne, en privilegiant la clarte, la coherence et l'accessibilite. L'ensemble des ecrans utilise la bibliotheque shadcn/ui avec un theme clair/sombre basculeable, offrant une experience visuelle agreable et adaptable aux preferences de l'utilisateur."));

content.push(heading3("3.7.1 Page de connexion"));

content.push(body("La page de connexion constitue le point d'entree de l'application. Elle presente un formulaire centre avec les champs email et mot de passe, ainsi qu'un champ optionnel pour le code d'organisation. Le formulaire est encadre dans une carte avec le logo AEIP et un message de bienvenue. La gestion des erreurs est implementee de maniere granulaire : message d'erreur pour identifiants incorrects, pour compte inactif, ou pour code d'organisation invalide. Le formulaire affiche un etat de chargement pendant la verification des identifiants, empechant les soumissions multiples. Apres une authentification reussie, l'utilisateur est redirige automatiquement vers le tableau de bord correspondant a son type d'organisation, ou vers l'interface d'administration s'il est super-administrateur."));

content.push(heading3("3.7.2 Tableaux de bord"));

content.push(body("Chaque type d'organisation dispose d'un tableau de bord adapte a son contexte. Le tableau de bord universitaire affiche les indicateurs suivants : nombre total de documents, nombre d'etudiants (derive du nombre d'utilisateurs), nombre de cours et de recherches (calculé a partir du volume documentaire). Le tableau de bord hospitalier affiche le nombre de patients, de consultations et d'urgences. Chaque tableau de bord comprend quatre sections principales : les cartes de statistiques en haut, les graphiques de repartition au milieu, les documents recents et le fil d'activite en bas."));

content.push(body("L'interface du tableau de bord est construite a partir de composants reutilisables definis dans dashboard-widgets.tsx : StatCard pour les cartes de statistiques, ChartCard pour les graphiques, RecentList pour les listes de documents recents, et QuickActions pour les raccourcis d'actions frequentes. Cette approche modulaire garantit la coherence visuelle entre les differents tableaux de bord tout en permettant des variations contextuelles."));

content.push(heading3("3.7.3 Gestion documentaire"));

content.push(body("L'interface de gestion documentaire presente une vue en tableau des documents avec des colonnes pour le titre, la reference, le type, le statut, la classification, l'auteur et le departement. Des filtres dynamiques permettent de rechercher par texte, de filtrer par statut, type, classification et departement. Des actions contextuelles sont disponibles pour chaque document en fonction du role de l'utilisateur : soumettre en revision, approuver, rejeter, publier, archiver. Un dialogue de creation de document permet de saisir les informations necessaires : titre, description, type, classification et departement."));

content.push(heading3("3.7.4 Administration"));

content.push(body("L'interface d'administration est reservee aux super-administrateurs de la plateforme et presente une vue dediee avec une barre laterale violette distincte. Elle comprend les ecrans suivants : vue plateforme (statistiques globales sur les organisations, utilisateurs et documents), gestion des organisations (creation, modification, suspension), facturation (en cours de developpement), analytique (en cours de developpement) et catalogue de modules plateforme. L'interface d'administration des organisations permet au super-administrateur de superviser l'ensemble des organisations clientes, de gerer leurs abonnements et de controler l'activation des modules."));

content.push(heading3("3.7.5 Workflow Builder"));

content.push(body("Le constructeur de workflows offre une interface visuelle pour creer et modifier les workflows de validation. Il permet d'ajouter et de supprimer des etats, de definir des transitions entre les etats, et de specifier les roles autorises pour chaque transition. L'interface utilise le drag-and-drop via la bibliotheque @dnd-kit pour la reorganisation des etats, et presente chaque transition avec ses roles autorises sous forme de badges colores. Ce constructeur permet aux administrateurs d'organisation de personnaliser les circuits de validation sans modification du code source, offrant ainsi une flexibilite considerable dans l'adaptation du systeme aux evolutions des processus metier."));

content.push(heading3("3.7.6 Navigation adaptive"));

content.push(body("Le systeme de navigation de l'application est adapte au type d'organisation et au role de l'utilisateur. La barre laterale affiche les elements de navigation pertinents en fonction du role : un VIEWER ne voit que les Documents, les Archives et les Notifications, tandis qu'un ORG_ADMIN voit egalement les Workflows, les Modules, l'Audit, l'Administration et les Parametres. En outre, des elements de navigation specifiques au type d'organisation sont ajoutes : un raccourci Academique pour les universites, Medical pour les hopitaux, Procedures pour les gouvernements, et Juridique pour les cabinets juridiques. Cette adaptation automatique de la navigation evite la surcharge cognitive de l'utilisateur en ne lui presentant que les fonctionnalites accessibles et pertinentes pour son profil."));

// ==========================================
// 3.8 Tests et validation
// ==========================================
content.push(heading2("3.8 Tests et validation"));

content.push(body("La strategie de test de GED-ISIPA repose sur une approche pragmatique combinant la validation fonctionnelle manuelle et les tests d'integration verifies sur l'application deployee. Conformement au principe d'honnetete academique, nous presentons uniquement les tests reellement executes, sans inventer de metriques ou de resultats de tests automatises qui n'ont pas ete implementes."));

content.push(heading3("3.8.1 Validation du deploiement"));

content.push(body("Le premier test realise a consiste a verifier le bon fonctionnement du processus de deploiement complet. L'application a ete clonee depuis le depot GitHub sur un serveur VPS, et le script setup.sh a ete execute. Le resultat a confirme que l'application demarre correctement, que la base de donnees est initialisee avec les donnees de seed, et que les neuf comptes de test sont accessibles. La verification a ete effectuee via des requetes curl simulant le parcours d'authentification : envoi des identifiants, reception du cookie de session, et acces aux endpoints proteges avec le cookie."));

content.push(heading3("3.8.2 Validation de l'authentification"));

content.push(body("Chacun des neuf comptes de test a ete verifie individuellement. Les tests ont confirme que : chaque compte peut se connecter avec ses identifiants (email et mot de passe admin123) ; les utilisateurs non authentifies sont rediriges vers la page de connexion ; les utilisateurs authentifies sont rediriges vers leur tableau de bord specifique en fonction de leur type d'organisation ; le super-administrateur est redirige vers l'interface d'administration ; les mots de passe incorrects generent un message d'erreur approprie ; les codes d'organisation invalides sont detectes et signales."));

content.push(tableCaption("Tableau 3-8 : Comptes de test valides"));
content.push(makeThreeLineTable(
  ["Email", "Role", "Organisation", "Mot de passe"],
  [
    ["superadmin@aeip.cd", "SUPER_ADMIN", "AEIP Platform", "admin123"],
    ["admin@isipa.cd", "ORG_ADMIN", "ISIPA (Universite)", "admin123"],
    ["dean@isipa.cd", "DEAN", "ISIPA (Universite)", "admin123"],
    ["prof@isipa.cd", "PROFESSOR", "ISIPA (Universite)", "admin123"],
    ["admin@hopital.cd", "ORG_ADMIN", "Hopital Central", "admin123"],
    ["doctor@hopital.cd", "DOCTOR", "Hopital Central", "admin123"],
    ["nurse@hopital.cd", "NURSE", "Hopital Central", "admin123"],
    ["admin@minplan.cd", "ORG_ADMIN", "Ministere du Plan", "admin123"],
    ["agent@minplan.cd", "CIVIL_SERVANT", "Ministere du Plan", "admin123"],
  ]
));

content.push(heading3("3.8.3 Validation du cycle de vie documentaire"));

content.push(body("Le cycle de vie documentaire a ete valide en suivant le parcours complet d'un document depuis sa creation jusqu'a son archivage. Un document a ete cree en statut Brouillon, puis soumis en revision (transition vers En revision), approuve (transition vers Approuve), publie (transition vers Publie), et finalement archive. Chaque transition a ete effectuee par un utilisateur disposant du role approprie, et le journal d'audit a ete consulte pour verifier la tracabilite de chaque operation. Les tests ont confirme que : les transitions sont restreintes aux roles autorises ; les transitions non autorisees sont refusees avec un message d'erreur ; le statut du document est synchronise automatiquement avec l'etat du workflow ; chaque transition genere une entree dans le journal d'audit."));

content.push(heading3("3.8.4 Validation de l'isolation multi-tenant"));

content.push(body("L'isolation multi-tenant a ete validee en verifiant qu'un utilisateur d'une organisation ne peut pas acceder aux donnees d'une autre organisation. Les tests ont ete effectues en se connectant successivement avec des comptes appartenant a l'ISIPA, a l'Hopital Central et au Ministere du Plan, et en verifiant que les documents, utilisateurs et departements affiches sont exclusivement ceux de l'organisation concernee. L'endpoint /api/documents a ete interroge avec le jeton JWT de chaque organisation, confirmant que le filtre organizationId est applique systematiquement."));

content.push(heading3("3.8.5 Validation des endpoints API"));

content.push(body("Les endpoints API principaux ont ete testes via des requetes HTTP simulant les operations courantes. L'endpoint /api/health a ete verifie et retourne les informations de statut (version 2.0.0, statut OK). L'endpoint /api/dashboard retourne les statistiques adaptees au type d'organisation de l'utilisateur authentifie. L'endpoint /api/audit retourne le journal d'audit filtre par organisation avec pagination. L'endpoint /api/search permet la recherche globale sur les documents, utilisateurs et departements. Les tests ont confirme que tous les endpoints proteges retournent une erreur 401 en l'absence de jeton JWT valide, et une erreur 403 en cas de permissions insuffisantes."));

content.push(heading3("3.8.6 Limites des tests"));

content.push(body("Il est important de noter les limites de la strategie de test actuelle. Aucun framework de test automatise (comme Jest, Vitest ou Cypress) n'a ete integre au projet. Les tests presentes ci-dessus sont des tests manuels executés sur l'application deployee, ce qui ne garantit pas la reproductibilite ni la detection de regressions futures. L'integration d'un framework de test constitue une perspective d'amelioration prioritaire identifiee dans la section 3.10. De meme, aucune mesure de performance quantitative (temps de reponse, charge maximale supportee) n'a ete realisee, ces metriques necessitant des outils de benchmarking dedies qui n'ont pas ete deployes dans le cadre de ce travail."));

// ==========================================
// 3.9 Analyse critique
// ==========================================
content.push(heading2("3.9 Analyse critique"));

content.push(heading3("3.9.1 Forces de la solution"));

content.push(body("La solution GED-ISIPA presente plusieurs forces significatives. Premierement, l'architecture multi-tenant constitue une avancee notable par rapport a l'objectif initial d'une application mono-organisation, offrant une scalabilite et une flexibilite superieures. Deuxiemement, le systeme RBAC a quatorze roles avec une matrice de permissions fine depasse les implementations typiques de systemes de gestion documentaire academiques, qui se limitent souvent a deux ou trois roles. Troisiemement, le moteur de workflow configurable permet d'adapter les circuits de validation sans modification du code source, une fonctionnalite rarement presente dans les projets de fin d'etudes. Quatriemement, le systeme de modules activables offre une personnalisation par organisation qui enrichit considerablement la valeur de la plateforme. Cinquiemement, le deploiement Docker simplifie la mise en production et garantit la reproductibilite de l'environnement."));

content.push(body("Sur le plan technique, l'utilisation de TypeScript avec Prisma ORM assure un typage statique complet, reduisant les erreurs a l'execution et facilitant la maintenance. Le choix de Next.js 16 avec App Router permet de beneficier des dernieres avancees du framework, notamment le rendu hybride et les layouts imbriques. L'interface utilisateur, construite sur shadcn/ui et Tailwind CSS, offre une experience moderne et responsive, avec un theme sombre disponible."));

content.push(heading3("3.9.2 Limites actuelles"));

content.push(body("Plusieurs limites doivent etre reconnues de maniere transparente. Premierement, les mots de passe sont stockes et compares en texte clair, ce qui constitue une vulnerabilite de securite majeure en production. L'implementation du hachage bcrypt est une priorite absolue. Deuxiemement, le telechargement reel de fichiers n'est pas implemente : le systeme stocke uniquement les metadonnees des documents, le stockage physique require l'integration avec MinIO. Troisiemement, le rate limiting en memoire est perdu a chaque redemarrage du serveur et ne se partage pas entre les instances. Quatriemement, certaines statistiques du tableau de bord sont calculees de maniere approximative (par exemple, le nombre d'etudiants est derive du nombre d'utilisateurs multiplie par un coefficient) plutot que d'etre basees sur des donnees reelles. Cinquiemement, les modules Facturation et Analytique sont des placeholders non fonctionnels."));

content.push(body("D'un point de vue academique, l'absence de tests automatises constitue une lacune significative. Les tests presentes dans ce chapitre sont exclusivement manuels, ce qui ne permet pas de garantir la non-regression lors des evolutions futures. De meme, l'absence de documentation API formelle (type Swagger/OpenAPI) rend l'API moins accessible aux developpeurs tiers."));

content.push(heading3("3.9.3 Difficultes rencontrees et solutions apportees"));

content.push(body("Le developpement de GED-ISIPA a ete confronte a plusieurs difficultes techniques. La premiere difficulte a ete le pivot technologique : le planning initial preconisait Spring Boot avec React et PostgreSQL, mais l'equipe a decide d'adopter Next.js comme framework full-stack. Cette decision, bien que justifiee par les avantages mentionnes dans la section 3.3, a necessite un apprentissage significatif du framework et de ses specificites (App Router, Server Components, Route Handlers)."));

content.push(body("La deuxieme difficulte a ete la configuration du deploiement Docker. Huit problemes ont ete identifies et corriges lors de la mise en production : absence de script de deploiement, fichier .env.example incomplet, Dockerfile non fonctionnel, absence de configuration Nginx, base de donnees incorrecte dans docker-compose.yml, absence de configuration prisma.seed, scripts npm manquants, et utilisation de bun en production au lieu de node. Ces problemes ont ete resolus dans le commit b23283e, et un script setup.sh a ete cree pour automatiser le deploiement en une seule commande."));

content.push(body("La troisieme difficulte a ete la gestion de la complexite du systeme multi-tenant. L'isolation des donnees entre organisations a necessite une discipline rigoureuse dans l'implementation des requetes Prisma, chaque requete devant inclure le filtre organizationId. La mise en place du middleware de securite a egalement demande une attention particuliere pour garantir que toutes les routes protegees sont couvertes et que les redirections sont correctes pour chaque type d'organisation."));

// ==========================================
// 3.10 Perspectives d'amélioration
// ==========================================
content.push(heading2("3.10 Perspectives d'amelioration"));

content.push(heading3("3.10.1 Securite"));

content.push(body("L'amelioration la plus prioritaire concerne l'implementation du hachage des mots de passe avec bcrypt. Cette modification, deja documentee dans le code source par un commentaire explicite, est essentielle pour toute mise en production. En complement, l'integration de Content Security Policy (CSP) stricts, l'ajout de CORS configure par domaine, et l'utilisation de HTTPS obligatoire avec des certificats SSL valides constituent des imperatifs de securite. L'introduction de l'authentification multi-facteurs (MFA) pour les roles administratifs renforcerait significativement la protection des comptes sensibles."));

content.push(heading3("3.10.2 Tests automatises"));

content.push(body("L'integration d'un framework de test complet constitue la deuxieme priorite. L'objectif est d'atteindre une couverture de test minimale de 80% sur les fonctions metier critiques. L'approche recommandee comprend : Vitest pour les tests unitaires des fonctions metier (permissions, workflow, module-engine), Testing Library pour les tests de composants React, et Playwright ou Cypress pour les tests end-to-end simulant les parcours utilisateur complets. L'integration continue via GitHub Actions permettrait d'executer automatiquement les tests a chaque push, garantissant la detection precoce des regressions."));

content.push(heading3("3.10.3 Telechargement de fichiers"));

content.push(body("L'implementation du telechargement reel de fichiers avec integration MinIO est necessaire pour que le systeme soit pleinement operationnel. L'architecture actuelle stocke les metadonnees des documents en base de donnees, mais les fichiers eux-memes doivent etre stockes dans le service MinIO deja configure dans docker-compose.yml. L'implementation doit inclure la verification des types MIME, la limitation de la taille des fichiers, le calcul et la verification des empreintes numeriques (fileHash), et la gestion des versions de fichiers via le modele DocumentVersion."));

content.push(heading3("3.10.4 Scalabilite"));

content.push(body("Pour supporter un nombre croissant d'organisations et d'utilisateurs, plusieurs evolutions architecturales sont envisageables : migration du rate limiting en memoire vers Redis, permettant le partage entre instances ; mise en place d'un CDN pour les assets statiques ; introduction de la pagination cote serveur optimisee avec des curseurs ; separation potentielle de l'application en microservices (service d'authentification, service documentaire, service de workflow) si la complexite le justifie ; et implementation d'un systeme de cache HTTP avec les en-tetes de cache appropriés pour les donnees consultees frequemment."));

content.push(heading3("3.10.5 Fonctionnalites additionnelles"));

content.push(body("Plusieurs fonctionnalites additionnelles pourraient enrichir la plateforme : la signature electronique des documents pour completer le processus d'approbation ; la notification par email pour informer les utilisateurs des actions requises ; l'export PDF des documents et des rapports ; la recherche full-text avec Elasticsearch pour des performances superieures sur de grands volumes ; l'internationalisation complete via next-intl pour supporter d'autres langues que le francais ; et l'API documentee avec Swagger/OpenAPI pour faciliter l'integration avec des systemes tiers."));

// ==========================================
// Éléments clés à défendre
// ==========================================
content.push(heading1("ELEMENTS CLES A DEFENDRE DEVANT LE JURY"));

content.push(body("Cette section prepare la soutenance en presentant les elements cles que l'etudiant doit etre capable de justifier, de demontrer et de defendre devant le jury. Pour chaque element, nous fournissons la justification, les benefices et les reponses aux objections possibles."));

content.push(heading2("A. Choix technologiques"));

content.push(bodyBold("Justification : "));
content.push(body("Le pivot de Spring Boot vers Next.js a ete motive par la productivite accrue offerte par un framework full-stack unifie, eliminant la necessite de maintenir deux projets separes (backend Spring Boot et frontend React). Next.js 16 avec App Router offre le rendu hybride (SSR/CSR), les layouts imbriques pour la gestion des permissions par route, et le mode standalone pour le deploiement en conteneur optimise."));

content.push(bodyBold("Benefices : "));
content.push(body("Base de code unique, typage TypeScript de bout en bout, deploiement simplifie, performances de chargement optimisees par le SSR, et accessibilite immediate aux dernieres avancees de l'ecosysteme React."));

content.push(bodyBold("Reponse aux objections : "));
content.push(body("Si le jury questionne la maturite de Next.js, repondre que Next.js est utilise en production par des entreprises majeures (Vercel, Netflix, TikTok, Notion) et que la version 16 beneficie de trois ans de stabilisation de l'App Router. Si le jury questionne l'absence de Java/Spring Boot, repondre que le choix technologique a ete guide par la productivite et la coherence plutot que par la conformite a un stack traditionnel, et que TypeScript offre un typage statique comparable a Java."));

content.push(heading2("B. Choix architecturaux"));

content.push(bodyBold("Justification : "));
content.push(body("L'architecture multi-tenant a ete choisie pour transformer la solution d'un outil mono-organisation en une plateforme SaaS evolutive. L'isolation des donnees par organisationId dans chaque requete Prisma garantit la separation des donnees sans necessiter de schemas de base de donnees separes, simplifiant ainsi la gestion et la maintenance."));

content.push(bodyBold("Benefices : "));
content.push(body("Scalabilite horizontale (une seule instance sert plusieurs organisations), couts d'infrastructure reduits, mise a jour centralisee, et onboarding simplifie pour les nouvelles organisations."));

content.push(bodyBold("Reponse aux objections : "));
content.push(body("Si le jury questionne la robustesse de l'isolation, repondre que l'isolation applicative est appropriee pour le contexte actuel et que la migration vers des schemas PostgreSQL separes est possible sans modification de la logique metier. Si le jury questionne le choix de SQLite en developpement, repondre que SQLite offre une experience de developpeur optimale (zero configuration, demarrage instantane) et que la compatibilite PostgreSQL est assuree par Prisma ORM."));

content.push(heading2("C. Choix de securite"));

content.push(bodyBold("Justification : "));
content.push(body("La strategie JWT a ete choisie pour sa simplicite de deploiement et ses performances (pas de consultation de base de donnees pour chaque requete). Le middleware implemente un defense-in-depth avec rate limiting, en-tetes de securite, protection des routes et verification des permissions."));

content.push(bodyBold("Benefices : "));
content.push(body("Performances elevees (pas de round-trip en base pour chaque requete), scalabilite (jetons auto-contenus), et couverture de securite multi-niveaux."));

content.push(bodyBold("Reponse aux objections : "))
content.push(body("Si le jury questionne le stockage des mots de passe en clair, repondre de maniere transparente que cette limitation est identifiee et documentee, qu'elle est acceptable uniquement en phase de developpement, et que l'implementation de bcrypt est planifiee et techniquement simple (une ligne de code a modifier dans auth.ts). Si le jury questionne la revocabilite des jetons JWT, repondre que la duree de vie de 24 heures limite la fenetre d'exposition et que l'introduction d'une liste noire Redis est prevue."));

content.push(heading2("D. Choix de modelisation"));

content.push(bodyBold("Justification : "));
content.push(body("Le schema Prisma definit quatorze modeles couvrant l'ensemble des besoins fonctionnels identifies. Le choix de CUID comme format d'identifiant garantit l'unicite globale et la lisibilite. Les enumerations assurent la coherence des valeurs autorisees et la validation au niveau de la base de donnees."));

content.push(bodyBold("Benefices : "));
content.push(body("Typage statique complet (generation automatique de types TypeScript a partir du schema), migrations versionnees, documentation vivante du schema de donnees, et validation des contraintes au niveau ORM et base de donnees."));

content.push(bodyBold("Reponse aux objections : "));
content.push(body("Si le jury questionne le nombre de quatorze roles, repondre que chaque role correspond a un profil metier reel identifie dans les organisations cibles et que la matrice de permissions est extensible sans modification du schema. Si le jury questionne l'absence de certaines relations, repondre que le schema a ete concu selon le principe YAGNI (You Aren't Gonna Need It), n'incluant que les entites et relations effectivement utilisees par l'application."));

content.push(heading2("E. Principaux resultats obtenus"));

content.push(bodyBold("Resultats quantitatifs : "));
content.push(bullet("14 modeles de donnees implementes et deployes"));
content.push(bullet("14 roles RBAC avec matrice de permissions couvrant 9 ressources et 12 types d'actions"));
content.push(bullet("8 types d'organisations supportees avec tableaux de bord adaptes"));
content.push(bullet("16 modules fonctionnalitaires avec gestion des dependances"));
content.push(bullet("17 types d'actions tracees dans le journal d'audit"));
content.push(bullet("30+ endpoints API RESTful documents et securises"));
content.push(bullet("9 comptes de test valides couvrant 3 organisations et 7 roles differents"));
content.push(bullet("22 pages d'interface utilisateur implementees"));
content.push(bullet("5 services Docker conteneurises pour le deploiement en production"));

content.push(bodyBold("Resultats qualitatifs : "));
content.push(bullet("Deploiement en une seule commande (setup.sh) validé sur serveur VPS"));
content.push(bullet("Cycle de vie documentaire complet (Brouillon a Archive) fonctionnel"));
content.push(bullet("Isolation multi-tenant verifiee et validee"));
content.push(bullet("Interface utilisateur moderne, responsive et accessible"));
content.push(bullet("Tracabilite complete des operations via le journal d'audit"));

// ===== BUILD DOCUMENT =====
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: P.body },
        paragraph: { spacing: { line: 360 } },
      },
    },
    heading1: {
      run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: P.primary },
      paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360, line: 360 } },
    },
    heading2: {
      run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 30, bold: true, color: P.primary },
      paragraph: { spacing: { before: 360, after: 240, line: 360 } },
    },
    heading3: {
      run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: P.primary },
      paragraph: { spacing: { before: 240, after: 120, line: 360 } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417, header: 850, footer: 992 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: buildHeader("Chapitre III - Implementation de la Solution GED-ISIPA") },
      footers: { default: buildFooter() },
      children: content,
    },
  ],
});

const outputPath = path.join(__dirname, "Chapitre3_GED_ISIPA_Final.docx");
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf);
  console.log(`Document generated: ${outputPath}`);
  console.log(`Size: ${(buf.length / 1024).toFixed(1)} KB`);
});
