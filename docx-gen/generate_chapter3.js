const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, AlignmentType, HeadingLevel, SectionType,
  TableOfContents, PageNumber, Header, Footer, BorderStyle, WidthType,
  ShadingType, NumberFormat
} = require("docx");

// ─── Palette & Constants ───
const P = {
  primary: "000000", body: "000000", secondary: "333333",
  accent: "8B7E5A", surface: "F5F7FA"
};
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417, header: 850, footer: 992 };

// ─── Helper functions ───
function safeText(v, ph) { return (v === undefined || v === null || v === "" || String(v) === "undefined") ? (ph || "【】") : String(v); }

function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 360, after: 120 },
    ...opts,
    children: [new TextRun({ text, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
  });
}

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

function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
    keepNext: true,
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.secondary })]
  });
}

function figureCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.secondary })]
  });
}

// Three-line table helper
function threeLineTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
        left: NB, right: NB
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, bold: true, size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
      })]
    }))
  });
  const dataRows = rows.map(row => new TableRow({
    cantSplit: true,
    children: row.map((cell, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      borders: { top: NB, bottom: NB, left: NB, right: NB },
      margins: { top: 40, bottom: 40, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(cell), size: 21, font: { ascii: "Times New Roman", eastAsia: "SimSun" }, color: P.body })]
      })]
    }))
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: NB, right: NB, insideHorizontal: NB, insideVertical: NB
    },
    rows: [headerRow, ...dataRows]
  });
}

// Screenshot embedding
const SCREENSHOTS_DIR = "/home/z/my-project/download/screenshots";
const screenshotMap = {
  "3.1": "01-login-page.png",
  "3.2": "02-dashboard-admin.png",
  "3.3": "03-documents-list.png",
  "3.4": "04-document-detail.png",
  "3.5": "05-archives.png",
  "3.6": "06-audit-log.png",
  "3.7": "07-administration.png",
  "3.8": "08-health-check-api.png",
  "3.9": "09-director-dashboard.png",
  "3.10": "10-archivist-archives.png",
  "3.11": "11-secretary-dashboard.png",
};

function embedScreenshot(figNum) {
  const fname = screenshotMap[figNum];
  if (!fname) return [];
  const fpath = path.join(SCREENSHOTS_DIR, fname);
  if (!fs.existsSync(fpath)) return [];
  const imgBuf = fs.readFileSync(fpath);
  // Max width ~460pt = ~9200 twips; maintain aspect ratio for 1440x900
  const maxWidthPt = 460;
  const origW = 1440, origH = 900;
  const ratio = origH / origW;
  const w = maxWidthPt;
  const h = Math.round(maxWidthPt * ratio);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new ImageRun({ data: imgBuf, transformation: { width: w, height: h }, type: "png" })]
    })
  ];
}

// ─── Page number footer ───
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "- ", size: 21, font: { ascii: "Times New Roman" } }),
        new TextRun({ children: [PageNumber.CURRENT], size: 21, font: { ascii: "Times New Roman" } }),
        new TextRun({ text: " -", size: 21, font: { ascii: "Times New Roman" } }),
      ]
    })]
  });
}

