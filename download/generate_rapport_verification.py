#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rapport de Verification Finale - Chapitre 3 GED-ISIPA"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white, gray
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
font_paths = {
    'NotoSansSC': '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf',
    'NotoSerifSC': '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC[wght].ttf',
    'DejaVuSans': '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    'DejaVuSansBold': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
}

for name, path in font_paths.items():
    if os.path.exists(path):
        try:
            pdfmetrics.registerFont(TTFont(name, path))
        except:
            pass

# Colors
PRIMARY = HexColor('#1E3A5F')
SECONDARY = HexColor('#2C5F8A')
ACCENT = HexColor('#C0392B')
GREEN = HexColor('#27AE60')
ORANGE = HexColor('#F39C12')
RED = HexColor('#E74C3C')
LIGHT_BG = HexColor('#F8F9FA')
LIGHT_BLUE = HexColor('#EBF5FB')
LIGHT_GREEN = HexColor('#EAFAF1')
LIGHT_RED = HexColor('#FDEDEC')
LIGHT_ORANGE = HexColor('#FEF9E7')
DARK_TEXT = HexColor('#2C3E50')
MUTED = HexColor('#7F8C8D')

OUTPUT = '/home/z/my-project/download/Rapport_Verification_Finale_Chapitre3_GED-ISIPA.pdf'

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=20*mm,
    rightMargin=20*mm,
    topMargin=25*mm,
    bottomMargin=20*mm,
)

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle(
    'CoverTitle', fontName='DejaVuSansBold', fontSize=22,
    leading=28, alignment=TA_CENTER, textColor=PRIMARY, spaceAfter=6*mm
))
styles.add(ParagraphStyle(
    'CoverSubtitle', fontName='DejaVuSans', fontSize=14,
    leading=18, alignment=TA_CENTER, textColor=SECONDARY, spaceAfter=4*mm
))
styles.add(ParagraphStyle(
    'CoverMeta', fontName='DejaVuSans', fontSize=10,
    leading=14, alignment=TA_CENTER, textColor=MUTED, spaceAfter=3*mm
))
styles.add(ParagraphStyle(
    'H1', fontName='DejaVuSansBold', fontSize=16,
    leading=20, textColor=PRIMARY, spaceBefore=8*mm, spaceAfter=4*mm
))
styles.add(ParagraphStyle(
    'H2', fontName='DejaVuSansBold', fontSize=13,
    leading=17, textColor=SECONDARY, spaceBefore=6*mm, spaceAfter=3*mm
))
styles.add(ParagraphStyle(
    'H3', fontName='DejaVuSansBold', fontSize=11,
    leading=15, textColor=DARK_TEXT, spaceBefore=4*mm, spaceAfter=2*mm
))
styles.add(ParagraphStyle(
    'Body', fontName='DejaVuSans', fontSize=9.5,
    leading=14, alignment=TA_JUSTIFY, textColor=DARK_TEXT,
    spaceBefore=1.5*mm, spaceAfter=1.5*mm
))
styles.add(ParagraphStyle(
    'BodyBold', fontName='DejaVuSansBold', fontSize=9.5,
    leading=14, alignment=TA_LEFT, textColor=DARK_TEXT,
    spaceBefore=1.5*mm, spaceAfter=1.5*mm
))
styles.add(ParagraphStyle(
    'MyBullet', fontName='DejaVuSans', fontSize=9.5,
    leading=14, alignment=TA_LEFT, textColor=DARK_TEXT,
    leftIndent=8*mm, bulletIndent=3*mm, spaceBefore=1*mm, spaceAfter=1*mm
))
styles.add(ParagraphStyle(
    'SmallNote', fontName='DejaVuSans', fontSize=8,
    leading=11, alignment=TA_LEFT, textColor=MUTED,
    spaceBefore=1*mm, spaceAfter=1*mm
))
styles.add(ParagraphStyle(
    'TableHeader', fontName='DejaVuSansBold', fontSize=8.5,
    leading=11, alignment=TA_CENTER, textColor=white
))
styles.add(ParagraphStyle(
    'TableCell', fontName='DejaVuSans', fontSize=8.5,
    leading=11, alignment=TA_LEFT, textColor=DARK_TEXT
))
styles.add(ParagraphStyle(
    'TableCellCenter', fontName='DejaVuSans', fontSize=8.5,
    leading=11, alignment=TA_CENTER, textColor=DARK_TEXT
))
styles.add(ParagraphStyle(
    'StatusOK', fontName='DejaVuSansBold', fontSize=8.5,
    leading=11, alignment=TA_CENTER, textColor=GREEN
))
styles.add(ParagraphStyle(
    'StatusPartial', fontName='DejaVuSansBold', fontSize=8.5,
    leading=11, alignment=TA_CENTER, textColor=ORANGE
))
styles.add(ParagraphStyle(
    'StatusMissing', fontName='DejaVuSansBold', fontSize=8.5,
    leading=11, alignment=TA_CENTER, textColor=RED
))
styles.add(ParagraphStyle(
    'FooterStyle', fontName='DejaVuSans', fontSize=7,
    leading=9, alignment=TA_CENTER, textColor=MUTED
))

story = []

# ====================== COVER PAGE ======================
story.append(Spacer(1, 35*mm))
story.append(Paragraph("RAPPORT DE VERIFICATION FINALE", styles['CoverTitle']))
story.append(Spacer(1, 3*mm))
story.append(HRFlowable(width="60%", thickness=2, color=PRIMARY, spaceAfter=5*mm))
story.append(Paragraph("Chapitre III : Implementation de la Solution GED-ISIPA", styles['CoverSubtitle']))
story.append(Spacer(1, 5*mm))
story.append(Paragraph("Verification de conformite academique et technique", styles['CoverSubtitle']))
story.append(Spacer(1, 15*mm))
story.append(Paragraph("Memoire de Master en Ingenierie Logicielle", styles['CoverMeta']))
story.append(Paragraph("Institut Superieur d'Informatique, Programmation et Analyse (ISIPA)", styles['CoverMeta']))
story.append(Paragraph("Annee academique 2024-2025", styles['CoverMeta']))
story.append(Spacer(1, 10*mm))
story.append(HRFlowable(width="40%", thickness=1, color=MUTED, spaceAfter=5*mm))
story.append(Paragraph("Document genere le 4 juin 2026", styles['CoverMeta']))
story.append(Paragraph("Analyse basee sur le code source reel et les documents du memoire", styles['CoverMeta']))

story.append(PageBreak())

# ====================== TABLE OF CONTENTS ======================
story.append(Paragraph("TABLE DES MATIERES", styles['H1']))
story.append(Spacer(1, 3*mm))

toc_items = [
    ("1.", "Synthese executive"),
    ("2.", "Verification des captures d'ecran et illustrations"),
    ("3.", "Verification de la presentation progressive et coherente"),
    ("4.", "Verification des interfaces, tableaux de bord, roles et modules"),
    ("5.", "Verification des choix techniques et architecturaux"),
    ("6.", "Verification des schemas, diagrammes et modeles"),
    ("7.", "Verification des tests et validations"),
    ("8.", "Verification des forces, limites et perspectives"),
    ("9.", "Coherence avec les Chapitres 1 et 2"),
    ("10.", "Verification de la bibliographie"),
    ("11.", "Rapport detaille des conformites"),
    ("12.", "Niveau de preparation et completude"),
    ("13.", "Questions probables du jury"),
    ("14.", "Recommandations finales"),
]

