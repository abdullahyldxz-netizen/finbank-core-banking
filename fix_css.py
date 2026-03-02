import os

file = 'frontend/src/index.css'
with open(file, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Remove glowing orbs — replace with very subtle background
old_orbs = """/* ── Ambient Glowing Orbs Background ── */
body::before,
body::after {
  content: "";
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  z-index: -1;
  opacity: 0.4;
  pointer-events: none;
}

body::before {
  top: -10%;
  left: -10%;
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  animation: floatOrb 20s infinite ease-in-out alternate;
}

body::after {
  bottom: -10%;
  right: -10%;
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #a855f7 0%, transparent 70%);
  animation: floatOrb 15s infinite ease-in-out alternate-reverse;
}

@keyframes floatOrb {
  0% {
    transform: translate(0, 0) scale(1);
  }

  100% {
    transform: translate(5%, 10%) scale(1.1);
  }
}"""

new_orbs = """/* ── Subtle Background Texture ── */
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at 20% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 100%, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
  z-index: -1;
  pointer-events: none;
}"""

css = css.replace(old_orbs, new_orbs)

# 2. Remove glass-panel class excess
old_glass = """/* ── Premium Glass Morphism ── */
.glass-panel {
  background: rgba(26, 26, 62, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}"""

new_glass = """/* ── Utility: Elevated Panel ── */
.glass-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}"""

css = css.replace(old_glass, new_glass)

# 3. Clean up .card — remove heavy backdrop-filter and bouncy animation
old_card = """.card {
  background: rgba(26, 26, 62, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

.card:hover {
  border-color: var(--border-active);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}"""

new_card = """.card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  border-color: var(--border-active);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}"""

css = css.replace(old_card, new_card)

# 4. Clean up .stat-card
old_stat = """.stat-card {
  background: rgba(26, 26, 62, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
  border-color: var(--border-active);
}"""

new_stat = """.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color 0.2s ease;
}

.stat-card:hover {
  border-color: var(--border-active);
}"""

css = css.replace(old_stat, new_stat)

# 5. Clean up .auth-card
old_auth = """.auth-card {
  background: rgba(26, 26, 62, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-lg), 0 0 40px rgba(99, 102, 241, 0.1);
}"""

new_auth = """.auth-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}"""

css = css.replace(old_auth, new_auth)

# 6. Clean up .account-card
old_acc = """.account-card {
  background: rgba(26, 26, 62, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  transition: var(--transition);
}"""

new_acc = """.account-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 20px;
  transition: border-color 0.2s ease;
}

.account-card:hover {
  border-color: var(--border-active);
}"""

css = css.replace(old_acc, new_acc)

# 7. Clean up navbar
old_nav = """.navbar {
  background: rgba(18, 18, 42, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}"""

new_nav = """.navbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}"""

css = css.replace(old_nav, new_nav)

# 8. Make body background a cleaner gradient (not pure black)
css = css.replace("background: var(--bg-primary);", "background: linear-gradient(180deg, var(--bg-primary) 0%, #0d0d24 100%);")

with open(file, 'w', encoding='utf-8', newline='') as f:
    f.write(css)
    
print("CSS overhaul complete! Removed AI-like effects, applied clean banking aesthetic.")
