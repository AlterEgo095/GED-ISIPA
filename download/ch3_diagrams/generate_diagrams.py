#!/usr/bin/env python3
"""
Generate 13 professional UML and architecture diagrams for Master's thesis Chapter 3
GED-ISIPA - Electronic Document Management System
All diagrams in French, academically styled
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Ellipse
import matplotlib.font_manager as fm
import numpy as np
import os

# Font setup
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
try:
    fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
except:
    pass
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Liberation Sans']
plt.rcParams['axes.unicode_minus'] = False

# Color scheme - professional blues and grays
COLORS = {
    'primary': '#2C5F8A',
    'primary_light': '#4A8BC2',
    'primary_dark': '#1A3A5C',
    'secondary': '#5B9BD5',
    'accent': '#E8792B',
    'bg_light': '#F0F4F8',
    'bg_medium': '#D6E4F0',
    'bg_dark': '#B8CCE4',
    'border': '#2C5F8A',
    'text': '#1A1A2E',
    'text_light': '#4A4A6A',
    'white': '#FFFFFF',
    'gray_light': '#E8ECF0',
    'gray': '#9CA3AF',
    'gray_dark': '#6B7280',
    'green': '#28A745',
    'red': '#DC3545',
    'yellow': '#FFC107',
    'orange': '#FD7E14',
    'purple': '#6F42C1',
    'teal': '#20C997',
}

OUTPUT_DIR = '/home/z/my-project/download/ch3_diagrams'
DPI = 150

def save_fig(fig, filename):
    filepath = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(filepath, dpi=DPI, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"  Saved: {filepath}")

def draw_stick_figure(ax, x, y, label, scale=1.0, color=COLORS['primary_dark']):
    """Draw a UML stick figure actor"""
    s = scale
    # Head
    head = plt.Circle((x, y + 1.2*s), 0.25*s, fill=False, edgecolor=color, linewidth=2)
    ax.add_patch(head)
    # Body
    ax.plot([x, x], [y + 0.95*s, y + 0.35*s], color=color, linewidth=2)
    # Arms
    ax.plot([x - 0.35*s, x + 0.35*s], [y + 0.75*s, y + 0.75*s], color=color, linewidth=2)
    # Legs
    ax.plot([x, x - 0.3*s], [y + 0.35*s, y], color=color, linewidth=2)
    ax.plot([x, x + 0.3*s], [y + 0.35*s, y], color=color, linewidth=2)
    # Label
    ax.text(x, y - 0.2*s, label, ha='center', va='top', fontsize=9, fontweight='bold', color=color)

def draw_use_case(ax, x, y, label, w=2.4, h=0.7, color=COLORS['secondary']):
    """Draw a UML use case ellipse"""
    ellipse = Ellipse((x, y), w, h, fill=True, facecolor=color, edgecolor=COLORS['primary'],
                       linewidth=1.5, alpha=0.85)
    ax.add_patch(ellipse)
    ax.text(x, y, label, ha='center', va='center', fontsize=8, color='white', fontweight='bold')

def draw_package(ax, x, y, w, h, label, color=COLORS['bg_light']):
    """Draw a UML package"""
    tab_h = 0.4
    tab_w = min(w * 0.4, 3.0)
    # Tab
    tab = FancyBboxPatch((x, y + h - tab_h), tab_w, tab_h,
                          boxstyle="round,pad=0.05", facecolor=COLORS['primary'],
                          edgecolor=COLORS['primary_dark'], linewidth=1.5)
    ax.add_patch(tab)
    ax.text(x + tab_w/2, y + h - tab_h/2, label, ha='center', va='center',
            fontsize=10, fontweight='bold', color='white')
    # Body
    body = FancyBboxPatch((x, y), w, h - tab_h,
                           boxstyle="round,pad=0.05", facecolor=color,
                           edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.7)
    ax.add_patch(body)


# ============================================================
# DIAGRAM 1: Use Case Diagram
# ============================================================
def diagram_use_case():
    print("Generating Diagram 1: Use Case Diagram...")
    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    # Title
    ax.text(12, 17.5, "Figure 3.1 - Diagramme des cas d'utilisation GED-ISIPA",
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['primary_dark'])

    # Actors
    actors = {
        'SUPER_ADMIN': (1.5, 9),
        'ORG_ADMIN': (5, 9),
        'PROFESSEUR': (19, 9),
        'LECTEUR': (22.5, 9),
    }
    for name, (x, y) in actors.items():
        draw_stick_figure(ax, x, y, name, scale=0.8)

    # Packages with use cases
    # Authentication
    draw_package(ax, 7, 15.2, 10, 1.8, "Authentification")
    draw_use_case(ax, 9.5, 16.0, "Se connecter")
    draw_use_case(ax, 14.5, 16.0, "Se deconnecter")

    # Document Management
    draw_package(ax, 7, 10.8, 10, 4.2, "Gestion des documents")
    doc_ucs = [
        (9.5, 14.2, "Creer document"),
        (14.5, 14.2, "Consulter document"),
        (9.5, 13.2, "Modifier document"),
        (14.5, 13.2, "Supprimer document"),
        (9.5, 12.2, "Archiver document"),
        (14.5, 12.2, "Publier document"),
        (9.5, 11.2, "Telecharger document"),
        (14.5, 11.2, "Rechercher document"),
    ]
    for x, y, label in doc_ucs:
        draw_use_case(ax, x, y, label, w=2.6, h=0.65)

    # Workflow
    draw_package(ax, 7, 6.8, 10, 3.2, "Workflow")
    wf_ucs = [
        (9.5, 9.2, "Soumettre document"),
        (14.5, 9.2, "Approuver document"),
        (9.5, 8.0, "Rejeter document"),
        (14.5, 8.0, "Executer workflow"),
    ]
    for x, y, label in wf_ucs:
        draw_use_case(ax, x, y, label, w=2.6, h=0.65)

    # Administration
    draw_package(ax, 7, 2.4, 10, 3.8, "Administration")
    admin_ucs = [
        (9.5, 5.6, "Gerer utilisateurs"),
        (14.5, 5.6, "Gerer departements"),
        (9.5, 4.6, "Gerer modules"),
        (14.5, 4.6, "Consulter audit"),
        (9.5, 3.6, "Configurer workflow"),
    ]
    for x, y, label in admin_ucs:
        draw_use_case(ax, x, y, label, w=2.6, h=0.65)

    # Super Admin specific
    draw_package(ax, 17.5, 2.4, 6, 3.0, "Super Admin")
    sa_ucs = [
        (20.5, 4.6, "Gerer organisations"),
        (20.5, 3.6, "Gerer abonnements"),
        (20.5, 2.8, "Analyser plateforme"),
    ]
    for x, y, label in sa_ucs:
        draw_use_case(ax, x, y, label, w=2.6, h=0.65, color=COLORS['accent'])

    # Draw associations - lines from actors to use cases
    def actor_assoc(actor_name, uc_x, uc_y, style='-', color=COLORS['gray_dark']):
        ax_x, ax_y = actors[actor_name]
        ax.plot([ax_x + 0.3, uc_x - 1.2], [ax_y + 0.8, uc_y],
                linestyle=style, color=color, linewidth=0.8, alpha=0.5)

    # SUPER_ADMIN associations
    for x, y, _ in sa_ucs:
        ax.annotate('', xy=(x - 1.3, y), xytext=(2.0, 9.8),
                     arrowprops=dict(arrowstyle='-', color=COLORS['accent'], lw=0.8, alpha=0.4))
    # SUPER_ADMIN -> admin UCs
    for x, y, _ in admin_ucs:
        ax.annotate('', xy=(x - 1.3, y), xytext=(2.0, 9.8),
                     arrowprops=dict(arrowstyle='-', color=COLORS['gray_dark'], lw=0.6, alpha=0.3))
    # SUPER_ADMIN -> auth
    for x, y in [(9.5, 16.0), (14.5, 16.0)]:
        ax.annotate('', xy=(x - 1.2, y), xytext=(2.0, 10.5),
                     arrowprops=dict(arrowstyle='-', color=COLORS['gray_dark'], lw=0.6, alpha=0.3))

    # ORG_ADMIN associations
    for x, y, _ in admin_ucs + wf_ucs:
        ax.annotate('', xy=(x - 1.3, y), xytext=(5.3, 9.8),
                     arrowprops=dict(arrowstyle='-', color=COLORS['primary'], lw=0.6, alpha=0.3))
    for x, y, _ in doc_ucs:
        ax.annotate('', xy=(x - 1.3, y), xytext=(5.3, 10.2),
                     arrowprops=dict(arrowstyle='-', color=COLORS['primary'], lw=0.6, alpha=0.3))
    for x, y in [(9.5, 16.0), (14.5, 16.0)]:
        ax.annotate('', xy=(x - 1.2, y), xytext=(5.3, 10.5),
                     arrowprops=dict(arrowstyle='-', color=COLORS['primary'], lw=0.6, alpha=0.3))

    # PROFESSEUR associations
    for x, y, _ in doc_ucs[:4] + doc_ucs[6:]:
        ax.annotate('', xy=(x + 1.3, y), xytext=(19.3, 9.8),
                     arrowprops=dict(arrowstyle='-', color=COLORS['secondary'], lw=0.6, alpha=0.3))
    ax.annotate('', xy=(9.5 + 1.3, 9.2), xytext=(19.3, 9.8),
                 arrowprops=dict(arrowstyle='-', color=COLORS['secondary'], lw=0.6, alpha=0.3))
    for x, y in [(9.5, 16.0), (14.5, 16.0)]:
        ax.annotate('', xy=(x + 1.2, y), xytext=(19.3, 10.5),
                     arrowprops=dict(arrowstyle='-', color=COLORS['secondary'], lw=0.6, alpha=0.3))

    # LECTEUR associations
    ax.annotate('', xy=(14.5 + 1.3, 14.2), xytext=(22.3, 9.8),
                 arrowprops=dict(arrowstyle='-', color=COLORS['teal'], lw=0.6, alpha=0.4))
    ax.annotate('', xy=(14.5 + 1.3, 11.2), xytext=(22.3, 9.8),
                 arrowprops=dict(arrowstyle='-', color=COLORS['teal'], lw=0.6, alpha=0.4))
    ax.annotate('', xy=(9.5 + 1.3, 11.2), xytext=(22.3, 9.5),
                 arrowprops=dict(arrowstyle='-', color=COLORS['teal'], lw=0.6, alpha=0.4))
    for x, y in [(9.5, 16.0), (14.5, 16.0)]:
        ax.annotate('', xy=(x + 1.2, y), xytext=(22.3, 10.5),
                     arrowprops=dict(arrowstyle='-', color=COLORS['teal'], lw=0.6, alpha=0.4))

    # Include/Extend annotations
    # "Soumettre" includes "Executer workflow"
    ax.annotate('', xy=(10.8, 8.0), xytext=(10.8, 9.2),
                 arrowprops=dict(arrowstyle='->', color=COLORS['accent'], lw=1.2, linestyle='dashed'))
    ax.text(11.2, 8.6, '<<include>>', fontsize=7, color=COLORS['accent'], fontstyle='italic')

    # "Publier" extends "Approuver"
    ax.annotate('', xy=(14.5, 9.55), xytext=(14.5, 14.2 - 0.35),
                 arrowprops=dict(arrowstyle='->', color=COLORS['purple'], lw=1.2, linestyle='dashed'))
    ax.text(14.9, 12.0, '<<extend>>', fontsize=7, color=COLORS['purple'], fontstyle='italic')

    save_fig(fig, 'fig_use_case.png')


# ============================================================
# DIAGRAM 2: Class Diagram
# ============================================================
def diagram_class():
    print("Generating Diagram 2: Class Diagram...")
    fig, ax = plt.subplots(1, 1, figsize=(28, 22))
    ax.set_xlim(0, 28)
    ax.set_ylim(0, 22)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(14, 21.5, "Figure 3.2 - Diagramme de classes GED-ISIPA",
            ha='center', va='center', fontsize=16, fontweight='bold', color=COLORS['primary_dark'])

    def draw_class(ax, x, y, w, name, attrs, methods, color=COLORS['primary']):
        h_attr = max(len(attrs) * 0.28, 0.4)
        h_meth = max(len(methods) * 0.28, 0.4)
        h_name = 0.45
        h_total = h_name + h_attr + h_meth + 0.1

        # Shadow
        shadow = FancyBboxPatch((x + 0.05, y - h_total - 0.05), w, h_total,
                                 boxstyle="round,pad=0.02", facecolor='#DDDDDD',
                                 edgecolor='none', alpha=0.5)
        ax.add_patch(shadow)

        # Name compartment
        name_box = FancyBboxPatch((x, y - h_name), w, h_name,
                                   boxstyle="round,pad=0.02", facecolor=color,
                                   edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(name_box)
        ax.text(x + w/2, y - h_name/2, name, ha='center', va='center',
                fontsize=8, fontweight='bold', color='white')

        # Attributes compartment
        attr_y = y - h_name - h_attr
        attr_box = Rectangle((x, attr_y), w, h_attr,
                              facecolor=COLORS['bg_light'], edgecolor=COLORS['primary_dark'], linewidth=1)
        ax.add_patch(attr_box)
        for i, attr in enumerate(attrs):
            ax.text(x + 0.1, attr_y + h_attr - 0.15 - i * 0.28, attr,
                    fontsize=6, va='top', color=COLORS['text'], fontfamily='monospace')

        # Methods compartment
        meth_y = attr_y - h_meth
        meth_box = Rectangle((x, meth_y), w, h_meth,
                              facecolor=COLORS['white'], edgecolor=COLORS['primary_dark'], linewidth=1)
        ax.add_patch(meth_box)
        # Divider line
        ax.plot([x, x + w], [attr_y, attr_y], color=COLORS['primary_dark'], linewidth=0.8)
        ax.plot([x, x + w], [meth_y, meth_y], color=COLORS['primary_dark'], linewidth=0.8)

        for i, meth in enumerate(methods):
            ax.text(x + 0.1, meth_y + h_meth - 0.15 - i * 0.28, meth,
                    fontsize=6, va='top', color=COLORS['text_light'], fontfamily='monospace')

        return (x + w/2, y, x + w/2, meth_y)  # center_x, top, center_x, bottom

    # Class definitions
    classes = {
        'Organization': {
            'pos': (1, 21), 'w': 3.5,
            'attrs': ['+ id: String', '+ name: String', '+ slug: String', '+ code: String', '+ type: OrgType', '+ status: Status'],
            'methods': ['+ getModules()', '+ getSubscription()'],
            'color': COLORS['primary']
        },
        'User': {
            'pos': (5.5, 21), 'w': 3.5,
            'attrs': ['+ id: String', '+ email: String', '+ name: String', '+ password: String', '+ role: Role', '+ isActive: Boolean', '+ organizationId: FK', '+ departmentId: FK'],
            'methods': ['+ canAccess()', '+ hasPermission()', '+ getOrg()'],
            'color': COLORS['primary']
        },
        'Department': {
            'pos': (10, 21), 'w': 3.2,
            'attrs': ['+ id: String', '+ name: String', '+ code: String', '+ organizationId: FK'],
            'methods': ['+ getUsers()', '+ getDocs()'],
            'color': COLORS['primary_light']
        },
        'Document': {
            'pos': (14, 21), 'w': 3.8,
            'attrs': ['+ id: String', '+ title: String', '+ reference: String', '+ type: DocType', '+ status: DocStatus', '+ classification: Level', '+ organizationId: FK', '+ authorId: FK', '+ departmentId: FK', '+ workflowId: FK'],
            'methods': ['+ submit()', '+ approve()', '+ reject()', '+ publish()', '+ archive()'],
            'color': COLORS['secondary']
        },
        'DocumentVersion': {
            'pos': (18.5, 21), 'w': 3.0,
            'attrs': ['+ id: String', '+ documentId: FK', '+ version: Int', '+ content: String', '+ createdAt: DateTime'],
            'methods': ['+ getContent()'],
            'color': COLORS['secondary']
        },
        'Workflow': {
            'pos': (22.5, 21), 'w': 3.0,
            'attrs': ['+ id: String', '+ name: String', '+ organizationId: FK'],
            'methods': ['+ getStates()', '+ getTransitions()'],
            'color': COLORS['accent']
        },
        'WorkflowState': {
            'pos': (22.5, 16.5), 'w': 3.2,
            'attrs': ['+ id: String', '+ workflowId: FK', '+ name: String', '+ isInitial: Boolean', '+ isFinal: Boolean'],
            'methods': ['+ canTransition()'],
            'color': COLORS['accent']
        },
        'WorkflowTransition': {
            'pos': (22.5, 12.5), 'w': 3.5,
            'attrs': ['+ id: String', '+ workflowId: FK', '+ sourceStateId: FK', '+ targetStateId: FK', '+ name: String', '+ allowedRoles: Role[]'],
            'methods': ['+ execute()', '+ isAllowed()'],
            'color': COLORS['accent']
        },
        'OrgModule': {
            'pos': (1, 16), 'w': 3.2,
            'attrs': ['+ id: String', '+ organizationId: FK', '+ moduleKey: String', '+ status: Status'],
            'methods': ['+ activate()', '+ deactivate()'],
            'color': COLORS['teal']
        },
        'Subscription': {
            'pos': (5, 16), 'w': 3.0,
            'attrs': ['+ id: String', '+ organizationId: FK', '+ plan: Plan', '+ status: Status'],
            'methods': ['+ isActive()', '+ getFeatures()'],
            'color': COLORS['teal']
        },
        'AuditLog': {
            'pos': (9, 16), 'w': 3.5,
            'attrs': ['+ id: String', '+ userId: FK', '+ action: String', '+ entityType: String', '+ entityId: String', '+ ipAddress: String'],
            'methods': ['+ log()', '+ query()'],
            'color': COLORS['purple']
        },
        'AccessLog': {
            'pos': (13.5, 16), 'w': 3.2,
            'attrs': ['+ id: String', '+ userId: FK', '+ documentId: FK', '+ action: String', '+ timestamp: DateTime'],
            'methods': ['+ log()', '+ getStats()'],
            'color': COLORS['purple']
        },
        'Notification': {
            'pos': (17.5, 16), 'w': 3.0,
            'attrs': ['+ id: String', '+ userId: FK', '+ title: String', '+ message: String', '+ read: Boolean'],
            'methods': ['+ markRead()', '+ send()'],
            'color': COLORS['green']
        },
        'SystemSetting': {
            'pos': (21.5, 8), 'w': 3.0,
            'attrs': ['+ id: String', '+ key: String', '+ value: String'],
            'methods': ['+ get()', '+ set()'],
            'color': COLORS['gray_dark']
        },
    }

    class_centers = {}
    for name, info in classes.items():
        x, y_top = info['pos']
        w = info['w']
        attrs = info['attrs']
        methods = info['methods']
        result = draw_class(ax, x, y_top, w, name, attrs, methods, info['color'])
        h_name = 0.45
        h_attr = max(len(attrs) * 0.28, 0.4)
        h_meth = max(len(methods) * 0.28, 0.4)
        h_total = h_name + h_attr + h_meth + 0.1
        class_centers[name] = {
            'cx': x + w/2, 'top': y_top, 'bottom': y_top - h_total,
            'left': x, 'right': x + w, 'center': (x + w/2, y_top - h_total/2)
        }

    # Draw relationships
    def draw_rel(ax, from_cls, to_cls, label='', from_card='1', to_card='*', style='-', color=COLORS['primary_dark']):
        f = class_centers[from_cls]
        t = class_centers[to_cls]
        # Determine best connection points
        fx, fy = f['cx'], f['bottom']
        tx, ty = t['cx'], t['top']
        if abs(fx - tx) < 0.5:
            # Vertical alignment
            pass
        else:
            # Try left/right
            if fx < tx:
                fx, fy = f['right'], (f['top'] + f['bottom'])/2
                tx, ty = t['left'], (t['top'] + t['bottom'])/2
            else:
                fx, fy = f['left'], (f['top'] + f['bottom'])/2
                tx, ty = t['right'], (t['top'] + t['bottom'])/2

        ax.annotate('', xy=(tx, ty), xytext=(fx, fy),
                     arrowprops=dict(arrowstyle='-', color=color, lw=1.2, linestyle=style))
        # Cardinalities
        ax.text(fx + 0.15 * np.sign(tx - fx), fy + 0.15, from_card, fontsize=7, color=color, fontweight='bold')
        ax.text(tx - 0.15 * np.sign(tx - fx), ty + 0.15, to_card, fontsize=7, color=color, fontweight='bold')
        if label:
            mid_x, mid_y = (fx + tx)/2, (fy + ty)/2
            ax.text(mid_x, mid_y + 0.2, label, fontsize=6, color=color, fontstyle='italic',
                    ha='center', va='bottom', bbox=dict(boxstyle='round,pad=0.1', facecolor='white', alpha=0.8))

    # Relationships
    draw_rel(ax, 'Organization', 'User', 'possede', '1', '1..*')
    draw_rel(ax, 'Organization', 'Department', 'structure', '1', '1..*')
    draw_rel(ax, 'Organization', 'Document', 'contient', '1', '0..*')
    draw_rel(ax, 'Organization', 'Workflow', 'definit', '1', '0..*')
    draw_rel(ax, 'Organization', 'OrgModule', 'active', '1', '0..*')
    draw_rel(ax, 'Organization', 'Subscription', 'souscrit', '1', '0..1')
    draw_rel(ax, 'User', 'AuditLog', 'genere', '1', '0..*')
    draw_rel(ax, 'User', 'AccessLog', 'effectue', '1', '0..*')
    draw_rel(ax, 'User', 'Notification', 'recoit', '1', '0..*')
    draw_rel(ax, 'User', 'Document', 'auteur', '1', '0..*')
    draw_rel(ax, 'Department', 'User', 'appartient', '1', '0..*')
    draw_rel(ax, 'Department', 'Document', 'rattache', '1', '0..*')
    draw_rel(ax, 'Document', 'DocumentVersion', 'versions', '1', '0..*')
    draw_rel(ax, 'Document', 'AccessLog', 'acces', '1', '0..*')
    draw_rel(ax, 'Workflow', 'WorkflowState', 'etats', '1', '1..*')
    draw_rel(ax, 'Workflow', 'WorkflowTransition', 'transitions', '1', '1..*')
    draw_rel(ax, 'WorkflowState', 'WorkflowTransition', 'source', '1', '0..*')
    draw_rel(ax, 'WorkflowState', 'WorkflowTransition', 'cible', '1', '0..*')

    save_fig(fig, 'fig_class_diagram.png')


# ============================================================
# DIAGRAM 3: Sequence Diagram - Authentication
# ============================================================
def diagram_seq_auth():
    print("Generating Diagram 3: Sequence Diagram - Authentication...")
    fig, ax = plt.subplots(1, 1, figsize=(22, 16))
    ax.set_xlim(0, 22)
    ax.set_ylim(0, 16)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(11, 15.5, "Figure 3.3 - Diagramme de sequence : Authentification",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    # Participants
    participants = [
        ('Utilisateur', 2.5, COLORS['primary_dark']),
        ('Navigateur', 5.5, COLORS['secondary']),
        ('NextAuth\nAPI', 8.5, COLORS['primary']),
        ('Credentials\nProvider', 11.5, COLORS['accent']),
        ('Prisma\nORM', 14.5, COLORS['teal']),
        ('Base de\ndonnees', 17.5, COLORS['purple']),
        ('Middleware', 20.5, COLORS['red']),
    ]

    lifeline_y_top = 14.5
    lifeline_y_bottom = 0.5

    for name, x, color in participants:
        # Participant box
        box = FancyBboxPatch((x - 1.1, lifeline_y_top), 2.2, 0.7,
                              boxstyle="round,pad=0.1", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, lifeline_y_top + 0.35, name, ha='center', va='center',
                fontsize=7, fontweight='bold', color='white')
        # Lifeline
        ax.plot([x, x], [lifeline_y_top, lifeline_y_bottom],
                linestyle='--', color=color, linewidth=0.8, alpha=0.5)

    # Messages
    messages = [
        (2.5, 5.5, 13.7, "1: Saisir identifiants", '->', COLORS['primary_dark']),
        (5.5, 8.5, 13.1, "2: POST /api/auth/callback/credentials", '->', COLORS['secondary']),
        (8.5, 11.5, 12.5, "3: authorize(email, password, orgCode)", '->', COLORS['primary']),
        (11.5, 14.5, 11.9, "4: findUnique({email, include: {organization}})", '->', COLORS['accent']),
        (14.5, 17.5, 11.3, "5: SELECT * FROM User WHERE email=?", '->', COLORS['teal']),
        (17.5, 14.5, 10.7, "6: Enregistrement utilisateur", '->', COLORS['purple']),
        (14.5, 11.5, 10.1, "7: Donnees utilisateur + organisation", '->', COLORS['teal']),
        (11.5, 11.5, 9.5, "8: Verifier mot de passe + isActive + orgCode", '->', COLORS['accent']),
        (11.5, 14.5, 8.9, "9: update({lastLogin: now()})", '->', COLORS['accent']),
        (11.5, 14.5, 8.3, "10: create({AuditLog: LOGIN})", '->', COLORS['accent']),
        (11.5, 8.5, 7.7, "11: Retourner user + JWT claims", '->', COLORS['green']),
        (8.5, 5.5, 7.1, "12: Definir cookie JWT + redirection", '->', COLORS['primary']),
        (5.5, 2.5, 6.5, "13: Page accueil avec session", '->', COLORS['secondary']),
        (2.5, 5.5, 5.9, "14: Requete suivante avec JWT", '->', COLORS['primary_dark']),
        (5.5, 20.5, 5.3, "15: Router requete avec JWT", '->', COLORS['secondary']),
        (20.5, 20.5, 4.7, "16: Verifier JWT + controle RBAC", '->', COLORS['red']),
        (20.5, 8.5, 4.1, "17: Autorisation validee", '->', COLORS['green']),
        (8.5, 2.5, 3.5, "18: Acces autorise a la page", '->', COLORS['primary']),
    ]

    for from_x, to_x, y, label, arrow, color in messages:
        ax.annotate('', xy=(to_x, y), xytext=(from_x, y),
                     arrowprops=dict(arrowstyle='->', color=color, lw=1.0))
        mid_x = (from_x + to_x) / 2
        # Activation boxes (thin rectangles on lifelines)
        ax.text(mid_x, y + 0.15, label, fontsize=5.5, ha='center', va='bottom',
                color=COLORS['text'], fontstyle='italic',
                bbox=dict(boxstyle='round,pad=0.05', facecolor='white', alpha=0.85, edgecolor='none'))

    # Self-message boxes
    for from_x, to_x, y, label, arrow, color in messages:
        if from_x == to_x:
            # Draw self-message loop
            ax.annotate('', xy=(from_x + 0.6, y - 0.2), xytext=(from_x, y),
                         arrowprops=dict(arrowstyle='->', color=color, lw=1.0,
                                         connectionstyle='arc3,rad=-0.3'))

    save_fig(fig, 'fig_seq_auth.png')


# ============================================================
# DIAGRAM 4: Sequence Diagram - Document Workflow
# ============================================================
def diagram_seq_workflow():
    print("Generating Diagram 4: Sequence Diagram - Document Workflow...")
    fig, ax = plt.subplots(1, 1, figsize=(22, 18))
    ax.set_xlim(0, 22)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(11, 17.5, "Figure 3.4 - Diagramme de sequence : Workflow documentaire",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    participants = [
        ('Utilisateur', 2, COLORS['primary_dark']),
        ('API\nRoute', 5, COLORS['secondary']),
        ('Moteur\nWorkflow', 8.5, COLORS['accent']),
        ('Prisma\nORM', 12, COLORS['teal']),
        ('Base de\ndonnees', 15.5, COLORS['purple']),
        ('Admin', 19, COLORS['red']),
    ]

    lifeline_y_top = 16.5
    lifeline_y_bottom = 0.5

    for name, x, color in participants:
        box = FancyBboxPatch((x - 1.1, lifeline_y_top), 2.2, 0.7,
                              boxstyle="round,pad=0.1", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, lifeline_y_top + 0.35, name, ha='center', va='center',
                fontsize=7, fontweight='bold', color='white')
        ax.plot([x, x], [lifeline_y_top, lifeline_y_bottom],
                linestyle='--', color=color, linewidth=0.8, alpha=0.5)

    # Fragment boxes
    # Creation
    frag1 = FancyBboxPatch((0.5, 14.5), 20.5, 1.6,
                             boxstyle="round,pad=0.1", facecolor='none',
                             edgecolor=COLORS['primary'], linewidth=1, linestyle='--')
    ax.add_patch(frag1)
    ax.text(1, 15.9, "Creation", fontsize=8, fontweight='bold', color=COLORS['primary'],
            bbox=dict(facecolor=COLORS['bg_light'], edgecolor=COLORS['primary'], pad=2))

    # Soumission
    frag2 = FancyBboxPatch((0.5, 11.8), 20.5, 2.4,
                             boxstyle="round,pad=0.1", facecolor='none',
                             edgecolor=COLORS['accent'], linewidth=1, linestyle='--')
    ax.add_patch(frag2)
    ax.text(1, 13.9, "Soumission", fontsize=8, fontweight='bold', color=COLORS['accent'],
            bbox=dict(facecolor=COLORS['bg_light'], edgecolor=COLORS['accent'], pad=2))

    # Approbation
    frag3 = FancyBboxPatch((0.5, 8.5), 20.5, 3.0,
                             boxstyle="round,pad=0.1", facecolor='none',
                             edgecolor=COLORS['green'], linewidth=1, linestyle='--')
    ax.add_patch(frag3)
    ax.text(1, 11.2, "Approbation", fontsize=8, fontweight='bold', color=COLORS['green'],
            bbox=dict(facecolor=COLORS['bg_light'], edgecolor=COLORS['green'], pad=2))

    # Publication
    frag4 = FancyBboxPatch((0.5, 5.5), 20.5, 2.7,
                             boxstyle="round,pad=0.1", facecolor='none',
                             edgecolor=COLORS['purple'], linewidth=1, linestyle='--')
    ax.add_patch(frag4)
    ax.text(1, 7.9, "Publication", fontsize=8, fontweight='bold', color=COLORS['purple'],
            bbox=dict(facecolor=COLORS['bg_light'], edgecolor=COLORS['purple'], pad=2))

    # Archivage
    frag5 = FancyBboxPatch((0.5, 1.0), 20.5, 4.2,
                             boxstyle="round,pad=0.1", facecolor='none',
                             edgecolor=COLORS['gray_dark'], linewidth=1, linestyle='--')
    ax.add_patch(frag5)
    ax.text(1, 4.9, "Archivage", fontsize=8, fontweight='bold', color=COLORS['gray_dark'],
            bbox=dict(facecolor=COLORS['bg_light'], edgecolor=COLORS['gray_dark'], pad=2))

    messages = [
        # Creation
        (2, 5, 15.7, "1: POST /api/documents (creer brouillon)", COLORS['primary_dark']),
        (5, 12, 15.2, "2: create({status: DRAFT})", COLORS['secondary']),
        (12, 15.5, 14.7, "3: INSERT INTO Document", COLORS['teal']),
        (15.5, 2, 14.2, "4: Document cree (Brouillon)", COLORS['purple']),
        # Soumission
        (2, 5, 13.4, "5: POST /api/documents/[id]/submit", COLORS['primary_dark']),
        (5, 8.5, 12.9, "6: executeTransition(Soumettre)", COLORS['secondary']),
        (8.5, 8.5, 12.4, "7: canTransition(Brouillon->En revision) + role?", COLORS['accent']),
        (8.5, 12, 11.9, "8: update({status: PENDING_REVIEW})", COLORS['accent']),
        (12, 15.5, 11.4, "9: UPDATE Document SET status", COLORS['teal']),
        (8.5, 5, 10.9, "10: Document soumis pour revision", COLORS['accent']),
        # Approbation
        (19, 5, 10.1, "11: POST /api/documents/[id]/approve", COLORS['red']),
        (5, 8.5, 9.6, "12: executeTransition(Approuver) + role check", COLORS['secondary']),
        (8.5, 8.5, 9.1, "13: canTransition(En revision->Approuve)", COLORS['accent']),
        (8.5, 12, 8.6, "14: update({status: APPROVED})", COLORS['accent']),
        (12, 15.5, 8.1, "15: UPDATE Document SET status=APPROVED", COLORS['teal']),
        (15.5, 19, 7.6, "16: Document approuve", COLORS['purple']),
        # Publication
        (19, 5, 6.8, "17: POST /api/documents/[id]/publish", COLORS['red']),
        (5, 8.5, 6.3, "18: executeTransition(Publier) + role check", COLORS['secondary']),
        (8.5, 8.5, 5.8, "19: canTransition(Approuve->Publie)", COLORS['accent']),
        (8.5, 12, 5.3, "20: update({status: PUBLISHED})", COLORS['accent']),
        (12, 15.5, 4.8, "21: UPDATE Document SET status=PUBLISHED", COLORS['teal']),
        # Archivage
        (2, 5, 4.0, "22: POST /api/documents/[id]/archive", COLORS['primary_dark']),
        (5, 8.5, 3.5, "23: executeTransition(Archiver)", COLORS['secondary']),
        (8.5, 12, 3.0, "24: update({status: ARCHIVED, archivedAt})", COLORS['accent']),
        (12, 15.5, 2.5, "25: UPDATE Document SET status=ARCHIVED", COLORS['teal']),
        (15.5, 2, 2.0, "26: Document archive", COLORS['purple']),
    ]

    for from_x, to_x, y, label, color in messages:
        if from_x == to_x:
            ax.annotate('', xy=(from_x + 0.8, y - 0.3), xytext=(from_x, y),
                         arrowprops=dict(arrowstyle='->', color=color, lw=1.0,
                                         connectionstyle='arc3,rad=-0.4'))
            ax.text(from_x + 1.0, y - 0.15, label, fontsize=5, ha='left', va='center',
                    color=COLORS['text'], fontstyle='italic',
                    bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=0.5))
        else:
            ax.annotate('', xy=(to_x, y), xytext=(from_x, y),
                         arrowprops=dict(arrowstyle='->', color=color, lw=1.0))
            mid_x = (from_x + to_x) / 2
            ax.text(mid_x, y + 0.12, label, fontsize=5, ha='center', va='bottom',
                    color=COLORS['text'], fontstyle='italic',
                    bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=0.5))

    save_fig(fig, 'fig_seq_workflow.png')


# ============================================================
# DIAGRAM 5: Activity Diagram - Document Lifecycle
# ============================================================
def diagram_activity():
    print("Generating Diagram 5: Activity Diagram - Document Lifecycle...")
    fig, ax = plt.subplots(1, 1, figsize=(22, 18))
    ax.set_xlim(0, 22)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(11, 17.5, "Figure 3.5 - Diagramme d'activite : Cycle de vie documentaire",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    # Swimlanes
    lanes = [
        ('Createur\n(USER/PROFESSEUR)', 0.5, 7, COLORS['bg_light']),
        ('Evaluateur\n(ORG_ADMIN/DEAN)', 7.5, 7, COLORS['bg_medium']),
        ('Administrateur\n(ORG_ADMIN/DEAN/CFO)', 14.5, 7, COLORS['bg_dark']),
    ]

    for name, x, w, color in lanes:
        lane = FancyBboxPatch((x, 0.5), w, 16.5,
                               boxstyle="round,pad=0.1", facecolor=color,
                               edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.3)
        ax.add_patch(lane)
        ax.text(x + w/2, 16.5, name, ha='center', va='center',
                fontsize=10, fontweight='bold', color=COLORS['primary_dark'],
                bbox=dict(facecolor='white', edgecolor=COLORS['primary_dark'], pad=3, alpha=0.9))

    def draw_action(ax, x, y, label, w=2.8, h=0.7, color=COLORS['secondary']):
        box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                              boxstyle="round,pad=0.1", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, label, ha='center', va='center', fontsize=9, color='white', fontweight='bold')

    def draw_decision(ax, x, y, label=''):
        diamond = plt.Polygon([[x, y+0.5], [x+0.5, y], [x, y-0.5], [x-0.5, y]],
                               facecolor=COLORS['yellow'], edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(diamond)
        if label:
            ax.text(x, y, label, ha='center', va='center', fontsize=7, fontweight='bold')

    def draw_start(ax, x, y):
        circle = plt.Circle((x, y), 0.25, facecolor=COLORS['primary_dark'], edgecolor='black')
        ax.add_patch(circle)

    def draw_end(ax, x, y):
        circle = plt.Circle((x, y), 0.3, facecolor=COLORS['primary_dark'], edgecolor='black')
        ax.add_patch(circle)
        inner = plt.Circle((x, y), 0.18, facecolor='white')
        ax.add_patch(inner)
        inner2 = plt.Circle((x, y), 0.12, facecolor=COLORS['primary_dark'])
        ax.add_patch(inner2)

    def draw_arrow(ax, from_xy, to_xy, label='', color=COLORS['primary_dark']):
        ax.annotate('', xy=to_xy, xytext=from_xy,
                     arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
        if label:
            mid_x = (from_xy[0] + to_xy[0]) / 2
            mid_y = (from_xy[1] + to_xy[1]) / 2
            ax.text(mid_x + 0.15, mid_y + 0.15, label, fontsize=7, color=color, fontweight='bold',
                    bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=1))

    # Flow elements - positions based on swimlanes
    # Lane 1: Createur (x center ~4)
    # Lane 2: Evaluateur (x center ~11)
    # Lane 3: Administrateur (x center ~18)

    # Start
    draw_start(ax, 4, 16)
    draw_arrow(ax, (4, 15.7), (4, 15.2))

    # Brouillon
    draw_action(ax, 4, 14.8, 'Brouillon', color=COLORS['primary'])
    draw_arrow(ax, (4, 14.4), (4, 13.8))

    # Soumettre
    draw_action(ax, 4, 13.4, 'Soumettre', color=COLORS['secondary'])
    draw_arrow(ax, (4, 13.0), (4, 12.5))

    # Fork bar
    ax.plot([3, 5], [12.2, 12.2], color=COLORS['primary_dark'], linewidth=3)
    draw_arrow(ax, (4, 12.5), (4, 12.3))

    # En revision
    draw_action(ax, 11, 11.5, 'En revision', color=COLORS['accent'])
    draw_arrow(ax, (4, 12.2), (11, 11.9))

    # Decision
    draw_decision(ax, 11, 10.3)
    draw_arrow(ax, (11, 11.1), (11, 10.8))

    # Approuver branch
    draw_action(ax, 11, 9.0, 'Approuver', color=COLORS['green'])
    draw_arrow(ax, (11, 9.8), (11, 9.4))
    ax.text(10.5, 9.8, 'Oui', fontsize=8, color=COLORS['green'], fontweight='bold')

    # Approuve
    draw_action(ax, 18, 8.0, 'Approuve', color=COLORS['green'])
    draw_arrow(ax, (11, 8.6), (18, 8.4))

    # Publier
    draw_action(ax, 18, 7.0, 'Publier', color=COLORS['purple'])
    draw_arrow(ax, (18, 7.7), (18, 7.4))

    # Publie
    draw_action(ax, 18, 6.0, 'Publie', color=COLORS['purple'])
    draw_arrow(ax, (18, 6.6), (18, 6.4))

    # Archiver
    draw_action(ax, 18, 5.0, 'Archiver', color=COLORS['gray_dark'])
    draw_arrow(ax, (18, 5.6), (18, 5.4))

    # Archive
    draw_action(ax, 18, 4.0, 'Archive', color=COLORS['gray_dark'])
    draw_arrow(ax, (18, 4.6), (18, 4.4))

    # End
    draw_end(ax, 18, 3.2)
    draw_arrow(ax, (18, 3.6), (18, 3.5))

    # Rejeter branch
    draw_action(ax, 4, 9.0, 'Rejeter', color=COLORS['red'])
    draw_arrow(ax, (10.5, 10.3), (4, 9.4))
    ax.text(7, 10.3, 'Non', fontsize=8, color=COLORS['red'], fontweight='bold')

    # Rejete
    draw_action(ax, 4, 8.0, 'Rejete', color=COLORS['red'])
    draw_arrow(ax, (4, 8.6), (4, 8.4))

    # Reviser
    draw_action(ax, 4, 7.0, 'Reviser', color=COLORS['orange'])
    draw_arrow(ax, (4, 7.6), (4, 7.4))

    # Loop back to Brouillon
    ax.annotate('', xy=(2.5, 14.8), xytext=(2.5, 7.0),
                 arrowprops=dict(arrowstyle='->', color=COLORS['orange'], lw=1.5,
                                 connectionstyle='arc3,rad=-0.3'))
    draw_arrow(ax, (4, 6.6), (2.5, 6.6))
    ax.annotate('', xy=(2.5, 14.8), xytext=(2.5, 6.6),
                 arrowprops=dict(arrowstyle='->', color=COLORS['orange'], lw=1.5))
    ax.text(1.8, 11, 'Retour\nbrouillon', fontsize=7, color=COLORS['orange'], fontweight='bold',
            ha='center', fontstyle='italic')

    save_fig(fig, 'fig_activity_doc.png')


# ============================================================
# DIAGRAM 6: Component Diagram
# ============================================================
def diagram_component():
    print("Generating Diagram 6: Component Diagram...")
    fig, ax = plt.subplots(1, 1, figsize=(26, 20))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 20)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(13, 19.5, "Figure 3.6 - Diagramme de composants GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_component(ax, x, y, w, h, label, color=COLORS['primary'], sub_items=None):
        # Shadow
        shadow = FancyBboxPatch((x + 0.05, y - 0.05), w, h,
                                 boxstyle="round,pad=0.05", facecolor='#CCCCCC',
                                 edgecolor='none', alpha=0.5)
        ax.add_patch(shadow)
        # Main box
        box = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.08", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.9)
        ax.add_patch(box)
        # Component icon (small rectangles)
        icon_x, icon_y = x + 0.15, y + h - 0.35
        ax.add_patch(Rectangle((icon_x, icon_y), 0.35, 0.15, facecolor='white', edgecolor=COLORS['primary_dark'], linewidth=0.8))
        ax.add_patch(Rectangle((icon_x, icon_y + 0.15), 0.2, 0.1, facecolor='white', edgecolor=COLORS['primary_dark'], linewidth=0.8))
        # Label
        ax.text(x + w/2, y + h - 0.25, label, ha='center', va='center',
                fontsize=9, fontweight='bold', color='white')
        # Sub items
        if sub_items:
            sub_y = y + h - 0.6
            for item in sub_items:
                sub_box = FancyBboxPatch((x + 0.15, sub_y - 0.3), w - 0.3, 0.28,
                                          boxstyle="round,pad=0.03", facecolor='white',
                                          edgecolor=COLORS['primary'], linewidth=0.8, alpha=0.9)
                ax.add_patch(sub_box)
                ax.text(x + w/2, sub_y - 0.16, item, ha='center', va='center',
                        fontsize=6.5, color=COLORS['text'])
                sub_y -= 0.35

    # Layer 1: Presentation
    layer1_y = 15.5
    layer1 = FancyBboxPatch((0.5, layer1_y), 25, 3.5,
                             boxstyle="round,pad=0.1", facecolor=COLORS['bg_light'],
                             edgecolor=COLORS['primary'], linewidth=2, alpha=0.4)
    ax.add_patch(layer1)
    ax.text(1.2, layer1_y + 3.2, "Couche Presentation", fontsize=11, fontweight='bold',
            color=COLORS['primary_dark'])

    pres_components = [
        (1, layer1_y + 0.3, 2.8, 2.5, "LoginPage", COLORS['primary'], []),
        (4.2, layer1_y + 0.3, 2.8, 2.5, "Dashboard", COLORS['primary'], ["DashboardPages"]),
        (7.4, layer1_y + 0.3, 2.8, 2.5, "DocumentList", COLORS['secondary'], []),
        (10.6, layer1_y + 0.3, 2.8, 2.5, "DocumentDetail", COLORS['secondary'], []),
        (13.8, layer1_y + 0.3, 2.8, 2.5, "ArchivesPage", COLORS['secondary'], []),
        (17.0, layer1_y + 0.3, 2.8, 2.5, "AuditPage", COLORS['teal'], []),
        (20.2, layer1_y + 0.3, 2.8, 2.5, "AdminPage", COLORS['accent'], []),
        (23.0, layer1_y + 0.3, 2.8, 2.5, "Workflows", COLORS['purple'], []),
    ]
    for args in pres_components:
        draw_component(ax, *args)

    # Layer 2: Business Logic
    layer2_y = 10.5
    layer2 = FancyBboxPatch((0.5, layer2_y), 25, 4.5,
                             boxstyle="round,pad=0.1", facecolor=COLORS['bg_medium'],
                             edgecolor=COLORS['accent'], linewidth=2, alpha=0.4)
    ax.add_patch(layer2)
    ax.text(1.2, layer2_y + 4.2, "Couche Logique Metier", fontsize=11, fontweight='bold',
            color=COLORS['primary_dark'])

    biz_components = [
        (1, layer2_y + 0.3, 3.5, 3.5, "AuthService", COLORS['accent'], ["JWT", "Session", "RBAC"]),
        (5, layer2_y + 0.3, 3.5, 3.5, "WorkflowEngine", COLORS['accent'], ["Transition", "State", "Role"]),
        (9, layer2_y + 0.3, 3.5, 3.5, "ModuleEngine", COLORS['teal'], ["Activate", "Config", "Check"]),
        (13, layer2_y + 0.3, 3.5, 3.5, "PermissionMatrix", COLORS['purple'], ["Role", "Action", "Resource"]),
        (17, layer2_y + 0.3, 3.5, 3.5, "TokenEngine", COLORS['primary'], ["Generate", "Validate", "Refresh"]),
        (21, layer2_y + 0.3, 3.5, 3.5, "Redirection", COLORS['secondary'], ["Route", "Role", "Org"]),
    ]
    for args in biz_components:
        draw_component(ax, *args)

    # Layer 3: Data Access
    layer3_y = 7.0
    layer3 = FancyBboxPatch((0.5, layer3_y), 25, 3.0,
                             boxstyle="round,pad=0.1", facecolor=COLORS['bg_dark'],
                             edgecolor=COLORS['teal'], linewidth=2, alpha=0.4)
    ax.add_patch(layer3)
    ax.text(1.2, layer3_y + 2.7, "Couche Acces aux Donnees", fontsize=11, fontweight='bold',
            color=COLORS['primary_dark'])

    data_components = [
        (1, layer3_y + 0.2, 4, 2.2, "PrismaClient", COLORS['teal'], ["Queries", "Mutations"]),
        (5.5, layer3_y + 0.2, 4, 2.2, "Schema (14)", COLORS['teal'], ["Models", "Relations"]),
        (10.5, layer3_y + 0.2, 4, 2.2, "Validators", COLORS['primary'], ["Zod", "Schemas"]),
        (15, layer3_y + 0.2, 4, 2.2, "Migrations", COLORS['primary'], ["SQL", "Seed"]),
    ]
    for args in data_components:
        draw_component(ax, *args)

    # Layer 4: External & Infrastructure
    layer4_y = 1.5
    layer4 = FancyBboxPatch((0.5, layer4_y), 25, 5.0,
                             boxstyle="round,pad=0.1", facecolor=COLORS['gray_light'],
                             edgecolor=COLORS['gray_dark'], linewidth=2, alpha=0.4)
    ax.add_patch(layer4)
    ax.text(1.2, layer4_y + 4.7, "Infrastructure & Externes", fontsize=11, fontweight='bold',
            color=COLORS['primary_dark'])

    infra_components = [
        (1, layer4_y + 0.3, 3.5, 3.8, "NextAuth.js", COLORS['red'], ["OAuth", "JWT", "Callbacks"]),
        (5, layer4_y + 0.3, 3.5, 3.8, "PostgreSQL", COLORS['primary'], ["Tables", "Indexes"]),
        (9, layer4_y + 0.3, 3.5, 3.8, "SQLite", COLORS['primary'], ["Dev Mode", "Embedded"]),
        (13, layer4_y + 0.3, 3.5, 3.8, "Docker", COLORS['blue' if 'blue' in COLORS else 'teal'], ["Container", "Compose"]),
        (17, layer4_y + 0.3, 3.5, 3.8, "Nginx", COLORS['green'], ["Proxy", "SSL", "Cache"]),
        (21, layer4_y + 0.3, 3.5, 3.8, "MinIO", COLORS['orange'], ["S3", "Storage"]),
    ]
    for args in infra_components:
        draw_component(ax, *args)

    # Dependency arrows (dashed)
    dep_arrows = [
        # Presentation -> Business
        ((2.4, layer1_y + 0.3), (2.75, layer2_y + 3.8)),
        ((8.8, layer1_y + 0.3), (6.75, layer2_y + 3.8)),
        ((13.4, layer1_y + 0.3), (14.75, layer2_y + 3.8)),
        ((17.0, layer1_y + 0.3), (8.75, layer2_y + 3.8)),
        # Business -> Data
        ((2.75, layer2_y + 0.3), (3, layer3_y + 2.4)),
        ((6.75, layer2_y + 0.3), (7.5, layer3_y + 2.4)),
        ((10.75, layer2_y + 0.3), (12.5, layer3_y + 2.4)),
        # Data -> External
        ((3, layer3_y + 0.2), (2.75, layer4_y + 4.1)),
        ((7.5, layer3_y + 0.2), (6.75, layer4_y + 4.1)),
    ]
    for from_xy, to_xy in dep_arrows:
        ax.annotate('', xy=to_xy, xytext=from_xy,
                     arrowprops=dict(arrowstyle='->', color=COLORS['gray_dark'],
                                     lw=1.2, linestyle='dashed'))

    save_fig(fig, 'fig_component.png')


# ============================================================
# DIAGRAM 7: Deployment Diagram
# ============================================================
def diagram_deployment():
    print("Generating Diagram 7: Deployment Diagram...")
    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(12, 17.5, "Figure 3.7 - Diagramme de deploiement GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_node(ax, x, y, w, h, label, sublabel='', color=COLORS['primary']):
        # 3D box effect
        # Front face
        front = FancyBboxPatch((x, y), w, h,
                                boxstyle="round,pad=0.05", facecolor=color,
                                edgecolor=COLORS['primary_dark'], linewidth=2, alpha=0.85)
        ax.add_patch(front)
        # Top face (3D)
        top_pts = np.array([[x, y+h], [x+0.3, y+h+0.3], [x+w+0.3, y+h+0.3], [x+w, y+h]])
        top = plt.Polygon(top_pts, facecolor=lighten_color(color, 0.3),
                           edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(top)
        # Right face (3D)
        right_pts = np.array([[x+w, y], [x+w+0.3, y+0.3], [x+w+0.3, y+h+0.3], [x+w, y+h]])
        right = plt.Polygon(right_pts, facecolor=lighten_color(color, 0.15),
                             edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(right)
        # Labels
        ax.text(x + w/2, y + h/2 + 0.2, label, ha='center', va='center',
                fontsize=10, fontweight='bold', color='white')
        if sublabel:
            ax.text(x + w/2, y + h/2 - 0.3, sublabel, ha='center', va='center',
                    fontsize=8, color=COLORS['bg_light'], fontstyle='italic')

    def lighten_color(color_hex, amount=0.3):
        """Lighten a hex color"""
        from matplotlib.colors import to_rgb
        r, g, b = to_rgb(color_hex)
        r = min(1, r + amount)
        g = min(1, g + amount)
        b = min(1, b + amount)
        return (r, g, b)

    def draw_communication(ax, from_xy, to_xy, label='', protocol=''):
        ax.annotate('', xy=to_xy, xytext=from_xy,
                     arrowprops=dict(arrowstyle='<->', color=COLORS['primary_dark'],
                                     lw=2, linestyle='-'))
        mid_x = (from_xy[0] + to_xy[0]) / 2
        mid_y = (from_xy[1] + to_xy[1]) / 2
        if protocol:
            ax.text(mid_x, mid_y + 0.3, protocol, ha='center', va='center',
                    fontsize=8, color=COLORS['accent'], fontweight='bold',
                    bbox=dict(facecolor='white', edgecolor=COLORS['accent'], pad=2, alpha=0.9))
        if label:
            ax.text(mid_x, mid_y - 0.3, label, ha='center', va='top',
                    fontsize=7, color=COLORS['text_light'], fontstyle='italic')

    # Client Browser
    draw_node(ax, 1, 14, 4, 2.5, "Navigateur Client", "Chrome/Firefox/Safari",
              color=COLORS['gray_dark'])

    # Docker Host
    docker_y = 7
    docker_host = FancyBboxPatch((6, docker_y), 16.5, 8.5,
                                  boxstyle="round,pad=0.15", facecolor=COLORS['bg_light'],
                                  edgecolor=COLORS['accent'], linewidth=2, linestyle='--', alpha=0.5)
    ax.add_patch(docker_host)
    ax.text(6.5, docker_y + 8.2, "Docker Host (Docker Compose)", fontsize=10,
            fontweight='bold', color=COLORS['accent'])

    # Nginx
    draw_node(ax, 8, 13, 4, 2.2, "Nginx", "Reverse Proxy :80/:443",
              color=COLORS['green'])

    # Next.js App
    draw_node(ax, 8, 9, 4, 2.8, "Next.js App", "Container :3000",
              color=COLORS['primary'])

    # PostgreSQL
    draw_node(ax, 14, 13, 4, 2.2, "PostgreSQL", "Container :5432",
              color=COLORS['purple'])

    # Redis
    draw_node(ax, 14, 9, 4, 2.2, "Redis", "Cache :6379",
              color=COLORS['red'])

    # MinIO
    draw_node(ax, 14, 5.5, 4, 2.2, "MinIO", "Stockage S3 :9000",
              color=COLORS['orange'])

    # Docker Compose box
    dc_box = FancyBboxPatch((7, 4.5), 12, 1,
                             boxstyle="round,pad=0.1", facecolor=COLORS['accent'],
                             edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.8)
    ax.add_patch(dc_box)
    ax.text(13, 5.0, "docker-compose.yml", ha='center', va='center',
            fontsize=9, fontweight='bold', color='white')

    # Port mappings
    port_box = FancyBboxPatch((1, 8), 4.5, 4,
                               boxstyle="round,pad=0.1", facecolor='white',
                               edgecolor=COLORS['primary'], linewidth=1.5)
    ax.add_patch(port_box)
    ax.text(3.25, 11.6, "Mappages ports", ha='center', va='center',
            fontsize=8, fontweight='bold', color=COLORS['primary_dark'])
    ports = ["80/443 -> 3000", "5432 (interne)", "6379 (interne)", "9000 (interne)"]
    for i, p in enumerate(ports):
        ax.text(3.25, 11.0 - i * 0.6, p, ha='center', va='center',
                fontsize=7, color=COLORS['text'], fontfamily='monospace')

    # Communications
    draw_communication(ax, (5, 15.25), (8, 14.1), "Requetes web", "HTTPS")
    draw_communication(ax, (12, 14.1), (10, 11.8), "Proxy", ":3000")
    draw_communication(ax, (12, 10.4), (14, 14.1), "Requetes SQL", "TCP :5432")
    draw_communication(ax, (12, 10.4), (14, 10.1), "Cache", "TCP :6379")
    draw_communication(ax, (12, 9.5), (14, 6.6), "Fichiers", "S3 :9000")

    save_fig(fig, 'fig_deployment.png')


# ============================================================
# DIAGRAM 8: MCD (Conceptual Data Model)
# ============================================================
def diagram_mcd():
    print("Generating Diagram 8: MCD...")
    fig, ax = plt.subplots(1, 1, figsize=(26, 20))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 20)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(13, 19.5, "Figure 3.8 - Modele Conceptuel de Donnees (MCD) GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_entity(ax, x, y, w, h, name, attrs, color=COLORS['primary']):
        box = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.08", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=2, alpha=0.9)
        ax.add_patch(box)
        # Name
        name_h = 0.5
        name_box = FancyBboxPatch((x, y + h - name_h), w, name_h,
                                   boxstyle="round,pad=0.05", facecolor=COLORS['primary_dark'],
                                   edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(name_box)
        ax.text(x + w/2, y + h - name_h/2, name, ha='center', va='center',
                fontsize=9, fontweight='bold', color='white')
        # Attributes
        for i, attr in enumerate(attrs):
            ax.text(x + 0.15, y + h - name_h - 0.25 - i * 0.28, attr,
                    fontsize=6.5, va='top', color='white', fontfamily='monospace')
        return (x + w/2, y + h/2)  # center

    def draw_association(ax, x, y, name, card_from, card_to, color=COLORS['accent']):
        diamond = plt.Polygon([[x, y+0.4], [x+0.8, y], [x, y-0.4], [x-0.8, y]],
                               facecolor=color, edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.9)
        ax.add_patch(diamond)
        ax.text(x, y, name, ha='center', va='center', fontsize=6, fontweight='bold', color='white')

    # Entities
    entities = {
        'Organization': {'pos': (1, 15), 'w': 3.5, 'h': 3.2,
                          'attrs': ['id', 'name', 'slug', 'code', 'type', 'status'],
                          'color': COLORS['primary']},
        'User': {'pos': (5.5, 15), 'w': 3.0, 'h': 3.5,
                  'attrs': ['id', 'email', 'name', 'password', 'role', 'isActive', 'lastLogin'],
                  'color': COLORS['secondary']},
        'Department': {'pos': (10, 15), 'w': 2.8, 'h': 2.0,
                        'attrs': ['id', 'name', 'code'],
                        'color': COLORS['primary_light']},
        'Document': {'pos': (10, 10), 'w': 3.2, 'h': 3.5,
                      'attrs': ['id', 'title', 'reference', 'type', 'status', 'classification', 'archivedAt'],
                      'color': COLORS['secondary']},
        'DocumentVersion': {'pos': (14.5, 10), 'w': 3.0, 'h': 2.5,
                             'attrs': ['id', 'version', 'content', 'createdAt'],
                             'color': COLORS['teal']},
        'Workflow': {'pos': (19, 15), 'w': 2.5, 'h': 1.8,
                      'attrs': ['id', 'name'],
                      'color': COLORS['accent']},
        'WorkflowState': {'pos': (19, 10), 'w': 3.0, 'h': 2.5,
                           'attrs': ['id', 'name', 'isInitial', 'isFinal'],
                           'color': COLORS['accent']},
        'WorkflowTransition': {'pos': (19, 5), 'w': 3.5, 'h': 2.5,
                                'attrs': ['id', 'name', 'allowedRoles'],
                                'color': COLORS['orange']},
        'OrgModule': {'pos': (1, 10), 'w': 3.0, 'h': 2.0,
                       'attrs': ['id', 'moduleKey', 'status'],
                       'color': COLORS['teal']},
        'Subscription': {'pos': (5, 10), 'w': 3.0, 'h': 2.0,
                          'attrs': ['id', 'plan', 'status'],
                          'color': COLORS['green']},
        'AuditLog': {'pos': (1, 5), 'w': 3.5, 'h': 2.5,
                      'attrs': ['id', 'action', 'entityType', 'entityId', 'ipAddress'],
                      'color': COLORS['purple']},
        'AccessLog': {'pos': (5.5, 5), 'w': 3.0, 'h': 2.5,
                       'attrs': ['id', 'action', 'timestamp'],
                       'color': COLORS['purple']},
        'Notification': {'pos': (10, 5), 'w': 3.0, 'h': 2.5,
                          'attrs': ['id', 'title', 'message', 'read'],
                          'color': COLORS['green']},
    }

    entity_centers = {}
    for name, info in entities.items():
        x, y = info['pos']
        w, h = info['w'], info['h']
        center = draw_entity(ax, x, y, w, h, name, info['attrs'], info['color'])
        entity_centers[name] = center

    # Draw relationships with crow's foot
    def draw_crows_foot(ax, from_center, to_center, from_card, to_card, label='', color=COLORS['primary_dark']):
        fx, fy = from_center
        tx, ty = to_center
        ax.annotate('', xy=(tx, ty), xytext=(fx, fy),
                     arrowprops=dict(arrowstyle='-', color=color, lw=1.2))
        # Cardinality labels
        dx = tx - fx
        dy = ty - fy
        dist = np.sqrt(dx**2 + dy**2)
        if dist > 0:
            ux, uy = dx/dist, dy/dist
            ax.text(fx + ux * 0.8 + 0.1, fy + uy * 0.8 + 0.1, from_card,
                    fontsize=7, color=color, fontweight='bold')
            ax.text(tx - ux * 0.8 - 0.1, ty - uy * 0.8 + 0.1, to_card,
                    fontsize=7, color=color, fontweight='bold')
        if label:
            mid_x = (fx + tx) / 2
            mid_y = (fy + ty) / 2
            ax.text(mid_x, mid_y + 0.25, label, fontsize=6, ha='center',
                    color=color, fontstyle='italic',
                    bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=1))

    # Relationships
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['User'], '1,N', '1,1', 'possede')
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['Department'], '1,N', '1,1', 'structure')
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['Document'], '1,N', '0,N', 'contient')
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['Workflow'], '1,N', '0,N', 'definit')
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['OrgModule'], '1,N', '0,N', 'active')
    draw_crows_foot(ax, entity_centers['Organization'], entity_centers['Subscription'], '1,1', '0,1', 'souscrit')
    draw_crows_foot(ax, entity_centers['User'], entity_centers['Document'], '0,N', '0,N', 'auteur')
    draw_crows_foot(ax, entity_centers['User'], entity_centers['AuditLog'], '0,N', '1,1', 'genere')
    draw_crows_foot(ax, entity_centers['User'], entity_centers['AccessLog'], '0,N', '1,1', 'effectue')
    draw_crows_foot(ax, entity_centers['User'], entity_centers['Notification'], '0,N', '1,1', 'recoit')
    draw_crows_foot(ax, entity_centers['Department'], entity_centers['User'], '0,N', '1,1', 'appartient')
    draw_crows_foot(ax, entity_centers['Department'], entity_centers['Document'], '0,N', '0,N', 'rattache')
    draw_crows_foot(ax, entity_centers['Document'], entity_centers['DocumentVersion'], '1,1', '0,N', 'versions')
    draw_crows_foot(ax, entity_centers['Document'], entity_centers['AccessLog'], '1,1', '0,N', 'acces')
    draw_crows_foot(ax, entity_centers['Workflow'], entity_centers['WorkflowState'], '1,1', '1,N', 'etats')
    draw_crows_foot(ax, entity_centers['Workflow'], entity_centers['WorkflowTransition'], '1,1', '1,N', 'transitions')
    draw_crows_foot(ax, entity_centers['WorkflowState'], entity_centers['WorkflowTransition'], '1,1', '0,N', 'source')
    draw_crows_foot(ax, entity_centers['WorkflowState'], entity_centers['WorkflowTransition'], '1,1', '0,N', 'cible')

    # Legend
    legend_box = FancyBboxPatch((1, 0.3), 5, 1.5,
                                 boxstyle="round,pad=0.1", facecolor='white',
                                 edgecolor=COLORS['primary_dark'], linewidth=1.5)
    ax.add_patch(legend_box)
    ax.text(1.3, 1.5, "Notation Merise", fontsize=8, fontweight='bold', color=COLORS['primary_dark'])
    ax.text(1.3, 1.1, "1,1 = Un et un seul", fontsize=7, color=COLORS['text'])
    ax.text(1.3, 0.8, "0,N = Zero ou plusieurs", fontsize=7, color=COLORS['text'])
    ax.text(1.3, 0.5, "1,N = Un ou plusieurs", fontsize=7, color=COLORS['text'])

    save_fig(fig, 'fig_mcd.png')


# ============================================================
# DIAGRAM 9: MLD (Logical Data Model)
# ============================================================
def diagram_mld():
    print("Generating Diagram 9: MLD...")
    fig, ax = plt.subplots(1, 1, figsize=(28, 22))
    ax.set_xlim(0, 28)
    ax.set_ylim(0, 22)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(14, 21.5, "Figure 3.9 - Modele Logique de Donnees (MLD) GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_table(ax, x, y, w, name, columns, color=COLORS['primary']):
        row_h = 0.32
        header_h = 0.5
        h = header_h + len(columns) * row_h + 0.15

        # Shadow
        shadow = FancyBboxPatch((x + 0.05, y - h - 0.05), w, h,
                                 boxstyle="round,pad=0.03", facecolor='#CCCCCC',
                                 edgecolor='none', alpha=0.5)
        ax.add_patch(shadow)

        # Table body
        body = FancyBboxPatch((x, y - h), w, h,
                               boxstyle="round,pad=0.03", facecolor='white',
                               edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(body)

        # Header
        header = FancyBboxPatch((x, y - header_h), w, header_h,
                                 boxstyle="round,pad=0.03", facecolor=color,
                                 edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(header)
        ax.text(x + w/2, y - header_h/2, name, ha='center', va='center',
                fontsize=8, fontweight='bold', color='white')

        # Columns
        for i, col in enumerate(columns):
            col_y = y - header_h - 0.18 - i * row_h
            prefix = ''
            col_style = 'normal'
            if col.endswith(' PK'):
                prefix = '\u0332'  # underline
                col = col[:-3]
                col_style = 'bold'
            elif col.endswith(' FK'):
                col = col[:-3]
                col_style = 'italic'

            if col_style == 'bold':
                ax.text(x + 0.12, col_y, '\u0332' + col + '\u0332', fontsize=6, va='center',
                        color=COLORS['primary_dark'], fontweight='bold', fontfamily='monospace')
            elif col_style == 'italic':
                ax.text(x + 0.12, col_y, col, fontsize=6, va='center',
                        color=COLORS['accent'], fontstyle='italic', fontfamily='monospace')
            else:
                ax.text(x + 0.12, col_y, col, fontsize=6, va='center',
                        color=COLORS['text'], fontfamily='monospace')

            # Separator line
            if i > 0:
                ax.plot([x, x + w], [col_y + row_h/2, col_y + row_h/2],
                        color=COLORS['bg_medium'], linewidth=0.3)

        return (x + w/2, y - h/2)  # center

    # Tables
    tables = {
        'Organization': {
            'pos': (1, 21), 'w': 4.0,
            'cols': ['id PK', 'name', 'slug', 'code', 'type', 'status', 'createdAt', 'updatedAt'],
            'color': COLORS['primary']
        },
        'User': {
            'pos': (5.5, 21), 'w': 4.2,
            'cols': ['id PK', 'email', 'name', 'password', 'role', 'isActive', 'organizationId FK', 'departmentId FK', 'lastLogin'],
            'color': COLORS['secondary']
        },
        'Department': {
            'pos': (10, 21), 'w': 3.5,
            'cols': ['id PK', 'name', 'code', 'organizationId FK'],
            'color': COLORS['primary_light']
        },
        'Document': {
            'pos': (14, 21), 'w': 4.2,
            'cols': ['id PK', 'title', 'reference', 'type', 'status', 'classification', 'organizationId FK', 'authorId FK', 'departmentId FK', 'workflowId FK', 'archivedAt'],
            'color': COLORS['secondary']
        },
        'DocumentVersion': {
            'pos': (18.5, 21), 'w': 3.5,
            'cols': ['id PK', 'documentId FK', 'version', 'content', 'createdAt'],
            'color': COLORS['teal']
        },
        'Workflow': {
            'pos': (22.5, 21), 'w': 3.0,
            'cols': ['id PK', 'name', 'organizationId FK'],
            'color': COLORS['accent']
        },
        'WorkflowState': {
            'pos': (22.5, 16.5), 'w': 3.5,
            'cols': ['id PK', 'workflowId FK', 'name', 'isInitial', 'isFinal'],
            'color': COLORS['accent']
        },
        'WorkflowTransition': {
            'pos': (22.5, 12), 'w': 4.0,
            'cols': ['id PK', 'workflowId FK', 'sourceStateId FK', 'targetStateId FK', 'name', 'allowedRoles'],
            'color': COLORS['orange']
        },
        'OrganizationModule': {
            'pos': (1, 14), 'w': 3.5,
            'cols': ['id PK', 'organizationId FK', 'moduleKey', 'status'],
            'color': COLORS['teal']
        },
        'Subscription': {
            'pos': (5, 14), 'w': 3.2,
            'cols': ['id PK', 'organizationId FK', 'plan', 'status'],
            'color': COLORS['green']
        },
        'AuditLog': {
            'pos': (9, 14), 'w': 3.8,
            'cols': ['id PK', 'userId FK', 'action', 'entityType', 'entityId', 'ipAddress'],
            'color': COLORS['purple']
        },
        'AccessLog': {
            'pos': (13.5, 14), 'w': 3.5,
            'cols': ['id PK', 'userId FK', 'documentId FK', 'action', 'timestamp'],
            'color': COLORS['purple']
        },
        'Notification': {
            'pos': (17.5, 14), 'w': 3.2,
            'cols': ['id PK', 'userId FK', 'title', 'message', 'read'],
            'color': COLORS['green']
        },
        'SystemSetting': {
            'pos': (21.5, 7), 'w': 3.5,
            'cols': ['id PK', 'key', 'value'],
            'color': COLORS['gray_dark']
        },
    }

    table_centers = {}
    for name, info in tables.items():
        x, y = info['pos']
        w = info['w']
        center = draw_table(ax, x, y, w, name, info['cols'], info['color'])
        table_centers[name] = center

    # FK relationships
    def draw_fk_rel(ax, from_table, to_table, fk_col='', color=COLORS['primary_dark']):
        f = table_centers[from_table]
        t = table_centers[to_table]
        ax.annotate('', xy=t, xytext=f,
                     arrowprops=dict(arrowstyle='->', color=color, lw=0.8,
                                     linestyle='dashed', alpha=0.6))

    draw_fk_rel(ax, 'User', 'Organization')
    draw_fk_rel(ax, 'User', 'Department')
    draw_fk_rel(ax, 'Document', 'Organization')
    draw_fk_rel(ax, 'Document', 'User')
    draw_fk_rel(ax, 'Document', 'Department')
    draw_fk_rel(ax, 'Document', 'Workflow')
    draw_fk_rel(ax, 'DocumentVersion', 'Document')
    draw_fk_rel(ax, 'Workflow', 'Organization')
    draw_fk_rel(ax, 'WorkflowState', 'Workflow')
    draw_fk_rel(ax, 'WorkflowTransition', 'Workflow')
    draw_fk_rel(ax, 'WorkflowTransition', 'WorkflowState')
    draw_fk_rel(ax, 'OrganizationModule', 'Organization')
    draw_fk_rel(ax, 'Subscription', 'Organization')
    draw_fk_rel(ax, 'AuditLog', 'User')
    draw_fk_rel(ax, 'AccessLog', 'User')
    draw_fk_rel(ax, 'AccessLog', 'Document')
    draw_fk_rel(ax, 'Notification', 'User')

    # Legend
    legend_y = 7
    legend = FancyBboxPatch((1, legend_y), 6, 2.5,
                             boxstyle="round,pad=0.1", facecolor='white',
                             edgecolor=COLORS['primary_dark'], linewidth=1.5)
    ax.add_patch(legend)
    ax.text(1.3, legend_y + 2.2, "Legende", fontsize=9, fontweight='bold', color=COLORS['primary_dark'])
    ax.text(1.3, legend_y + 1.8, "\u0332souligne\u0332 = Cle primaire (PK)", fontsize=7, color=COLORS['primary_dark'], fontfamily='monospace')
    ax.text(1.3, legend_y + 1.4, "italique = Cle etrangere (FK)", fontsize=7, color=COLORS['accent'], fontstyle='italic')
    ax.text(1.3, legend_y + 1.0, "--- > = Relation FK", fontsize=7, color=COLORS['primary_dark'])

    save_fig(fig, 'fig_mld.png')


# ============================================================
# DIAGRAM 10: MPD (Physical Data Model)
# ============================================================
def diagram_mpd():
    print("Generating Diagram 10: MPD...")
    fig, ax = plt.subplots(1, 1, figsize=(28, 24))
    ax.set_xlim(0, 28)
    ax.set_ylim(0, 24)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(14, 23.5, "Figure 3.10 - Modele Physique de Donnees (MPD) GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_phys_table(ax, x, y, w, name, columns, color=COLORS['primary']):
        row_h = 0.3
        header_h = 0.5
        h = header_h + len(columns) * row_h + 0.15

        # Shadow
        shadow = FancyBboxPatch((x + 0.04, y - h - 0.04), w, h,
                                 boxstyle="round,pad=0.03", facecolor='#CCCCCC',
                                 edgecolor='none', alpha=0.5)
        ax.add_patch(shadow)

        # Body
        body = FancyBboxPatch((x, y - h), w, h,
                               boxstyle="round,pad=0.03", facecolor='white',
                               edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(body)

        # Header
        header = FancyBboxPatch((x, y - header_h), w, header_h,
                                 boxstyle="round,pad=0.03", facecolor=color,
                                 edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(header)
        ax.text(x + w/2, y - header_h/2, name, ha='center', va='center',
                fontsize=7.5, fontweight='bold', color='white')

        # Columns with physical types
        for i, col_def in enumerate(columns):
            col_y = y - header_h - 0.15 - i * row_h
            parts = col_def.split('|')
            col_name = parts[0].strip()
            col_type = parts[1].strip() if len(parts) > 1 else ''
            constraints = parts[2].strip() if len(parts) > 2 else ''

            # Color coding
            name_color = COLORS['primary_dark']
            if 'PK' in constraints:
                name_color = COLORS['primary_dark']
            elif 'FK' in constraints:
                name_color = COLORS['accent']

            # Column name
            if 'PK' in constraints:
                ax.text(x + 0.1, col_y, '\u0332' + col_name + '\u0332', fontsize=5.5, va='center',
                        color=name_color, fontweight='bold', fontfamily='monospace')
            elif 'FK' in constraints:
                ax.text(x + 0.1, col_y, col_name, fontsize=5.5, va='center',
                        color=name_color, fontstyle='italic', fontfamily='monospace')
            else:
                ax.text(x + 0.1, col_y, col_name, fontsize=5.5, va='center',
                        color=COLORS['text'], fontfamily='monospace')

            # Type
            ax.text(x + w * 0.45, col_y, col_type, fontsize=5, va='center',
                    color=COLORS['teal'], fontfamily='monospace')

            # Constraints
            if constraints:
                ax.text(x + w * 0.75, col_y, constraints, fontsize=4.5, va='center',
                        color=COLORS['red'], fontfamily='monospace')

            # Row separator
            if i > 0:
                ax.plot([x, x + w], [col_y + row_h/2, col_y + row_h/2],
                        color=COLORS['bg_medium'], linewidth=0.3)

        return (x + w/2, y - h/2)

    # Physical table definitions
    phys_tables = {
        'Organization': {
            'pos': (1, 23), 'w': 4.5,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'name | VARCHAR(255) | NOT NULL',
                'slug | VARCHAR(255) | NOT NULL UNIQUE',
                'code | VARCHAR(50) | NOT NULL UNIQUE',
                'type | ENUM | NOT NULL DEFAULT UNIVERSITY',
                'status | ENUM | NOT NULL DEFAULT ACTIVE',
                'logo | TEXT | NULL',
                'settings | JSON | NULL',
                'createdAt | DATETIME | NOT NULL DEFAULT NOW()',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['primary']
        },
        'User': {
            'pos': (6, 23), 'w': 4.5,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'email | VARCHAR(255) | NOT NULL UNIQUE',
                'name | VARCHAR(255) | NOT NULL',
                'password | VARCHAR(255) | NOT NULL',
                'role | ENUM | NOT NULL DEFAULT USER',
                'isActive | BOOLEAN | NOT NULL DEFAULT TRUE',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'departmentId | VARCHAR(36) | FK NULL',
                'lastLogin | DATETIME | NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['secondary']
        },
        'Department': {
            'pos': (11, 23), 'w': 4.2,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'name | VARCHAR(255) | NOT NULL',
                'code | VARCHAR(50) | NOT NULL',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['primary_light']
        },
        'Document': {
            'pos': (16, 23), 'w': 4.8,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'title | VARCHAR(500) | NOT NULL',
                'reference | VARCHAR(100) | UNIQUE',
                'type | ENUM | NOT NULL',
                'status | ENUM | NOT NULL DEFAULT DRAFT',
                'classification | ENUM | DEFAULT NORMAL',
                'content | TEXT | NULL',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'authorId | VARCHAR(36) | FK NOT NULL',
                'departmentId | VARCHAR(36) | FK NULL',
                'workflowId | VARCHAR(36) | FK NULL',
                'archivedAt | DATETIME | NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['secondary']
        },
        'DocumentVersion': {
            'pos': (21.5, 23), 'w': 4.0,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'documentId | VARCHAR(36) | FK NOT NULL',
                'version | INTEGER | NOT NULL',
                'content | TEXT | NULL',
                'filePath | VARCHAR(500) | NULL',
                'createdAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['teal']
        },
        'Workflow': {
            'pos': (21.5, 17), 'w': 4.0,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'name | VARCHAR(255) | NOT NULL',
                'description | TEXT | NULL',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['accent']
        },
        'WorkflowState': {
            'pos': (21.5, 12.5), 'w': 4.2,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'workflowId | VARCHAR(36) | FK NOT NULL',
                'name | VARCHAR(100) | NOT NULL',
                'isInitial | BOOLEAN | NOT NULL DEFAULT FALSE',
                'isFinal | BOOLEAN | NOT NULL DEFAULT FALSE',
                'createdAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['accent']
        },
        'WorkflowTransition': {
            'pos': (16, 12.5), 'w': 5.0,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'workflowId | VARCHAR(36) | FK NOT NULL',
                'sourceStateId | VARCHAR(36) | FK NOT NULL',
                'targetStateId | VARCHAR(36) | FK NOT NULL',
                'name | VARCHAR(100) | NOT NULL',
                'allowedRoles | JSON | NOT NULL',
                'createdAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['orange']
        },
        'OrganizationModule': {
            'pos': (1, 14), 'w': 4.2,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'moduleKey | VARCHAR(100) | NOT NULL',
                'status | ENUM | NOT NULL DEFAULT ACTIVE',
                'config | JSON | NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['teal']
        },
        'Subscription': {
            'pos': (5.5, 14), 'w': 4.0,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'organizationId | VARCHAR(36) | FK NOT NULL',
                'plan | ENUM | NOT NULL DEFAULT FREE',
                'status | ENUM | NOT NULL DEFAULT ACTIVE',
                'expiresAt | DATETIME | NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['green']
        },
        'AuditLog': {
            'pos': (10, 14), 'w': 4.5,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'userId | VARCHAR(36) | FK NOT NULL',
                'action | VARCHAR(100) | NOT NULL',
                'entityType | VARCHAR(50) | NOT NULL',
                'entityId | VARCHAR(36) | NULL',
                'details | JSON | NULL',
                'ipAddress | VARCHAR(45) | NULL',
                'userAgent | TEXT | NULL',
                'createdAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['purple']
        },
        'AccessLog': {
            'pos': (15, 8), 'w': 4.2,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'userId | VARCHAR(36) | FK NOT NULL',
                'documentId | VARCHAR(36) | FK NOT NULL',
                'action | VARCHAR(50) | NOT NULL',
                'timestamp | DATETIME | NOT NULL',
            ],
            'color': COLORS['purple']
        },
        'Notification': {
            'pos': (10, 8), 'w': 4.2,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'userId | VARCHAR(36) | FK NOT NULL',
                'title | VARCHAR(255) | NOT NULL',
                'message | TEXT | NOT NULL',
                'read | BOOLEAN | NOT NULL DEFAULT FALSE',
                'createdAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['green']
        },
        'SystemSetting': {
            'pos': (5.5, 8), 'w': 4.0,
            'cols': [
                'id | VARCHAR(36) | PK NOT NULL',
                'key | VARCHAR(100) | NOT NULL UNIQUE',
                'value | TEXT | NULL',
                'createdAt | DATETIME | NOT NULL',
                'updatedAt | DATETIME | NOT NULL',
            ],
            'color': COLORS['gray_dark']
        },
    }

    # Index annotations
    idx_box = FancyBboxPatch((1, 3), 10, 3.5,
                              boxstyle="round,pad=0.1", facecolor=COLORS['bg_light'],
                              edgecolor=COLORS['primary_dark'], linewidth=1.5)
    ax.add_patch(idx_box)
    ax.text(1.3, 6.1, "Index et contraintes", fontsize=9, fontweight='bold', color=COLORS['primary_dark'])
    indexes = [
        "IDX_User_email ON User(email) - UNIQUE",
        "IDX_User_orgId ON User(organizationId)",
        "IDX_User_deptId ON User(departmentId)",
        "IDX_Organization_slug ON Organization(slug) - UNIQUE",
        "IDX_Organization_code ON Organization(code) - UNIQUE",
        "IDX_Document_orgId ON Document(organizationId)",
        "IDX_Document_authorId ON Document(authorId)",
        "IDX_Document_status ON Document(status)",
        "IDX_AuditLog_userId ON AuditLog(userId)",
        "IDX_AuditLog_entity ON AuditLog(entityType, entityId)",
    ]
    for i, idx in enumerate(indexes):
        ax.text(1.5, 5.6 - i * 0.28, idx, fontsize=6, va='center',
                color=COLORS['text'], fontfamily='monospace')

    # Prisma mapping box
    prisma_box = FancyBboxPatch((12, 3), 7, 3.5,
                                 boxstyle="round,pad=0.1", facecolor=COLORS['bg_medium'],
                                 edgecolor=COLORS['teal'], linewidth=1.5)
    ax.add_patch(prisma_box)
    ax.text(12.3, 6.1, "Mapping Prisma Schema", fontsize=9, fontweight='bold', color=COLORS['primary_dark'])
    prisma_mappings = [
        "@id -> VARCHAR(36) DEFAULT uuid()",
        "@unique -> CONSTRAINT UNIQUE",
        "@default -> DEFAULT value",
        "@relation -> FOREIGN KEY",
        "@map -> Column name mapping",
        "Json -> JSON (PostgreSQL) / TEXT (SQLite)",
        "Enum -> ENUM / VARCHAR CHECK",
        "DateTime -> TIMESTAMP / DATETIME",
    ]
    for i, m in enumerate(prisma_mappings):
        ax.text(12.5, 5.6 - i * 0.28, m, fontsize=6, va='center',
                color=COLORS['text'], fontfamily='monospace')

    for name, info in phys_tables.items():
        x, y = info['pos']
        draw_phys_table(ax, x, y, info['w'], name, info['cols'], info['color'])

    save_fig(fig, 'fig_mpd.png')


# ============================================================
# DIAGRAM 11: Logical Architecture
# ============================================================
def diagram_archi_logique():
    print("Generating Diagram 11: Logical Architecture...")
    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(12, 17.5, "Figure 3.11 - Architecture logique GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    layers = [
        {
            'name': 'Couche Presentation',
            'y': 14.5, 'h': 2.5,
            'color': COLORS['primary'],
            'bg': COLORS['bg_light'],
            'items': ['React 19', 'shadcn/ui', 'Tailwind CSS', 'Next.js App Router', 'Formulaires Zod'],
            'icon': '🖥️'
        },
        {
            'name': 'Couche API & Metier',
            'y': 11.0, 'h': 3.0,
            'color': COLORS['accent'],
            'bg': COLORS['bg_medium'],
            'items': ['Route Handlers', 'Workflow Engine', 'Module Engine', 'Permission Matrix', 'Token Engine', 'Redirection'],
            'icon': '⚙️'
        },
        {
            'name': 'Couche Authentification & Securite',
            'y': 7.5, 'h': 3.0,
            'color': COLORS['red'],
            'bg': '#FDE8E8',
            'items': ['NextAuth.js JWT', 'Middleware RBAC', 'Rate Limiting', 'Security Headers', 'CORS Policy', 'CSRF Protection'],
            'icon': '🔒'
        },
        {
            'name': "Couche Acces aux Donnees",
            'y': 4.0, 'h': 3.0,
            'color': COLORS['teal'],
            'bg': '#E8F8F5',
            'items': ['Prisma ORM', 'SQLite (Dev)', 'PostgreSQL (Prod)', 'Migrations', 'Seed Data', 'Query Builder'],
            'icon': '💾'
        },
        {
            'name': "Couche Infrastructure",
            'y': 0.5, 'h': 3.0,
            'color': COLORS['purple'],
            'bg': '#F0E8FD',
            'items': ['Docker', 'Nginx', 'Redis Cache', 'MinIO S3', 'CI/CD', 'Monitoring'],
            'icon': '🏗️'
        },
    ]

    for layer in layers:
        y = layer['y']
        h = layer['h']
        # Background
        bg = FancyBboxPatch((1.5, y), 21, h,
                             boxstyle="round,pad=0.15", facecolor=layer['bg'],
                             edgecolor=layer['color'], linewidth=2.5, alpha=0.7)
        ax.add_patch(bg)

        # Layer name bar
        name_bar = FancyBboxPatch((1.5, y + h - 0.6), 21, 0.6,
                                   boxstyle="round,pad=0.05", facecolor=layer['color'],
                                   edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.95)
        ax.add_patch(name_bar)
        ax.text(12, y + h - 0.3, f"{layer['name']}",
                ha='center', va='center', fontsize=10, fontweight='bold', color='white')

        # Items
        items = layer['items']
        n = len(items)
        item_w = 19.0 / n
        for i, item in enumerate(items):
            item_x = 2.5 + i * item_w
            item_box = FancyBboxPatch((item_x, y + 0.3), item_w - 0.3, h - 1.2,
                                       boxstyle="round,pad=0.05", facecolor='white',
                                       edgecolor=layer['color'], linewidth=1, alpha=0.9)
            ax.add_patch(item_box)
            ax.text(item_x + (item_w - 0.3)/2, y + 0.3 + (h - 1.2)/2, item,
                    ha='center', va='center', fontsize=8, color=COLORS['text'], fontweight='bold')

    # Arrows between layers
    for i in range(len(layers) - 1):
        from_y = layers[i]['y'] + layers[i]['h']
        to_y = layers[i+1]['y'] + layers[i+1]['h']
        ax.annotate('', xy=(12, to_y + 0.1), xytext=(12, from_y - 0.1),
                     arrowprops=dict(arrowstyle='<->', color=COLORS['primary_dark'],
                                     lw=2.5, linestyle='-'))
        ax.text(12.5, (from_y + to_y) / 2, 'HTTP/JSON', fontsize=7,
                color=COLORS['primary_dark'], fontstyle='italic', rotation=90,
                va='center')

    save_fig(fig, 'fig_archi_logique.png')


# ============================================================
# DIAGRAM 12: Data Flow Diagram
# ============================================================
def diagram_data_flow():
    print("Generating Diagram 12: Data Flow Diagram...")
    fig, ax = plt.subplots(1, 1, figsize=(24, 18))
    ax.set_xlim(0, 24)
    ax.set_ylim(0, 18)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(12, 17.5, "Figure 3.12 - Diagramme de flux de donnees GED-ISIPA",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_process(ax, x, y, w, h, label, sublabel='', color=COLORS['primary']):
        box = FancyBboxPatch((x, y), w, h,
                              boxstyle="round,pad=0.08", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.5, alpha=0.9)
        ax.add_patch(box)
        ax.text(x + w/2, y + h/2 + (0.15 if sublabel else 0), label,
                ha='center', va='center', fontsize=9, fontweight='bold', color='white')
        if sublabel:
            ax.text(x + w/2, y + h/2 - 0.2, sublabel,
                    ha='center', va='center', fontsize=7, color=COLORS['bg_light'], fontstyle='italic')
        return (x + w/2, y + h/2)

    def draw_datastore(ax, x, y, w, label, color=COLORS['teal']):
        # Two horizontal lines (data store notation)
        ax.plot([x, x + w], [y + 0.3, y + 0.3], color=color, linewidth=2)
        ax.plot([x, x + w], [y - 0.3, y - 0.3], color=color, linewidth=2)
        # Left closing line
        ax.plot([x, x], [y - 0.3, y + 0.3], color=color, linewidth=2)
        ax.text(x + w/2, y, label, ha='center', va='center', fontsize=8,
                fontweight='bold', color=COLORS['text'])
        return (x + w/2, y)

    def draw_external(ax, x, y, label, color=COLORS['gray_dark']):
        rect = Rectangle((x - 1.2, y - 0.4), 2.4, 0.8,
                          facecolor='white', edgecolor=color, linewidth=2)
        ax.add_patch(rect)
        ax.text(x, y, label, ha='center', va='center', fontsize=8,
                fontweight='bold', color=color)
        return (x, y)

    def draw_flow(ax, from_pt, to_pt, label='', color=COLORS['primary_dark']):
        ax.annotate('', xy=to_pt, xytext=from_pt,
                     arrowprops=dict(arrowstyle='->', color=color, lw=1.5))
        if label:
            mid_x = (from_pt[0] + to_pt[0]) / 2
            mid_y = (from_pt[1] + to_pt[1]) / 2
            ax.text(mid_x, mid_y + 0.25, label, fontsize=6.5, ha='center',
                    color=color, fontstyle='italic',
                    bbox=dict(facecolor='white', alpha=0.8, edgecolor='none', pad=1))

    # Main flow - horizontal
    # External entity
    ext_user = draw_external(ax, 2, 15.5, 'Utilisateur')

    # Process 1: Browser
    p1 = draw_process(ax, 0.5, 13.5, 3, 1.2, 'Navigateur', 'Interface web', COLORS['gray_dark'])

    # Process 2: Middleware
    p2 = draw_process(ax, 4.5, 13.5, 3.5, 1.2, 'Middleware', 'JWT + Rate Limit', COLORS['red'])

    # Process 3: Route Handler
    p3 = draw_process(ax, 8.5, 13.5, 3.5, 1.2, 'Route Handler', 'RBAC + Zod', COLORS['accent'])

    # Process 4: Business Logic
    p4 = draw_process(ax, 12.5, 13.5, 3.5, 1.2, 'Logique Metier', 'Services', COLORS['primary'])

    # Process 5: Prisma ORM
    p5 = draw_process(ax, 16.5, 13.5, 3, 1.2, 'Prisma ORM', 'Queries', COLORS['teal'])

    # Data store
    ds1 = draw_datastore(ax, 20.5, 13.7, 3, 'Base de donnees', COLORS['purple'])

    # Main flow arrows
    draw_flow(ax, (2, 14.8), (2, 14.7), 'Action')
    draw_flow(ax, (3.5, 14.1), (4.5, 14.1), 'HTTP Request')
    draw_flow(ax, (8, 14.1), (8.5, 14.1), 'Valide')
    draw_flow(ax, (12, 14.1), (12.5, 14.1), 'Autorise')
    draw_flow(ax, (16, 14.1), (16.5, 14.1), 'Query')
    draw_flow(ax, (19.5, 14.1), (20.5, 14.1), 'SQL')

    # Response flow (below)
    resp_y = 12.5
    ax.annotate('', xy=(2, resp_y + 0.8), xytext=(20.5, resp_y + 0.8),
                 arrowprops=dict(arrowstyle='->', color=COLORS['green'], lw=1.5))
    ax.text(11, resp_y + 1.0, 'Reponse JSON -> Rendu navigateur', ha='center', fontsize=8,
            color=COLORS['green'], fontweight='bold')

    # Alternative flow 1: Auth
    ax.text(4, 10.5, "Flux d'authentification", fontsize=10, fontweight='bold',
            color=COLORS['red'],
            bbox=dict(facecolor='#FDE8E8', edgecolor=COLORS['red'], pad=3))

    auth_flow = [
        (1.5, 9, 2.5, 1.0, 'Saisie\nidentifiants', COLORS['gray_dark']),
        (4.5, 9, 2.5, 1.0, 'NextAuth\nAPI', COLORS['red']),
        (7.5, 9, 2.5, 1.0, 'Verification\ncredentials', COLORS['accent']),
        (10.5, 9, 2.5, 1.0, 'JWT\ngeneration', COLORS['primary']),
        (13.5, 9, 2.5, 1.0, 'Cookie\nsetting', COLORS['green']),
    ]
    for x, y, w, h, label, color in auth_flow:
        draw_process(ax, x, y, w, h, label, '', color)
    for i in range(len(auth_flow) - 1):
        x1 = auth_flow[i][0] + auth_flow[i][2]
        x2 = auth_flow[i+1][0]
        y_mid = auth_flow[i][1] + auth_flow[i][3]/2
        draw_flow(ax, (x1, y_mid), (x2, y_mid))

    # Alternative flow 2: Workflow
    ax.text(4, 7, "Flux d'execution workflow", fontsize=10, fontweight='bold',
            color=COLORS['accent'],
            bbox=dict(facecolor=COLORS['bg_medium'], edgecolor=COLORS['accent'], pad=3))

    wf_flow = [
        (1.5, 5.5, 2.5, 1.0, 'Soumission\ndocument', COLORS['secondary']),
        (4.5, 5.5, 2.5, 1.0, 'Moteur\nWorkflow', COLORS['accent']),
        (7.5, 5.5, 2.5, 1.0, 'Verification\ntransition', COLORS['orange']),
        (10.5, 5.5, 2.5, 1.0, 'Mise a jour\nstatut', COLORS['teal']),
        (13.5, 5.5, 2.5, 1.0, 'Notification\nresultat', COLORS['green']),
    ]
    for x, y, w, h, label, color in wf_flow:
        draw_process(ax, x, y, w, h, label, '', color)
    for i in range(len(wf_flow) - 1):
        x1 = wf_flow[i][0] + wf_flow[i][2]
        x2 = wf_flow[i+1][0]
        y_mid = wf_flow[i][1] + wf_flow[i][3]/2
        draw_flow(ax, (x1, y_mid), (x2, y_mid))

    # Alternative flow 3: File upload
    ax.text(4, 3.5, "Flux de telechargement/fichier", fontsize=10, fontweight='bold',
            color=COLORS['teal'],
            bbox=dict(facecolor='#E8F8F5', edgecolor=COLORS['teal'], pad=3))

    file_flow = [
        (1.5, 2, 2.5, 1.0, 'Selection\nfichier', COLORS['gray_dark']),
        (4.5, 2, 2.5, 1.0, 'Upload\nAPI', COLORS['secondary']),
        (7.5, 2, 2.5, 1.0, 'Validation\ntype/taille', COLORS['accent']),
        (10.5, 2, 2.5, 1.0, 'Stockage\nMinIO/S3', COLORS['teal']),
        (13.5, 2, 2.5, 1.0, 'Enregistrement\nmetadata', COLORS['purple']),
    ]
    for x, y, w, h, label, color in file_flow:
        draw_process(ax, x, y, w, h, label, '', color)
    for i in range(len(file_flow) - 1):
        x1 = file_flow[i][0] + file_flow[i][2]
        x2 = file_flow[i+1][0]
        y_mid = file_flow[i][1] + file_flow[i][3]/2
        draw_flow(ax, (x1, y_mid), (x2, y_mid))

    # Data stores on the right
    ds2 = draw_datastore(ax, 18, 9.5, 4, 'Session JWT', COLORS['red'])
    ds3 = draw_datastore(ax, 18, 6.0, 4, 'Workflow States', COLORS['accent'])
    ds4 = draw_datastore(ax, 18, 2.5, 4, 'Fichiers MinIO', COLORS['teal'])

    save_fig(fig, 'fig_data_flow.png')


# ============================================================
# DIAGRAM 13: Architecture Applicative
# ============================================================
def diagram_archi_applicative():
    print("Generating Diagram 13: Architecture Applicative...")
    fig, ax = plt.subplots(1, 1, figsize=(26, 20))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 20)
    ax.set_aspect('equal')
    ax.axis('off')

    ax.text(13, 19.5, "Figure 3.13 - Architecture applicative GED-ISIPA (Next.js App Router)",
            ha='center', va='center', fontsize=14, fontweight='bold', color=COLORS['primary_dark'])

    def draw_folder(ax, x, y, w, h, label, color=COLORS['primary'], sub_items=None):
        # Folder shape
        tab_w = min(len(label) * 0.3 + 0.5, w * 0.6)
        tab_h = 0.35
        # Tab
        tab = FancyBboxPatch((x, y + h - tab_h), tab_w, tab_h,
                              boxstyle="round,pad=0.03", facecolor=color,
                              edgecolor=COLORS['primary_dark'], linewidth=1.2)
        ax.add_patch(tab)
        ax.text(x + tab_w/2, y + h - tab_h/2, label, ha='center', va='center',
                fontsize=7, fontweight='bold', color='white')
        # Body
        body = FancyBboxPatch((x, y), w, h - tab_h,
                               boxstyle="round,pad=0.05", facecolor='white',
                               edgecolor=color, linewidth=1.5, alpha=0.9)
        ax.add_patch(body)
        if sub_items:
            item_y = y + h - tab_h - 0.25
            for item in sub_items:
                item_color = COLORS['text']
                item_bg = 'white'
                if '->' in item:
                    parts = item.split('->')
                    ax.text(x + 0.2, item_y, '\u25B8 ' + parts[0].strip(), fontsize=6.5,
                            va='top', color=COLORS['secondary'], fontweight='bold', fontfamily='monospace')
                    ax.text(x + 0.5 + len(parts[0]) * 0.13, item_y, ' -> ' + parts[1].strip(), fontsize=6,
                            va='top', color=COLORS['text_light'], fontfamily='monospace')
                else:
                    ax.text(x + 0.2, item_y, '\u25B8 ' + item, fontsize=6.5,
                            va='top', color=item_color, fontfamily='monospace')
                item_y -= 0.28
        return (x + w/2, y + h/2)

    # app/ structure
    app_y = 16
    app_x = 0.5

    # (auth) group
    draw_folder(ax, 0.5, 14.5, 3.5, 2.5, '(auth)', COLORS['primary'], [
        'login/', 'register/', 'forgot-password/'
    ])

    # (dashboard) group
    draw_folder(ax, 4.5, 11, 3.5, 6.0, '(dashboard)', COLORS['secondary'], [
        'dashboard/',
        'documents/',
        'archives/',
        'audit/',
        'administration/',
        'modules/',
        'workflows/',
        'notifications/',
        'settings/',
    ])

    # admin group
    draw_folder(ax, 8.5, 12, 3.5, 5.0, 'admin', COLORS['accent'], [
        'dashboard/',
        'organizations/',
        'billing/',
        'analytics/',
        'modules/',
    ])

    # api group
    draw_folder(ax, 12.5, 4, 5.0, 13.0, 'api', COLORS['red'], [
        'auth/[...nextauth]/',
        'documents/',
        'documents/[id]/',
        'documents/[id]/approve/',
        'documents/[id]/reject/',
        'documents/[id]/archive/',
        'documents/[id]/submit/',
        'documents/[id]/publish/',
        'users/',
        'departments/',
        'workflows/',
        'modules/',
        'audit/',
        'notifications/',
        'organizations/',
        'subscriptions/',
        'settings/',
        'upload/',
        'stats/',
        'search/',
        '... (28 handlers)',
    ])

    # lib/ structure
    draw_folder(ax, 18, 4, 4, 13.0, 'lib', COLORS['teal'], [
        'auth.ts',
        'permissions.ts',
        'workflow.ts',
        'module-engine.ts',
        'token-engine.ts',
        'redirection.ts',
        'constants.ts',
        'validators.ts',
        'db.ts',
        'utils.ts',
        'api-client.ts',
    ])

    # Components
    draw_folder(ax, 22.5, 12, 3, 5, 'components', COLORS['purple'], [
        'ui/',
        'documents/',
        'workflow/',
        'admin/',
        'layout/',
        'forms/',
    ])

    # Hooks
    draw_folder(ax, 22.5, 9, 3, 2.5, 'hooks', COLORS['green'], [
        'useAuth',
        'usePermission',
        'useWorkflow',
    ])

    # Types
    draw_folder(ax, 22.5, 7, 3, 1.5, 'types', COLORS['gray_dark'], [
        'index.ts',
    ])

    # Prisma
    draw_folder(ax, 22.5, 4.5, 3, 2.0, 'prisma', COLORS['orange'], [
        'schema.prisma',
        'migrations/',
        'seed.ts',
    ])

    # Navigation flow diagram at bottom
    nav_y = 0.5
    nav_box = FancyBboxPatch((0.5, nav_y), 25, 3.2,
                              boxstyle="round,pad=0.1", facecolor=COLORS['bg_light'],
                              edgecolor=COLORS['primary'], linewidth=2, alpha=0.5)
    ax.add_patch(nav_box)
    ax.text(1, nav_y + 3.0, "Flux de navigation par role et type d'organisation",
            fontsize=9, fontweight='bold', color=COLORS['primary_dark'])

    # Role-based navigation
    roles = [
        ('SUPER_ADMIN', 1.5, COLORS['accent'], ['admin/', 'organizations/', 'billing/', 'analytics/']),
        ('ORG_ADMIN', 7, COLORS['primary'], ['dashboard/', 'administration/', 'workflows/', 'modules/']),
        ('PROFESSEUR', 13, COLORS['secondary'], ['documents/', 'archives/', 'notifications/']),
        ('LECTEUR', 18.5, COLORS['teal'], ['documents/', 'archives/']),
    ]

    for role_name, x, color, pages in roles:
        # Role label
        role_box = FancyBboxPatch((x, nav_y + 2.0), 4.5, 0.7,
                                   boxstyle="round,pad=0.05", facecolor=color,
                                   edgecolor=COLORS['primary_dark'], linewidth=1.5)
        ax.add_patch(role_box)
        ax.text(x + 2.25, nav_y + 2.35, role_name, ha='center', va='center',
                fontsize=7, fontweight='bold', color='white')
        # Pages
        for i, page in enumerate(pages):
            page_box = FancyBboxPatch((x + i * 1.1, nav_y + 0.3), 1.0, 0.5,
                                       boxstyle="round,pad=0.03", facecolor='white',
                                       edgecolor=color, linewidth=1)
            ax.add_patch(page_box)
            ax.text(x + i * 1.1 + 0.5, nav_y + 0.55, page, ha='center', va='center',
                    fontsize=5.5, color=color, fontweight='bold')
            # Arrow from role to page
            ax.annotate('', xy=(x + i * 1.1 + 0.5, nav_y + 0.8), xytext=(x + 2.25, nav_y + 2.0),
                         arrowprops=dict(arrowstyle='->', color=color, lw=0.6, alpha=0.5))

    save_fig(fig, 'fig_archi_applicative.png')


# ============================================================
# MAIN - Generate all diagrams
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("GENERATION DES 13 DIAGRAMMES - CHAPITRE 3 GED-ISIPA")
    print("=" * 60)

    diagram_use_case()
    diagram_class()
    diagram_seq_auth()
    diagram_seq_workflow()
    diagram_activity()
    diagram_component()
    diagram_deployment()
    diagram_mcd()
    diagram_mld()
    diagram_mpd()
    diagram_archi_logique()
    diagram_data_flow()
    diagram_archi_applicative()

    print("\n" + "=" * 60)
    print("TOUS LES DIAGRAMMES ONT ETE GENERES AVEC SUCCES!")
    print("=" * 60)

    # List all generated files
    print("\nFichiers generes:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.png'):
            filepath = os.path.join(OUTPUT_DIR, f)
            size_kb = os.path.getsize(filepath) / 1024
            print(f"  {f}: {size_kb:.1f} KB")