for num, title in toc_items:
    story.append(Paragraph(f"<b>{num}</b>  {title}", styles['Body']))

story.append(PageBreak())

# ====================== 1. SYNTHESE EXECUTIVE ======================
story.append(Paragraph("1. SYNTHESE EXECUTIVE", styles['H1']))

story.append(Paragraph(
    "Le present rapport constitue la verification finale et exhaustive du Chapitre III du memoire de Master "
    "intitule 'Implementation de la Solution GED-ISIPA'. Cette verification a ete realisee par analyse "
    "systematique du code source reellement deploye, comparaison avec les descriptions du Chapitre 3 Final "
    "(Chapitre3_GED_ISIPA_Final.docx, 658.8 Ko, 209 paragraphes, 7930 mots, 6 figures, 8 tableaux), "
    "et mise en coherence avec les Chapitres 1 et 2 du memoire original. L'objectif est de determiner "
    "si le Chapitre 3 est pret pour une soutenance academique de Master.",
    styles['Body']
))

story.append(Spacer(1, 3*mm))

# Summary table
summary_data = [
    [Paragraph('<b>Critere</b>', styles['TableHeader']),
     Paragraph('<b>Statut</b>', styles['TableHeader']),
     Paragraph('<b>Appreciation</b>', styles['TableHeader'])],
    [Paragraph('Captures d\'ecran dans le document', styles['TableCell']),
     Paragraph('MANQUANT', styles['StatusMissing']),
     Paragraph('0 screenshot sur 11 disponibles est integre', styles['TableCell'])],
    [Paragraph('Explications detaillees des captures', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('Descriptions textuelles sans appui visuel', styles['TableCell'])],
    [Paragraph('Presentation progressive et coherente', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK']),
     Paragraph('Structure 3.1 a 3.10 logique et progressive', styles['TableCell'])],
    [Paragraph('Interfaces et fonctionnalites en profondeur', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('Descriptions textuelles sans captures reelles', styles['TableCell'])],
    [Paragraph('Justification des choix techniques', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK']),
     Paragraph('Justifications detaillees avec reponses aux objections', styles['TableCell'])],
    [Paragraph('Schema UML, MCD, MLD, diagrammes', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('MCD present, MLD textuel, UML absent', styles['TableCell'])],
    [Paragraph('Tests et validations documentes', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('Tests manuels honnetes, pas de tests automatises', styles['TableCell'])],
    [Paragraph('Forces, limites, perspectives', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK']),
     Paragraph('Analyse critique transparente et pertinente', styles['TableCell'])],
    [Paragraph('Coherence avec Chapitres 1 et 2', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('Pivot technologique justifie, ecarts de perimetre', styles['TableCell'])],
    [Paragraph('Bibliographie du Chapitre 3', styles['TableCell']),
     Paragraph('MANQUANT', styles['StatusMissing']),
     Paragraph('Aucune section bibliographique dans le chapitre', styles['TableCell'])],
    [Paragraph('Correspondance code vs chapitre', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial']),
     Paragraph('10/20 affirmations exactes, 3 partielles, 7 incorrectes', styles['TableCell'])],
]

avail_w = A4[0] - 40*mm
col_w = [avail_w*0.38, avail_w*0.15, avail_w*0.47]

summary_table = Table(summary_data, colWidths=col_w, repeatRows=1)
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 5),
    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
]))
story.append(summary_table)
story.append(Spacer(1, 4*mm))

story.append(Paragraph(
    "<b>Estimation globale :</b> Le Chapitre 3 presente une structure academique solide et un contenu textuel "
    "de qualite, mais souffre de lacunes critiques en matiere d'illustrations (captures d'ecran absentes du document, "
    "diagrammes UML manquants), de correspondance avec l'infrastructure reelle (fichiers Dockerfile, setup.sh, "
    "nginx.conf absents du depot), et d'absence totale de bibliographie. Le taux de completude estime est de "
    "<b>62%</b> pour les exigences formulees, necessitant des corrections importantes avant la soutenance.",
    styles['Body']
))

# ====================== 2. CAPTURES D'ECRAN ======================
story.append(Paragraph("2. VERIFICATION DES CAPTURES D'ECRAN ET ILLUSTRATIONS", styles['H1']))

story.append(Paragraph("2.1 Captures d'ecran disponibles", styles['H2']))

story.append(Paragraph(
    "Le repertoire /home/z/my-project/download/screenshots/ contient 11 captures d'ecran de l'application "
    "reellement deployee, toutes datees du 2 juin 2026 et d'une resolution de 1440x900 pixels. Ces captures "
    "couvrent les ecrans suivants :",
    styles['Body']
))

screenshots = [
    ("01-login-page.png", "Page de connexion", "47 Ko"),
    ("02-dashboard-admin.png", "Tableau de bord administrateur", "83 Ko"),
    ("03-documents-list.png", "Liste des documents", "112 Ko"),
    ("04-document-detail.png", "Detail d'un document", "94 Ko"),
    ("05-archives.png", "Page des archives", "76 Ko"),
    ("06-audit-log.png", "Journal d'audit", "93 Ko"),
    ("07-administration.png", "Page d'administration", "88 Ko"),
    ("08-health-check-api.png", "API Health Check", "58 Ko"),
    ("09-director-dashboard.png", "Tableau de bord directeur", "75 Ko"),
    ("10-archivist-archives.png", "Archives (archiviste)", "83 Ko"),
    ("11-secretary-dashboard.png", "Tableau de bord secretaire", "85 Ko"),
]

ss_data = [[Paragraph('<b>Fichier</b>', styles['TableHeader']),
            Paragraph('<b>Ecran capture</b>', styles['TableHeader']),
            Paragraph('<b>Taille</b>', styles['TableHeader'])]]
for fname, desc, size in screenshots:
    ss_data.append([
        Paragraph(fname, styles['TableCell']),
        Paragraph(desc, styles['TableCell']),
        Paragraph(size, styles['TableCellCenter']),
    ])

ss_table = Table(ss_data, colWidths=[avail_w*0.35, avail_w*0.45, avail_w*0.20], repeatRows=1)
ss_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))
story.append(ss_table)
story.append(Spacer(1, 3*mm))

story.append(Paragraph(
    "<b>PROBLEME CRITIQUE :</b> Aucune de ces 11 captures d'ecran n'est integree dans le document "
    "Chapitre3_GED_ISIPA_Final.docx. Le document contient uniquement 6 images, toutes des diagrammes "
    "d'architecture generes par matplotlib (fig3-1 a fig3-6). Les captures existent en tant que fichiers "
    "mais n'ont pas ete embarquees dans le document final.",
    styles['Body']
))

story.append(Paragraph("2.2 Diagrammes presentes dans le document", styles['H2']))

diagrams = [
    ("fig3-1_architecture_logique.png", "Architecture logique en couches", "Present"),
    ("fig3-2_architecture_deploiement.png", "Architecture de deploiement Docker", "Present"),
    ("fig3-3_workflow.png", "Cycle de vie documentaire (Workflow)", "Present"),
    ("fig3-4_mcd.png", "Modele Conceptuel de Donnees (MCD)", "Present"),
    ("fig3-5_rbac.png", "Hierarchie des roles RBAC", "Present"),
    ("fig3-6_modules.png", "Systeme de modules par type d'organisation", "Present"),
]

diag_data = [[Paragraph('<b>Figure</b>', styles['TableHeader']),
              Paragraph('<b>Description</b>', styles['TableHeader']),
              Paragraph('<b>Statut</b>', styles['TableHeader'])]]
for fname, desc, status in diagrams:
    diag_data.append([
        Paragraph(fname, styles['TableCell']),
        Paragraph(desc, styles['TableCell']),
        Paragraph(status, styles['StatusOK']),
    ])

# Add missing diagrams
missing_diags = [
    ("N/A", "Modele Logique de Donnees (MLD) - diagramme", "MANQUANT"),
    ("N/A", "Diagramme de classes UML", "MANQUANT"),
    ("N/A", "Diagramme de cas d'utilisation UML", "MANQUANT"),
    ("N/A", "Diagramme de sequence UML", "MANQUANT"),
    ("N/A", "Diagramme d'activite UML", "MANQUANT"),
    ("N/A", "Modele Physique de Donnees (MPD)", "MANQUANT"),
]
for fname, desc, status in missing_diags:
    diag_data.append([
        Paragraph(fname, styles['TableCell']),
        Paragraph(desc, styles['TableCell']),
        Paragraph(status, styles['StatusMissing']),
    ])

diag_table = Table(diag_data, colWidths=[avail_w*0.30, avail_w*0.50, avail_w*0.20], repeatRows=1)
diag_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))
story.append(diag_table)
story.append(Spacer(1, 3*mm))

story.append(Paragraph(
    "Le document contient 6 diagrammes d'architecture correctement generes et integres. Cependant, "
    "les diagrammes UML fondamentaux attendus dans un chapitre d'implementation (cas d'utilisation, "
    "classes, sequence, activite) sont totalement absents. Le MLD est presente uniquement sous forme "
    "de tableau textuel (Tableau 3-2), sans representation graphique. Le MPD n'est pas du tout aborde. "
    "Pour un memoire utilisant la methode Merise (comme precise au Chapitre 1), l'absence des diagrammes "
    "UML et du MPD constitue une lacune significative que le jury ne manquera pas de signaler.",
    styles['Body']
))

# ====================== 3. PRESENTATION PROGRESSIVE ======================
story.append(Paragraph("3. VERIFICATION DE LA PRESENTATION PROGRESSIVE ET COHERENTE", styles['H1']))

story.append(Paragraph(
    "La structure du Chapitre 3 suit une logique progressive commendable, allant du general au particulier :",
    styles['Body']
))

progress_items = [
    "3.1 Presentation generale : vue d'ensemble de la solution, objectifs atteints, valeur ajoutee",
    "3.2 Architecture : logique, physique, logicielle, flux de donnees (du concept au deploiement)",
    "3.3 Technologies : stack, justifications, limites identifiees (transparence academique)",
    "3.4 Modelisation : MCD, MLD, dictionnaire de donnees, enumerations (du conceptuel au logique)",
    "3.5 Realisation : structure, roles, workflow, modules, auth, API, jetons (implementation concrete)",
    "3.6 Fonctionnalites : gestion documentaire, workflow, multi-tenant, dashboards, audit, utilisateurs",
    "3.7 Interfaces : connexion, dashboards, documents, administration, workflow builder, navigation",
    "3.8 Tests : deploiement, authentification, cycle de vie, isolation multi-tenant, API, limites",
    "3.9 Analyse critique : forces, limites, difficultes rencontrees et solutions",
    "3.10 Perspectives : securite, tests, upload, scalabilite, fonctionnalites additionnelles",
]

for item in progress_items:
    story.append(Paragraph(f"\u2022 {item}", styles['MyBullet']))

story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "<b>Appreciation :</b> La progression est coherente et bien structuree. Chaque section s'appuie "
    "logiquement sur la precedente. L'ajout d'une section 'Elements cles a defendre devant le jury' "
    "en fin de chapitre est un atout considerable pour la preparation a la soutenance. Cependant, "
    "la section 3.7 (Interfaces) souffre de l'absence de captures d'ecran, ce qui affaiblit "
    "considerablement la valeur demonstrative de cette section cruciale.",
    styles['Body']
))