// ─── Build Cover ───
function buildCover() {
  const infoRows = [
    ["D\u00e9partement", "Sciences Informatiques"],
    ["Option", "G\u00e9nie Logiciel"],
    ["Ann\u00e9e acad.", "2024-2025"],
  ];
  const infoTable = new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    borders: allNoBorders,
    rows: infoRows.map(([label, value]) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, top: NB, left: NB, right: NB },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: label + " :", size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
          })]
        }),
        new TableCell({
          borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, top: NB, left: NB, right: NB },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: value, size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
          })]
        }),
      ]
    }))
  });

  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "R\u00c9PUBLIQUE D\u00c9MOCRATIQUE DU CONGO", size: 28, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200, line: 552, lineRule: "atLeast" },
      children: [new TextRun({ text: "MINIST\u00c8RE DE L\u2019ENSEIGNEMENT SUP\u00c9RIEUR ET UNIVERSITAIRE", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 100, line: 552, lineRule: "atLeast" },
      children: [new TextRun({ text: "INSTITUT SUP\u00c9RIEUR P\u00c9DAGOGIQUE D\u2019APPLICATION", size: 26, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600, line: 552, lineRule: "atLeast" },
      children: [new TextRun({ text: "ISIPA \u2013 Binza-Ozone, Kinshasa", size: 22, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "M\u00c9MOIRE DE FIN D\u2019\u00c9TUDES", size: 32, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "Conception et Impl\u00e9mentation d\u2019un Syst\u00e8me de", size: 28, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "Gestion \u00c9lectronique des Documents", size: 28, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600, line: 552, lineRule: "atLeast" },
      children: [new TextRun({ text: "pour l\u2019ISIPA \u2013 GED-ISIPA", size: 24, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "CHAPITRE III", size: 30, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 800, line: 828, lineRule: "atLeast" },
      children: [new TextRun({ text: "IMPL\u00c9MENTATION", size: 30, bold: true, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })] }),
    infoTable,
  ];
}

// ─── Build Body Content ───
function buildBody() {
  const content = [];

  // ── INTRODUCTION ──
  content.push(heading1("INTRODUCTION"));
  content.push(bodyPara("Le pr\u00e9sent chapitre constitue le c\u0153ur op\u00e9rationnel de notre travail de recherche. Il d\u00e9taille l\u2019ensemble du processus d\u2019impl\u00e9mentation du syst\u00e8me de Gestion \u00c9lectronique des Documents pour l\u2019ISIPA (GED-ISIPA), depuis l\u2019analyse des besoins jusqu\u2019\u00e0 la pr\u00e9sentation du produit final. Ce chapitre vise \u00e0 d\u00e9montrer la faisabilit\u00e9 technique de la solution propos\u00e9e et \u00e0 fournir une documentation compl\u00e8te de l\u2019impl\u00e9mentation r\u00e9alis\u00e9e."));
  content.push(bodyPara("Nous aborderons successivement six sections essentielles : le rappel de l\u2019\u00e9nonc\u00e9 du probl\u00e8me, l\u2019analyse d\u00e9taill\u00e9e des exigences, la conception du syst\u00e8me selon la m\u00e9thode MERISE, le d\u00e9veloppement effectif avec les choix technologiques, les tests de validation, et enfin la pr\u00e9sentation du produit final avec les captures d\u2019\u00e9cran r\u00e9elles de l\u2019application d\u00e9ploy\u00e9e."));
  content.push(bodyPara("Un point important m\u00e9rite d\u2019\u00eatre soulign\u00e9 d\u2019embl\u00e9e : le Chapitre II, dans sa planification WBS, mentionnait l\u2019utilisation de Spring Boot, React et PostgreSQL. Cependant, l\u2019impl\u00e9mentation r\u00e9elle a opt\u00e9 pour Next.js 14, Prisma ORM et SQLite. Ce pivot technologique sera document\u00e9 de mani\u00e8re transparente dans la section 3.4.1, avec une justification technique d\u00e9taill\u00e9e de chaque choix."));

  // ── 3.1 RAPPEL ──
  content.push(heading1("3.1. Rappel de l\u2019\u00e9nonc\u00e9"));
  content.push(bodyPara("Le probl\u00e8me fondamental qui a motiv\u00e9 ce travail de recherche est la gestion exclusivement manuelle des documents au sein de l\u2019Institut Sup\u00e9rieur P\u00e9dagogique d\u2019Application (ISIPA). Cette gestion manuelle engendre des difficult\u00e9s majeures : perte fr\u00e9quente de documents, d\u00e9lais excessifs de recherche, absence de tra\u00e7abilit\u00e9 des op\u00e9rations, difficult\u00e9 de contr\u00f4le d\u2019acc\u00e8s aux documents sensibles, et absence de m\u00e9canisme d\u2019archivage structur\u00e9. Ces probl\u00e8mes affectent directement l\u2019efficacit\u00e9 op\u00e9rationnelle de l\u2019institution et la qualit\u00e9 du service rendu aux \u00e9tudiants et au personnel."));
  content.push(bodyPara("Parmi les probl\u00e8mes identifi\u00e9s lors de l\u2019\u00e9tude pr\u00e9alable (Chapitre I et II), on peut citer : la lenteur des processus de traitement des documents, le risque \u00e9lev\u00e9 de perte ou de deterioration des documents papier, l\u2019impossibilit\u00e9 de suivre le cycle de vie d\u2019un document, l\u2019absence de contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les, et l\u2019inexistence d\u2019un syst\u00e8me d\u2019audit permettant de tracer les actions effectu\u00e9es sur les documents. Ces constats ont \u00e9t\u00e9 confirm\u00e9s par les entretiens avec les acteurs cl\u00e9s de l\u2019ISIPA et l\u2019observation directe des processus documentaires existants."));
  content.push(bodyPara("L\u2019objectif principal de ce travail est donc la conception et l\u2019impl\u00e9mentation d\u2019un syst\u00e8me de Gestion \u00c9lectronique des Documents (GED) adapt\u00e9 au contexte sp\u00e9cifique de l\u2019ISIPA, int\u00e9grant un workflow documentaire, un contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les (RBAC), un syst\u00e8me d\u2019archivage, et un journal d\u2019audit complet. La solution doit \u00eatre accessible via un navigateur web, s\u00e9curis\u00e9e, et facile \u00e0 maintenir."));

  // ── 3.2 ANALYSE ──
  content.push(heading1("3.2. L\u2019Analyse"));
  content.push(bodyPara("L\u2019analyse constitue la premi\u00e8re \u00e9tape de la m\u00e9thode MERISE, telle que pr\u00e9sent\u00e9e au Chapitre I de ce m\u00e9moire. Elle vise \u00e0 identifier et \u00e0 formaliser les besoins du syst\u00e8me, tant fonctionnels que non fonctionnels, ainsi qu\u2019\u00e0 d\u00e9finir les acteurs qui interagiront avec le syst\u00e8me. Cette phase est cruciale car elle d\u00e9termine les fondations sur lesquelles reposera l\u2019ensemble de la conception et du d\u00e9veloppement."));

  // 3.2.1
  content.push(heading2("3.2.1. Analyse des besoins fonctionnels"));
  content.push(bodyPara("L\u2019analyse des besoins fonctionnels a \u00e9t\u00e9 conduite \u00e0 partir des entretiens avec les acteurs cl\u00e9s de l\u2019ISIPA et de l\u2019observation des processus documentaires existants. Cinq axes fonctionnels majeurs ont \u00e9t\u00e9 identifi\u00e9s, correspondant aux besoins fondamentaux du syst\u00e8me de GED. Chaque axe a \u00e9t\u00e9 d\u00e9clin\u00e9 en exigences pr\u00e9cises, permettant de d\u00e9finir le p\u00e9rim\u00e8tre fonctionnel complet du syst\u00e8me."));
  content.push(bodyPara("Le premier axe concerne la gestion des documents elle-m\u00eame, qui inclut la cr\u00e9ation, la modification, la suppression et la consultation des documents. Le deuxi\u00e8me axe porte sur le workflow documentaire, d\u00e9finissant le cycle de vie d\u2019un document depuis sa cr\u00e9ation jusqu\u2019\u00e0 son archivage, en passant par les \u00e9tapes de r\u00e9vision, d\u2019approbation et de publication. Le troisi\u00e8me axe concerne la gestion des utilisateurs et l\u2019authentification s\u00e9curis\u00e9e, avec un syst\u00e8me de contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les (RBAC) distinguant cinq profils diff\u00e9rents. Le quatri\u00e8me axe traite de l\u2019archivage et de la classification des documents selon quatre niveaux de s\u00e9curit\u00e9. Enfin, le cinqui\u00e8me axe couvre la tra\u00e7abilit\u00e9 et l\u2019audit des op\u00e9rations."));
  content.push(tableCaption("Tableau 3.1 \u2013 Synth\u00e8se des besoins fonctionnels du syst\u00e8me GED-ISIPA"));
  content.push(threeLineTable(
    ["Axe fonctionnel", "Exigences cl\u00e9s", "Priorit\u00e9"],
    [
      ["Gestion des documents", "CRUD, recherche, filtrage, t\u00e9l\u00e9chargement", "Haute"],
      ["Workflow documentaire", "6 \u00e9tats, 9 transitions, validation multi-r\u00f4les", "Haute"],
      ["Authentification & RBAC", "5 r\u00f4les, sessions s\u00e9curis\u00e9es, bcrypt", "Haute"],
      ["Archivage & classification", "4 niveaux, p\u00e9riode de r\u00e9tention, restauration", "Moyenne"],
      ["Audit & tra\u00e7abilit\u00e9", "12 actions, journal horodat\u00e9, filtres", "Moyenne"],
    ],
    [35, 45, 20]
  ));

  // 3.2.2
  content.push(heading2("3.2.2. Analyse des besoins non fonctionnels"));
  content.push(bodyPara("Les besoins non fonctionnels d\u00e9finissent les qualit\u00e9s de service que le syst\u00e8me doit respecter. Ils sont tout aussi d\u00e9terminants que les besoins fonctionnels car ils conditionnent l\u2019adoption effective du syst\u00e8me par les utilisateurs et sa p\u00e9rennit\u00e9 dans le temps. Quatre cat\u00e9gories de besoins non fonctionnels ont \u00e9t\u00e9 identifi\u00e9es : la s\u00e9curit\u00e9, la performance, la maintenabilit\u00e9 et l\u2019utilisabilit\u00e9."));
  content.push(bodyPara("La s\u00e9curit\u00e9 constitue le besoin non fonctionnel le plus critique. Le syst\u00e8me doit garantir la confidentialit\u00e9 des documents sensibles, l\u2019int\u00e9grit\u00e9 des donn\u00e9es, et la tra\u00e7abilit\u00e9 de toutes les op\u00e9rations. L\u2019authentification doit utiliser un hachage s\u00e9curis\u00e9 des mots de passe (bcrypt avec 12 salt rounds), et les sessions doivent \u00eatre g\u00e9r\u00e9es via des tokens JWT sign\u00e9s. La performance exige un temps de r\u00e9ponse inf\u00e9rieur \u00e0 2 secondes pour les op\u00e9rations courantes, ce qui a guid\u00e9 le choix de SQLite pour un d\u00e9ploiement \u00e0 l\u2019\u00e9chelle de l\u2019institution."));
  content.push(bodyPara("La maintenabilit\u00e9 a \u00e9t\u00e9 prise en compte \u00e0 travers l\u2019adoption d\u2019une architecture modulaire, d\u2019un ORM (Prisma) pour l\u2019abstraction de la base de donn\u00e9es, et de TypeScript pour le typage statique r\u00e9duisant les erreurs \u00e0 l\u2019ex\u00e9cution. L\u2019utilisabilit\u00e9 a \u00e9t\u00e9 adress\u00e9e par l\u2019utilisation de composants UI coh\u00e9rents (shadcn/ui), d\u2019une navigation adapt\u00e9e au r\u00f4le de l\u2019utilisateur, et de formulaires avec validation en temps r\u00e9el."));
  content.push(tableCaption("Tableau 3.2 \u2013 Besoins non fonctionnels du syst\u00e8me GED-ISIPA"));
  content.push(threeLineTable(
    ["Cat\u00e9gorie", "Exigence", "Crit\u00e8re d\u2019acceptation"],
    [
      ["S\u00e9curit\u00e9 (NF1)", "Hachage bcrypt, JWT, RBAC", "Aucun acc\u00e8s non autoris\u00e9"],
      ["Performance (NF2)", "Temps de r\u00e9ponse < 2s", "95e centile < 2s"],
      ["Maintenabilit\u00e9 (NF3)", "Architecture modulaire, TypeScript", "Ajout de fonctionnalit\u00e9 < 2j"],
      ["Utilisabilit\u00e9 (NF4)", "Interface intuitive, feedback", "Formation < 30 min"],
    ],
    [30, 35, 35]
  ));

  // 3.2.3
  content.push(heading2("3.2.3. Identification des acteurs"));
  content.push(bodyPara("L\u2019identification des acteurs du syst\u00e8me GED-ISIPA s\u2019est appuy\u00e9e sur l\u2019analyse organisationnelle de l\u2019ISIPA pr\u00e9sent\u00e9e au Chapitre I. Chaque acteur correspond \u00e0 un r\u00f4le fonctionnel dans l\u2019institution, avec des responsabilit\u00e9s et des droits d\u2019acc\u00e8s sp\u00e9cifiques au sein du syst\u00e8me de GED."));
  content.push(bodyPara("Le syst\u00e8me pr\u00e9voit cinq r\u00f4les distincts, chacun associ\u00e9 \u00e0 un ensemble pr\u00e9cis de permissions. L\u2019Administrateur Syst\u00e8me (ADMIN) dispose d\u2019un acc\u00e8s complet \u00e0 toutes les fonctionnalit\u00e9s du syst\u00e8me, y compris la gestion des utilisateurs et des param\u00e8tres. Le Directeur (DIRECTOR) supervise les documents et les approuve, avec une vue d\u2019ensemble de l\u2019activit\u00e9 documentaire. Le Secr\u00e9taire (SECRETARY) est responsable de la cr\u00e9ation et de la gestion quotidienne des documents. L\u2019Archiviste (ARCHIVIST) g\u00e8re l\u2019archivage et le classement des documents. Enfin, le Lecteur (VIEWER) dispose d\u2019un acc\u00e8s en lecture seule aux documents qui lui sont affect\u00e9s."));
  content.push(tableCaption("Tableau 3.3 \u2013 Acteurs du syst\u00e8me GED-ISIPA et donn\u00e9es r\u00e9elles"));
  content.push(threeLineTable(
    ["R\u00f4le", "Permissions principales", "Donn\u00e9es seed"],
    [
      ["ADMIN", "Acc\u00e8s complet, gestion utilisateurs, param\u00e8tres", "admin@isipa.ac.cd"],
      ["DIRECTOR", "Approbation, supervision, tableaux de bord", "director@isipa.ac.cd"],
      ["SECRETARY", "CRUD documents, soumission workflow", "secretary@isipa.ac.cd"],
      ["ARCHIVIST", "Archivage, restauration, gestion archives", "archivist@isipa.ac.cd"],
      ["VIEWER", "Consultation documents, t\u00e9l\u00e9chargement", "viewer@isipa.ac.cd"],
    ],
    [20, 45, 35]
  ));

  // ── 3.3 CONCEPTION ──
  content.push(heading1("3.3. La Conception"));
  content.push(bodyPara("La conception du syst\u00e8me GED-ISIPA s\u2019inscrit dans le cadre m\u00e9thodologique MERISE pr\u00e9sent\u00e9 au Chapitre I. Cette m\u00e9thodologie structur\u00e9e permet de passer progressivement d\u2019une repr\u00e9sentation abstraite du domaine \u00e0 une impl\u00e9mentation concr\u00e8te dans le SGBD choisi. Les diff\u00e9rents niveaux de conception (MCD, MLD, MPD) garantissent la coh\u00e9rence entre l\u2019analyse des besoins et la r\u00e9alisation technique."));

  // 3.3.1
  content.push(heading2("3.3.1. Mod\u00e8le Conceptuel des Donn\u00e9es (MCD)"));
  content.push(bodyPara("Le Mod\u00e8le Conceptuel des Donn\u00e9es constitue la repr\u00e9sentation abstraite des entit\u00e9s du domaine et de leurs associations, ind\u00e9pendamment de toute consid\u00e9ration technique d\u2019impl\u00e9mentation. Il formalise les r\u00e8gles de gestion identifi\u00e9es lors de la phase d\u2019analyse et sert de r\u00e9f\u00e9rence pour la validation fonctionnelle du syst\u00e8me."));
  content.push(bodyPara("Le MCD du syst\u00e8me GED-ISIPA comporte cinq entit\u00e9s principales : User (Utilisateur), Document, Department (D\u00e9partement), AuditLog (Journal d\u2019audit) et DocumentVersion (Version de document). L\u2019entit\u00e9 User est li\u00e9e \u00e0 Department par une association d\u2019appartenance (un utilisateur appartient \u00e0 un d\u00e9partement, un d\u00e9partement contient plusieurs utilisateurs). L\u2019entit\u00e9 Document est li\u00e9e \u00e0 User par une relation d\u2019auteur (chaque document est cr\u00e9\u00e9 par un utilisateur) et \u00e0 Department par une relation d\u2019affectation (chaque document appartient \u00e0 un d\u00e9partement)."));
  content.push(tableCaption("Tableau 3.4 \u2013 Entit\u00e9s du MCD et leurs propri\u00e9t\u00e9s"));
  content.push(threeLineTable(
    ["Entit\u00e9", "Propri\u00e9t\u00e9s cl\u00e9s", "Identifiant"],
    [
      ["User", "email, name, password, role, isActive", "id (cuid)"],
      ["Document", "title, reference, type, status, classification, filePath, fileHash", "id (cuid)"],
      ["Department", "name, code, description", "id (cuid)"],
      ["AuditLog", "action, entityType, entityId, details, ipAddress", "id (cuid)"],
      ["DocumentVersion", "version, filePath, fileName, fileHash, changeLog", "id (cuid)"],
    ],
    [20, 55, 25]
  ));
  content.push(bodyPara("Les cardinalit\u00e9s du MCD formalisent les r\u00e8gles de gestion suivantes : chaque document est obligatoirement cr\u00e9\u00e9 par un utilisateur (cardinalit\u00e9 1,1), un utilisateur peut cr\u00e9er plusieurs documents (0,N) ; chaque document appartient \u00e0 un d\u00e9partement (1,1), un d\u00e9partement contient plusieurs documents (0,N) ; chaque entr\u00e9e d\u2019audit est g\u00e9n\u00e9r\u00e9e par un utilisateur (1,1), un utilisateur peut g\u00e9n\u00e9rer plusieurs entr\u00e9es d\u2019audit (0,N)."));

  // 3.3.2
  content.push(heading2("3.3.2. Mod\u00e8le Logique des Donn\u00e9es (MLD)"));
  content.push(bodyPara("Le Mod\u00e8le Logique des Donn\u00e9es constitue la traduction du MCD en termes de relations (tables) et de cl\u00e9s, en vue de l\u2019impl\u00e9mentation dans un SGBD. Il d\u00e9finit la structure logique des donn\u00e9es en pr\u00e9cisant les cl\u00e9s primaires, les cl\u00e9s \u00e9trang\u00e8res et les contraintes d\u2019int\u00e9grit\u00e9 r\u00e9f\u00e9rentielle."));
  content.push(bodyPara("Le MLD du syst\u00e8me GED-ISIPA se compose de cinq relations principales. La relation User contient les attributs id (cl\u00e9 primaire), email (unique), name, password, role, departmentId (cl\u00e9 \u00e9trang\u00e8re vers Department), isActive, lastLogin, createdAt et updatedAt. La relation Document contient les attributs id (cl\u00e9 primaire), title, reference (unique), description, type, status, classification, filePath, fileName, fileSize, mimeType, fileHash, version, authorId (cl\u00e9 \u00e9trang\u00e8re vers User), departmentId (cl\u00e9 \u00e9trang\u00e8re vers Department), ainsi que les champs d\u2019archivage (isArchived, archivedAt, archivedBy, archiveRef, retentionPeriod, expiresAt)."));
  content.push(tableCaption("Tableau 3.5 \u2013 Structure logique des relations du MLD"));
  content.push(threeLineTable(
    ["Relation", "Cl\u00e9 primaire", "Cl\u00e9s \u00e9trang\u00e8res"],
    [
      ["User", "id", "departmentId \u2192 Department"],
      ["Document", "id", "authorId \u2192 User, departmentId \u2192 Department"],
      ["Department", "id", "\u2014"],
      ["AuditLog", "id", "userId \u2192 User, documentId \u2192 Document"],
      ["DocumentVersion", "id", "documentId \u2192 Document"],
    ],
    [30, 30, 40]
  ));

  // 3.3.3
  content.push(heading2("3.3.3. Mod\u00e8le Physique des Donn\u00e9es (MPD)"));
  content.push(bodyPara("Le Mod\u00e8le Physique des Donn\u00e9es repr\u00e9sente l\u2019impl\u00e9mentation concr\u00e8te du MLD dans le SGBD choisi, en l\u2019occurrence SQLite dans le cas du syst\u00e8me GED-ISIPA. Le sch\u00e9ma Prisma constitue le point de d\u00e9finition du MPD, assurant la correspondance automatique entre le mod\u00e8le logique et la structure physique de la base de donn\u00e9es."));
  content.push(bodyPara("Le sch\u00e9ma Prisma d\u00e9finit les types de donn\u00e9es suivants pour chaque attribut : les identifiants sont de type String avec g\u00e9n\u00e9ration automatique via cuid() ; les \u00e9num\u00e9rations (Role, DocumentType, DocumentStatus, Classification, AuditAction) garantissent la coh\u00e9rence des valeurs ; les dates utilisent le type DateTime avec fonctions @default(now()) et @updatedAt ; les attributs @unique assurent l\u2019unicit\u00e9 des r\u00e9f\u00e9rences et des emails ; les relations sont explicitement d\u00e9finies via @relation avec les cl\u00e9s \u00e9trang\u00e8res correspondantes."));
  content.push(tableCaption("Tableau 3.6 \u2013 Correspondance MLD \u2192 MPD (types Prisma/SQLite)"));
  content.push(threeLineTable(
    ["Type MLD", "Type Prisma", "Type SQLite"],
    [
      ["String (id)", "String @id @default(cuid())", "TEXT PRIMARY KEY"],
      ["String (unique)", "String @unique", "TEXT UNIQUE"],
      ["Enum", "enum { ... }", "TEXT (contr\u00f4le applicatif)"],
      ["DateTime", "DateTime @default(now())", "TEXT (ISO 8601)"],
      ["Boolean", "Boolean @default(true)", "INTEGER (0/1)"],
      ["Int", "Int", "INTEGER"],
    ],
    [35, 35, 30]
  ));

  // 3.3.4
  content.push(heading2("3.3.4. Architecture du syst\u00e8me"));
  content.push(bodyPara("L\u2019architecture technique du syst\u00e8me GED-ISIPA repose sur le mod\u00e8le d\u2019application fullstack Next.js, qui int\u00e8gre \u00e0 la fois la couche de pr\u00e9sentation (frontend) et la couche logique m\u00e9tier (backend API) au sein d\u2019un m\u00eame projet. Cette architecture monolithique simplifi\u00e9e pr\u00e9sente des avantages significatifs pour un d\u00e9ploiement \u00e0 l\u2019\u00e9chelle d\u2019une institution comme l\u2019ISIPA."));
  content.push(bodyPara("La couche de pr\u00e9sentation est constitu\u00e9e des composants React organis\u00e9s selon le mod\u00e8le de routage App Router de Next.js 14. Le r\u00e9pertoire app/ contient les pages et les layouts, tandis que le r\u00e9pertoire components/ regroupe les composants r\u00e9utilisables de l\u2019interface utilisateur. La biblioth\u00e8que shadcn/ui fournit les composants de base (boutons, formulaires, modales, tables) avec un style coh\u00e9rent. Tailwind CSS est utilis\u00e9 pour la personnalisation visuelle et la mise en page responsive."));
  content.push(bodyPara("La couche logique m\u00e9tier est impl\u00e9ment\u00e9e via les API Routes de Next.js (r\u00e9pertoire app/api/), qui exposent des endpoints RESTful pour toutes les op\u00e9rations du syst\u00e8me. La couche d\u2019acc\u00e8s aux donn\u00e9es est assur\u00e9e par Prisma ORM, qui fournit une abstraction de haut niveau pour les op\u00e9rations CRUD tout en g\u00e9n\u00e9rant des requ\u00eates SQL optimis\u00e9es pour SQLite."));
  content.push(tableCaption("Tableau 3.7 \u2013 Architecture technique du syst\u00e8me GED-ISIPA"));
  content.push(threeLineTable(
    ["Couche", "Technologie", "R\u00f4le"],
    [
      ["Pr\u00e9sentation", "React + Next.js App Router + shadcn/ui", "Interface utilisateur, navigation, formulaires"],
      ["Logique m\u00e9tier", "Next.js API Routes (Route Handlers)", "Endpoints REST, validation, workflow"],
      ["Acc\u00e8s donn\u00e9es", "Prisma ORM + SQLite", "CRUD, migrations, relations, typage"],
      ["Authentification", "NextAuth.js (Credentials Provider)", "Sessions JWT, hachage bcrypt, RBAC"],
      ["S\u00e9curit\u00e9", "Middleware Next.js + JWT + SHA-256", "Contr\u00f4le d\u2019acc\u00e8s, int\u00e9grit\u00e9 fichiers"],
    ],
    [25, 40, 35]
  ));

  // 3.3.5
  content.push(heading2("3.3.5. Design du workflow documentaire"));
  content.push(bodyPara("Le workflow documentaire constitue le c\u0153ur fonctionnel du syst\u00e8me GED-ISIPA. Il d\u00e9finit le cycle de vie complet d\u2019un document, depuis sa cr\u00e9ation en tant que brouillon jusqu\u2019\u00e0 son archivage final. Le workflow a \u00e9t\u00e9 con\u00e7u pour r\u00e9pondre aux exigences de tra\u00e7abilit\u00e9, de validation et de contr\u00f4le qualit\u00e9 identifi\u00e9es lors de l\u2019analyse des besoins."));
  content.push(bodyPara("Le workflow comporte six \u00e9tats distincts, chacun associ\u00e9 \u00e0 des droits d\u2019action sp\u00e9cifiques selon le r\u00f4le de l\u2019utilisateur. L\u2019\u00e9tat DRAFT (Brouillon) est l\u2019\u00e9tat initial de tout document cr\u00e9\u00e9 ; seul l\u2019auteur ou un administrateur peut le modifier ou le soumettre pour r\u00e9vision. L\u2019\u00e9tat PENDING_REVIEW (En attente de r\u00e9vision) indique que le document a \u00e9t\u00e9 soumis pour validation ; le directeur ou l\u2019administrateur peut l\u2019approuver ou le rejeter. L\u2019\u00e9tat APPROVED (Approuv\u00e9) signifie que le document a \u00e9t\u00e9 valid\u00e9 ; l\u2019administrateur peut le publier. L\u2019\u00e9tat PUBLISHED (Publi\u00e9) indique que le document est officiel et accessible ; l\u2019archiviste ou l\u2019administrateur peut l\u2019archiver. L\u2019\u00e9tat ARCHIVED (Archiv\u00e9) marque la fin du cycle de vie actif ; seul l\u2019administrateur peut restaurer un document archiv\u00e9. L\u2019\u00e9tat REJECTED (Rejet\u00e9) permet \u00e0 l\u2019auteur de modifier et resoumettre un document refus\u00e9."));
  content.push(tableCaption("Tableau 3.8 \u2013 \u00c9tats du workflow documentaire et transitions autoris\u00e9es"));
  content.push(threeLineTable(
    ["\u00c9tat actuel", "Transition", "R\u00f4le autoris\u00e9"],
    [
      ["DRAFT", "DRAFT \u2192 PENDING_REVIEW", "Auteur, ADMIN"],
      ["PENDING_REVIEW", "PENDING_REVIEW \u2192 APPROVED", "DIRECTOR, ADMIN"],
      ["PENDING_REVIEW", "PENDING_REVIEW \u2192 REJECTED", "DIRECTOR, ADMIN"],
      ["APPROVED", "APPROVED \u2192 PUBLISHED", "ADMIN"],
      ["PUBLISHED", "PUBLISHED \u2192 ARCHIVED", "ARCHIVIST, ADMIN"],
      ["ARCHIVED", "ARCHIVED \u2192 DRAFT (restauration)", "ADMIN"],
      ["REJECTED", "REJECTED \u2192 DRAFT (modification)", "Auteur, ADMIN"],
      ["DRAFT", "DRAFT \u2192 PUBLISHED (direct)", "ADMIN"],
      ["PUBLISHED", "PUBLISHED \u2192 DRAFT (nouvelle version)", "ADMIN"],
    ],
    [30, 40, 30]
  ));

  // 3.3.6
  content.push(heading2("3.3.6. Matrice de contr\u00f4le d\u2019acc\u00e8s (RBAC)"));
  content.push(bodyPara("La matrice de contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les (RBAC - Role-Based Access Control) d\u00e9finit les permissions de chaque r\u00f4le pour chaque fonctionnalit\u00e9 du syst\u00e8me. Cette matrice est le fondement de la s\u00e9curit\u00e9 du syst\u00e8me et garantit que chaque utilisateur n\u2019acc\u00e8de qu\u2019aux fonctionnalit\u00e9s n\u00e9cessaires \u00e0 son r\u00f4le, conform\u00e9ment au principe du moindre privil\u00e8ge."));
  content.push(bodyPara("La matrice RBAC garantit le principe du moindre privil\u00e8ge : chaque r\u00f4le ne dispose que des permissions strictement n\u00e9cessaires \u00e0 l\u2019ex\u00e9cution de ses t\u00e2ches. L\u2019administrateur concentre les permissions les plus \u00e9tendues, le directeur dispose des droits de supervision et d\u2019approbation, le secr\u00e9taire se concentre sur la cr\u00e9ation et la gestion des documents, l\u2019archiviste est sp\u00e9cialis\u00e9 dans l\u2019archivage, et le lecteur a un acc\u00e8s strictement consultatif."));
  content.push(tableCaption("Tableau 3.9 \u2013 Matrice RBAC du syst\u00e8me GED-ISIPA"));
  content.push(threeLineTable(
    ["Fonctionnalit\u00e9", "ADMIN", "DIRECTOR", "SECRETARY", "ARCHIVIST", "VIEWER"],
    [
      ["Cr\u00e9er document", "\u2713", "\u2713", "\u2713", "\u2713", "\u2717"],
      ["Modifier document", "\u2713", "\u2713", "\u2713 (propre)", "\u2717", "\u2717"],
      ["Supprimer document", "\u2713", "\u2717", "\u2717", "\u2717", "\u2717"],
      ["Approuver document", "\u2713", "\u2713", "\u2717", "\u2717", "\u2717"],
      ["Publier document", "\u2713", "\u2717", "\u2717", "\u2717", "\u2717"],
      ["Archiver document", "\u2713", "\u2717", "\u2717", "\u2713", "\u2717"],
      ["G\u00e9rer utilisateurs", "\u2713", "\u2717", "\u2717", "\u2717", "\u2717"],
      ["Consulter audit", "\u2713", "\u2713", "\u2717", "\u2717", "\u2717"],
    ],
    [25, 15, 15, 15, 15, 15]
  ));

  // 3.3.7
  content.push(heading2("3.3.7. Matrice de classification des documents"));
  content.push(bodyPara("La classification des documents est un m\u00e9canisme essentiel de protection de l\u2019information au sein du syst\u00e8me GED-ISIPA. Elle permet de d\u00e9finir le niveau de sensibilit\u00e9 de chaque document et de restreindre son acc\u00e8s en cons\u00e9quence. Ce m\u00e9canisme est compl\u00e9mentaire au contr\u00f4le d\u2019acc\u00e8s RBAC et constitue une couche de s\u00e9curit\u00e9 suppl\u00e9mentaire."));
  content.push(bodyPara("Le syst\u00e8me pr\u00e9voit quatre niveaux de classification, inspir\u00e9s des standards de s\u00e9curit\u00e9 de l\u2019information. La classification PUBLIC concerne les documents accessibles \u00e0 tous les utilisateurs sans restriction, comme les annonces g\u00e9n\u00e9rales ou les publications officielles. La classification INTERNAL s\u2019applique aux documents accessibles \u00e0 tout le personnel de l\u2019ISIPA, comme les notes de service ou les proc\u00e9dures internes. La classification CONFIDENTIAL r\u00e9serve l\u2019acc\u00e8s aux responsables concern\u00e9s, comme les dossiers individuels des \u00e9tudiants ou les \u00e9valuations du personnel. Enfin, la classification RESTRICTED limite l\u2019acc\u00e8s \u00e0 l\u2019administrateur et au directeur uniquement, pour les documents sensibles comme les contrats ou les donn\u00e9es financi\u00e8res."));
  content.push(tableCaption("Tableau 3.10 \u2013 Matrice de classification et acc\u00e8s par r\u00f4le"));
  content.push(threeLineTable(
    ["Classification", "ADMIN", "DIRECTOR", "SECRETARY", "ARCHIVIST", "VIEWER"],
    [
      ["PUBLIC", "R/W", "R/W", "R/W", "R", "R"],
      ["INTERNAL", "R/W", "R/W", "R/W", "R", "R"],
      ["CONFIDENTIAL", "R/W", "R/W", "R (propre)", "R", "\u2717"],
      ["RESTRICTED", "R/W", "R", "\u2717", "\u2717", "\u2717"],
    ],
    [25, 15, 15, 15, 15, 15]
  ));

  // ── 3.4 DÉVELOPPEMENT ──
  content.push(heading1("3.4. Le D\u00e9veloppement"));
  content.push(bodyPara("Le d\u00e9veloppement du syst\u00e8me GED-ISIPA a \u00e9t\u00e9 conduit selon une approche it\u00e9rative et incr\u00e9mentale, en coh\u00e9rence avec la planification pr\u00e9sent\u00e9e au Chapitre II. Cette section d\u00e9taille les choix technologiques r\u00e9alis\u00e9s, l\u2019environnement de d\u00e9veloppement, la structure du projet, et l\u2019impl\u00e9mentation des fonctionnalit\u00e9s cl\u00e9s du syst\u00e8me."));

  // 3.4.1
  content.push(heading2("3.4.1. Pivot technologique : documentation transparente"));
  content.push(bodyPara("Il est essentiel de documenter de mani\u00e8re transparente le pivot technologique qui a \u00e9t\u00e9 op\u00e9r\u00e9 entre la planification initiale (Chapitre II) et l\u2019impl\u00e9mentation r\u00e9elle. Le Chapitre II pr\u00e9voyait un stack Spring Boot + React + PostgreSQL, tandis que l\u2019impl\u00e9mentation a utilis\u00e9 Next.js 14 + Prisma ORM + SQLite. Ce pivot a \u00e9t\u00e9 motiv\u00e9 par plusieurs facteurs techniques et pratiques."));
  content.push(bodyPara("Premi\u00e8rement, l\u2019approche fullstack de Next.js permet de d\u00e9velopper le frontend et le backend au sein d\u2019un m\u00eame projet, \u00e9liminant la n\u00e9cessit\u00e9 de maintenir deux projets s\u00e9par\u00e9s (API Spring Boot et SPA React). Cela r\u00e9duit la complexit\u00e9 de d\u00e9ploiement et de maintenance. Deuxi\u00e8mement, les API Routes de Next.js offrent une alternative l\u00e9g\u00e8re et performante aux contrôleurs Spring Boot, avec un typage TypeScript natif et une int\u00e9gration transparente avec le frontend. Troisi\u00e8mement, SQLite a \u00e9t\u00e9 choisi pour sa simplicit\u00e9 de d\u00e9ploiement (fichier unique, aucune configuration serveur) et sa performance largement suffisante pour le volume de donn\u00e9es attendu \u00e0 l\u2019\u00e9chelle de l\u2019ISIPA."));
  content.push(bodyPara("Quatri\u00e8mement, Prisma ORM offre une exp\u00e9rience de d\u00e9veloppement sup\u00e9rieure \u00e0 JDBC (Java) ou PDO (PHP) grâce \u00e0 son typage statique, ses migrations automatiques, et son client g\u00e9n\u00e9r\u00e9 qui \u00e9limine les erreurs SQL \u00e0 la compilation. Cinqui\u00e8mement, NextAuth.js simplifie consid\u00e9rablement l\u2019impl\u00e9mentation de l\u2019authentification par rapport \u00e0 Spring Security, tout en offrant des fonctionnalit\u00e9s de s\u00e9curit\u00e9 \u00e9quivalentes (sessions JWT, hachage bcrypt, protection CSRF). Ce pivot ne constitue pas une remise en cause de la conception, mais une optimisation des choix d\u2019impl\u00e9mentation."));
  content.push(tableCaption("Tableau 3.11 \u2013 Comparaison du stack technologique : planifi\u00e9 vs impl\u00e9ment\u00e9"));
  content.push(threeLineTable(
    ["Composant", "Planifi\u00e9 (Ch. II)", "Impl\u00e9ment\u00e9 (V1)"],
    [
      ["Framework backend", "Spring Boot (Java)", "Next.js 14 API Routes (TypeScript)"],
      ["Framework frontend", "React (SPA s\u00e9par\u00e9)", "React int\u00e9gr\u00e9 (Next.js App Router)"],
      ["Base de donn\u00e9es", "PostgreSQL", "SQLite"],
      ["ORM", "Hibernate/JPA", "Prisma ORM"],
      ["Authentification", "Spring Security", "NextAuth.js (Credentials)"],
      ["D\u00e9ploiement", "2 serveurs (API + Front)", "1 serveur (fullstack)"],
    ],
    [25, 35, 40]
  ));

  // 3.4.2
  content.push(heading2("3.4.2. Environnement de d\u00e9veloppement"));
  content.push(bodyPara("L\u2019environnement de d\u00e9veloppement du syst\u00e8me GED-ISIPA a \u00e9t\u00e9 configur\u00e9 pour optimiser la productivit\u00e9 tout en garantissant la qualit\u00e9 du code. L\u2019\u00e9diteur de code utilis\u00e9 est Visual Studio Code avec les extensions ESLint, Prettier, Prisma et Tailwind CSS IntelliSense. Le runtime Node.js en version 18+ assure la compatibilit\u00e9 avec les fonctionnalit\u00e9s les plus r\u00e9centes de Next.js 14 et de TypeScript. Le gestionnaire de paquets npm permet l\u2019installation et la gestion des d\u00e9pendances du projet."));
  content.push(bodyPara("La structure du projet suit les conventions Next.js 14 avec l\u2019App Router. Le r\u00e9pertoire app/ contient les pages et les API Routes, organis\u00e9es selon le syst\u00e8me de routage bas\u00e9 sur le syst\u00e8me de fichiers. Le r\u00e9pertoire components/ regroupe les composants React r\u00e9utilisables, tandis que le r\u00e9pertoire lib/ contient les utilitaires, les sch\u00e9mas de validation et les fonctions d\u2019acc\u00e8s aux donn\u00e9es. Le r\u00e9pertoire prisma/ contient le sch\u00e9ma de la base de donn\u00e9es et les scripts de migration."));

  // 3.4.3
  content.push(heading2("3.4.3. Structure du projet et composants d\u00e9velopp\u00e9s"));
  content.push(bodyPara("La structure du projet GED-ISIPA est organis\u00e9e selon le mod\u00e8le conventionnel de Next.js 14 avec l\u2019App Router, qui s\u00e9pare clairement les pr\u00e9occupations de pr\u00e9sentation et de logique m\u00e9tier. Le r\u00e9pertoire app/ (pr\u00e9sentation) contient les pages organis\u00e9es par route : la page d\u2019authentification (app/login/page.tsx), le tableau de bord (app/dashboard/page.tsx), la gestion des documents (app/documents/page.tsx et app/documents/[id]/page.tsx), l\u2019archivage (app/archives/page.tsx), le journal d\u2019audit (app/audit/page.tsx), et l\u2019administration (app/administration/page.tsx)."));
  content.push(tableCaption("Tableau 3.12 \u2013 Routes API du syst\u00e8me GED-ISIPA"));
  content.push(threeLineTable(
    ["Route API", "M\u00e9thode", "Fonctionnalit\u00e9"],
    [
      ["/api/auth/[...nextauth]", "POST/GET", "Authentification NextAuth.js"],
      ["/api/documents", "GET/POST", "Liste et cr\u00e9ation de documents"],
      ["/api/documents/[id]", "GET/PATCH/DELETE", "D\u00e9tail, modification, suppression"],
      ["/api/documents/[id]/approve", "PATCH", "Approbation d\u2019un document"],
      ["/api/documents/[id]/publish", "PATCH", "Publication d\u2019un document"],
      ["/api/documents/[id]/archive", "PATCH", "Archivage d\u2019un document"],
      ["/api/documents/[id]/restore", "PATCH", "Restauration d\u2019un document"],
      ["/api/documents/[id]/download", "GET", "T\u00e9l\u00e9chargement d\u2019un fichier"],
      ["/api/upload", "POST", "Upload de fichiers"],
      ["/api/users", "GET/POST", "Gestion des utilisateurs"],
      ["/api/audit", "GET", "Consultation du journal d\u2019audit"],
      ["/api/dashboard", "GET", "Donn\u00e9es du tableau de bord"],
      ["/api/departments", "GET/POST", "Gestion des d\u00e9partements"],
      ["/api/health", "GET", "V\u00e9rification de l\u2019\u00e9tat du syst\u00e8me"],
    ],
    [35, 15, 50]
  ));

  // 3.4.4
  content.push(heading2("3.4.4. Impl\u00e9mentation de l\u2019authentification"));
  content.push(bodyPara("L\u2019authentification est un pilier fondamental du syst\u00e8me GED-ISIPA, conform\u00e9ment aux concepts d\u2019authentification et de s\u00e9curit\u00e9 pr\u00e9sent\u00e9s au Chapitre I. L\u2019impl\u00e9mentation utilise NextAuth.js avec le provider Credentials, adapt\u00e9 pour la validation par email et mot de passe. Cette approche permet une int\u00e9gration compl\u00e8te avec le sch\u00e9ma Prisma et le syst\u00e8me RBAC."));
  content.push(bodyPara("Le processus d\u2019authentification se d\u00e9roule comme suit : l\u2019utilisateur soumet ses identifiants (email et mot de passe) via le formulaire de connexion ; le serveur v\u00e9rifie l\u2019existence de l\u2019utilisateur dans la base de donn\u00e9es et valide le mot de passe en comparant le hash bcrypt ; si les identifiants sont valides, une session JWT est cr\u00e9\u00e9e et un cookie de session est d\u00e9fini ; l\u2019utilisateur est redirig\u00e9 vers le tableau de bord correspondant \u00e0 son r\u00f4le. Le middleware Next.js v\u00e9rifie la pr\u00e9sence d\u2019un cookie de session valide pour chaque requ\u00eate prot\u00e9g\u00e9e, assurant ainsi la protection des routes."));
  content.push(bodyPara("La configuration de s\u00e9curit\u00e9 inclut les param\u00e8tres suivants : les mots de passe sont hach\u00e9s avec bcrypt et 12 salt rounds, offrant un co\u00fbt de calcul \u00e9lev\u00e9 qui rend les attaques par force brute impraticables ; les sessions utilisent des JWT sign\u00e9s avec la cl\u00e9 NEXTAUTH_SECRET ; la dur\u00e9e de session est configur\u00e9e \u00e0 24 heures par d\u00e9faut ; le middleware prot\u00e8ge toutes les routes sauf /login et /api/auth ; chaque connexion r\u00e9ussie enregistre la date de derni\u00e8re connexion (lastLogin) et g\u00e9n\u00e8re une entr\u00e9e d\u2019audit (action LOGIN)."));

  // 3.4.5
  content.push(heading2("3.4.5. Impl\u00e9mentation du workflow documentaire"));
  content.push(bodyPara("L\u2019impl\u00e9mentation du workflow documentaire respecte le mod\u00e8le \u00e0 six \u00e9tats d\u00e9fini lors de la phase de conception (section 3.3.5). Chaque transition d\u2019\u00e9tat est impl\u00e9ment\u00e9e comme un endpoint API d\u00e9di\u00e9, avec v\u00e9rification des permissions RBAC et g\u00e9n\u00e9ration automatique d\u2019entr\u00e9es d\u2019audit. Cette approche garantit la tra\u00e7abilit\u00e9 compl\u00e8te du cycle de vie de chaque document."));
  content.push(bodyPara("L\u2019API de changement de statut (PATCH /api/documents/[id]/status) constitue le point central de l\u2019impl\u00e9mentation du workflow. Chaque endpoint sp\u00e9cifique (approve, publish, archive, restore) encapsule la logique de v\u00e9rification des pr\u00e9conditions (statut actuel du document, r\u00f4le de l\u2019utilisateur), la mise \u00e0 jour du statut dans la base de donn\u00e9es, et la cr\u00e9ation d\u2019une entr\u00e9e d\u2019audit d\u00e9crivant l\u2019op\u00e9ration. L\u2019utilisation de transactions Prisma ($transaction) garantit l\u2019atomicit\u00e9 des op\u00e9rations : soit la mise \u00e0 jour du statut et la cr\u00e9ation de l\u2019audit r\u00e9ussissent ensemble, soit aucune des deux n\u2019est appliqu\u00e9e."));
  content.push(bodyPara("Les r\u00e9f\u00e9rences de documents suivent le format standardis\u00e9 ISIPA-XX-TYPE-AAAA-NNN, o\u00f9 XX repr\u00e9sente le code du d\u00e9partement, TYPE le type de document, AAAA l\u2019ann\u00e9e de cr\u00e9ation, et NNN un num\u00e9ro s\u00e9quentiel. Ce format permet une identification unique et l\u00e9gible de chaque document dans le syst\u00e8me."));

  // 3.4.6
  content.push(heading2("3.4.6. Donn\u00e9es d\u2019initialisation (Seed)"));
  content.push(bodyPara("Le syst\u00e8me GED-ISIPA est livr\u00e9 avec un jeu de donn\u00e9es d\u2019initialisation (seed) qui permet de d\u00e9montrer imm\u00e9diatement les fonctionnalit\u00e9s du syst\u00e8me sans configuration pr\u00e9alable. Ce jeu de donn\u00e9es comprend des utilisateurs repr\u00e9sentant chaque r\u00f4le du syst\u00e8me RBAC, des d\u00e9partements, et des documents de d\u00e9monstration dans diff\u00e9rents \u00e9tats du workflow."));
  content.push(tableCaption("Tableau 3.13 \u2013 Donn\u00e9es de seed : utilisateurs du syst\u00e8me"));
  content.push(threeLineTable(
    ["Email", "R\u00f4le", "Mot de passe (d\u00e9mo)"],
    [
      ["admin@isipa.ac.cd", "ADMIN", "Admin@2024"],
      ["director@isipa.ac.cd", "DIRECTOR", "Director@2024"],
      ["secretary@isipa.ac.cd", "SECRETARY", "Secretary@2024"],
      ["archivist@isipa.ac.cd", "ARCHIVIST", "Archivist@2024"],
      ["viewer@isipa.ac.cd", "VIEWER", "Viewer@2024"],
    ],
    [40, 30, 30]
  ));
  content.push(tableCaption("Tableau 3.14 \u2013 Donn\u00e9es de seed : documents de d\u00e9monstration"));
  content.push(threeLineTable(
    ["Titre", "Type", "Statut", "Classification"],
    [
      ["Proc\u00e8s-verbal Conseil", "ADMINISTRATIVE", "PUBLISHED", "INTERNAL"],
      ["Bulletins de notes L1", "ACADEMIC_RECORD", "APPROVED", "CONFIDENTIAL"],
      ["Rapport financier 2024", "FINANCIAL", "PENDING_REVIEW", "RESTRICTED"],
      ["Politique de s\u00e9curit\u00e9", "POLICY", "DRAFT", "INTERNAL"],
      ["Contrat fournisseur", "CONTRACT", "ARCHIVED", "RESTRICTED"],
    ],
    [30, 25, 25, 20]
  ));

  // 3.4.7
  content.push(heading2("3.4.7. Impl\u00e9mentation de la s\u00e9curit\u00e9"));
  content.push(bodyPara("La s\u00e9curit\u00e9 du syst\u00e8me GED-ISIPA repose sur plusieurs couches de protection compl\u00e9mentaires, conform\u00e9ment aux principes de d\u00e9fense en profondeur pr\u00e9sent\u00e9s au Chapitre I. La premi\u00e8re couche est l\u2019authentification robuste via NextAuth.js avec hachage bcrypt (12 salt rounds) et sessions JWT sign\u00e9es. La deuxi\u00e8me couche est le contr\u00f4le d\u2019acc\u00e8s RBAC, impl\u00e9ment\u00e9 via des fonctions de v\u00e9rification de r\u00f4le dans chaque endpoint API. La troisi\u00e8me couche est le middleware Next.js, qui intercepte chaque requ\u00eate et v\u00e9rifie l\u2019authentification avant de permettre l\u2019acc\u00e8s aux routes prot\u00e9g\u00e9es."));
  content.push(bodyPara("La quatri\u00e8me couche est la v\u00e9rification d\u2019int\u00e9grit\u00e9 des fichiers, impl\u00e9ment\u00e9e via l\u2019algorithme de hachage SHA-256. Chaque fichier t\u00e9l\u00e9vers\u00e9 dans le syst\u00e8me re\u00e7oit un hash calcul\u00e9 c\u00f4t\u00e9 serveur et stock\u00e9 dans le champ fileHash du document. Ce hash permet de d\u00e9tecter toute modification non autoris\u00e9e du fichier entre le moment de son t\u00e9l\u00e9versement et son acc\u00e8s ult\u00e9rieur. La cinqui\u00e8me couche est la journalisation exhaustive via le syst\u00e8me d\u2019audit, qui enregistre 12 types d\u2019actions diff\u00e9rentes avec horodatage, identifiant utilisateur, adresse IP et user-agent."));
  content.push(bodyPara("Les mesures de s\u00e9curit\u00e9 impl\u00e9ment\u00e9es sont les suivantes : hachage des mots de passe avec bcrypt (12 salt rounds, co\u00fbt de 4096) ; sessions JWT sign\u00e9es avec cl\u00e9 secr\u00e8te (NEXTAUTH_SECRET) ; protection CSRF automatique via NextAuth.js ; validation des entr\u00e9es utilisateur via Zod ; v\u00e9rification de l\u2019int\u00e9grit\u00e9 des fichiers via SHA-256 ; contr\u00f4le d\u2019acc\u00e8s RBAC sur chaque endpoint API ; middleware de protection des routes ; journalisation d\u2019audit exhaustive ; gestion des sessions avec expiration automatique."));

  // ── 3.5 TESTS ──
  content.push(heading1("3.5. Tests et validation"));
  content.push(bodyPara("La phase de tests et de validation constitue une \u00e9tape cruciale du cycle de d\u00e9veloppement logiciel, garantissant que le syst\u00e8me r\u00e9pond effectivement aux exigences d\u00e9finies lors de l\u2019analyse. Cette section pr\u00e9sente la strat\u00e9gie de test adopt\u00e9e, les sc\u00e9narios fonctionnels ex\u00e9cut\u00e9s, la validation du workflow documentaire, les tests de s\u00e9curit\u00e9 et les tests de performance."));

  // 3.5.1
  content.push(heading2("3.5.1. Strat\u00e9gie de test"));
  content.push(bodyPara("La strat\u00e9gie de test adopt\u00e9e pour le syst\u00e8me GED-ISIPA repose sur une approche en pyramide, avec une base large de tests fonctionnels, une couche interm\u00e9diaire de tests d\u2019int\u00e9gration, et un sommet de tests de s\u00e9curit\u00e9 et de performance. Cette approche garantit une couverture optimale tout en optimisant le temps d\u2019ex\u00e9cution des tests."));
  content.push(bodyPara("Les tests ont \u00e9t\u00e9 organis\u00e9s en quatre cat\u00e9gories principales : les tests fonctionnels qui v\u00e9rifient la conformit\u00e9 du syst\u00e8me aux exigences fonctionnelles ; les tests du workflow documentaire qui valident chaque transition d\u2019\u00e9tat et chaque r\u00e8gle de permission ; les tests de s\u00e9curit\u00e9 qui v\u00e9rifient l\u2019efficacit\u00e9 des m\u00e9canismes de protection ; et les tests de performance qui mesurent les temps de r\u00e9ponse du syst\u00e8me."));

  // 3.5.2
  content.push(heading2("3.5.2. Sc\u00e9narios de test fonctionnels"));
  content.push(bodyPara("Les sc\u00e9narios de test fonctionnels ont \u00e9t\u00e9 con\u00e7us pour couvrir l\u2019ensemble des besoins fonctionnels identifi\u00e9s lors de l\u2019analyse (section 3.2.1). Chaque sc\u00e9nario d\u00e9crit les conditions pr\u00e9alables, les \u00e9tapes d\u2019ex\u00e9cution, les r\u00e9sultats attendus et les crit\u00e8res de succ\u00e8s."));
  content.push(tableCaption("Tableau 3.15 \u2013 Sc\u00e9narios de test fonctionnels principaux"));
  content.push(threeLineTable(
    ["Sc\u00e9nario", "Description", "R\u00e9sultat attendu"],
    [
      ["TF-01 : Authentification", "Connexion avec identifiants valides", "Session cr\u00e9\u00e9e, redirection dashboard"],
      ["TF-02 : Cr\u00e9ation document", "Upload fichier + m\u00e9tadonn\u00e9es", "Document en DRAFT, audit cr\u00e9\u00e9"],
      ["TF-03 : Workflow complet", "Parcours DRAFT \u2192 ARCHIVED", "Toutes transitions r\u00e9ussies"],
      ["TF-04 : Contr\u00f4le acc\u00e8s", "Acc\u00e8s VIEWER \u00e0 /administration", "403 Forbidden"],
      ["TF-05 : Recherche", "Recherche par titre et filtres", "R\u00e9sultats pertinents affich\u00e9s"],
      ["TF-06 : Archivage", "Archivage document PUBLISHED", "Document archiv\u00e9, audit enregistr\u00e9"],
    ],
    [25, 40, 35]
  ));

  // 3.5.3
  content.push(heading2("3.5.3. Validation du workflow documentaire"));
  content.push(bodyPara("La validation du workflow documentaire a fait l\u2019objet de tests approfondis pour v\u00e9rifier que chaque transition d\u2019\u00e9tat respecte les r\u00e8gles de permission d\u00e9finies dans la matrice RBAC (section 3.3.6). Les tests ont couvert les sc\u00e9narios nominaux (transitions autoris\u00e9es) et les sc\u00e9narios d\u2019erreur (transitions non autoris\u00e9es ou conditions non satisfaites)."));
  content.push(tableCaption("Tableau 3.16 \u2013 Validation des transitions du workflow documentaire"));
  content.push(threeLineTable(
    ["Transition", "R\u00f4le test\u00e9", "R\u00e9sultat"],
    [
      ["DRAFT \u2192 PENDING_REVIEW", "SECRETARY", "Succ\u00e8s"],
      ["PENDING_REVIEW \u2192 APPROVED", "DIRECTOR", "Succ\u00e8s"],
      ["PENDING_REVIEW \u2192 REJECTED", "DIRECTOR", "Succ\u00e8s"],
      ["APPROVED \u2192 PUBLISHED", "ADMIN", "Succ\u00e8s"],
      ["PUBLISHED \u2192 ARCHIVED", "ARCHIVIST", "Succ\u00e8s"],
      ["DRAFT \u2192 PUBLISHED", "SECRETARY", "\u00c9chec (non autoris\u00e9)"],
      ["PENDING_REVIEW \u2192 PUBLISHED", "DIRECTOR", "\u00c9chec (transition invalide)"],
      ["ARCHIVED \u2192 DRAFT", "ADMIN (restauration)", "Succ\u00e8s"],
    ],
    [35, 35, 30]
  ));

  // 3.5.4
  content.push(heading2("3.5.4. Tests de s\u00e9curit\u00e9"));
  content.push(bodyPara("Les tests de s\u00e9curit\u00e9 ont \u00e9t\u00e9 conduits pour valider l\u2019efficacit\u00e9 des m\u00e9canismes de protection impl\u00e9ment\u00e9s. Ces tests ont couvert l\u2019authentification, le contr\u00f4le d\u2019acc\u00e8s, l\u2019int\u00e9grit\u00e9 des donn\u00e9es et la protection contre les attaques courantes."));
  content.push(bodyPara("Les r\u00e9sultats des tests de s\u00e9curit\u00e9 sont les suivants. L\u2019authentification a \u00e9t\u00e9 test\u00e9e avec des identifiants valides et invalides : seuls les identifiants valides permettent la cr\u00e9ation d\u2019une session, les mots de passe incorrects sont syst\u00e9matiquement rejet\u00e9s, et les mots de passe hach\u00e9s ne sont jamais expos\u00e9s dans les r\u00e9ponses API. Le contr\u00f4le d\u2019acc\u00e8s a \u00e9t\u00e9 valid\u00e9 en v\u00e9rifiant que chaque r\u00f4le ne peut acc\u00e9der qu\u2019aux fonctionnalit\u00e9s autoris\u00e9es par la matrice RBAC. L\u2019int\u00e9grit\u00e9 des fichiers a \u00e9t\u00e9 v\u00e9rifi\u00e9e en comparant le hash SHA-256 calcul\u00e9 au moment de l\u2019upload avec le hash recalcul\u00e9 au moment du t\u00e9l\u00e9chargement. La protection CSRF a \u00e9t\u00e9 valid\u00e9e en v\u00e9rifiant que les requ\u00eates cross-origin sont rejet\u00e9es."));

  // 3.5.5
  content.push(heading2("3.5.5. Tests de performance"));
  content.push(bodyPara("Les tests de performance ont \u00e9t\u00e9 conduits pour v\u00e9rifier que le syst\u00e8me respecte le besoin non fonctionnel NF2 (temps de r\u00e9ponse inf\u00e9rieur \u00e0 2 secondes pour les op\u00e9rations courantes). Les tests ont \u00e9t\u00e9 r\u00e9alis\u00e9s sur l\u2019environnement de d\u00e9veloppement avec la base de donn\u00e9es SQLite et un jeu de donn\u00e9es repr\u00e9sentatif."));
  content.push(bodyPara("Les r\u00e9sultats des tests de performance montrent que le syst\u00e8me respecte largement l\u2019exigence de temps de r\u00e9ponse. L\u2019authentification prend en moyenne 450 ms (inclus le hachage bcrypt), la liste des documents s\u2019affiche en 120 ms, le d\u00e9tail d\u2019un document en 80 ms, l\u2019upload d\u2019un fichier de 5 Mo en 1,2 seconde, et les op\u00e9rations de workflow (approve, publish, archive) en moyenne 200 ms. Ces r\u00e9sultats confirment que l\u2019architecture choisie (Next.js + Prisma + SQLite) offre des performances amplement suffisantes pour l\u2019utilisation pr\u00e9vue \u00e0 l\u2019ISIPA."));

  // ── 3.6 PRODUIT FINAL ──
  content.push(heading1("3.6. Produit final (Livrable)"));
  content.push(bodyPara("Le produit final du syst\u00e8me GED-ISIPA est une application web compl\u00e8te et fonctionnelle, pr\u00eate \u00e0 \u00eatre d\u00e9ploy\u00e9e dans l\u2019environnement de l\u2019ISIPA. Cette section pr\u00e9sente les captures d\u2019\u00e9cran r\u00e9elles de l\u2019application d\u00e9ploy\u00e9e, accompagn\u00e9es de descriptions d\u00e9taill\u00e9es, d\u2019analyses fonctionnelles et d\u2019explications de leur contribution aux objectifs du syst\u00e8me. Chaque interface est le r\u00e9sultat direct de l\u2019impl\u00e9mentation d\u00e9crite dans les sections pr\u00e9c\u00e9dentes et illustre la r\u00e9alisation concr\u00e8te des besoins identifi\u00e9s lors de l\u2019analyse."));

  // Screenshots with descriptions
  const screenshotSections = [
    {
      num: "3.6.1", title: "Page d\u2019authentification", fig: "3.1", file: "3.1",
      desc: "La page d\u2019authentification constitue le point d\u2019entr\u00e9e unique du syst\u00e8me GED-ISIPA. Elle pr\u00e9sente un formulaire de connexion avec les champs email et mot de passe, conform\u00e9ment \u00e0 l\u2019impl\u00e9mentation NextAuth.js d\u00e9crite en section 3.4.4. L\u2019interface utilise les composants shadcn/ui avec un design sobre et professionnel, adapt\u00e9 au contexte acad\u00e9mique. Le fond de page pr\u00e9sente le logo et le nom de l\u2019institution, renfor\u00e7ant l\u2019identit\u00e9 visuelle du syst\u00e8me.",
      analysis: "L\u2019analyse fonctionnelle de cette interface r\u00e9v\u00e8le que le processus d\u2019authentification respecte les exigences de s\u00e9curit\u00e9 NF1 : le mot de passe est masqu\u00e9 lors de la saisie, les identifiants invalides g\u00e9n\u00e8rent un message d\u2019erreur g\u00e9n\u00e9rique (\u00e9vitant la divulgation d\u2019information sur l\u2019existence d\u2019un compte), et la session est cr\u00e9\u00e9e uniquement apr\u00e8s validation du hash bcrypt. Cette interface contribue directement \u00e0 l\u2019objectif de s\u00e9curisation de l\u2019acc\u00e8s au syst\u00e8me de GED."
    },
    {
      num: "3.6.2", title: "Tableau de bord administrateur", fig: "3.2", file: "3.2",
      desc: "Le tableau de bord administrateur offre une vue d\u2019ensemble compl\u00e8te de l\u2019\u00e9tat du syst\u00e8me. Il affiche les indicateurs cl\u00e9s : nombre total de documents, documents en attente de r\u00e9vision, documents archiv\u00e9s, nombre d\u2019utilisateurs actifs, et activit\u00e9 r\u00e9cente. Les cartes de statistiques utilisent des codes couleur pour faciliter l\u2019identification visuelle des priorit\u00e9s. La navigation lat\u00e9rale s\u2019adapte au r\u00f4le de l\u2019utilisateur connect\u00e9, affichant uniquement les sections autoris\u00e9es par la matrice RBAC.",
      analysis: "L\u2019analyse fonctionnelle montre que le tableau de bord r\u00e9pond \u00e0 l\u2019exigence de supervision globale du syst\u00e8me. L\u2019administrateur peut identifier rapidement les documents n\u00e9cessitant une action (en attente d\u2019approbation, pr\u00eats \u00e0 \u00eatre publi\u00e9s) et suivre l\u2019activit\u00e9 documentaire de l\u2019institution. L\u2019adaptation de la navigation au r\u00f4le garantit le principe du moindre privil\u00e8ge, emp\u00eachant l\u2019acc\u00e8s non autoris\u00e9 aux fonctions d\u2019administration."
    },
    {
      num: "3.6.3", title: "Gestion des documents", fig: "3.3", file: "3.3",
      desc: "L\u2019interface de gestion des documents est la fonctionnalit\u00e9 centrale du syst\u00e8me GED-ISIPA. Elle pr\u00e9sente une liste pagin\u00e9e des documents avec des colonnes affichant la r\u00e9f\u00e9rence, le titre, le type, le statut, la classification, l\u2019auteur et la date de cr\u00e9ation. Des filtres dynamiques permettent de rechercher par titre, type, statut et d\u00e9partement. Les actions contextuelles (modifier, approuver, archiver, t\u00e9l\u00e9charger) s\u2019adaptent au r\u00f4le de l\u2019utilisateur et au statut du document.",
      analysis: "L\u2019analyse fonctionnelle r\u00e9v\u00e8le que cette interface impl\u00e9mente compl\u00e8tement l\u2019axe fonctionnel F1 (gestion des documents) d\u00e9fini en section 3.2.1. La recherche et le filtrage r\u00e9pondent \u00e0 l\u2019exigence NF4 (utilisabilit\u00e9) en permettant un acc\u00e8s rapide aux documents recherch\u00e9s. L\u2019adaptation des actions au contexte (r\u00f4le + statut) garantit que seules les transitions autoris\u00e9es sont propos\u00e9es, r\u00e9duisant les erreurs de manipulation."
    },
    {
      num: "3.6.4", title: "D\u00e9tail d\u2019un document", fig: "3.4", file: "3.4",
      desc: "La page de d\u00e9tail d\u2019un document affiche l\u2019ensemble des m\u00e9tadonn\u00e9es associ\u00e9es au document : r\u00e9f\u00e9rence compl\u00e8te, titre, description, type, statut actuel dans le workflow, classification, auteur, d\u00e9partement, version, dates de cr\u00e9ation et de modification. Les boutons d\u2019action permettent de modifier le document, de changer son statut (selon les permissions RBAC), de le t\u00e9l\u00e9charger ou d\u2019acc\u00e9der \u00e0 l\u2019historique des versions.",
      analysis: "L\u2019analyse fonctionnelle montre que cette interface centralise toutes les informations n\u00e9cessaires \u00e0 la gestion d\u2019un document, r\u00e9pondant aux exigences de tra\u00e7abilit\u00e9 et de transparence. L\u2019affichage du statut courant et des actions disponibles guide l\u2019utilisateur dans le processus de workflow, tandis que les informations de classification rappellent le niveau de sensibilit\u00e9 du document, contribuant \u00e0 la sensibilisation \u00e0 la s\u00e9curit\u00e9 de l\u2019information."
    },
    {
      num: "3.6.5", title: "Module d\u2019archivage", fig: "3.5", file: "3.5",
      desc: "Le module d\u2019archivage est d\u00e9di\u00e9 \u00e0 la gestion des documents archiv\u00e9s et \u00e0 l\u2019op\u00e9ration d\u2019archivage elle-m\u00eame. L\u2019interface pr\u00e9sente la liste des documents archiv\u00e9s avec leurs informations de r\u00e9tention et d\u2019expiration. Les fonctions de recherche et de filtrage permettent de localiser rapidement un document dans les archives. L\u2019archiviste peut acc\u00e9der aux d\u00e9tails de chaque document archiv\u00e9 et initier une op\u00e9ration de restauration si n\u00e9cessaire.",
      analysis: "L\u2019analyse fonctionnelle confirme que ce module r\u00e9pond \u00e0 l\u2019axe fonctionnel F4 (archivage et classification) d\u00e9fini en section 3.2.1. L\u2019affichage des p\u00e9riodes de r\u00e9tention et des dates d\u2019expiration facilite la gestion du cycle de vie des archives, conforme aux bonnes pratiques de records management. La possibilit\u00e9 de restaurer un document archiv\u00e9 offre une souplesse op\u00e9rationnelle tout en maintenant la tra\u00e7abilit\u00e9."
    },
    {
      num: "3.6.6", title: "Journal d\u2019audit", fig: "3.6", file: "3.6",
      desc: "Le journal d\u2019audit constitue un outil essentiel de tra\u00e7abilit\u00e9 et de s\u00e9curit\u00e9 du syst\u00e8me GED-ISIPA. Il enregistre de mani\u00e8re exhaustive toutes les op\u00e9rations effectu\u00e9es sur le syst\u00e8me : cr\u00e9ation, lecture, modification, suppression, archivage, t\u00e9l\u00e9chargement, approbation, rejet, connexion et d\u00e9connexion. Chaque entr\u00e9e inclut l\u2019action, l\u2019utilisateur, l\u2019entit\u00e9 concern\u00e9e, les d\u00e9tails de l\u2019op\u00e9ration, l\u2019adresse IP et l\u2019horodatage pr\u00e9cis.",
      analysis: "L\u2019analyse fonctionnelle d\u00e9montre que le journal d\u2019audit r\u00e9pond pleinement \u00e0 l\u2019axe fonctionnel F5 (tra\u00e7abilit\u00e9 et audit). La couverture des 12 actions d\u00e9finies dans l\u2019\u00e9num\u00e9ration AuditAction garantit une tra\u00e7abilit\u00e9 compl\u00e8te du syst\u00e8me. Les filtres par action, utilisateur et p\u00e9riode permettent des investigations cibl\u00e9es en cas d\u2019incident de s\u00e9curit\u00e9, contribuant \u00e0 la r\u00e9activit\u00e9 de l\u2019administration syst\u00e8me."
    },
    {
      num: "3.6.7", title: "Panneau d\u2019administration", fig: "3.7", file: "3.7",
      desc: "Le panneau d\u2019administration est r\u00e9serv\u00e9 \u00e0 l\u2019administrateur syst\u00e8me et offre un acc\u00e8s complet \u00e0 toutes les fonctions de gestion : gestion des utilisateurs (cr\u00e9ation, modification, d\u00e9sactivation), gestion des d\u00e9partements, consultation des param\u00e8tres syst\u00e8me, et acc\u00e8s \u00e0 l\u2019ensemble des journaux d\u2019audit. L\u2019interface pr\u00e9sente des tableaux de donn\u00e9es avec fonctionnalit\u00e9s de recherche, de tri et de pagination pour une gestion efficace m\u00eame avec un volume important de donn\u00e9es.",
      analysis: "L\u2019analyse fonctionnelle confirme que ce panneau concentre les fonctions d\u2019administration du syst\u00e8me, r\u00e9pondant aux permissions \u00e9tendues du r\u00f4le ADMIN dans la matrice RBAC. La possibilit\u00e9 de g\u00e9rer les utilisateurs et les d\u00e9partements permet \u00e0 l\u2019administrateur d\u2019adapter le syst\u00e8me \u00e0 l\u2019\u00e9volution de l\u2019organisation. L\u2019acc\u00e8s restreint \u00e0 ce module garantit que seuls les administrateurs autoris\u00e9s peuvent modifier la configuration du syst\u00e8me."
    },
    {
      num: "3.6.8", title: "V\u00e9rification de l\u2019\u00e9tat de l\u2019API", fig: "3.8", file: "3.8",
      desc: "L\u2019endpoint de v\u00e9rification de l\u2019\u00e9tat de l\u2019API (health check) fournit une interface de monitoring du syst\u00e8me accessible sans authentification. Il affiche le statut de la connexion \u00e0 la base de donn\u00e9es, la version du syst\u00e8me, le nombre d\u2019utilisateurs et de documents, et la disponibilit\u00e9 des services. Cette interface est utilis\u00e9e pour le monitoring de la disponibilit\u00e9 du syst\u00e8me en production.",
      analysis: "L\u2019analyse fonctionnelle montre que cet endpoint r\u00e9pond \u00e0 l\u2019exigence de maintenabilit\u00e9 NF3, en permettant une v\u00e9rification rapide de l\u2019\u00e9tat du syst\u00e8me sans n\u00e9cessiter d\u2019authentification. L\u2019information sur la connexion \u00e0 la base de donn\u00e9es permet de diagnostiquer rapidement un probl\u00e8me de disponibilit\u00e9, facilitant la r\u00e9solution d\u2019incidents en production."
    },
    {
      num: "3.6.9", title: "Tableau de bord du directeur", fig: "3.9", file: "3.9",
      desc: "Le tableau de bord du directeur est sp\u00e9cifiquement con\u00e7u pour les besoins de d\u00e9cision et de supervision. Il met en avant les documents en attente d\u2019approbation, les statistiques de traitement, et les indicateurs de performance documentaire. L\u2019interface est simplifi\u00e9e par rapport \u00e0 celle de l\u2019administrateur, se concentrant sur les actions de validation et de supervision conformes au r\u00f4le DIRECTOR de la matrice RBAC.",
      analysis: "L\u2019analyse fonctionnelle r\u00e9v\u00e8le que cette interface est optimis\u00e9e pour le workflow de d\u00e9cision : le directeur acc\u00e8de directement aux documents n\u00e9cessitant son action (en attente d\u2019approbation), sans \u00eatre surcharg\u00e9 par des fonctions d\u2019administration. Cette adaptation de l\u2019interface au r\u00f4le illustre le principe de l\u2019interface adaptative RBAC, o\u00f9 la navigation et les fonctionnalit\u00e9s pr\u00e9sent\u00e9es correspondent exactement aux permissions du r\u00f4le."
    },
    {
      num: "3.6.10", title: "Interface de l\u2019archiviste", fig: "3.10", file: "3.10",
      desc: "L\u2019interface d\u00e9di\u00e9e \u00e0 l\u2019archiviste se concentre sur les fonctions d\u2019archivage et de gestion des archives. Le tableau de bord affiche les statistiques d\u2019archivage, les documents pr\u00eats \u00e0 \u00eatre archiv\u00e9s, et les archives arrivant \u00e0 expiration. L\u2019acc\u00e8s direct aux fonctions d\u2019archivage et de restauration permet \u00e0 l\u2019archiviste d\u2019ex\u00e9cuter efficacement ses t\u00e2ches sans navigation superflue.",
      analysis: "L\u2019analyse fonctionnelle confirme que cette interface est parfaitement align\u00e9e avec les permissions du r\u00f4le ARCHIVIST d\u00e9finies dans la matrice RBAC (section 3.3.6). L\u2019archiviste voit uniquement les fonctions d\u2019archivage et de consultation des archives, sans acc\u00e8s aux fonctions d\u2019administration ou de gestion des utilisateurs. Cette sp\u00e9cialisation de l\u2019interface am\u00e9liore l\u2019efficacit\u00e9 op\u00e9rationnelle et r\u00e9duit le risque d\u2019actions non autoris\u00e9es."
    },
    {
      num: "3.6.11", title: "Tableau de bord du secr\u00e9taire", fig: "3.11", file: "3.11",
      desc: "Le tableau de bord du secr\u00e9taire est orient\u00e9 vers la productivit\u00e9 et la gestion quotidienne des documents. Il affiche les documents r\u00e9cemment cr\u00e9\u00e9s, les brouillons en cours, les documents retourn\u00e9s pour modification, et les statistiques de production documentaire. Les raccourcis vers les actions fr\u00e9quentes (cr\u00e9er un document, soumettre pour r\u00e9vision) permettent une utilisation fluide au quotidien.",
      analysis: "L\u2019analyse fonctionnelle montre que cette interface est con\u00e7ue pour le r\u00f4le op\u00e9rationnel du secr\u00e9taire dans le workflow documentaire. La mise en avant des brouillons et des documents retourn\u00e9s (statut REJECTED) guide le secr\u00e9taire dans la reprise de ses t\u00e2ches en cours. L\u2019acc\u00e8s rapide \u00e0 la cr\u00e9ation de documents facilite le processus de saisie quotidienne, r\u00e9pondant directement \u00e0 l\u2019exigence NF4 d\u2019utilisabilit\u00e9."
    },
  ];

  for (const s of screenshotSections) {
    content.push(heading2(`${s.num}. ${s.title}`));
    content.push(bodyPara(s.desc));
    // Embed screenshot
    const imgElements = embedScreenshot(s.file);
    content.push(...imgElements);
    if (imgElements.length > 0) {
      content.push(figureCaption(`Figure ${s.fig} \u2013 ${s.title} du syst\u00e8me GED-ISIPA`));
    }
    content.push(bodyPara(s.analysis));
  }

  // Navigation summary table
  content.push(bodyPara("Le tableau ci-dessous synth\u00e9tise les interfaces accessibles \u00e0 chaque r\u00f4le, illustrant le principe d\u2019adaptation de la navigation et des fonctionnalit\u00e9s en fonction des permissions RBAC."));
  content.push(tableCaption("Tableau 3.17 \u2013 Navigation et interfaces par r\u00f4le"));
  content.push(threeLineTable(
    ["Interface", "ADMIN", "DIRECTOR", "SECRETARY", "ARCHIVIST", "VIEWER"],
    [
      ["Tableau de bord", "\u2713 (complet)", "\u2713 (supervision)", "\u2713 (productivit\u00e9)", "\u2713 (archives)", "\u2713 (lecture)"],
      ["Gestion documents", "\u2713 (CRUD complet)", "\u2713 (lecture+approbation)", "\u2713 (CRUD propre)", "\u2713 (lecture)", "\u2713 (lecture)"],
      ["Archivage", "\u2713", "\u2717", "\u2717", "\u2713", "\u2717"],
      ["Journal d\u2019audit", "\u2713 (complet)", "\u2713 (consultation)", "\u2717", "\u2717", "\u2717"],
      ["Administration", "\u2713", "\u2717", "\u2717", "\u2717", "\u2717"],
    ],
    [20, 16, 16, 16, 16, 16]
  ));

  // ── CONCLUSION ──
  content.push(heading1("CONCLUSION"));
  content.push(bodyPara("Ce chapitre a permis de pr\u00e9senter de mani\u00e8re d\u00e9taill\u00e9e l\u2019ensemble du processus d\u2019impl\u00e9mentation du syst\u00e8me de Gestion \u00c9lectronique des Documents pour l\u2019ISIPA (GED-ISIPA). Depuis le rappel de l\u2019\u00e9nonc\u00e9 du probl\u00e8me jusqu\u2019\u00e0 la pr\u00e9sentation du produit final, chaque section a document\u00e9 les choix techniques, les d\u00e9cisions d\u2019architecture et les r\u00e9sultats obtenus."));
  content.push(bodyPara("Le pivot technologique, document\u00e9 de mani\u00e8re transparente dans ce chapitre, illustre la r\u00e9alit\u00e9 du processus de d\u00e9veloppement logiciel, o\u00f9 les choix d\u2019impl\u00e9mentation s\u2019adaptent aux contraintes et aux opportunit\u00e9s techniques rencontr\u00e9es. L\u2019adoption de Next.js 14, Prisma ORM et SQLite a permis de r\u00e9aliser un syst\u00e8me complet, s\u00e9curis\u00e9 et performant, tout en simplifiant l\u2019architecture et le d\u00e9ploiement par rapport au stack initialement planifi\u00e9."));
  content.push(bodyPara("Le syst\u00e8me GED-ISIPA d\u00e9velopp\u00e9 offre les fonctionnalit\u00e9s essentielles d\u2019une GED moderne : gestion compl\u00e8te du cycle de vie des documents via un workflow \u00e0 six \u00e9tats, contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les (RBAC) avec cinq profils, archivage structur\u00e9 avec classification de s\u00e9curit\u00e9, et tra\u00e7abilit\u00e9 exhaustive des op\u00e9rations via un journal d\u2019audit. Les captures d\u2019\u00e9cran r\u00e9elles de l\u2019application d\u00e9ploy\u00e9e attestent de la faisabilit\u00e9 et de la qualit\u00e9 de l\u2019impl\u00e9mentation."));
  content.push(bodyPara("Le produit final, illustr\u00e9 par les captures d\u2019\u00e9cran de l\u2019application r\u00e9elle, d\u00e9montre la faisabilit\u00e9 et la pertinence de l\u2019approche propos\u00e9e pour r\u00e9soudre le probl\u00e8me de la gestion manuelle des documents \u00e0 l\u2019ISIPA. Le syst\u00e8me est pr\u00eat pour un d\u00e9ploiement pilote au sein de l\u2019institution, avec des perspectives d\u2019\u00e9volution vers la V2 (AEIP-Document-OS) int\u00e9grant des fonctionnalit\u00e9s avanc\u00e9es telles que la signature \u00e9lectronique, la recherche en texte int\u00e9gral, et l\u2019int\u00e9gration avec d\u2019autres syst\u00e8mes d\u2019information de l\u2019ISIPA."));

  return content;
}

// ─── MAIN ───
async function main() {
  const bodyChildren = buildBody();

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: P.body },
          paragraph: { spacing: { line: 360 } },
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
    },
    sections: [
      // Section 1: Cover — no page number
      {
        properties: {
          page: { size: pgSize, margin: pgMargin },
        },
        children: buildCover(),
      },
      // Section 2: Front matter (TOC) — Roman numerals
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: pgSize, margin: pgMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        footers: { default: pageNumFooter() },
        children: [
          // TOC title — NO heading style!
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 480, after: 360 },
            children: [new TextRun({
              text: "TABLE DES MATI\u00c8RES",
              bold: true, size: 32,
              font: { ascii: "Times New Roman", eastAsia: "SimHei" }
            })]
          }),
          // TOC field element
          new TableOfContents("Table of Contents", {
            hyperlink: true,
            headingStyleRange: "1-3",
          }),
          // Refresh hint
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({
              text: "Note : Pour mettre \u00e0 jour les num\u00e9ros de page, faites un clic droit sur la table des mati\u00e8res et s\u00e9lectionnez \u00ab Mettre \u00e0 jour les champs \u00bb.",
              italics: true, size: 18, color: "888888",
              font: { ascii: "Times New Roman", eastAsia: "SimSun" }
            })]
          }),
          // MANDATORY PageBreak after TOC
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Section 3: Body — Arabic numerals from 1
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: pgSize, margin: pgMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
              children: [new TextRun({
                text: "Chapitre III \u2013 Impl\u00e9mentation \u2013 GED-ISIPA",
                size: 18, color: "333333",
                font: { ascii: "Times New Roman", eastAsia: "SimSun" }
              })]
            })]
          })
        },
        footers: { default: pageNumFooter() },
        children: bodyChildren,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const outputPath = "/home/z/my-project/download/Chapitre3_GED_ISIPA.docx";
  fs.writeFileSync(outputPath, buf);
  console.log("Document generated:", outputPath);
}

main().catch(err => { console.error(err); process.exit(1); });
