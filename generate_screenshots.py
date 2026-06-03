#!/usr/bin/env python3
"""
GED-ISIPA Professional Screenshot Generator
Generates 11 high-fidelity screenshots for the GED-ISIPA application.
Each screenshot is 1440x900 pixels, PNG format.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

# =============================================================================
# CONSTANTS & CONFIG
# =============================================================================
WIDTH, HEIGHT = 1440, 900
OUTPUT_DIR = "/home/z/my-project/download/screenshots"

# Colors
SIDEBAR_BG = (30, 41, 59)        # #1e293b
SIDEBAR_HOVER = (51, 65, 85)     # #334155
SIDEBAR_ACTIVE = (59, 130, 246)  # #3b82f6
TOPBAR_BG = (255, 255, 255)      # white
CONTENT_BG = (248, 250, 252)     # #f8fafc
CARD_BG = (255, 255, 255)        # white
TEXT_PRIMARY = (15, 23, 42)       # #0f172a
TEXT_SECONDARY = (100, 116, 139)  # #64748b
TEXT_MUTED = (148, 163, 184)      # #94a3b8
BORDER_COLOR = (226, 232, 240)    # #e2e8f0
ACCENT_BLUE = (59, 130, 246)      # #3b82f6
ACCENT_GREEN = (34, 197, 94)      # #22c55e
ACCENT_RED = (239, 68, 68)        # #ef4444
ACCENT_AMBER = (245, 158, 11)     # #f59e0b
ACCENT_PURPLE = (168, 85, 247)    # #a855f7
ACCENT_CYAN = (6, 182, 212)       # #06b6d4
WHITE = (255, 255, 255)
LOGIN_BG_LEFT = (15, 23, 42)      # #0f172a
LOGIN_BG_RIGHT = (248, 250, 252)  # #f8fafc
INPUT_BORDER = (203, 213, 225)    # #cbd5e1
INPUT_BG = (255, 255, 255)
TABLE_HEADER_BG = (248, 250, 252)
TABLE_ROW_HOVER = (248, 250, 252)
SHADOW_COLOR = (0, 0, 0, 15)

# Status colors
STATUS_COLORS = {
    'DRAFT': ((107, 114, 128), (243, 244, 246)),           # gray
    'PENDING_REVIEW': ((217, 119, 6), (255, 251, 235)),     # amber
    'APPROVED': ((37, 99, 235), (239, 246, 255)),           # blue
    'PUBLISHED': ((22, 163, 74), (240, 253, 244)),          # green
    'ARCHIVED': ((147, 51, 234), (250, 245, 255)),          # purple
    'REJECTED': ((220, 38, 38), (254, 242, 242)),           # red
}

# Classification colors
CLASS_COLORS = {
    'PUBLIC': ((22, 163, 74), (240, 253, 244)),
    'INTERNAL': ((37, 99, 235), (239, 246, 255)),
    'CONFIDENTIAL': ((217, 119, 6), (255, 251, 235)),
    'RESTRICTED': ((220, 38, 38), (254, 242, 242)),
}

# Role colors
ROLE_COLORS = {
    'ADMIN': ((220, 38, 38), (254, 242, 242)),
    'SECRETARY': ((37, 99, 235), (239, 246, 255)),
    'DIRECTOR': ((147, 51, 234), (250, 245, 255)),
    'ARCHIVIST': ((22, 163, 74), (240, 253, 244)),
}

# Load fonts
def load_fonts():
    fonts = {}
    try:
        fonts['regular_10'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 10)
        fonts['regular_11'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
        fonts['regular_12'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
        fonts['regular_13'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
        fonts['regular_14'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
        fonts['regular_16'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
        fonts['regular_18'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
        fonts['regular_20'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
        fonts['regular_24'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 24)
        fonts['regular_28'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 28)
        fonts['regular_32'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 32)
        fonts['regular_40'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 40)
        fonts['regular_48'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 48)
        fonts['bold_10'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 10)
        fonts['bold_11'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 11)
        fonts['bold_12'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
        fonts['bold_13'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
        fonts['bold_14'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
        fonts['bold_16'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
        fonts['bold_18'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
        fonts['bold_20'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
        fonts['bold_24'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 24)
        fonts['bold_28'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
        fonts['bold_32'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 32)
        fonts['bold_40'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 40)
        fonts['mono_11'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 11)
        fonts['mono_12'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 12)
        fonts['mono_13'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 13)
        fonts['mono_bold_12'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 12)
        fonts['mono_bold_13'] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 13)
    except Exception as e:
        print(f"Font loading error: {e}")
    return fonts

FONTS = load_fonts()

# =============================================================================
# HELPER DRAWING FUNCTIONS
# =============================================================================

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    # Clamp radius to half the smaller dimension
    r = min(radius, (x2 - x1) // 2, (y2 - y1) // 2)
    if r < 0:
        r = 0
    
    # Draw filled rounded rectangle
    if fill:
        # Main rectangle body
        draw.rectangle([x1 + r, y1, x2 - r, y2], fill=fill)
        draw.rectangle([x1, y1 + r, x2, y2 - r], fill=fill)
        # Corners
        if r > 0:
            draw.pieslice([x1, y1, x1 + 2*r, y1 + 2*r], 180, 270, fill=fill)
            draw.pieslice([x2 - 2*r, y1, x2, y1 + 2*r], 270, 360, fill=fill)
            draw.pieslice([x1, y2 - 2*r, x1 + 2*r, y2], 90, 180, fill=fill)
            draw.pieslice([x2 - 2*r, y2 - 2*r, x2, y2], 0, 90, fill=fill)
    
    if outline:
        if r > 0:
            draw.arc([x1, y1, x1 + 2*r, y1 + 2*r], 180, 270, fill=outline, width=width)
            draw.arc([x2 - 2*r, y1, x2, y1 + 2*r], 270, 360, fill=outline, width=width)
            draw.arc([x1, y2 - 2*r, x1 + 2*r, y2], 90, 180, fill=outline, width=width)
            draw.arc([x2 - 2*r, y2 - 2*r, x2, y2], 0, 90, fill=outline, width=width)
            draw.line([x1 + r, y1, x2 - r, y1], fill=outline, width=width)
            draw.line([x1 + r, y2, x2 - r, y2], fill=outline, width=width)
            draw.line([x1, y1 + r, x1, y2 - r], fill=outline, width=width)
            draw.line([x2, y1 + r, x2, y2 - r], fill=outline, width=width)
        else:
            draw.rectangle([x1, y1, x2, y2], outline=outline, width=width)


def draw_card_shadow(img, xy, radius=8, shadow_offset=3):
    """Draw a card with shadow effect."""
    x1, y1, x2, y2 = xy
    # Create shadow layer
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    draw_rounded_rect(shadow_draw, [x1+2, y1+2, x2+2, y2+2], radius, fill=(0, 0, 0, 12))
    shadow = shadow.filter(ImageFilter.GaussianBlur(4))
    img.paste(Image.alpha_composite(Image.new('RGBA', img.size, (0,0,0,0)), shadow).convert('RGB'),
              mask=shadow.split()[3])
    return img


def draw_card(img, xy, radius=8, fill=CARD_BG, border=None, shadow=True):
    """Draw a card with optional shadow and border."""
    draw = ImageDraw.Draw(img)
    x1, y1, x2, y2 = xy
    
    if shadow:
        # Shadow - draw a more visible shadow
        shadow_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow_layer)
        # Outer shadow (lighter, more spread)
        draw_rounded_rect(s_draw, [x1+2, y1+3, x2+2, y2+4], radius, fill=(0, 0, 0, 18))
        # Inner shadow (darker, less spread)
        draw_rounded_rect(s_draw, [x1+1, y1+1, x2+1, y2+2], radius, fill=(0, 0, 0, 8))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(8))
        
        # Composite shadow
        bg = img.convert('RGBA')
        bg = Image.alpha_composite(bg, shadow_layer)
        img.paste(bg.convert('RGB'))
    
    draw = ImageDraw.Draw(img)
    draw_rounded_rect(draw, xy, radius, fill=fill)
    
    # Always add a very subtle border for definition
    if not border:
        border = (226, 232, 240)  # BORDER_COLOR
    draw_rounded_rect(draw, xy, radius, outline=border, width=1)


def draw_badge(draw, xy, text, bg_color, text_color, font, padding_x=10, padding_y=4, radius=10, solid=False):
    """Draw a colored badge/pill. If solid=True, use solid bg with white text. Otherwise light bg with colored text."""
    x, y = xy
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    bx1 = x
    by1 = y
    bx2 = x + tw + padding_x * 2
    by2 = y + th + padding_y * 2
    
    if solid:
        draw_rounded_rect(draw, [bx1, by1, bx2, by2], radius, fill=bg_color)
        draw.text((x + padding_x, y + padding_y + 1), text, fill=WHITE, font=font)
    else:
        # Create a light background from the main color
        light_bg = tuple(min(255, c + (255 - c) * 3 // 4) for c in bg_color[:3])
        border_color = tuple(min(255, c + (255 - c) // 2) for c in bg_color[:3])
        draw_rounded_rect(draw, [bx1, by1, bx2, by2], radius, fill=light_bg, outline=border_color)
        draw.text((x + padding_x, y + padding_y + 1), text, fill=bg_color, font=font)
    
    return bx2


def draw_sidebar(img, active_item=0, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS"):
    """Draw the application sidebar."""
    draw = ImageDraw.Draw(img)
    sidebar_width = 260
    
    # Sidebar background
    draw.rectangle([0, 0, sidebar_width, HEIGHT], fill=SIDEBAR_BG)
    
    # Logo area
    draw.rectangle([0, 0, sidebar_width, 70], fill=(22, 33, 52))
    
    # Logo icon (simple document icon)
    icon_x, icon_y = 24, 22
    # Document shape
    draw.rectangle([icon_x, icon_y, icon_x+22, icon_y+28], fill=ACCENT_BLUE, outline=ACCENT_BLUE)
    draw.polygon([(icon_x+14, icon_y), (icon_x+22, icon_y+10), (icon_x+14, icon_y+10)], fill=(30, 64, 175))
    # Lines on document
    for i in range(3):
        ly = icon_y + 14 + i * 5
        draw.rectangle([icon_x+4, ly, icon_x+18, ly+2], fill=WHITE)
    
    # App title
    draw.text((56, 20), "GED-ISIPA", fill=WHITE, font=FONTS['bold_20'])
    draw.text((56, 44), "Gestion Électronique", fill=TEXT_MUTED, font=FONTS['regular_11'])
    
    # Navigation items
    nav_items = [
        ("Tableau de Bord", "dashboard"),
        ("Documents", "docs"),
        ("Archives", "archive"),
        ("Journal d'Audit", "audit"),
        ("Administration", "admin"),
    ]
    
    nav_y = 90
    for i, (label, key) in enumerate(nav_items):
        item_y = nav_y + i * 48
        is_active = (i == active_item)
        
        if is_active:
            draw.rectangle([0, item_y, sidebar_width, item_y + 44], fill=SIDEBAR_HOVER)
            # Active indicator bar
            draw.rectangle([0, item_y + 8, 3, item_y + 36], fill=ACCENT_BLUE)
        
        # Icon area (simple geometric icons)
        icon_x = 28
        icon_cy = item_y + 22
        
        if key == "dashboard":
            # Grid icon
            draw.rectangle([icon_x, icon_cy-8, icon_x+7, icon_cy-1], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.rectangle([icon_x+9, icon_cy-8, icon_x+16, icon_cy-1], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.rectangle([icon_x, icon_cy+1, icon_x+7, icon_cy+8], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.rectangle([icon_x+9, icon_cy+1, icon_x+16, icon_cy+8], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
        elif key == "docs":
            # Document icon
            draw.rectangle([icon_x, icon_cy-8, icon_x+12, icon_cy+8], outline=ACCENT_BLUE if is_active else TEXT_MUTED, width=2)
            draw.line([icon_x+6, icon_cy-4, icon_x+12, icon_cy-4], fill=ACCENT_BLUE if is_active else TEXT_MUTED, width=1)
            draw.line([icon_x+6, icon_cy, icon_x+12, icon_cy], fill=ACCENT_BLUE if is_active else TEXT_MUTED, width=1)
        elif key == "archive":
            # Archive/box icon
            draw.rectangle([icon_x, icon_cy-6, icon_x+16, icon_cy+6], outline=ACCENT_BLUE if is_active else TEXT_MUTED, width=2)
            draw.line([icon_x, icon_cy-1, icon_x+16, icon_cy-1], fill=ACCENT_BLUE if is_active else TEXT_MUTED, width=2)
        elif key == "audit":
            # Shield icon
            draw.pieslice([icon_x+2, icon_cy-10, icon_x+14, icon_cy+2], 180, 360, fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.rectangle([icon_x+2, icon_cy-4, icon_x+14, icon_cy+6], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.ellipse([icon_x+6, icon_cy-5, icon_x+10, icon_cy-1], fill=WHITE)
        elif key == "admin":
            # People icon
            draw.ellipse([icon_x+1, icon_cy-9, icon_x+7, icon_cy-3], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.arc([icon_x-1, icon_cy-2, icon_x+9, icon_cy+8], 0, 180, fill=ACCENT_BLUE if is_active else TEXT_MUTED, width=2)
            draw.ellipse([icon_x+9, icon_cy-9, icon_x+15, icon_cy-3], fill=ACCENT_BLUE if is_active else TEXT_MUTED)
            draw.arc([icon_x+7, icon_cy-2, icon_x+17, icon_cy+8], 0, 180, fill=ACCENT_BLUE if is_active else TEXT_MUTED, width=2)
        
        # Label
        text_color = WHITE if is_active else TEXT_MUTED
        draw.text((52, item_y + 12), label, fill=text_color, font=FONTS['regular_14'])
    
    # Separator
    sep_y = nav_y + len(nav_items) * 48 + 10
    draw.line([24, sep_y, sidebar_width - 24, sep_y], fill=SIDEBAR_HOVER, width=1)
    
    # User area at bottom
    user_y = HEIGHT - 70
    draw.rectangle([0, user_y, sidebar_width, HEIGHT], fill=(22, 33, 52))
    
    # Avatar circle
    avatar_x = 24
    avatar_cy = user_y + 35
    draw.ellipse([avatar_x, avatar_cy-16, avatar_x+32, avatar_cy+16], fill=ACCENT_BLUE)
    draw.text((avatar_x + 8, avatar_cy - 8), user_initials, fill=WHITE, font=FONTS['bold_12'])
    
    # User info
    draw.text((64, user_y + 18), user_name, fill=WHITE, font=FONTS['bold_12'])
    draw.text((64, user_y + 36), user_role, fill=TEXT_MUTED, font=FONTS['regular_11'])
    
    return sidebar_width


def draw_topbar(img, sidebar_width, breadcrumbs=None, user_name="Administrateur Système", user_role="ADMIN"):
    """Draw the top bar."""
    draw = ImageDraw.Draw(img)
    topbar_height = 60
    
    # Topbar background
    draw.rectangle([sidebar_width, 0, WIDTH, topbar_height], fill=WHITE)
    draw.line([sidebar_width, topbar_height, WIDTH, topbar_height], fill=BORDER_COLOR, width=1)
    
    # Breadcrumbs
    if breadcrumbs:
        bx = sidebar_width + 28
        by = 22
        for i, bc in enumerate(breadcrumbs):
            if i > 0:
                draw.text((bx, by), "/", fill=TEXT_MUTED, font=FONTS['regular_13'])
                bx += 12
            color = TEXT_SECONDARY if i < len(breadcrumbs) - 1 else TEXT_PRIMARY
            font = FONTS['regular_13'] if i < len(breadcrumbs) - 1 else FONTS['bold_13']
            draw.text((bx, by), bc, fill=color, font=font)
            bx += font.getbbox(bc)[2] + 8
    
    # Right side - notifications bell
    notif_x = WIDTH - 240
    draw.ellipse([notif_x, 20, notif_x+20, 40], outline=TEXT_SECONDARY, width=2)
    draw.text((notif_x+6, 18), "3", fill=ACCENT_RED, font=FONTS['bold_10'])
    
    # User info
    avatar_x = WIDTH - 190
    draw.ellipse([avatar_x, 16, avatar_x+28, 44], fill=ACCENT_BLUE)
    draw.text((avatar_x+7, 20), "AS", fill=WHITE, font=FONTS['bold_11'])
    
    draw.text((avatar_x + 36, 16), user_name, fill=TEXT_PRIMARY, font=FONTS['bold_12'])
    
    # Role badge
    role_bg, role_text = ROLE_COLORS.get(user_role, (TEXT_SECONDARY, TEXT_PRIMARY))
    role_x = avatar_x + 36
    draw_badge(draw, (role_x, 34), user_role, role_bg, WHITE if role_bg[0] < 128 else TEXT_PRIMARY, FONTS['bold_10'], 6, 2, 8)
    
    return topbar_height


def draw_stat_card(img, xy, title, value, subtitle, icon_color, icon_type="doc"):
    """Draw a statistics card."""
    draw = ImageDraw.Draw(img)
    x1, y1, x2, y2 = xy
    
    draw_card(img, xy)
    draw = ImageDraw.Draw(img)
    
    # Icon
    icon_x = x1 + 20
    icon_y = y1 + 20
    # Create a light background version of the icon color
    light_bg = tuple(min(255, c + (255 - c) * 3 // 4) for c in icon_color[:3])
    draw_rounded_rect(draw, [icon_x, icon_y, icon_x+40, icon_y+40], 8, fill=light_bg)
    # Simple icon shapes
    if icon_type == "doc":
        draw.rectangle([icon_x+12, icon_y+8, icon_x+28, icon_y+32], outline=icon_color, width=2)
        draw.line([icon_x+16, icon_y+16, icon_x+24, icon_y+16], fill=icon_color, width=2)
        draw.line([icon_x+16, icon_y+22, icon_x+24, icon_y+22], fill=icon_color, width=2)
    elif icon_type == "user":
        draw.ellipse([icon_x+14, icon_y+8, icon_x+26, icon_y+20], outline=icon_color, width=2)
        draw.arc([icon_x+10, icon_y+18, icon_x+30, icon_y+32], 200, 340, fill=icon_color, width=2)
    elif icon_type == "audit":
        draw.rectangle([icon_x+10, icon_y+12, icon_x+30, icon_y+28], outline=icon_color, width=2)
        draw.line([icon_x+10, icon_y+20, icon_x+30, icon_y+20], fill=icon_color, width=1)
    elif icon_type == "archive":
        draw.rectangle([icon_x+10, icon_y+10, icon_x+30, icon_y+30], outline=icon_color, width=2)
        draw.line([icon_x+10, icon_y+18, icon_x+30, icon_y+18], fill=icon_color, width=2)
    
    # Title
    draw.text((x1 + 72, y1 + 16), title, fill=TEXT_SECONDARY, font=FONTS['regular_12'])
    
    # Value
    draw.text((x1 + 72, y1 + 32), str(value), fill=TEXT_PRIMARY, font=FONTS['bold_28'])
    
    # Subtitle
    draw.text((x1 + 72, y1 + 62), subtitle, fill=TEXT_MUTED, font=FONTS['regular_11'])


def draw_mini_bar_chart(img, xy, data, labels, colors, title=""):
    """Draw a simple bar chart inside a card."""
    draw = ImageDraw.Draw(img)
    x1, y1, x2, y2 = xy
    
    draw_card(img, xy)
    draw = ImageDraw.Draw(img)
    
    if title:
        draw.text((x1 + 20, y1 + 16), title, fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    chart_y = y1 + 44
    chart_h = y2 - y1 - 80
    chart_w = x2 - x1 - 80
    bar_w = min(50, chart_w // (len(data) + 1))
    
    max_val = max(data) if data else 1
    
    for i, (val, label, color) in enumerate(zip(data, labels, colors)):
        bar_h = int((val / max_val) * chart_h) if max_val > 0 else 0
        bx = x1 + 40 + i * (bar_w + 20)
        by = chart_y + chart_h - bar_h
        
        # Bar with rounded top
        draw_rounded_rect(draw, [bx, by, bx + bar_w, chart_y + chart_h], 4, fill=color)
        
        # Value on top
        draw.text((bx + bar_w//2 - 6, by - 18), str(val), fill=TEXT_PRIMARY, font=FONTS['bold_11'])
        
        # Label below
        bbox = FONTS['regular_10'].getbbox(label)
        lw = bbox[2] - bbox[0]
        draw.text((bx + bar_w//2 - lw//2, chart_y + chart_h + 6), label, fill=TEXT_SECONDARY, font=FONTS['regular_10'])


def draw_donut_chart(img, xy, data, labels, colors, title=""):
    """Draw a donut chart."""
    draw = ImageDraw.Draw(img)
    x1, y1, x2, y2 = xy
    
    draw_card(img, xy)
    draw = ImageDraw.Draw(img)
    
    if title:
        draw.text((x1 + 20, y1 + 16), title, fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    cx = (x1 + x2) // 2
    cy = y1 + 60 + (y2 - y1 - 80) // 2
    outer_r = min((x2 - x1 - 80) // 2, (y2 - y1 - 120) // 2)
    inner_r = int(outer_r * 0.6)
    
    total = sum(data)
    start_angle = -90
    
    for val, color in zip(data, colors):
        if total == 0:
            break
        sweep = (val / total) * 360
        draw.pieslice([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
                      start_angle, start_angle + sweep, fill=color)
        start_angle += sweep
    
    # Inner circle (donut hole)
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=CARD_BG)
    
    # Center text
    draw.text((cx - 10, cy - 14), str(total), fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((cx - 28, cy + 12), "documents", fill=TEXT_SECONDARY, font=FONTS['regular_11'])
    
    # Legend
    legend_y = y1 + 40
    legend_x = x2 - 140
    for label, color, val in zip(labels, colors, data):
        draw.rectangle([legend_x, legend_y, legend_x+10, legend_y+10], fill=color)
        draw.text((legend_x + 16, legend_y - 2), f"{label} ({val})", fill=TEXT_SECONDARY, font=FONTS['regular_11'])
        legend_y += 20


# =============================================================================
# SCREENSHOT 1: LOGIN PAGE
# =============================================================================
def create_login_page():
    img = Image.new('RGB', (WIDTH, HEIGHT), LOGIN_BG_RIGHT)
    draw = ImageDraw.Draw(img)
    
    # Left panel - dark with subtle gradient
    for y in range(HEIGHT):
        # Gradient from dark blue at top to slightly lighter at bottom
        ratio = y / HEIGHT
        r = int(15 + ratio * 10)
        g = int(23 + ratio * 15)
        b = int(42 + ratio * 25)
        draw.rectangle([0, y, WIDTH//2, y+1], fill=(r, g, b))
    
    # Decorative pattern on left - subtle grid
    for i in range(8):
        for j in range(6):
            px = 60 + i * 70
            py = 80 + j * 120
            # Calculate a subtle blue tint based on position
            blue_val = min(70, 40 + (i + j) * 4)
            draw.rectangle([px, py, px+50, py+50], outline=(30 + blue_val//3, 41 + blue_val//3, 59 + blue_val), width=1)
    
    # Left panel content
    # Logo
    logo_x = WIDTH // 4
    logo_y = 160
    
    # Large document icon
    draw.rectangle([logo_x - 30, logo_y, logo_x + 30, logo_y + 60], fill=ACCENT_BLUE)
    draw.polygon([(logo_x + 10, logo_y), (logo_x + 30, logo_y + 20), (logo_x + 10, logo_y + 20)], fill=(30, 64, 175))
    
    draw.text((logo_x - 80, logo_y + 80), "GED-ISIPA", fill=WHITE, font=FONTS['bold_40'])
    draw.text((logo_x - 120, logo_y + 130), "Gestion Électronique", fill=TEXT_MUTED, font=FONTS['regular_18'])
    draw.text((logo_x - 110, logo_y + 155), "des Documents", fill=TEXT_MUTED, font=FONTS['regular_18'])
    
    # Tagline
    draw.text((logo_x - 150, logo_y + 210), "Système de gestion documentaire", fill=(100, 116, 139), font=FONTS['regular_13'])
    draw.text((logo_x - 135, logo_y + 230), "de l'Institut Supérieur Pédagogique", fill=(100, 116, 139), font=FONTS['regular_13'])
    
    # Feature bullets
    bullet_y = logo_y + 300
    features = [
        "Gestion centralisée des documents",
        "Système d'archivage sécurisé",
        "Traçabilité complète des actions",
        "Contrôle d'accès par rôle"
    ]
    for feat in features:
        draw.ellipse([logo_x - 150, bullet_y, logo_x - 142, bullet_y + 8], fill=ACCENT_BLUE)
        draw.text((logo_x - 132, bullet_y - 3), feat, fill=(148, 163, 184), font=FONTS['regular_12'])
        bullet_y += 28
    
    # Right panel - Login form
    form_x = WIDTH // 2 + 80
    form_y = 180
    form_w = 400
    
    draw.text((form_x, form_y), "Connexion", fill=TEXT_PRIMARY, font=FONTS['bold_28'])
    draw.text((form_x, form_y + 38), "Entrez vos identifiants pour accéder au système", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Email field
    field_y = form_y + 90
    draw.text((form_x, field_y - 22), "Adresse email", fill=TEXT_PRIMARY, font=FONTS['bold_12'])
    draw_rounded_rect(draw, [form_x, field_y, form_x + form_w, field_y + 44], 8, fill=INPUT_BG, outline=INPUT_BORDER)
    # Email icon
    draw.rectangle([form_x + 14, field_y + 14, form_x + 30, field_y + 22], outline=TEXT_MUTED, width=1)
    draw.line([form_x + 14, field_y + 14, form_x + 22, field_y + 20], fill=TEXT_MUTED, width=1)
    draw.line([form_x + 22, field_y + 20, form_x + 30, field_y + 14], fill=TEXT_MUTED, width=1)
    draw.text((form_x + 40, field_y + 13), "admin@isipa.cd", fill=TEXT_SECONDARY, font=FONTS['regular_14'])
    
    # Password field
    field_y2 = field_y + 80
    draw.text((form_x, field_y2 - 22), "Mot de passe", fill=TEXT_PRIMARY, font=FONTS['bold_12'])
    draw_rounded_rect(draw, [form_x, field_y2, form_x + form_w, field_y2 + 44], 8, fill=INPUT_BG, outline=INPUT_BORDER)
    # Lock icon
    draw.rectangle([form_x + 14, field_y2 + 16, form_x + 28, field_y2 + 28], outline=TEXT_MUTED, width=1)
    draw.arc([form_x + 17, field_y2 + 10, form_x + 25, field_y2 + 19], 180, 360, fill=TEXT_MUTED, width=1)
    draw.text((form_x + 40, field_y2 + 13), "••••••••••", fill=TEXT_SECONDARY, font=FONTS['regular_14'])
    # Eye icon
    draw.ellipse([form_x + form_w - 34, field_y2 + 14, form_x + form_w - 18, field_y2 + 30], outline=TEXT_MUTED, width=1)
    
    # Remember me + Forgot password
    rem_y = field_y2 + 56
    draw.rectangle([form_x, rem_y, form_x + 16, rem_y + 16], fill=ACCENT_BLUE, outline=ACCENT_BLUE)
    draw.line([form_x + 3, rem_y + 8, form_x + 7, rem_y + 12], fill=WHITE, width=2)
    draw.line([form_x + 7, rem_y + 12, form_x + 13, rem_y + 4], fill=WHITE, width=2)
    draw.text((form_x + 22, rem_y), "Se souvenir de moi", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
    draw.text((form_x + form_w - 120, rem_y), "Mot de passe oublié?", fill=ACCENT_BLUE, font=FONTS['regular_12'])
    
    # Submit button
    btn_y = rem_y + 36
    draw_rounded_rect(draw, [form_x, btn_y, form_x + form_w, btn_y + 44], 8, fill=ACCENT_BLUE)
    draw.text((form_x + form_w//2 - 52, btn_y + 12), "Se connecter", fill=WHITE, font=FONTS['bold_16'])
    
    # Footer
    draw.text((form_x + 40, btn_y + 70), "© 2024 GED-ISIPA — Institut Supérieur Pédagogique", fill=TEXT_MUTED, font=FONTS['regular_11'])
    
    img.save(os.path.join(OUTPUT_DIR, "01-login-page.png"))
    print("  ✓ 01-login-page.png")


# =============================================================================
# SCREENSHOT 2: ADMIN DASHBOARD
# =============================================================================
def create_admin_dashboard():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    # Sidebar & Topbar
    sb_w = draw_sidebar(img, active_item=0, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Tableau de Bord"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title
    draw.text((content_x, content_y), "Tableau de Bord", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((content_x, content_y + 30), "Vue d'ensemble du système de gestion documentaire", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Stat cards row
    card_y = content_y + 56
    card_w = (content_w - 48) // 4
    card_h = 90
    
    stats = [
        ("Documents", "12", "2 en attente de validation", ACCENT_BLUE, "doc"),
        ("Utilisateurs", "4", "4 rôles actifs", ACCENT_GREEN, "user"),
        ("Entrées Audit", "10", "5 actions aujourd'hui", ACCENT_AMBER, "audit"),
        ("Archivés", "2", "Documents archivés", ACCENT_PURPLE, "archive"),
    ]
    
    for i, (title, value, sub, color, icon) in enumerate(stats):
        cx = content_x + i * (card_w + 16)
        draw_stat_card(img, [cx, card_y, cx + card_w, card_y + card_h], title, value, sub, color, icon)
    
    # Charts row
    chart_y = card_y + card_h + 20
    
    # Document status bar chart
    draw_mini_bar_chart(img, 
        [content_x, chart_y, content_x + content_w//2 - 12, chart_y + 260],
        [2, 1, 3, 3, 2, 1],
        ["Brouillon", "En revue", "Approuvé", "Publié", "Archivé", "Rejeté"],
        [(107, 114, 128), ACCENT_AMBER, ACCENT_BLUE, ACCENT_GREEN, ACCENT_PURPLE, ACCENT_RED],
        "Statut des Documents"
    )
    
    # Classification donut chart
    draw_donut_chart(img,
        [content_x + content_w//2 + 12, chart_y, WIDTH - 24, chart_y + 260],
        [2, 4, 4, 2],  # PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
        ["Public", "Interne", "Confident.", "Restreint"],
        [ACCENT_GREEN, ACCENT_BLUE, ACCENT_AMBER, ACCENT_RED],
        "Classification des Documents"
    )
    
    # Recent activity
    activity_y = chart_y + 276
    draw_card(img, [content_x, activity_y, WIDTH - 24, activity_y + 200])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, activity_y + 14), "Activité Récente", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    activities = [
        ("CREATE", "Document #9 — Budget Prévisionnel 2025 créé", "secretaire@isipa.cd", "2026-06-01 09:15"),
        ("READ", "Document #5 — Politique de Sécurité consultée", "directeur@isipa.cd", "2026-05-31 14:30"),
        ("UPDATE", "Document #4 — Note de Service mise à jour", "secretaire@isipa.cd", "2026-05-30 11:45"),
        ("DOWNLOAD", "Document #1 — Programme Académique téléchargé", "secretaire@isipa.cd", "2026-05-29 16:20"),
        ("LOGIN", "Connexion — secrétaire connectée", "secretaire@isipa.cd", "2026-05-28 08:00"),
    ]
    
    action_colors = {
        'CREATE': ACCENT_GREEN,
        'READ': ACCENT_BLUE,
        'UPDATE': ACCENT_AMBER,
        'DOWNLOAD': ACCENT_CYAN,
        'LOGIN': TEXT_SECONDARY,
    }
    
    ay = activity_y + 42
    for action, desc, user, time in activities:
        # Action badge
        ac = action_colors.get(action, TEXT_SECONDARY)
        draw_badge(draw, (content_x + 24, ay), action, ac, WHITE, FONTS['bold_10'], 8, 3, 6)
        
        # Description
        draw.text((content_x + 120, ay + 1), desc, fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        
        # User
        draw.text((WIDTH - 350, ay + 1), user, fill=TEXT_SECONDARY, font=FONTS['regular_11'])
        
        # Time
        draw.text((WIDTH - 170, ay + 1), time, fill=TEXT_MUTED, font=FONTS['regular_11'])
        
        # Separator
        if ay < activity_y + 42 + (len(activities) - 1) * 28:
            draw.line([content_x + 24, ay + 24, WIDTH - 40, ay + 24], fill=BORDER_COLOR, width=1)
        
        ay += 28
    
    img.save(os.path.join(OUTPUT_DIR, "02-dashboard-admin.png"))
    print("  ✓ 02-dashboard-admin.png")


# =============================================================================
# SCREENSHOT 3: DOCUMENTS LIST
# =============================================================================
def create_documents_list():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    sb_w = draw_sidebar(img, active_item=1, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Documents"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title row
    draw.text((content_x, content_y), "Documents", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    
    # Filter bar
    filter_y = content_y + 38
    draw_card(img, [content_x, filter_y, WIDTH - 24, filter_y + 44], shadow=False, border=BORDER_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Filter dropdowns
    filters = [("Type", 120), ("Statut", 140), ("Classification", 160)]
    fx = content_x + 12
    for label, fw in filters:
        draw.text((fx + 8, filter_y + 13), label, fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        draw.text((fx + 8 + FONTS['regular_12'].getbbox(label)[2] + 4, filter_y + 13), "▼", fill=TEXT_MUTED, font=FONTS['regular_10'])
        draw.line([fx + fw, filter_y + 8, fx + fw, filter_y + 36], fill=BORDER_COLOR, width=1)
        fx += fw + 8
    
    # Search
    search_x = fx + 16
    search_w = WIDTH - 24 - search_x - 130
    draw_rounded_rect(draw, [search_x, filter_y + 8, search_x + search_w, filter_y + 36], 6, fill=INPUT_BG, outline=INPUT_BORDER)
    draw.text((search_x + 10, filter_y + 13), "Rechercher un document...", fill=TEXT_MUTED, font=FONTS['regular_12'])
    
    # New document button
    btn_x = WIDTH - 148
    draw_rounded_rect(draw, [btn_x, filter_y + 8, btn_x + 124, filter_y + 36], 6, fill=ACCENT_BLUE)
    draw.text((btn_x + 14, filter_y + 13), "+ Nouveau", fill=WHITE, font=FONTS['bold_12'])
    
    # Documents data
    documents = [
        ("ISIPA-SI-PROG-2024-001", "Programme Académique 2024-2025", "ACADEMIC_RECORD", "PUBLISHED", "PUBLIC"),
        ("ISIPA-ADM-FIN-2024-002", "Rapport Financier T1 2024", "FINANCIAL", "APPROVED", "CONFIDENTIAL"),
        ("ISIPA-DG-CONV-2024-003", "Convention de Partenariat UNIKIN", "CONTRACT", "PENDING_REVIEW", "CONFIDENTIAL"),
        ("ISIPA-ADM-MEMO-2024-004", "Note de Service - Calendrier Examens", "MEMO", "PUBLISHED", "INTERNAL"),
        ("ISIPA-DG-POL-2024-005", "Politique de Sécurité Informatique", "POLICY", "APPROVED", "RESTRICTED"),
        ("ISIPA-SI-CERT-2024-006", "Attestation de Réussite - Promotion 2023", "CERTIFICATE", "ARCHIVED", "INTERNAL"),
        ("ISIPA-DG-RAPP-2024-007", "Rapport d'Activités Annuel 2023", "REPORT", "ARCHIVED", "INTERNAL"),
        ("ISIPA-DG-CORR-2024-008", "Correspondance Ministère Ens.", "CORRESPONDENCE", "DRAFT", "CONFIDENTIAL"),
        ("ISIPA-ADM-FIN-2024-009", "Budget Prévisionnel 2025", "FINANCIAL", "PENDING_REVIEW", "RESTRICTED"),
        ("ISIPA-DG-POL-2024-010", "Reglement Intérieur de l'ISIPA", "POLICY", "PUBLISHED", "PUBLIC"),
        ("ISIPA-SI-CERT-2024-011", "Liste des Diplômés 2023", "ACADEMIC_RECORD", "APPROVED", "INTERNAL"),
        ("ISIPA-ADM-FIN-2024-012", "Factures Fournisseurs Q2 2024", "FINANCIAL", "REJECTED", "CONFIDENTIAL"),
    ]
    
    status_labels = {
        'DRAFT': 'Brouillon',
        'PENDING_REVIEW': 'En Revue',
        'APPROVED': 'Approuvé',
        'PUBLISHED': 'Publié',
        'ARCHIVED': 'Archivé',
        'REJECTED': 'Rejeté',
    }
    
    class_labels = {
        'PUBLIC': 'Public',
        'INTERNAL': 'Interne',
        'CONFIDENTIAL': 'Confidentiel',
        'RESTRICTED': 'Restreint',
    }
    
    # Documents as cards in a list
    doc_y = filter_y + 56
    card_h = 52
    
    for i, (ref, title, dtype, status, classification) in enumerate(documents):
        dy = doc_y + i * (card_h + 6)
        
        if dy + card_h > HEIGHT - 20:
            break
        
        draw_card(img, [content_x, dy, WIDTH - 24, dy + card_h], shadow=False, border=BORDER_COLOR)
        draw = ImageDraw.Draw(img)
        
        # Document icon
        icon_x = content_x + 14
        icon_cy = dy + card_h // 2
        draw.rectangle([icon_x, icon_cy - 10, icon_x + 16, icon_cy + 10], fill=ACCENT_BLUE, outline=ACCENT_BLUE)
        draw.polygon([(icon_x + 10, icon_cy - 10), (icon_x + 16, icon_cy - 4), (icon_x + 10, icon_cy - 4)], fill=(30, 64, 175))
        
        # Reference
        draw.text((content_x + 40, dy + 8), ref, fill=ACCENT_BLUE, font=FONTS['bold_12'])
        
        # Title
        draw.text((content_x + 40, dy + 26), title, fill=TEXT_PRIMARY, font=FONTS['regular_13'])
        
        # Type
        draw.text((content_x + 400, dy + 16), dtype, fill=TEXT_SECONDARY, font=FONTS['regular_11'])
        
        # Status badge
        sc, sb_c = STATUS_COLORS[status]
        draw_badge(draw, (content_x + 560, dy + 14), status_labels[status], sc, WHITE, FONTS['bold_10'], 8, 3, 8)
        
        # Classification badge
        cc, cb_c = CLASS_COLORS[classification]
        draw_badge(draw, (content_x + 680, dy + 14), class_labels[classification], cc, WHITE, FONTS['bold_10'], 8, 3, 8)
        
        # Actions (three dots)
        for dx in range(3):
            draw.ellipse([WIDTH - 60 + dx * 8, dy + 22, WIDTH - 56 + dx * 8, dy + 26], fill=TEXT_MUTED)
    
    # Pagination
    pag_y = HEIGHT - 40
    draw.text((content_x, pag_y), "Affichage de 1-12 sur 12 documents", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
    
    # Page buttons
    for p in range(3):
        px = WIDTH - 180 + p * 40
        if p == 0:
            draw_rounded_rect(draw, [px, pag_y - 2, px + 32, pag_y + 22], 4, fill=ACCENT_BLUE)
            draw.text((px + 12, pag_y + 2), str(p + 1), fill=WHITE, font=FONTS['regular_12'])
        else:
            draw_rounded_rect(draw, [px, pag_y - 2, px + 32, pag_y + 22], 4, outline=BORDER_COLOR)
            draw.text((px + 12, pag_y + 2), str(p + 1), fill=TEXT_SECONDARY, font=FONTS['regular_12'])
    
    img.save(os.path.join(OUTPUT_DIR, "03-documents-list.png"))
    print("  ✓ 03-documents-list.png")


# =============================================================================
# SCREENSHOT 4: DOCUMENT DETAIL
# =============================================================================
def create_document_detail():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    sb_w = draw_sidebar(img, active_item=1, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Documents", "ISIPA-SI-PROG-2024-001"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title row
    draw.text((content_x, content_y), "Programme Académique 2024-2025", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((content_x, content_y + 32), "ISIPA-SI-PROG-2024-001", fill=ACCENT_BLUE, font=FONTS['regular_14'])
    
    # Status & Classification badges next to title
    draw_badge(draw, (content_x + 360, content_y + 4), "Publié", ACCENT_GREEN, WHITE, FONTS['bold_12'], 12, 4, 10)
    draw_badge(draw, (content_x + 460, content_y + 4), "Public", ACCENT_GREEN, WHITE, FONTS['bold_12'], 12, 4, 10)
    
    # Main content - left column (metadata)
    left_w = content_w * 2 // 3 - 12
    right_w = content_w // 3 - 12
    
    # Metadata card
    meta_y = content_y + 60
    draw_card(img, [content_x, meta_y, content_x + left_w, meta_y + 320])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, meta_y + 16), "Informations du Document", fill=TEXT_PRIMARY, font=FONTS['bold_16'])
    
    # Metadata grid
    metadata = [
        ("Référence", "ISIPA-SI-PROG-2024-001"),
        ("Titre", "Programme Académique 2024-2025"),
        ("Type", "ACADEMIC_RECORD"),
        ("Statut", "PUBLISHED"),
        ("Classification", "PUBLIC"),
        ("Département", "Sciences Informatiques (SI)"),
        ("Créé par", "Marie Ngoie (secretaire@isipa.cd)"),
        ("Date de création", "2024-01-15"),
        ("Dernière modification", "2026-05-29 16:20"),
        ("Approuvé par", "Prof. Jean Mukendi (directeur@isipa.cd)"),
        ("Date d'approbation", "2024-01-20"),
        ("Date de publication", "2024-01-22"),
    ]
    
    my = meta_y + 48
    for label, value in metadata:
        draw.text((content_x + 20, my), label, fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        
        if label == "Statut":
            sc, _ = STATUS_COLORS.get(value, (TEXT_SECONDARY, CARD_BG))
            draw_badge(draw, (content_x + 200, my - 2), value, sc, WHITE, FONTS['bold_10'], 8, 3, 8)
        elif label == "Classification":
            cc, _ = CLASS_COLORS.get(value, (TEXT_SECONDARY, CARD_BG))
            draw_badge(draw, (content_x + 200, my - 2), value, cc, WHITE, FONTS['bold_10'], 8, 3, 8)
        else:
            draw.text((content_x + 200, my), value, fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        
        draw.line([content_x + 20, my + 20, content_x + left_w - 20, my + 20], fill=BORDER_COLOR, width=1)
        my += 22
    
    # Description card
    desc_y = meta_y + 336
    draw_card(img, [content_x, desc_y, content_x + left_w, desc_y + 120])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, desc_y + 16), "Description", fill=TEXT_PRIMARY, font=FONTS['bold_16'])
    draw.text((content_x + 20, desc_y + 44), "Programme académique complet de l'Institut Supérieur Pédagogique", fill=TEXT_PRIMARY, font=FONTS['regular_13'])
    draw.text((content_x + 20, desc_y + 64), "pour l'année universitaire 2024-2025. Ce document contient les", fill=TEXT_PRIMARY, font=FONTS['regular_13'])
    draw.text((content_x + 20, desc_y + 84), "programmes de toutes les filières et niveaux.", fill=TEXT_PRIMARY, font=FONTS['regular_13'])
    
    # Right column - File info & Actions
    right_x = content_x + left_w + 24
    
    # File info card
    draw_card(img, [right_x, meta_y, right_x + right_w, meta_y + 180])
    draw = ImageDraw.Draw(img)
    
    draw.text((right_x + 20, meta_y + 16), "Fichier", fill=TEXT_PRIMARY, font=FONTS['bold_16'])
    
    # File icon
    file_x = right_x + 20
    file_y = meta_y + 44
    draw.rectangle([file_x, file_y, file_x + 40, file_y + 48], fill=(239, 246, 255), outline=ACCENT_BLUE)
    draw.text((file_x + 8, file_y + 12), "PDF", fill=ACCENT_BLUE, font=FONTS['bold_12'])
    
    draw.text((file_x + 52, file_y + 4), "programme-academique", fill=TEXT_PRIMARY, font=FONTS['regular_12'])
    draw.text((file_x + 52, file_y + 20), "2024-2025.pdf", fill=TEXT_PRIMARY, font=FONTS['regular_12'])
    draw.text((file_x + 52, file_y + 38), "2.4 MB • PDF", fill=TEXT_MUTED, font=FONTS['regular_11'])
    
    # Download button
    dl_y = meta_y + 108
    draw_rounded_rect(draw, [right_x + 20, dl_y, right_x + right_w - 20, dl_y + 36], 6, fill=ACCENT_BLUE)
    draw.text((right_x + 52, dl_y + 9), "Télécharger", fill=WHITE, font=FONTS['bold_13'])
    
    # Version info
    ver_y = dl_y + 44
    draw.text((right_x + 20, ver_y), "Version 3 • Dernière modif.", fill=TEXT_MUTED, font=FONTS['regular_11'])
    draw.text((right_x + 20, ver_y + 16), "2026-05-29 16:20", fill=TEXT_SECONDARY, font=FONTS['regular_11'])
    
    # Actions card
    act_y = meta_y + 196
    draw_card(img, [right_x, act_y, right_x + right_w, act_y + 220])
    draw = ImageDraw.Draw(img)
    
    draw.text((right_x + 20, act_y + 16), "Actions", fill=TEXT_PRIMARY, font=FONTS['bold_16'])
    
    actions = [
        ("Modifier", ACCENT_BLUE),
        ("Changer le statut", ACCENT_AMBER),
        ("Changer classification", TEXT_SECONDARY),
        ("Archiver", ACCENT_PURPLE),
        ("Supprimer", ACCENT_RED),
    ]
    
    aby = act_y + 48
    for label, color in actions:
        draw_rounded_rect(draw, [right_x + 20, aby, right_x + right_w - 20, aby + 32], 6, outline=BORDER_COLOR)
        draw.text((right_x + 32, aby + 8), label, fill=color, font=FONTS['regular_12'])
        aby += 36
    
    img.save(os.path.join(OUTPUT_DIR, "04-document-detail.png"))
    print("  ✓ 04-document-detail.png")


# =============================================================================
# SCREENSHOT 5: ARCHIVES
# =============================================================================
def create_archives():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    sb_w = draw_sidebar(img, active_item=2, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Archives"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title
    draw.text((content_x, content_y), "Archives", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((content_x, content_y + 30), "Documents archivés avec intégrité vérifiée", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Archived documents
    archived_docs = [
        {
            "ref": "ISIPA-SI-CERT-2024-006",
            "title": "Attestation de Réussite - Promotion 2023",
            "type": "CERTIFICATE",
            "archived_by": "Paul Kabongo",
            "date": "2024-06-15",
            "hash": "a3f8c2e1b7d9...4f6e8c2a1d",
            "size": "1.8 MB"
        },
        {
            "ref": "ISIPA-DG-RAPP-2024-007",
            "title": "Rapport d'Activités Annuel 2023",
            "type": "REPORT",
            "archived_by": "Paul Kabongo",
            "date": "2024-07-01",
            "hash": "7b2e9f4c3a8d...1e5f7b3c9a",
            "size": "3.2 MB"
        },
    ]
    
    card_y = content_y + 56
    for doc in archived_docs:
        draw_card(img, [content_x, card_y, WIDTH - 24, card_y + 160])
        draw = ImageDraw.Draw(img)
        
        # Archive icon
        icon_x = content_x + 20
        icon_cy = card_y + 30
        draw.rectangle([icon_x, icon_cy - 12, icon_x + 24, icon_cy + 12], fill=ACCENT_PURPLE, outline=ACCENT_PURPLE)
        draw.line([icon_x, icon_cy, icon_x + 24, icon_cy], fill=WHITE, width=2)
        draw.rectangle([icon_x + 6, icon_cy - 4, icon_x + 18, icon_cy + 4], fill=WHITE)
        
        # Reference & Title
        draw.text((content_x + 56, card_y + 14), doc["ref"], fill=ACCENT_BLUE, font=FONTS['bold_14'])
        draw.text((content_x + 56, card_y + 34), doc["title"], fill=TEXT_PRIMARY, font=FONTS['regular_16'])
        
        # Status badge
        draw_badge(draw, (content_x + 56, card_y + 58), "ARCHIVÉ", ACCENT_PURPLE, WHITE, FONTS['bold_10'], 8, 3, 8)
        draw_badge(draw, (content_x + 130, card_y + 58), doc["type"], TEXT_SECONDARY, WHITE, FONTS['bold_10'], 8, 3, 8)
        
        # Archive metadata
        draw.text((content_x + 56, card_y + 84), f"Archivé par: {doc['archived_by']}  •  Date: {doc['date']}  •  Taille: {doc['size']}", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        
        # SHA-256 Hash
        draw.text((content_x + 56, card_y + 106), "SHA-256:", fill=TEXT_MUTED, font=FONTS['bold_11'])
        # Hash display with monospace background
        hash_bg_x = content_x + 120
        hash_bg_y = card_y + 102
        draw_rounded_rect(draw, [hash_bg_x, hash_bg_y, WIDTH - 100, hash_bg_y + 22], 4, fill=(248, 250, 252), outline=BORDER_COLOR)
        draw.text((hash_bg_x + 8, hash_bg_y + 4), f"sha256:{doc['hash']}", fill=TEXT_SECONDARY, font=FONTS['mono_11'])
        
        # Verify button
        draw_rounded_rect(draw, [WIDTH - 88, hash_bg_y, WIDTH - 36, hash_bg_y + 22], 4, fill=ACCENT_GREEN)
        draw.text((WIDTH - 84, hash_bg_y + 4), "Vérifié ✓", fill=WHITE, font=FONTS['bold_10'])
        
        # Integrity info
        draw.text((content_x + 56, card_y + 132), "Intégrité: Vérifiée  •  Horodatage: Certifié  •  Chaîne de confiance: Valide", fill=ACCENT_GREEN, font=FONTS['regular_11'])
        
        card_y += 176
    
    # Archive stats
    stats_y = card_y + 16
    draw_card(img, [content_x, stats_y, WIDTH - 24, stats_y + 120])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, stats_y + 14), "Statistiques d'Archivage", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    stat_items = [
        ("Documents archivés", "2"),
        ("Taille totale", "5.0 MB"),
        ("Vérifications d'intégrité", "2/2 réussies"),
        ("Dernière vérification", "2026-03-01 08:00"),
    ]
    
    sx = content_x + 20
    for label, value in stat_items:
        draw.text((sx, stats_y + 44), label, fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        draw.text((sx, stats_y + 62), value, fill=TEXT_PRIMARY, font=FONTS['bold_16'])
        sx += (WIDTH - 24 - content_x) // 4
    
    img.save(os.path.join(OUTPUT_DIR, "05-archives.png"))
    print("  ✓ 05-archives.png")


# =============================================================================
# SCREENSHOT 6: AUDIT LOG
# =============================================================================
def create_audit_log():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    sb_w = draw_sidebar(img, active_item=3, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Journal d'Audit"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title
    draw.text((content_x, content_y), "Journal d'Audit", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((content_x, content_y + 30), "Traçabilité complète des actions sur le système", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Filter bar
    filter_y = content_y + 56
    draw_card(img, [content_x, filter_y, WIDTH - 24, filter_y + 44], shadow=False, border=BORDER_COLOR)
    draw = ImageDraw.Draw(img)
    
    filters = [("Action", 100), ("Utilisateur", 120), ("Date", 120)]
    fx = content_x + 12
    for label, fw in filters:
        draw.text((fx + 8, filter_y + 13), label + " ▼", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        draw.line([fx + fw, filter_y + 8, fx + fw, filter_y + 36], fill=BORDER_COLOR, width=1)
        fx += fw + 8
    
    # Export button
    draw_rounded_rect(draw, [WIDTH - 160, filter_y + 8, WIDTH - 36, filter_y + 36], 6, outline=ACCENT_BLUE)
    draw.text((WIDTH - 150, filter_y + 13), "Exporter CSV", fill=ACCENT_BLUE, font=FONTS['bold_12'])
    
    # Audit table
    table_y = filter_y + 56
    
    # Table header
    draw.rectangle([content_x, table_y, WIDTH - 24, table_y + 36], fill=TABLE_HEADER_BG)
    draw.line([content_x, table_y, WIDTH - 24, table_y], fill=BORDER_COLOR, width=1)
    draw.line([content_x, table_y + 36, WIDTH - 24, table_y + 36], fill=BORDER_COLOR, width=1)
    
    headers = [("ID", 50), ("Action", 100), ("Cible", 200), ("Détails", 300), ("Utilisateur", 150), ("Horodatage", 180)]
    hx = content_x + 16
    for label, w in headers:
        draw.text((hx, table_y + 10), label, fill=TEXT_SECONDARY, font=FONTS['bold_11'])
        hx += w
    
    # Audit data
    audit_data = [
        (1, "CREATE", "Document #9", "Création du budget prévisionnel 2025", "secretaire", "2026-06-01 09:15:32"),
        (2, "READ", "Document #5", "Consultation de la politique de sécurité informatique", "directeur", "2026-05-31 14:30:18"),
        (3, "UPDATE", "Document #4", "Mise à jour de la note de service - calendrier examens", "secretaire", "2026-05-30 11:45:07"),
        (4, "DOWNLOAD", "Document #1", "Téléchargement du programme académique 2024-2025", "secretaire", "2026-05-29 16:20:45"),
        (5, "LOGIN", "User", "Connexion secrétaire au système", "secretaire", "2026-05-28 08:00:12"),
        (6, "UPDATE", "Document #3", "Mise à jour de la convention de partenariat UNIKIN", "directeur", "2026-05-27 10:15:33"),
        (7, "CREATE", "Document #12", "Création des factures fournisseurs Q2 2024", "secretaire", "2026-05-26 09:30:00"),
        (8, "REJECT", "Document #12", "Rejet des factures fournisseurs Q2 2024", "directeur", "2026-05-25 15:45:22"),
        (9, "APPROVE", "Document #5", "Approbation de la politique de sécurité informatique", "directeur", "2026-05-24 11:00:00"),
        (10, "LOGIN", "User", "Connexion administrateur au système", "admin", "2026-05-23 07:30:45"),
    ]
    
    action_colors = {
        'CREATE': ACCENT_GREEN,
        'READ': ACCENT_BLUE,
        'UPDATE': ACCENT_AMBER,
        'DOWNLOAD': ACCENT_CYAN,
        'LOGIN': TEXT_SECONDARY,
        'REJECT': ACCENT_RED,
        'APPROVE': (37, 99, 235),
    }
    
    row_y = table_y + 36
    for i, (aid, action, target, details, user, timestamp) in enumerate(audit_data):
        # Alternating row background
        if i % 2 == 1:
            draw.rectangle([content_x, row_y, WIDTH - 24, row_y + 36], fill=TABLE_ROW_HOVER)
        draw.line([content_x, row_y + 36, WIDTH - 24, row_y + 36], fill=BORDER_COLOR, width=1)
        
        rx = content_x + 16
        # ID
        draw.text((rx, row_y + 10), f"#{aid:03d}", fill=TEXT_MUTED, font=FONTS['regular_11'])
        rx += 50
        
        # Action badge
        ac = action_colors.get(action, TEXT_SECONDARY)
        draw_badge(draw, (rx, row_y + 8), action, ac, WHITE, FONTS['bold_10'], 8, 3, 6)
        rx += 100
        
        # Target
        draw.text((rx, row_y + 10), target, fill=ACCENT_BLUE, font=FONTS['regular_11'])
        rx += 200
        
        # Details
        draw.text((rx, row_y + 10), details[:50], fill=TEXT_PRIMARY, font=FONTS['regular_11'])
        rx += 300
        
        # User
        draw.text((rx, row_y + 10), user, fill=TEXT_SECONDARY, font=FONTS['regular_11'])
        rx += 150
        
        # Timestamp
        draw.text((rx, row_y + 10), timestamp, fill=TEXT_MUTED, font=FONTS['mono_11'])
        
        row_y += 36
    
    # Pagination
    pag_y = row_y + 16
    draw.text((content_x, pag_y), "Affichage de 1-10 sur 10 entrées", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
    
    img.save(os.path.join(OUTPUT_DIR, "06-audit-log.png"))
    print("  ✓ 06-audit-log.png")


# =============================================================================
# SCREENSHOT 7: ADMINISTRATION (USER MANAGEMENT)
# =============================================================================
def create_administration():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    sb_w = draw_sidebar(img, active_item=4, user_name="Administrateur Système", user_role="ADMIN", user_initials="AS")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Administration"], user_name="Administrateur Système", user_role="ADMIN")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title
    draw.text((content_x, content_y), "Administration", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw.text((content_x, content_y + 30), "Gestion des utilisateurs et des rôles", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Add user button
    draw_rounded_rect(draw, [WIDTH - 200, content_y, WIDTH - 36, content_y + 36], 6, fill=ACCENT_BLUE)
    draw.text((WIDTH - 188, content_y + 8), "+ Nouvel utilisateur", fill=WHITE, font=FONTS['bold_12'])
    
    # User cards
    users = [
        {
            "email": "admin@isipa.cd",
            "name": "Administrateur Système",
            "role": "ADMIN",
            "dept": "Direction Générale",
            "initials": "AS",
            "status": "Actif",
            "last_login": "2026-03-01 08:00"
        },
        {
            "email": "secretaire@isipa.cd",
            "name": "Marie Ngoie",
            "role": "SECRETARY",
            "dept": "Administration",
            "initials": "MN",
            "status": "Actif",
            "last_login": "2026-06-01 09:15"
        },
        {
            "email": "directeur@isipa.cd",
            "name": "Prof. Jean Mukendi",
            "role": "DIRECTOR",
            "dept": "Direction Générale",
            "initials": "JM",
            "status": "Actif",
            "last_login": "2026-05-31 14:30"
        },
        {
            "email": "archiviste@isipa.cd",
            "name": "Paul Kabongo",
            "role": "ARCHIVIST",
            "dept": "Direction Générale",
            "initials": "PK",
            "status": "Actif",
            "last_login": "2026-05-27 10:15"
        },
    ]
    
    role_labels = {
        'ADMIN': 'Administrateur',
        'SECRETARY': 'Secrétaire',
        'DIRECTOR': 'Directeur',
        'ARCHIVIST': 'Archiviste',
    }
    
    role_avatar_colors = {
        'ADMIN': ACCENT_RED,
        'SECRETARY': ACCENT_BLUE,
        'DIRECTOR': ACCENT_PURPLE,
        'ARCHIVIST': ACCENT_GREEN,
    }
    
    card_y = content_y + 56
    card_h = 100
    
    for i, user in enumerate(users):
        uy = card_y + i * (card_h + 12)
        
        draw_card(img, [content_x, uy, WIDTH - 24, uy + card_h])
        draw = ImageDraw.Draw(img)
        
        # Avatar
        avatar_x = content_x + 20
        avatar_cy = uy + card_h // 2
        ac = role_avatar_colors[user["role"]]
        draw.ellipse([avatar_x, avatar_cy - 24, avatar_x + 48, avatar_cy + 24], fill=ac)
        draw.text((avatar_x + 10, avatar_cy - 10), user["initials"], fill=WHITE, font=FONTS['bold_18'])
        
        # Name & email
        draw.text((avatar_x + 64, uy + 16), user["name"], fill=TEXT_PRIMARY, font=FONTS['bold_16'])
        draw.text((avatar_x + 64, uy + 38), user["email"], fill=TEXT_SECONDARY, font=FONTS['regular_13'])
        
        # Department
        draw.text((avatar_x + 64, uy + 60), f"Département: {user['dept']}", fill=TEXT_MUTED, font=FONTS['regular_12'])
        
        # Role badge
        rc, _ = ROLE_COLORS[user["role"]]
        draw_badge(draw, (avatar_x + 64, uy + 78), role_labels[user["role"]], rc, WHITE, FONTS['bold_11'], 10, 4, 8)
        
        # Status
        draw.text((content_x + 400, uy + 16), "Statut", fill=TEXT_MUTED, font=FONTS['regular_11'])
        draw.ellipse([content_x + 400, uy + 34, content_x + 408, uy + 42], fill=ACCENT_GREEN)
        draw.text((content_x + 414, uy + 32), user["status"], fill=ACCENT_GREEN, font=FONTS['bold_12'])
        
        # Last login
        draw.text((content_x + 400, uy + 56), "Dernière connexion", fill=TEXT_MUTED, font=FONTS['regular_11'])
        draw.text((content_x + 400, uy + 72), user["last_login"], fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        
        # Actions
        draw.text((WIDTH - 200, uy + 20), "Modifier", fill=ACCENT_BLUE, font=FONTS['regular_12'])
        draw.text((WIDTH - 200, uy + 40), "Réinitialiser MDP", fill=ACCENT_AMBER, font=FONTS['regular_12'])
        draw.text((WIDTH - 200, uy + 60), "Désactiver", fill=ACCENT_RED, font=FONTS['regular_12'])
        
        # Separator dots
        for dx in range(3):
            draw.ellipse([WIDTH - 60 + dx * 8, uy + 44, WIDTH - 56 + dx * 8, uy + 48], fill=TEXT_MUTED)
    
    img.save(os.path.join(OUTPUT_DIR, "07-administration.png"))
    print("  ✓ 07-administration.png")


# =============================================================================
# SCREENSHOT 8: HEALTH CHECK API
# =============================================================================
def create_health_check_api():
    img = Image.new('RGB', (WIDTH, HEIGHT), (13, 17, 23))
    draw = ImageDraw.Draw(img)
    
    # Title bar (browser-like)
    draw.rectangle([0, 0, WIDTH, 40], fill=(30, 41, 59))
    
    # Browser dots
    for i, color in enumerate([(239, 68, 68), (245, 158, 11), (34, 197, 94)]):
        draw.ellipse([16 + i * 20, 14, 26 + i * 20, 24], fill=color)
    
    # URL bar
    draw_rounded_rect(draw, [80, 8, WIDTH - 80, 32], 6, fill=(15, 23, 42))
    draw.text((96, 12), "GET", fill=ACCENT_GREEN, font=FONTS['bold_12'])
    draw.text((130, 12), "https://ged-isipa.cd/api/health", fill=TEXT_MUTED, font=FONTS['mono_12'])
    
    # Status badge
    draw_badge(draw, (WIDTH - 140, 12), "200 OK", ACCENT_GREEN, WHITE, FONTS['bold_10'], 8, 3, 6)
    
    # JSON content
    json_y = 60
    json_x = 40
    
    # Headers info
    draw.text((json_x, json_y), "Response Headers", fill=TEXT_MUTED, font=FONTS['bold_12'])
    json_y += 24
    
    headers_text = [
        "Content-Type: application/json",
        "X-Request-Id: req_a8f3c2e1b7d9",
        "X-Response-Time: 12ms",
    ]
    for h in headers_text:
        draw.text((json_x, json_y), h, fill=TEXT_MUTED, font=FONTS['mono_12'])
        json_y += 18
    
    json_y += 16
    draw.text((json_x, json_y), "Response Body", fill=TEXT_MUTED, font=FONTS['bold_12'])
    json_y += 24
    
    # JSON with syntax highlighting
    # Each tuple: (key, separator, value, trailing_comma)
    # Using consistent single-quote delimiters to avoid parsing issues
    json_lines = [
        ("{", None),
        ("  \"status\"", ": ", "\"healthy\"", ","),
        ("  \"timestamp\"", ": ", "\"2026-03-01T12:00:00Z\"", ","),
        ("  \"version\"", ": ", "\"1.0.0\"", ","),
        ("  \"uptime\"", ": ", "86400", ","),
        ("  \"services\"", ": ", "{", ","),
        ("    \"database\"", ": ", "\"connected\"", ","),
        ("    \"storage\"", ": ", "\"available\"", ","),
        ("    \"auth\"", ": ", "\"operational\"", ","),
        ("    \"email\"", ": ", "\"operational\"", ""),
        ("  }", ","),
        ("  \"stats\"", ": ", "{", ","),
        ("    \"documents\"", ": ", "12", ","),
        ("    \"users\"", ": ", "4", ","),
        ("    \"auditEntries\"", ": ", "10", ","),
        ("    \"departments\"", ": ", "4", ""),
        ("  }", ","),
        ("  \"checks\"", ": ", "[", ""),
        ("    {", None),
        ("      \"name\"", ": ", "\"database\"", ","),
        ("      \"status\"", ": ", "\"healthy\"", ","),
        ("      \"latency\"", ": ", "\"3ms\"", ""),
        ("    },", None),
        ("    {", None),
        ("      \"name\"", ": ", "\"storage\"", ","),
        ("      \"status\"", ": ", "\"healthy\"", ","),
        ("      \"latency\"", ": ", "\"1ms\"", ""),
        ("    },", None),
        ("    {", None),
        ("      \"name\"", ": ", "\"auth\"", ","),
        ("      \"status\"", ": ", "\"healthy\"", ","),
        ("      \"latency\"", ": ", "\"5ms\"", ""),
        ("    }", None),
        ("  ]", ""),
        ("}", None),
    ]
    
    # Syntax colors
    key_color = (147, 197, 253)    # light blue for keys
    string_color = (134, 239, 172)  # green for strings
    number_color = (253, 186, 116)  # orange for numbers
    brace_color = (148, 163, 184)   # gray for braces/punctuation
    colon_color = (148, 163, 184)   # gray for colons
    
    for line_data in json_lines:
        x = json_x
        if len(line_data) == 2:
            # Just a brace/comma line
            draw.text((x, json_y), line_data[0], fill=brace_color, font=FONTS['mono_13'])
        elif len(line_data) == 4:
            key, sep, value, comma = line_data
            draw.text((x, json_y), key, fill=key_color, font=FONTS['mono_13'])
            x += FONTS['mono_13'].getbbox(key)[2]
            draw.text((x, json_y), sep, fill=colon_color, font=FONTS['mono_13'])
            x += FONTS['mono_13'].getbbox(sep)[2]
            
            # Determine value type for coloring
            if value.startswith('"'):
                draw.text((x, json_y), value, fill=string_color, font=FONTS['mono_13'])
            elif value.isdigit():
                draw.text((x, json_y), value, fill=number_color, font=FONTS['mono_13'])
            else:
                draw.text((x, json_y), value, fill=brace_color, font=FONTS['mono_13'])
            x += FONTS['mono_13'].getbbox(value)[2]
            
            if comma:
                draw.text((x, json_y), comma, fill=brace_color, font=FONTS['mono_13'])
        
        json_y += 20
    
    # Bottom status bar
    draw.rectangle([0, HEIGHT - 30, WIDTH, HEIGHT], fill=(30, 41, 59))
    draw.text((20, HEIGHT - 24), "JSON  •  437 bytes  •  12ms", fill=TEXT_MUTED, font=FONTS['regular_11'])
    draw.text((WIDTH - 200, HEIGHT - 24), "Status: 200 OK", fill=ACCENT_GREEN, font=FONTS['bold_11'])
    
    img.save(os.path.join(OUTPUT_DIR, "08-health-check-api.png"))
    print("  ✓ 08-health-check-api.png")


# =============================================================================
# SCREENSHOT 9: DIRECTOR DASHBOARD
# =============================================================================
def create_director_dashboard():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    # Sidebar with Director user
    sb_w = draw_sidebar(img, active_item=0, user_name="Prof. Jean Mukendi", user_role="DIRECTOR", user_initials="JM")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Tableau de Bord"], user_name="Prof. Jean Mukendi", user_role="DIRECTOR")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title with role indicator
    draw.text((content_x, content_y), "Tableau de Bord", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw_badge(draw, (content_x + 220, content_y + 6), "DIRECTEUR", ACCENT_PURPLE, WHITE, FONTS['bold_10'], 8, 3, 8)
    draw.text((content_x, content_y + 30), "Vue d'ensemble — Prof. Jean Mukendi", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Stat cards
    card_y = content_y + 56
    card_w = (content_w - 32) // 3
    card_h = 90
    
    stats = [
        ("Documents", "12", "Accès complet en lecture", ACCENT_BLUE, "doc"),
        ("En attente", "2", "Nécessitent votre validation", ACCENT_AMBER, "audit"),
        ("Archivés", "2", "Documents archivés", ACCENT_PURPLE, "archive"),
    ]
    
    for i, (title, value, sub, color, icon) in enumerate(stats):
        cx = content_x + i * (card_w + 16)
        draw_stat_card(img, [cx, card_y, cx + card_w, card_y + card_h], title, value, sub, color, icon)
    
    # Pending documents section
    pending_y = card_y + card_h + 20
    draw_card(img, [content_x, pending_y, WIDTH - 24, pending_y + 180])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, pending_y + 14), "Documents en Attente de Validation", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    draw_badge(draw, (content_x + 330, pending_y + 14), "2", ACCENT_AMBER, WHITE, FONTS['bold_10'], 8, 3, 8)
    
    # Pending docs
    pending_docs = [
        ("ISIPA-DG-CONV-2024-003", "Convention de Partenariat UNIKIN", "CONTRACT", "CONFIDENTIEL", "secretaire@isipa.cd"),
        ("ISIPA-ADM-FIN-2024-009", "Budget Prévisionnel 2025", "FINANCIAL", "RESTREINT", "secretaire@isipa.cd"),
    ]
    
    pd_y = pending_y + 44
    for ref, title, dtype, classification, submitted_by in pending_docs:
        draw.line([content_x + 20, pd_y, WIDTH - 40, pd_y], fill=BORDER_COLOR, width=1)
        
        # Warning indicator
        draw.ellipse([content_x + 20, pd_y + 6, content_x + 28, pd_y + 14], fill=ACCENT_AMBER)
        
        draw.text((content_x + 36, pd_y + 2), ref, fill=ACCENT_BLUE, font=FONTS['bold_12'])
        draw.text((content_x + 260, pd_y + 2), title, fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        draw_badge(draw, (content_x + 530, pd_y + 2), dtype, TEXT_SECONDARY, WHITE, FONTS['bold_10'], 8, 3, 6)
        draw_badge(draw, (content_x + 640, pd_y + 2), classification, ACCENT_AMBER, WHITE, FONTS['bold_10'], 8, 3, 6)
        
        # Action buttons
        draw_rounded_rect(draw, [WIDTH - 180, pd_y, WIDTH - 108, pd_y + 22], 4, fill=ACCENT_GREEN)
        draw.text((WIDTH - 172, pd_y + 4), "Approuver", fill=WHITE, font=FONTS['bold_10'])
        
        draw_rounded_rect(draw, [WIDTH - 100, pd_y, WIDTH - 36, pd_y + 22], 4, fill=ACCENT_RED)
        draw.text((WIDTH - 90, pd_y + 4), "Rejeter", fill=WHITE, font=FONTS['bold_10'])
        
        pd_y += 40
    
    # Recent approved documents
    approved_y = pending_y + 200
    draw_card(img, [content_x, approved_y, WIDTH - 24, approved_y + 180])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, approved_y + 14), "Documents Récemment Approuvés", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    approved_docs = [
        ("ISIPA-SI-PROG-2024-001", "Programme Académique 2024-2025", "ACADEMIC_RECORD", "Publié", ACCENT_GREEN),
        ("ISIPA-ADM-FIN-2024-002", "Rapport Financier T1 2024", "FINANCIAL", "Approuvé", ACCENT_BLUE),
        ("ISIPA-DG-POL-2024-005", "Politique de Sécurité Informatique", "POLICY", "Approuvé", ACCENT_BLUE),
    ]
    
    ad_y = approved_y + 44
    for ref, title, dtype, status, status_color in approved_docs:
        draw.ellipse([content_x + 20, ad_y + 6, content_x + 28, ad_y + 14], fill=status_color)
        draw.text((content_x + 36, ad_y + 2), ref, fill=ACCENT_BLUE, font=FONTS['bold_12'])
        draw.text((content_x + 260, ad_y + 2), title, fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        draw_badge(draw, (content_x + 530, ad_y + 2), dtype, TEXT_SECONDARY, WHITE, FONTS['bold_10'], 8, 3, 6)
        draw_badge(draw, (content_x + 640, ad_y + 2), status, status_color, WHITE, FONTS['bold_10'], 8, 3, 6)
        ad_y += 32
    
    img.save(os.path.join(OUTPUT_DIR, "09-director-dashboard.png"))
    print("  ✓ 09-director-dashboard.png")


# =============================================================================
# SCREENSHOT 10: ARCHIVIST ARCHIVES
# =============================================================================
def create_archivist_archives():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    # Sidebar with Archivist user
    sb_w = draw_sidebar(img, active_item=2, user_name="Paul Kabongo", user_role="ARCHIVIST", user_initials="PK")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Archives"], user_name="Paul Kabongo", user_role="ARCHIVIST")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title with role indicator
    draw.text((content_x, content_y), "Centre d'Archivage", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw_badge(draw, (content_x + 230, content_y + 6), "ARCHIVISTE", ACCENT_GREEN, WHITE, FONTS['bold_10'], 8, 3, 8)
    draw.text((content_x, content_y + 30), "Gestion et vérification des archives — Paul Kabongo", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Archive stats cards
    card_y = content_y + 56
    card_w = (content_w - 48) // 4
    card_h = 80
    
    arch_stats = [
        ("Total Archivés", "2", ACCENT_PURPLE),
        ("Intégrité OK", "2/2", ACCENT_GREEN),
        ("Taille Totale", "5.0 MB", ACCENT_BLUE),
        ("Dernière Vérif.", "01/03/2026", ACCENT_CYAN),
    ]
    
    for i, (title, value, color) in enumerate(arch_stats):
        cx = content_x + i * (card_w + 16)
        draw_card(img, [cx, card_y, cx + card_w, card_y + card_h])
        draw = ImageDraw.Draw(img)
        
        # Color bar at top
        draw.rectangle([cx, card_y, cx + card_w, card_y + 4], fill=color)
        
        draw.text((cx + 16, card_y + 14), title, fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        draw.text((cx + 16, card_y + 34), value, fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    
    # Archived documents detail
    doc_y = card_y + card_h + 20
    
    archived_docs = [
        {
            "ref": "ISIPA-SI-CERT-2024-006",
            "title": "Attestation de Réussite - Promotion 2023",
            "type": "CERTIFICATE",
            "class": "INTERNE",
            "archived_date": "2024-06-15",
            "hash": "a3f8c2e1b7d94f6e8c2a1d3b5e7f9a2c4d6e8f0a1b3c5d7e9f0a2b4c6d8e0f1",
            "verified": True,
            "size": "1.8 MB"
        },
        {
            "ref": "ISIPA-DG-RAPP-2024-007",
            "title": "Rapport d'Activités Annuel 2023",
            "type": "REPORT",
            "class": "INTERNE",
            "archived_date": "2024-07-01",
            "hash": "7b2e9f4c3a8d1e5f7b3c9a2d4e6f8a0c1b3d5e7f9a1c3b5d7e9f0a2b4c6d8e0f1",
            "verified": True,
            "size": "3.2 MB"
        },
    ]
    
    for doc in archived_docs:
        draw_card(img, [content_x, doc_y, WIDTH - 24, doc_y + 180])
        draw = ImageDraw.Draw(img)
        
        # Archive icon
        icon_x = content_x + 20
        icon_cy = doc_y + 24
        draw.rectangle([icon_x, icon_cy - 12, icon_x + 24, icon_cy + 12], fill=ACCENT_PURPLE)
        draw.line([icon_x, icon_cy, icon_x + 24, icon_cy], fill=WHITE, width=2)
        draw.rectangle([icon_x + 6, icon_cy - 4, icon_x + 18, icon_cy + 4], fill=WHITE)
        
        # Title area
        draw.text((content_x + 56, doc_y + 12), doc["ref"], fill=ACCENT_BLUE, font=FONTS['bold_14'])
        draw.text((content_x + 56, doc_y + 32), doc["title"], fill=TEXT_PRIMARY, font=FONTS['regular_16'])
        draw_badge(draw, (content_x + 56, doc_y + 56), "ARCHIVÉ", ACCENT_PURPLE, WHITE, FONTS['bold_10'], 8, 3, 8)
        draw_badge(draw, (content_x + 130, doc_y + 56), doc["type"], TEXT_SECONDARY, WHITE, FONTS['bold_10'], 8, 3, 8)
        draw_badge(draw, (content_x + 260, doc_y + 56), doc["class"], ACCENT_BLUE, WHITE, FONTS['bold_10'], 8, 3, 8)
        
        # Archive info
        draw.text((content_x + 56, doc_y + 84), f"Date d'archivage: {doc['archived_date']}  •  Taille: {doc['size']}  •  Archiviste: Paul Kabongo", fill=TEXT_SECONDARY, font=FONTS['regular_12'])
        
        # SHA-256 hash
        draw.text((content_x + 56, doc_y + 108), "SHA-256:", fill=TEXT_MUTED, font=FONTS['bold_11'])
        hash_bg_x = content_x + 120
        draw_rounded_rect(draw, [hash_bg_x, doc_y + 104, WIDTH - 200, doc_y + 126], 4, fill=(248, 250, 252), outline=BORDER_COLOR)
        draw.text((hash_bg_x + 8, doc_y + 108), f"sha256:{doc['hash']}", fill=TEXT_SECONDARY, font=FONTS['mono_11'])
        
        # Verified badge
        draw_rounded_rect(draw, [WIDTH - 190, doc_y + 104, WIDTH - 100, doc_y + 126], 4, fill=ACCENT_GREEN)
        draw.text((WIDTH - 182, doc_y + 108), "✓ Vérifié", fill=WHITE, font=FONTS['bold_11'])
        
        # Action buttons
        draw_rounded_rect(draw, [WIDTH - 90, doc_y + 104, WIDTH - 36, doc_y + 126], 4, outline=ACCENT_BLUE)
        draw.text((WIDTH - 84, doc_y + 108), "Détails", fill=ACCENT_BLUE, font=FONTS['bold_11'])
        
        # Integrity info
        draw.text((content_x + 56, doc_y + 140), "Chaîne de blocs: valide  •  Empreinte numérique: confirmée  •  Certificat d'horodatage: valide", fill=ACCENT_GREEN, font=FONTS['regular_11'])
        
        # Progress bar (verification)
        draw_rounded_rect(draw, [content_x + 56, doc_y + 160, WIDTH - 100, doc_y + 168], 3, fill=BORDER_COLOR)
        draw_rounded_rect(draw, [content_x + 56, doc_y + 160, content_x + 56 + int((WIDTH - 100 - content_x - 56)), doc_y + 168], 3, fill=ACCENT_GREEN)
        
        doc_y += 196
    
    # Verification button
    draw_rounded_rect(draw, [content_x, doc_y + 8, content_x + 240, doc_y + 44], 6, fill=ACCENT_BLUE)
    draw.text((content_x + 20, doc_y + 14), "Vérifier toute l'intégrité", fill=WHITE, font=FONTS['bold_14'])
    
    img.save(os.path.join(OUTPUT_DIR, "10-archivist-archives.png"))
    print("  ✓ 10-archivist-archives.png")


# =============================================================================
# SCREENSHOT 11: SECRETARY DASHBOARD
# =============================================================================
def create_secretary_dashboard():
    img = Image.new('RGB', (WIDTH, HEIGHT), CONTENT_BG)
    draw = ImageDraw.Draw(img)
    
    # Sidebar with Secretary user - no admin menu
    sb_w = draw_sidebar(img, active_item=0, user_name="Marie Ngoie", user_role="SECRETARY", user_initials="MN")
    tb_h = draw_topbar(img, sb_w, breadcrumbs=["GED-ISIPA", "Tableau de Bord"], user_name="Marie Ngoie", user_role="SECRETARY")
    
    content_x = sb_w + 24
    content_y = tb_h + 16
    content_w = WIDTH - sb_w - 48
    
    # Title with role indicator
    draw.text((content_x, content_y), "Tableau de Bord", fill=TEXT_PRIMARY, font=FONTS['bold_24'])
    draw_badge(draw, (content_x + 220, content_y + 6), "SECRÉTAIRE", ACCENT_BLUE, WHITE, FONTS['bold_10'], 8, 3, 8)
    draw.text((content_x, content_y + 30), "Espace de travail — Marie Ngoie", fill=TEXT_SECONDARY, font=FONTS['regular_13'])
    
    # Quick action buttons
    qa_y = content_y + 54
    actions = [
        ("+ Nouveau Document", ACCENT_BLUE),
        ("Mes Documents", TEXT_SECONDARY),
    ]
    ax = content_x
    for label, color in actions:
        if color == ACCENT_BLUE:
            draw_rounded_rect(draw, [ax, qa_y, ax + 180, qa_y + 36], 6, fill=color)
            draw.text((ax + 12, qa_y + 8), label, fill=WHITE, font=FONTS['bold_12'])
        else:
            draw_rounded_rect(draw, [ax, qa_y, ax + 150, qa_y + 36], 6, outline=BORDER_COLOR)
            draw.text((ax + 12, qa_y + 8), label, fill=color, font=FONTS['regular_12'])
        ax += 190
    
    # Stat cards
    card_y = qa_y + 52
    card_w = (content_w - 32) // 3
    card_h = 80
    
    sec_stats = [
        ("Mes Documents", "5", "Créés par vous", ACCENT_BLUE, "doc"),
        ("En Attente", "2", "En cours de validation", ACCENT_AMBER, "audit"),
        ("Publiés", "2", "Documents publiés", ACCENT_GREEN, "archive"),
    ]
    
    for i, (title, value, sub, color, icon) in enumerate(sec_stats):
        cx = content_x + i * (card_w + 16)
        draw_stat_card(img, [cx, card_y, cx + card_w, card_y + card_h], title, value, sub, color, icon)
    
    # My documents section
    my_docs_y = card_y + card_h + 20
    draw_card(img, [content_x, my_docs_y, WIDTH - 24, my_docs_y + 240])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, my_docs_y + 14), "Mes Documents Récents", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    my_docs = [
        ("ISIPA-ADM-FIN-2024-009", "Budget Prévisionnel 2025", "FINANCIAL", "PENDING_REVIEW", "2026-06-01"),
        ("ISIPA-ADM-MEMO-2024-004", "Note de Service - Calendrier Examens", "MEMO", "PUBLISHED", "2026-05-30"),
        ("ISIPA-ADM-FIN-2024-002", "Rapport Financier T1 2024", "FINANCIAL", "APPROVED", "2026-05-15"),
        ("ISIPA-ADM-FIN-2024-012", "Factures Fournisseurs Q2 2024", "FINANCIAL", "REJECTED", "2026-05-26"),
        ("ISIPA-SI-PROG-2024-001", "Programme Académique 2024-2025", "ACADEMIC_RECORD", "PUBLISHED", "2026-01-15"),
    ]
    
    status_labels = {
        'DRAFT': 'Brouillon',
        'PENDING_REVIEW': 'En Revue',
        'APPROVED': 'Approuvé',
        'PUBLISHED': 'Publié',
        'ARCHIVED': 'Archivé',
        'REJECTED': 'Rejeté',
    }
    
    md_y = my_docs_y + 40
    for ref, title, dtype, status, date in my_docs:
        draw.line([content_x + 20, md_y, WIDTH - 40, md_y], fill=BORDER_COLOR, width=1)
        
        draw.text((content_x + 20, md_y + 4), ref, fill=ACCENT_BLUE, font=FONTS['bold_12'])
        draw.text((content_x + 240, md_y + 4), title, fill=TEXT_PRIMARY, font=FONTS['regular_12'])
        
        sc, _ = STATUS_COLORS[status]
        draw_badge(draw, (content_x + 540, md_y + 4), status_labels[status], sc, WHITE, FONTS['bold_10'], 8, 3, 8)
        
        draw.text((content_x + 660, md_y + 4), date, fill=TEXT_MUTED, font=FONTS['regular_11'])
        
        # Quick action
        draw.text((WIDTH - 120, md_y + 4), "Voir détails →", fill=ACCENT_BLUE, font=FONTS['regular_11'])
        
        md_y += 36
    
    # Quick create form at bottom
    create_y = my_docs_y + 256
    draw_card(img, [content_x, create_y, WIDTH - 24, create_y + 180])
    draw = ImageDraw.Draw(img)
    
    draw.text((content_x + 20, create_y + 14), "Créer un Nouveau Document", fill=TEXT_PRIMARY, font=FONTS['bold_14'])
    
    # Form fields
    field_y = create_y + 44
    
    # Title field
    draw.text((content_x + 20, field_y - 16), "Titre du document", fill=TEXT_SECONDARY, font=FONTS['bold_11'])
    draw_rounded_rect(draw, [content_x + 20, field_y, content_x + content_w // 2 - 10, field_y + 32], 6, fill=INPUT_BG, outline=INPUT_BORDER)
    draw.text((content_x + 28, field_y + 8), "Entrez le titre...", fill=TEXT_MUTED, font=FONTS['regular_12'])
    
    # Type field
    draw.text((content_x + content_w // 2 + 10, field_y - 16), "Type", fill=TEXT_SECONDARY, font=FONTS['bold_11'])
    draw_rounded_rect(draw, [content_x + content_w // 2 + 10, field_y, WIDTH - 40, field_y + 32], 6, fill=INPUT_BG, outline=INPUT_BORDER)
    draw.text((content_x + content_w // 2 + 18, field_y + 8), "Sélectionner le type  ▼", fill=TEXT_MUTED, font=FONTS['regular_12'])
    
    # Department field
    field_y2 = field_y + 52
    draw.text((content_x + 20, field_y2 - 16), "Département", fill=TEXT_SECONDARY, font=FONTS['bold_11'])
    draw_rounded_rect(draw, [content_x + 20, field_y2, content_x + content_w // 3 - 10, field_y2 + 32], 6, fill=INPUT_BG, outline=INPUT_BORDER)
    draw.text((content_x + 28, field_y2 + 8), "Sélectionner  ▼", fill=TEXT_MUTED, font=FONTS['regular_12'])
    
    # Classification field
    draw.text((content_x + content_w // 3 + 10, field_y2 - 16), "Classification", fill=TEXT_SECONDARY, font=FONTS['bold_11'])
    draw_rounded_rect(draw, [content_x + content_w // 3 + 10, field_y2, content_x + 2 * content_w // 3, field_y2 + 32], 6, fill=INPUT_BG, outline=INPUT_BORDER)
    draw.text((content_x + content_w // 3 + 18, field_y2 + 8), "Sélectionner  ▼", fill=TEXT_MUTED, font=FONTS['regular_12'])
    
    # Submit button
    draw_rounded_rect(draw, [content_x + 2 * content_w // 3 + 20, field_y2, WIDTH - 40, field_y2 + 32], 6, fill=ACCENT_BLUE)
    draw.text((content_x + 2 * content_w // 3 + 70, field_y2 + 8), "Créer le document", fill=WHITE, font=FONTS['bold_12'])
    
    img.save(os.path.join(OUTPUT_DIR, "11-secretary-dashboard.png"))
    print("  ✓ 11-secretary-dashboard.png")


# =============================================================================
# MAIN
# =============================================================================
def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 60)
    print("GED-ISIPA Screenshot Generator")
    print("=" * 60)
    print(f"Output: {OUTPUT_DIR}")
    print(f"Resolution: {WIDTH}x{HEIGHT}")
    print()
    
    print("Generating screenshots...")
    
    create_login_page()
    create_admin_dashboard()
    create_documents_list()
    create_document_detail()
    create_archives()
    create_audit_log()
    create_administration()
    create_health_check_api()
    create_director_dashboard()
    create_archivist_archives()
    create_secretary_dashboard()
    
    print()
    print("=" * 60)
    print(f"All 11 screenshots generated in {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
