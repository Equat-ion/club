from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

class ColorBox(Flowable):
    def __init__(self, color_hex, label):
        Flowable.__init__(self)
        self.color = colors.HexColor(color_hex)
        self.label = label
        self.width = 1.5 * inch
        self.height = 0.5 * inch

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)
        self.canv.setFillColor(colors.black if self.is_light(self.color) else colors.white)
        self.canv.drawCentredString(self.width/2, self.height/2 - 4, self.label)

    def is_light(self, color):
        # Rough brightness check
        r, g, b = color.red, color.green, color.blue
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 0.5

def create_branding_kit():
    doc = SimpleDocTemplate("branding/BRANDING_KIT.pdf", pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'ClubTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=colors.HexColor('#059669'),
        spaceAfter=24
    )
    
    header_style = ParagraphStyle(
        'ClubHeader',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#064e3b'),
        spaceBefore=12,
        spaceAfter=12
    )

    story = []

    # Page 1: Brand Overview
    story.append(Paragraph("Club: Branding Kit", title_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("1. Brand Identity", header_style))
    story.append(Paragraph("<b>App Name:</b> Club", styles['Normal']))
    story.append(Paragraph("<b>Persona:</b> Energetic Startup (Playful, vibrant, energetic, friendly)", styles['Normal']))
    story.append(Paragraph("<b>Target Audience:</b> Club Volunteers and Leaders", styles['Normal']))
    story.append(Paragraph("<b>Visual Direction:</b> Eco / Natural with high-energy accents.", styles['Normal']))
    story.append(Spacer(1, 24))

    # Page 1: Color Palette
    story.append(Paragraph("2. Color Palette", header_style))
    
    color_data = [
        [ColorBox('#059669', 'Primary'), ColorBox('#34d399', 'Primary Light')],
        [ColorBox('#d97706', 'Secondary'), ColorBox('#84cc16', 'Accent (Lime)')],
        [ColorBox('#064e3b', 'Forest Dark'), ColorBox('#78350f', 'Earth Brown')],
    ]
    
    t = Table(color_data, colWidths=[2*inch, 2*inch])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t)
    story.append(Spacer(1, 24))

    # Page 2: Typography & Guidelines
    story.append(PageBreak())
    story.append(Paragraph("3. Typography", header_style))
    
    story.append(Paragraph("Headings: Hanken Grotesk (Helvetica Bold used for PDF)", styles['Heading2']))
    story.append(Paragraph("The quick brown fox jumps over the lazy dog.", styles['Heading2']))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("Body Text: Inter / Sans-Serif (Helvetica used for PDF)", styles['Normal']))
    story.append(Paragraph("Volunteers are the heart of our club. We empower them with tools that are as energetic and natural as the communities they serve.", styles['Normal']))
    story.append(Spacer(1, 24))

    story.append(Paragraph("4. Visual Guidelines", header_style))
    guidelines = [
        "• Corner Radius: 12px for a friendly, approachable feel.",
        "• Shadows: Soft, natural shadows to create depth without harshness.",
        "• Gradients: Use subtle natural transitions from Forest Green to Emerald.",
        "• Tone: Energetic, encouraging, and clear."
    ]
    for g in guidelines:
        story.append(Paragraph(g, styles['Normal']))

    doc.build(story)
    print("Branding Kit PDF generated successfully.")

if __name__ == "__main__":
    create_branding_kit()