# ====================== 4. INTERFACES, ROLES, MODULES ======================
story.append(Paragraph("4. VERIFICATION DES INTERFACES, TABLEAUX DE BORD, ROLES ET MODULES", styles['H1']))

story.append(Paragraph("4.1 Interfaces utilisateur", styles['H2']))

story.append(Paragraph(
    "Le Chapitre 3 decrit six categories d'interfaces dans la section 3.7 : page de connexion, "
    "tableaux de bord, gestion documentaire, administration, workflow builder et navigation adaptive. "
    "Chaque sous-section fournit une description textuelle detaillee des elements visuels, des "
    "fonctionnalites et de l'ergonomie. Cependant, ces descriptions restent purement textuelles : "
    "aucune capture d'ecran reelle n'illustre les interfaces decrites. Pour un chapitre d'implementation, "
    "c'est une lacune majeure car le jury s'attend a voir des preuves visuelles du produit realise.",
    styles['Body']
))

story.append(Paragraph(
    "Les 11 captures d'ecran disponibles dans le repertoire screenshots/ couvrent les ecrans principaux "
    "(connexion, dashboard, documents, archives, audit, administration, API health), mais aucun tableau "
    "de bord specialise (universitaire, hospitalier, gouvernement) n'est capture. Il manque egalement "
    "des captures du workflow builder, de la page modules, de la page parametres et des interfaces "
    "specifiques par role.",
    styles['Body']
))

story.append(Paragraph("4.2 Verification des roles et permissions vs code reel", styles['H2']))

