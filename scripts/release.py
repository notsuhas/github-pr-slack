import json
import os
import re
import subprocess
from pathlib import Path


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def parse_version(value):
    if not re.fullmatch(r"(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)", value):
        raise ValueError(f"Invalid version: {value}")
    version = tuple(map(int, value.split(".")))
    if max(version) > 65535 or version == (0, 0, 0):
        raise ValueError(f"Invalid Chrome extension version: {value}")
    return version


def next_version(current, tags):
    declared = parse_version(current)
    released = [parse_version(tag[1:]) for tag in tags if re.fullmatch(r"v\d+\.\d+\.\d+", tag)]
    latest = max(released, default=(0, 0, 0))
    candidate = declared if declared > latest else (*latest[:2], latest[2] + 1)
    result = ".".join(map(str, candidate))
    parse_version(result)
    return result


def prepare_release(root, run_id, source_sha):
    tags = git("tag", "--list", "v*").splitlines()
    for tag in tags:
        message = git("show", "-s", "--format=%B", f"{tag}^{{commit}}")
        if f"Release-Run: {run_id}" in message.splitlines():
            if f"Source-Commit: {source_sha}" not in message.splitlines():
                raise ValueError("Release run points to a different source commit")
            git("checkout", "--detach", tag)
            return tag[1:]

    manifest_path = root / "github-pr-slack/manifest.json"
    manifest = json.loads(manifest_path.read_text())
    version = next_version(manifest["version"], tags)
    for path in (manifest_path, root / "package.json"):
        data = json.loads(path.read_text())
        data["version"] = version
        path.write_text(json.dumps(data, indent=2) + "\n")

    git("add", "github-pr-slack/manifest.json", "package.json")
    git("commit", "--allow-empty", "-m", f"Release v{version}\n\nSource-Commit: {source_sha}\nRelease-Run: {run_id}")
    git("tag", "-a", f"v{version}", "-m", f"Release v{version}")
    return version


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    os.chdir(root)
    version = prepare_release(root, os.environ["RELEASE_RUN_ID"], os.environ["RELEASE_SOURCE_SHA"])
    with open(os.environ["GITHUB_OUTPUT"], "a") as output:
        output.write(f"version={version}\n")
    print(f"Prepared v{version}")
