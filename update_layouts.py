import os
import glob

layouts = glob.glob('frontend/src/layouts/*Layout.jsx')

nav_str = """            </aside>

            {/* ── Mobile Bottom Navigation ── */}
            <nav className="bottom-nav" role="navigation" aria-label="Mobil alt menü">
                {links.map((link) => (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`bottom-nav-item ${isActive(link.to) ? 'active' : ''}`}
                        aria-current={isActive(link.to) ? 'page' : undefined}
                    >
                        <link.icon size={20} />
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <main"""

for layout in layouts:
    with open(layout, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'className="bottom-nav"' in content:
        continue
        
    s1 = "            </aside>\n\n            <main"
    s2 = "            </aside>\r\n\r\n            <main"
    
    if s1 in content:
        content = content.replace(s1, nav_str)
    elif s2 in content:
        content = content.replace(s2, nav_str)
    else:
        print(f"Target string not found in {layout}")
        continue
        
    with open(layout, 'w', encoding='utf-8', newline='') as f:
        f.write(content)
        
    print(f'Updated {layout}')