# RBAC verification table
rbac_data = [
    [Paragraph('<b>Affirmation du Chapitre 3</b>', styles['TableHeader']),
     Paragraph('<b>Code reel</b>', styles['TableHeader']),
     Paragraph('<b>Statut</b>', styles['TableHeader'])],
    [Paragraph('14 roles RBAC', styles['TableCell']),
     Paragraph('14 roles : SUPER_ADMIN, ORG_ADMIN, MANAGER, USER, VIEWER, DEAN, PROFESSOR, DOCTOR, NURSE, LAWYER, PARALEGAL, CFO, HR_MANAGER, CIVIL_SERVANT', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('9 ressources', styles['TableCell']),
     Paragraph('9 : documents, users, departments, modules, workflows, billing, settings, audit, organizations', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('12 types d\'actions', styles['TableCell']),
     Paragraph('12 : create, read, update, delete, approve, reject, archive, restore, publish, manage, export, share', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('16 modules fonctionnels', styles['TableCell']),
     Paragraph('15 modules : RH, ACADEMIC, LIBRARY, RESEARCH, MEDICAL, PHARMACY, LABORATORY, FINANCE, CRM, PROJECT, PROCEDURE, ARCHIVE, COMPLIANCE, LEGAL, BILLING', styles['TableCell']),
     Paragraph('ECART (-1)', styles['StatusPartial'])],
    [Paragraph('22 pages d\'interface', styles['TableCell']),
     Paragraph('25 page.tsx (17 dashboard + 5 admin + 2 auth + 1 root)', styles['TableCell']),
     Paragraph('ECART (+3)', styles['StatusPartial'])],
]

rbac_table = Table(rbac_data, colWidths=[avail_w*0.28, avail_w*0.55, avail_w*0.17], repeatRows=1)
rbac_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))
story.append(rbac_table)

story.append(Paragraph("4.3 Modules : ecart detaille", styles['H2']))
story.append(Paragraph(
    "Le Chapitre 3 affirme que le systeme comporte '16 modules fonctionnels avec gestion des dependances'. "
    "L'analyse du fichier module-engine.ts revele exactement 15 modules dans le catalogue AVAILABLE_MODULES. "
    "L'ecart de 1 unite est probablement une erreur de comptage. Les 15 modules reels sont : RH, ACADEMIC, "
    "LIBRARY, RESEARCH, MEDICAL, PHARMACY, LABORATORY, FINANCE, CRM, PROJECT, PROCEDURE, ARCHIVE, "
    "COMPLIANCE, LEGAL, BILLING. La correction est simple : remplacer '16' par '15' dans le texte, "
    "ou ajouter un 16e module au code si necessaire.",
    styles['Body']
))

# ====================== 5. CHOIX TECHNIQUES ======================
story.append(Paragraph("5. VERIFICATION DES CHOIX TECHNIQUES ET ARCHITECTURAUX", styles['H1']))

story.append(Paragraph("5.1 Affirmations techniques vs realite du code", styles['H2']))

tech_data = [
    [Paragraph('<b>Affirmation</b>', styles['TableHeader']),
     Paragraph('<b>Code reel</b>', styles['TableHeader']),
     Paragraph('<b>Statut</b>', styles['TableHeader'])],
    [Paragraph('Next.js 16 avec App Router', styles['TableCell']),
     Paragraph('next: ^16.1.1 dans package.json', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('Prisma ORM avec SQLite (dev) / PostgreSQL (prod)', styles['TableCell']),
     Paragraph('Schema Prisma avec SQLite (db/custom.db). PostgreSQL configure dans docker-compose mais non utilise en dev', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial'])],
    [Paragraph('5 services Docker (app, postgres, redis, minio, nginx)', styles['TableCell']),
     Paragraph('docker-compose.yml declare 5 services. MAIS : Dockerfile absent, docker/nginx.conf absent, docker/ absent', styles['TableCell']),
     Paragraph('NON FONCTIONNEL', styles['StatusMissing'])],
    [Paragraph('Deploiement setup.sh valide sur VPS', styles['TableCell']),
     Paragraph('setup.sh n\'existe pas dans le depot. Affirmation fausse', styles['TableCell']),
     Paragraph('FAUX', styles['StatusMissing'])],
    [Paragraph('17 types d\'actions d\'audit', styles['TableCell']),
     Paragraph('17 dans AuditAction enum (schema.prisma)', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('14 types de documents', styles['TableCell']),
     Paragraph('14 dans DocumentType enum (schema.prisma)', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('JWT maxAge 24h', styles['TableCell']),
     Paragraph('maxAge: 24 * 60 * 60 dans auth.ts', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('8 types d\'organisations', styles['TableCell']),
     Paragraph('8 dans OrganizationType enum', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('30+ endpoints API', styles['TableCell']),
     Paragraph('41 endpoints distincts (28 fichiers de routes)', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
    [Paragraph('5 etats et 5 transitions (workflow)', styles['TableCell']),
     Paragraph('5 etats et 5 transitions dans DEFAULT_WORKFLOW', styles['TableCell']),
     Paragraph('CONFORME', styles['StatusOK'])],
]

tech_table = Table(tech_data, colWidths=[avail_w*0.30, avail_w*0.50, avail_w*0.20], repeatRows=1)
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))
story.append(tech_table)
story.append(Spacer(1, 3*mm))

story.append(Paragraph("5.2 Probleme critique : infrastructure de deploiement fantome", styles['H2']))

story.append(Paragraph(
    "Le Chapitre 3 decrit une architecture de deploiement Docker Compose avec 5 services (app, postgres, "
    "redis, minio, nginx) et affirme que le deploiement en une commande via setup.sh a ete 'valide sur "
    "serveur VPS'. Or, la verification du depot revele que :",
    styles['Body']
))

missing_files = [
    "Le fichier Dockerfile n'existe pas, bien que docker-compose.yml le reference (build: context: ., dockerfile: Dockerfile)",
    "Le fichier setup.sh n'existe pas, alors que le chapitre affirme qu'il a ete valide",
    "Le repertoire docker/ n'existe pas, bien que docker-compose.yml reference ./docker/nginx.conf et ./docker/ssl/",
    "En consequence, docker-compose up echouerait immediatement si tente",
]
for f in missing_files:
    story.append(Paragraph(f"\u2022 {f}", styles['MyBullet']))

story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "Il est possible que ces fichiers aient existe dans une version anterieure du depot (commit b23283e "
    "mentionne dans les audits precedents) mais qu'ils aient ete perdus lors d'une reinitialisation ou "
    "d'un force push. Quoi qu'il en soit, le Chapitre 3 fait reference a des elements d'infrastructure "
    "qui ne sont pas presents dans le depot actuel, ce qui constitue une incoherence grave si un membre "
    "du jury decide de cloner le depot pour verifier les affirmations du memoire.",
    styles['Body']
))

story.append(Paragraph("5.3 Justification du pivot technologique", styles['H2']))
story.append(Paragraph(
    "Le pivot de Spring Boot + React + PostgreSQL + MinIO + Keycloak (annonce au Chapitre 1) vers "
    "Next.js + Prisma + SQLite + NextAuth.js (implemente reellement) est explicitement reconnu et "
    "justifie dans le Chapitre 3, section 3.9.3 (Difficultes rencontrees) et dans la section 'Elements "
    "cles a defendre devant le jury'. Les justifications fournies sont solides : productivite accrue, "
    "base de code unique, typage TypeScript de bout en bout, SSR natif. Des reponses aux objections "
    "probables du jury sont egalement preparees. C'est un point positif majeur du chapitre.",
    styles['Body']
))

# ====================== 6. SCHEMAS ET DIAGRAMMES ======================
story.append(Paragraph("6. VERIFICATION DES SCHEMAS, DIAGRAMMES ET MODELES", styles['H1']))

story.append(Paragraph("6.1 Diagrammes presents et leur qualite", styles['H2']))

story.append(Paragraph(
    "Les 6 diagrammes generes par matplotlib et integres dans le document sont de qualite acceptable "
    "pour un memoire de Master. Ils couvrent les aspects architecturaux essentiels : architecture logique "
    "en couches, architecture de deploiement, cycle de vie workflow, MCD, hierarchie RBAC et systeme "
    "de modules. Chaque figure est accompagnee d'une legende (Figure 3-1 a Figure 3-6) et est referencee "
    "dans le texte du chapitre.",
    styles['Body']
))

story.append(Paragraph("6.2 Diagrammes manquants critiques", styles['H2']))

story.append(Paragraph(
    "Plusieurs diagrammes attendus dans un chapitre d'implementation de memoire sont absents du document :",
    styles['Body']
))

missing_uml = [
    "<b>Diagramme de cas d'utilisation (Use Case)</b> : Obligatoire pour montrer les interactions entre les acteurs et le systeme. Le Chapitre 1 reference la methode UML, rendant cette absence particulierement flagrante.",
    "<b>Diagramme de classes</b> : Essentiel pour presenter la structure orientee objet du systeme. Les 14 modeles Prisma devraient etre traduits en diagramme de classes UML.",
    "<b>Diagramme de sequence</b> : Necessaire pour illustrer les flux de communication, notamment le processus d'authentification, le cycle de vie documentaire et l'execution du workflow.",
    "<b>Diagramme d'activite</b> : Utile pour decrire les processus metier comme le workflow de validation documentaire.",
    "<b>MLD graphique</b> : Le MLD est presente uniquement sous forme de tableau textuel (Tableau 3-2). Un diagramme entite-relation avec cles etrangeres serait plus parlant.",
    "<b>MPD (Modele Physique de Donnees)</b> : La methode Merise presentee au Chapitre 1 exige les trois niveaux (MCD, MLD, MPD). Le MPD est totalement absent.",
]
for item in missing_uml:
    story.append(Paragraph(f"\u2022 {item}", styles['MyBullet']))

# ====================== 7. TESTS ET VALIDATIONS ======================
story.append(Paragraph("7. VERIFICATION DES TESTS ET VALIDATIONS", styles['H1']))

story.append(Paragraph("7.1 Honnetete academique des tests", styles['H2']))
story.append(Paragraph(
    "Le Chapitre 3 fait preuve d'une honnetete academique louable en matiere de tests. La section 3.8.6 "
    "(Limites des tests) reconnait explicitement qu'aucun framework de test automatise n'a ete integre "
    "et que tous les tests presentes sont manuels. Cette transparence est un atout pour la soutenance, "
    "car elle evite au jury de decouvrir des resultats de tests fabriques (probleme identifie dans "
    "l'audit academique initial qui notait des 'resultats de tests fabriques' dans une version anterieure).",
    styles['Body']
))

story.append(Paragraph("7.2 Tests documentes vs tests executables", styles['H2']))
story.append(Paragraph(
    "Les tests decrits dans le Chapitre 3 (sections 3.8.1 a 3.8.5) sont :",
    styles['Body']
))

tests_list = [
    "Validation du deploiement : Clone + setup.sh. PROBLEME : setup.sh n'existe pas, ce test ne peut pas etre reproduit.",
    "Validation de l'authentification : 9 comptes de test verifies. VERIFIABLE avec les comptes du seed.ts.",
    "Validation du cycle de vie documentaire : Brouillon a Archive. VERIFIABLE mais pas de preuve automatisee.",
    "Validation de l'isolation multi-tenant : 3 organisations testees. VERIFIABLE mais pas de preuve automatisee.",
    "Validation des endpoints API : Health, Dashboard, Documents. VERIFIABLE via curl mais pas de script de test.",
]
for t in tests_list:
    story.append(Paragraph(f"\u2022 {t}", styles['MyBullet']))

story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "<b>Recommandation :</b> Creer au minimum un script de test fonctionnel (test-manuel.sh) qui execute "
    "les scenarios decrits et produit un rapport de resultats. Cela fournirait une preuve tangible "
    "des validations effectuees et renforcerait la credibilite du chapitre.",
    styles['Body']
))

# ====================== 8. FORCES, LIMITES, PERSPECTIVES ======================
story.append(Paragraph("8. VERIFICATION DES FORCES, LIMITES ET PERSPECTIVES", styles['H1']))

story.append(Paragraph("8.1 Forces identifiees", styles['H2']))
story.append(Paragraph(
    "La section 3.9.1 identifie correctement les forces principales de la solution : architecture multi-tenant, "
    "typage statique TypeScript, RBAC granulaire, workflow extensible, journal d'audit complet et "
    "interface utilisateur moderne. Ces forces sont reelles et verifiables dans le code source. "
    "L'evaluation est honnete et non exageree.",
    styles['Body']
))

story.append(Paragraph("8.2 Limites reconnues", styles['H2']))
story.append(Paragraph(
    "La section 3.9.2 reconnait les limites suivantes : mots de passe en texte clair, absence de tests "
    "automatises, statistiques de dashboard hardcodees, notifications non dynamiques, CSP avec unsafe-inline, "
    "duplication frontend et packages inutilises. Toutes ces limites sont confirmees par l'analyse du code "
    "source. La transparence est appropriee pour un memoire academique et evitera au jury de les decouvrir "
    "lui-meme.",
    styles['Body']
))

story.append(Paragraph("8.3 Perspectives d'amelioration", styles['H2']))
story.append(Paragraph(
    "La section 3.10 propose cinq axes d'amelioration (securite, tests automatises, telechargement de "
    "fichiers, scalabilite, fonctionnalites additionnels). Ces perspectives sont realistes et bien "
    "articulees avec les limites identifiees. Elles demontrent une capacite d'analyse critique et "
    "une vision d'evolution du systeme, ce que le jury appreciera.",
    styles['Body']
))

# ====================== 9. COHERENCE CH1-2-3 ======================
story.append(Paragraph("9. COHERENCE AVEC LES CHAPITRES 1 ET 2", styles['H1']))

coherence_data = [
    [Paragraph('<b>Point de coherence</b>', styles['TableHeader']),
     Paragraph('<b>Chapitres 1-2</b>', styles['TableHeader']),
     Paragraph('<b>Chapitre 3</b>', styles['TableHeader']),
     Paragraph('<b>Statut</b>', styles['TableHeader'])],
    [Paragraph('Methode Merise', styles['TableCell']),
     Paragraph('Adoptee (MCD, MLD, MPD)', styles['TableCell']),
     Paragraph('MCD present, MLD partiel, MPD absent', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial'])],
    [Paragraph('Diagrammes UML', styles['TableCell']),
     Paragraph('References dans la methodologie', styles['TableCell']),
     Paragraph('Aucun diagramme UML', styles['TableCell']),
     Paragraph('MANQUANT', styles['StatusMissing'])],
    [Paragraph('Technologies', styles['TableCell']),
     Paragraph('Spring Boot, React, PostgreSQL, MinIO, Keycloak', styles['TableCell']),
     Paragraph('Next.js, Prisma, SQLite, NextAuth.js', styles['TableCell']),
     Paragraph('PIVOT JUSTIFIE', styles['StatusPartial'])],
    [Paragraph('Perimetre', styles['TableCell']),
     Paragraph('ISIPA uniquement (mono-organisation)', styles['TableCell']),
     Paragraph('8 types d\'organisations (multi-tenant SaaS)', styles['TableCell']),
     Paragraph('ELARGI', styles['StatusPartial'])],
    [Paragraph('Archivage ISO 14721', styles['TableCell']),
     Paragraph('Reference au modele OAIS', styles['TableCell']),
     Paragraph('Non aborde specifiquement', styles['TableCell']),
     Paragraph('MANQUANT', styles['StatusMissing'])],
    [Paragraph('Planning (49 jours, 12 taches)', styles['TableCell']),
     Paragraph('WBS, PERT, Gantt detailles', styles['TableCell']),
     Paragraph('Non reference dans le Chapitre 3', styles['TableCell']),
     Paragraph('MANQUANT', styles['StatusMissing'])],
    [Paragraph('Objectifs specifiques (6)', styles['TableCell']),
     Paragraph('Analyse, definition, conception, dev, test, recommandations', styles['TableCell']),
     Paragraph('Tous abordes sauf tests automatises', styles['TableCell']),
     Paragraph('PARTIEL', styles['StatusPartial'])],
    [Paragraph('Difficultes', styles['TableCell']),
     Paragraph('Acces limite, manque de documentation', styles['TableCell']),
     Paragraph('Pivot techno, Docker, complexite multi-tenant', styles['TableCell']),
     Paragraph('COHERENT', styles['StatusOK'])],
    [Paragraph('Structure Chapitre 3', styles['TableCell']),
     Paragraph('Rappel, Analyse, Conception, Dev, Tests, Livrable', styles['TableCell']),
     Paragraph('3.1-3.10 avec sections plus riches', styles['TableCell']),
     Paragraph('AMELIORE', styles['StatusOK'])],
]

coh_table = Table(coherence_data, colWidths=[avail_w*0.20, avail_w*0.28, avail_w*0.32, avail_w*0.20], repeatRows=1)
coh_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT_BG]),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
]))
story.append(coh_table)
story.append(Spacer(1, 3*mm))

story.append(Paragraph(
    "<b>Points d'incoherence majeurs :</b> Trois elements creat des contradictions entre les Chapitres 1-2 "
    "et le Chapitre 3 : (1) L'elargissement du perimetre d'ISIPA seul a 8 types d'organisations n'est "
    "pas justifie dans le Chapitre 3 comme une evolution de la problematique ; (2) La reference a ISO 14721 "
    "(OAIS) pour l'archivage numerique, mentionnee au Chapitre 1, n'est reprise nulle part dans le Chapitre 3 ; "
    "(3) Le planning detaille du Chapitre 2 (49 jours, chemin critique) n'est pas mis en perspective avec "
    "le deroulement reel du projet dans le Chapitre 3.",
    styles['Body']
))

# ====================== 10. BIBLIOGRAPHIE ======================
story.append(Paragraph("10. VERIFICATION DE LA BIBLIOGRAPHIE", styles['H1']))

story.append(Paragraph("10.1 Bibliographie dans le Chapitre 3", styles['H2']))
story.append(Paragraph(
    "Le Chapitre 3 ne contient aucune section bibliographique. Aucune reference, citation ou note de bas "
    "de page n'est presente dans les 209 paragraphes du document. C'est une omission academique majeure "
    "pour un chapitre d'implementation qui discute de technologies specifiques (Next.js, Prisma, NextAuth.js, "
    "Docker, etc.), de methodes (Merise, RBAC, JWT) et de standards (REST, OAuth).",
    styles['Body']
))

story.append(Paragraph("10.2 Bibliographie du memoire original (Chapitres 1-2)", styles['H2']))

story.append(Paragraph(
    "La bibliographie du memoire original est tres insuffisante. Elle comprend uniquement :",
    styles['Body']
))

bib_items = [
    "Ouvrages : 5 references seulement (Heeks 2018, Reichelt & Krommes 2024, Sommerville 2023, UN 2020, World Bank 2021)",
    "Memoires : Aucun memoire reference",
    "Webographie : Aucune reference web",
    "Dictionnaires et autres : Aucune reference",
]
for b in bib_items:
    story.append(Paragraph(f"\u2022 {b}", styles['MyBullet']))

story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "Pour un memoire de Master en Ingenierie Logicielle, cette bibliographie est nettement insuffisante. "
    "Les normes academiques attendent au minimum 20-30 references couvrant : ouvrages de reference, "
    "articles de revues scientifiques, memoires anterieurs, documentations techniques officielles, "
    "normes et standards (ISO, W3C, OWASP), et ressources en ligne pertinentes.",
    styles['Body']
))

