import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
extension = root / "github-pr-slack"
version = json.loads((extension / "manifest.json").read_text())["version"]
output = root / "dist" / f"github-pr-slack-v{version}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for file in sorted(extension.rglob("*")):
        if file.is_file() and file.name != ".DS_Store":
            archive.write(file, file.relative_to(root))
    archive.write(root / "LICENSE", "github-pr-slack/LICENSE")
print(output)
