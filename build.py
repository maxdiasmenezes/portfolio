from argparse import ArgumentParser
from functools import partial
from html import escape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from shutil import copytree
from string import Template

from content import EXPERIENCE, PROFILE, PROJECTS, SKILLS

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "dist"


def text(value):
    """Escape plain content so it cannot accidentally become HTML."""
    return escape(str(value), quote=True)


def tags(values):
    return "".join(f'<span class="tag">{text(value)}</span>' for value in values)


def project_button(project, label="Explore project"):
    return (f'<button class="text-link project-open" data-project="{text(project["id"])}" '
            f'aria-haspopup="dialog">{text(label)}<span aria-hidden="true">↗</span></button>')


def render_cards():
    # These graphics explain each project's subject; they are not product screenshots.
    graphics = {
        "ai-os": '''<div class="project-visual system-visual" aria-label="Conceptual architecture: WhatsApp, web and voice connected to a local AI system">
          <div class="system-top"><span>WHATSAPP</span><span>WEB</span><span>VOICE</span></div>
          <div class="system-connectors" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="system-core"><span class="core-icon" aria-hidden="true">⌘</span><span>AI–OS<small>LOCAL INTELLIGENCE</small></span></div>
          <span class="visual-caption">SYSTEM ARCHITECTURE / CONCEPT</span></div>''',
        "modo-menezes": '''<div class="project-visual modo-visual" aria-label="Modo Menezes wordmark"><div class="modo-wordmark">modo<span>menezes</span></div><span class="visual-caption">SMALL BUSINESS. NEW POSSIBILITIES.</span></div>''',
        "bayer-platform": '''<div class="project-visual learning-visual" aria-label="Training workflow: learn, practice, progress"><span class="learning-title">Learn.<br>Practice.<br><em>Progress.</em></span><div class="learning-steps" aria-hidden="true"><i></i><i></i><i></i></div><span class="visual-caption">TECHNICAL LEARNING / TEAM PROJECT</span></div>''',
    }
    cards = []
    for project in PROJECTS[1:]:
        cards.append(f'''<article class="project-card reveal">
          {graphics.get(project['id'], '<div class="project-visual generic-visual">' + text(project['short_title']) + '</div>')}
          <div class="card-body"><div class="eyebrow"><span>{text(project['category'])}</span><span>{text(project['number'])}</span></div>
          <h3>{text(project['title'])}</h3><p>{text(project['description'])}</p>
          <div class="tags">{tags(project['tags'])}</div>{project_button(project)}</div></article>''')
    return "\n".join(cards)


def render_dialogs():
    dialogs = []
    for project in PROJECTS:
        paragraphs = "".join(f"<p>{text(item)}</p>" for item in project["details"])
        dialogs.append(f'''<dialog class="project-dialog" id="dialog-{text(project['id'])}" aria-labelledby="title-{text(project['id'])}">
          <div class="dialog-inner"><button class="dialog-close" aria-label="Close project details">✕</button>
          <span class="eyebrow">Project {text(project['number'])} / {text(project['category'])}</span>
          <h2 id="title-{text(project['id'])}">{text(project['short_title'])}</h2>
          <div class="dialog-meta"><span>{text(project['role'])}</span><span>{text(project['date'])}</span></div>
          <div class="tags">{tags(project['tags'])}</div>{paragraphs}<p class="project-note">{text(project['note'])}</p>
          <a class="button button-lime" href="mailto:{text(PROFILE['email'])}">Ask me about this project <span aria-hidden="true">↗</span></a></div></dialog>''')
    return "\n".join(dialogs)


def render_experience():
    return "\n".join(f'''<article class="experience-row reveal"><div class="experience-date">{text(item['date'])}<span>{text(item['type'])}</span></div>
      <div class="experience-main"><h3>{text(item['organization'])}</h3><h4>{text(item['role'])}</h4><p>{text(item['description'])}</p></div><span class="timeline-node" aria-hidden="true"></span></article>'''
      for item in EXPERIENCE)


def render_skills():
    return "\n".join(f'<div class="skill-group"><h3>{text(category)}</h3><div class="tags">{tags(values)}</div></div>' for category, values in SKILLS.items())


def build():
    """Render the HTML and copy browser assets. No third-party packages required."""
    OUTPUT.mkdir(exist_ok=True)
    profile_values = {key: text(value) for key, value in PROFILE.items()}
    featured = PROJECTS[0]
    template_values = {
        **profile_values,
        "brand_name": "<br>".join(text(part.upper()) for part in PROFILE["name"].split(" ", 1)),
        "base_poses": text(featured["base_poses"]),
        "scenarios": text(featured["scenarios"]),
        "feature_title": "<br>".join(text(line) for line in featured["title"].splitlines()),
        "feature_description": text(featured["description"]),
        "feature_tags": tags(featured["tags"]),
        "feature_button": project_button(featured, "Inside the research"),
        "project_cards": render_cards(),
        "project_dialogs": render_dialogs(),
        "experience_rows": render_experience(),
        "skill_groups": render_skills(),
    }
    html = Template((ROOT / "templates/index.html").read_text(encoding="utf-8")).substitute(template_values)
    (OUTPUT / "index.html").write_text(html, encoding="utf-8")
    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")
    copytree(ROOT / "assets", OUTPUT / "assets", dirs_exist_ok=True)
    print(f"Built your portfolio: {OUTPUT / 'index.html'}")


def main():
    parser = ArgumentParser(description="Build Max's Python-powered portfolio.")
    parser.add_argument("--serve", action="store_true", help="Preview the site locally after building")
    parser.add_argument("--port", type=int, default=8000, help="Preview port (default: 8000)")
    arguments = parser.parse_args()
    build()
    if arguments.serve:
        handler = partial(SimpleHTTPRequestHandler, directory=str(OUTPUT))
        # Bind only to your own computer; this is a development preview.
        with ThreadingHTTPServer(("127.0.0.1", arguments.port), handler) as server:
            print(f"Open http://localhost:{arguments.port} — press Ctrl+C to stop.")
            print("After editing, stop and rerun this command to rebuild.")
            try:
                server.serve_forever()
            except KeyboardInterrupt:
                print("\nPreview stopped.")


if __name__ == "__main__":
    main()