story.append(Paragraph("10.3 References manquantes pour les technologies utilisees", styles['H2']))

missing_refs = [
    "Next.js / Vercel : Documentation officielle et articles de reference",
    "Prisma ORM : Documentation officielle, articles compareatifs ORM",
    "NextAuth.js : Documentation officielle, references sur l'authentification JWT",
    "Docker : Documentation officielle, references sur la conteneurisation",
    "TypeScript : Specification du langage, ouvrages de reference",
    "React 19 : Documentation officielle, articles sur le SSR/SSG",
    "Tailwind CSS : Documentation officielle",
    "shadcn/ui : Documentation officielle",
    "SQLite / PostgreSQL : Ouvrages sur les bases de donnees relationnelles",
    "RBAC : Articles academiques sur le controle d'acces base sur les roles (Ferraiolo et al.)",
    "Multi-tenancy : Articles sur les architectures multi-tenant SaaS",
    "Merise : Ouvrages de reference sur la methode Merise",
    "UML : Ouvrages de reference (Rumbaugh, Booch, Jacobson)",
    "REST : These de Roy Fielding (2000), specification OpenAPI",
    "OWASP : Referentiel de securite web (Top 10)",
    "ISO 14721 (OAIS) : Reference deja mentionnee au Chapitre 1 mais non developpee",
    "ISO 15489 : Norme internationale pour la gestion de documents",
]
for r in missing_refs:
    story.append(Paragraph(f"\u2022 {r}", styles['MyBullet']))

