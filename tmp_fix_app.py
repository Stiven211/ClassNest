from pathlib import Path
path = Path('src/App.tsx')
text = path.read_text(encoding='utf-8')
start = text.find('          {isFirstTime && showWelcomeCard && (')
end = text.find('  const navTo = (page: string) => setCurrentPage(page as Page);')
if start == -1 or end == -1:
    raise SystemExit('Markers not found')
new_text = text[:start] + text[end:]
path.write_text(new_text, encoding='utf-8')
print('Removed stray JSX block')