# ====================== 11. RAPPORT DETAILLE ======================
story.append(Paragraph("11. RAPPORT DETAILLE DES CONFORMITES", styles['H1']))

story.append(Paragraph("11.1 Elements conformes", styles['H2']))

conforme_items = [
    "Structure progressive du chapitre (3.1 a 3.10) : logique et coherente",
    "Description de l'architecture logique en 5 couches : exacte et verifiable",
    "Matrice de permissions RBAC (14 roles x 9 ressources x 12 actions) : conforme au code",
    "Moteur de workflow (5 etats, 5 transitions) : conforme au code",
    "Cycle de vie documentaire (Brouillon a Archive) : verifiable dans le code",
    "Systeme de jetons AEIP (8 prefixes) : conforme au token-engine.ts",
    "Journal d'audit (17 actions tracees) : conforme au schema Prisma",
    "Types de documents (14 categories) : conforme au schema Prisma",
    "Isolation multi-tenant par organisationId : verifiable dans le code",
    "Pivot technologique justifie et prepare pour la defense",
    "Section 'Elements cles a defendre devant le jury' : atout majeur",
    "Honnetete sur les tests manuels (pas de resultats fabriques)",
    "Analyse critique transparente des limites",
    "Perspectives d'amelioration realistes et bien articulees",
    "6 diagrammes d'architecture de qualite acceptable",
    "8 tableaux de donnees (stack, MCD-MLD, dictionnaire, enums, RBAC, API, jetons, comptes)",
]
for item in conforme_items:
    story.append(Paragraph(f"\u2022 {item}", styles['MyBullet']))

story.append(Paragraph("11.2 Elements partiellement conformes", styles['H2']))

partial_items = [
    "Nombre de modules (16 annonces vs 15 reels) : erreur de comptage a corriger",
    "Nombre de pages (22 annoncees vs 25 reelles) : sous-comptage a corriger",
    "MLD present uniquement sous forme de tableau, pas de diagramme graphique",
    "Descriptions des interfaces textuelles sans captures d'ecran (les captures existent en fichiers)",
    "Stack PostgreSQL/MinIO/Redis decrite pour la production mais non fonctionnelle (Dockerfile absent)",
    "Coherence avec Chapitre 1 (Merise/UML) : methode annoncee mais diagrammes UML absents",
    "Coherence avec Chapitre 2 (Planning) : non reference dans le Chapitre 3",
    "Reference a ISO 14721 (OAIS) du Chapitre 1 : pas reprise dans le Chapitre 3",
]
for item in partial_items:
    story.append(Paragraph(f"\u2022 {item}", styles['MyBullet']))

story.append(Paragraph("11.3 Elements manquants", styles['H2']))

missing_items = [
    "Captures d'ecran reelles dans le document (0 sur 11 disponibles)",
    "Diagrammes UML (cas d'utilisation, classes, sequence, activite)",
    "MPD (Modele Physique de Donnees) exigee par Merise",
    "MLD sous forme de diagramme graphique",
    "Bibliographie / references dans le Chapitre 3",
    "Fichier Dockerfile dans le depot (reference par docker-compose.yml)",
    "Fichier setup.sh dans le depot (affirmation de validation dans le chapitre)",
    "Repertoire docker/ avec nginx.conf et ssl/ (reference par docker-compose.yml)",
    "Captures d'ecran des tableaux de bord specialises (universitaire, hospitalier, gouvernement)",
    "Captures du workflow builder, page modules, page parametres",
    "Script de test fonctionnel reproduisant les validations decrites",
    "Reference au planning du Chapitre 2 et comparaison avec le deroulement reel",
]
for item in missing_items:
    story.append(Paragraph(f"\u2022 {item}", styles['MyBullet']))

# ====================== 12. NIVEAU DE PREPARATION ======================
story.append(Paragraph("12. NIVEAU DE PREPARATION ET COMPLETUDE", styles['H1']))

story.append(Paragraph("12.1 Pourcentage de completude par dimension", styles['H2']))

complet_data = [
    [Paragraph('<b>Dimension</b>', styles['TableHeader']),
     Paragraph('<b>Ponderation</b>', styles['TableHeader']),
     Paragraph('<b>Completude</b>', styles['TableHeader']),
     Paragraph('<b>Pondere</b>', styles['TableHeader'])],
    [Paragraph('Structure et organisation', styles['TableCell']),
     Paragraph('15%', styles['TableCellCenter']),
     Paragraph('90%', styles['TableCellCenter']),
     Paragraph('13.5%', styles['TableCellCenter'])],
    [Paragraph('Correspondance code vs chapitre', styles['TableCell']),
     Paragraph('20%', styles['TableCellCenter']),
     Paragraph('65%', styles['TableCellCenter']),
     Paragraph('13.0%', styles['TableCellCenter'])],
    [Paragraph('Captures d\'ecran et illustrations', styles['TableCell']),
     Paragraph('15%', styles['TableCellCenter']),
     Paragraph('25%', styles['TableCellCenter']),
     Paragraph('3.8%', styles['TableCellCenter'])],
    [Paragraph('Diagrammes UML et modelisation', styles['TableCell']),
     Paragraph('15%', styles['TableCellCenter']),
     Paragraph('40%', styles['TableCellCenter']),
     Paragraph('6.0%', styles['TableCellCenter'])],
    [Paragraph('Tests et validations', styles['TableCell']),
     Paragraph('10%', styles['TableCellCenter']),
     Paragraph('55%', styles['TableCellCenter']),
     Paragraph('5.5%', styles['TableCellCenter'])],
    [Paragraph('Analyse critique et perspectives', styles['TableCell']),
     Paragraph('10%', styles['TableCellCenter']),
     Paragraph('85%', styles['TableCellCenter']),
     Paragraph('8.5%', styles['TableCellCenter'])],
    [Paragraph('Bibliographie et references', styles['TableCell']),
     Paragraph('10%', styles['TableCellCenter']),
     Paragraph('5%', styles['TableCellCenter']),
     Paragraph('0.5%', styles['TableCellCenter'])],
    [Paragraph('Coherence Ch1-Ch2-Ch3', styles['TableCell']),
     Paragraph('5%', styles['TableCellCenter']),
     Paragraph('55%', styles['TableCellCenter']),
     Paragraph('2.8%', styles['TableCellCenter'])],
]

total_pondere = 13.5 + 13.0 + 3.8 + 6.0 + 5.5 + 8.5 + 0.5 + 2.8
complet_data.append([
    Paragraph('<b>TOTAL</b>', styles['BodyBold']),
    Paragraph('<b>100%</b>', styles['BodyBold']),
    Paragraph('', styles['TableCell']),
    Paragraph(f'<b>{total_pondere:.1f}%</b>', styles['BodyBold']),
])

comp_table = Table(complet_data, colWidths=[avail_w*0.35, avail_w*0.18, avail_w*0.22, avail_w*0.25], repeatRows=1)
comp_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#DEE2E6')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -2), [white, LIGHT_BG]),
    ('BACKGROUND', (0, -1), (-1, -1), LIGHT_BLUE),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
story.append(comp_table)
story.append(Spacer(1, 3*mm))

story.append(Paragraph(
    f"<b>Taux de completude global estime : {total_pondere:.1f}%</b>",
    styles['Body']
))

story.append(Paragraph(
    "Ce taux est insuffisant pour une soutenance de Master. Le seuil minimal acceptable est de 80%. "
    "Les principaux facteurs limitants sont : l'absence de captures d'ecran dans le document (impact : -11.2%), "
    "l'absence de diagrammes UML (impact : -9.0%), l'absence de bibliographie (impact : -9.5%), "
    "et les affirmations incorrectes sur les fichiers d'infrastructure (impact : -7.0%).",
    styles['Body']
))

# ====================== 13. QUESTIONS DU JURY ======================
story.append(Paragraph("13. QUESTIONS PROBABLES DU JURY", styles['H1']))

story.append(Paragraph(
    "Sur la base des lacunes identifiees, voici les questions qu'un jury est susceptible de poser "
    "et pour lesquelles le Chapitre 3 actuel ne fournit pas de reponse satisfaisante :",
    styles['Body']
))

jury_questions = [
    ("Q1", "Ou sont les captures d'ecran de votre application ?",
     "Le document ne contient aucune capture d'ecran. Un chapitre d'implementation sans preuve visuelle du produit realise est tres insuffisant."),
    ("Q2", "Pourquoi n'y a-t-il aucun diagramme UML ? Vous avez pourtant reference UML dans votre methodologie.",
     "Le Chapitre 1 presente Merise et UML comme methodes, mais le Chapitre 3 ne contient aucun diagramme UML. Cette incoherence sera remarquee."),
    ("Q3", "Vous parlez de setup.sh valide sur VPS, mais ce fichier n'existe pas dans votre depot. Comment l'expliquez-vous ?",
     "Affirmation du Chapitre 3 non verifiable. Le jury pourrait cloner le depot et constater l'absence du fichier."),
    ("Q4", "Votre docker-compose.yml reference un Dockerfile qui n'existe pas. Votre architecture de deploiement est-elle vraiment fonctionnelle ?",
     "L'architecture Docker decrite est non fonctionnelle. Le jury pourrait demander une demonstration de deploiement."),
    ("Q5", "Vous annoncez 16 modules mais le code en contient 15. Pouvez-vous nous lister les 16 modules ?",
     "Erreur de comptage qui pourrait etre interpretee comme un manque de rigueur."),
    ("Q6", "Comment votre solution repond-elle aux principes ISO 14721 (OAIS) que vous avez evoques au Chapitre 1 ?",
     "Aucun lien n'est etabli entre l'archivage numerique implemente et les principes OAIS reference au Chapitre 1."),
    ("Q7", "Votre planning prevoit 49 jours. Avez-vous respecte ce planning ? Quels ecarts avez-vous constates ?",
     "Aucun retour sur le planning du Chapitre 2 n'est fait dans le Chapitre 3."),
    ("Q8", "Votre perimetre est passe d'une application ISIPA a une plateforme multi-tenant SaaS. Cette evolution etait-elle prevue dans votre problematique ?",
     "L'elargissement du perimetre n'est pas justifie par rapport a la problematique initiale."),
    ("Q9", "Quelles references bibliographiques soutiennent vos choix techniques ?",
     "Aucune reference n'est citee dans le Chapitre 3 pour justifier les choix technologiques."),
    ("Q10", "Comment pouvez-vous garantir l'isolation des donnees entre organisations sans tests automatises ?",
     "L'absence de tests automatises d'isolation multi-tenant affaiblit la credibilite de cette affirmation."),
]

for qid, question, justification in jury_questions:
    story.append(Paragraph(f"<b>{qid} : {question}</b>", styles['BodyBold']))
    story.append(Paragraph(f"  Justification : {justification}", styles['SmallNote']))

# ====================== 14. RECOMMANDATIONS ======================
story.append(Paragraph("14. RECOMMANDATIONS FINALES", styles['H1']))

story.append(Paragraph("14.1 Actions critiques (avant soutenance)", styles['H2']))

critical_actions = [
    "<b>Integrer les 11 captures d'ecran</b> dans le document Chapitre 3, chacune accompagnee d'une explication detaillee et professionnelle. Ajouter des captures supplementaires pour les tableaux de bord specialises, le workflow builder et la page modules.",
    "<b>Creer les fichiers d'infrastructure manquants</b> : Dockerfile, setup.sh, docker/nginx.conf. Ces fichiers sont necessaires pour que les affirmations du Chapitre 3 soient verifiables.",
    "<b>Ajouter les diagrammes UML manquants</b> : au minimum un diagramme de cas d'utilisation, un diagramme de classes et un diagramme de sequence pour le processus d'authentification et le workflow documentaire.",
    "<b>Corriger les erreurs factuelles</b> : 16 modules -> 15 modules, 22 pages -> 25 pages, supprimer l'affirmation 'setup.sh valide sur VPS' si le fichier ne peut pas etre restaure.",
    "<b>Ajouter une section bibliographique</b> au Chapitre 3 avec au minimum les references des technologies utilisees, les standards (ISO, OWASP, REST) et les articles academiques sur le RBAC et le multi-tenancy.",
]
for a in critical_actions:
    story.append(Paragraph(f"\u2022 {a}", styles['MyBullet']))

story.append(Paragraph("14.2 Actions importantes (recommandees)", styles['H2']))

important_actions = [
    "Ajouter un diagramme MLD graphique (entite-relation avec cles etrangeres) en complement du tableau textuel.",
    "Ajouter un MPD (Modele Physique de Donnees) comme exige par la methode Merise.",
    "Justifier l'elargissement du perimetre (ISIPA -> 8 types d'organisations) par rapport a la problematique initiale.",
    "Faire le lien entre l'archivage implemente et les principes ISO 14721 (OAIS) du Chapitre 1.",
    "Ajouter un retour sur le planning du Chapitre 2 : respect/depassement des delais, ecarts constates.",
    "Enrichir la bibliographie generale du memoire (objectif : 25-30 references minimum).",
    "Creer un script de test fonctionnel (test-manuel.sh) pour rendre les validations reproductibles.",
]
for a in important_actions:
    story.append(Paragraph(f"\u2022 {a}", styles['MyBullet']))

story.append(Paragraph("14.3 Ameliorations souhaitees", styles['H2']))

wished_actions = [
    "Ajouter des captures d'ecran pour chaque role (ce que voit un DEAN vs un PROFESSOR vs un VIEWER).",
    "Ajouter un diagramme d'activite pour le workflow de validation documentaire.",
    "Documenter les resultats de performance (temps de chargement, temps de reponse API).",
    "Ajouter une matrice de traceabilite entre les objectifs du Chapitre 1 et les resultats du Chapitre 3.",
    "Inclure un diagramme de deploiement UML detaille.",
]
for a in wished_actions:
    story.append(Paragraph(f"\u2022 {a}", styles['MyBullet']))

story.append(Spacer(1, 5*mm))
story.append(HRFlowable(width="100%", thickness=1, color=MUTED, spaceAfter=3*mm))

story.append(Paragraph(
    f"<b>CONCLUSION :</b> Le Chapitre 3 dans sa version actuelle presente un contenu textuel de qualite "
    f"avec une structure academique solide et une honnetete louable sur les limites. Cependant, avec un "
    f"taux de completude de {total_pondere:.1f}%, il n'est pas encore pret pour une soutenance. "
    f"Les lacunes critiques (captures d'ecran absentes, diagrammes UML manquants, bibliographie inexistante, "
    f"fichiers d'infrastructure fantomes) doivent etre corrigees en priorite. Avec les corrections "
    f"recommandees dans la section 14.1, le chapitre pourrait atteindre un taux de completude de 85-90%, "
    f"niveau suffisant pour une soutenance reussie.",
    styles['Body']
))

# Build PDF
doc.build(story)
print(f"PDF generated: {OUTPUT}")
print(f"Size: {os.path.getsize(OUTPUT)/1024:.1f} KB")
