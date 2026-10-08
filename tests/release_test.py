import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("release", Path(__file__).resolve().parents[1] / "scripts/release.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseTest(unittest.TestCase):
    def test_version_selection(self):
        for current, tags, expected in [
            ("1.1.0", [], "1.1.0"),
            ("1.1.0", ["v1.1.0"], "1.1.1"),
            ("1.1.0", ["v1.1.9", "v1.1.10", "unrelated"], "1.1.11"),
            ("1.2.0", ["v1.1.10"], "1.2.0"),
        ]:
            self.assertEqual(release.next_version(current, tags), expected)
        for invalid in ["1.1", "01.1.0", "1.1.0-beta", "65536.0.0", "0.0.0"]:
            with self.assertRaises(ValueError):
                release.next_version(invalid, [])

    def test_tagged_source_versions_and_retry(self):
        previous = Path.cwd()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            try:
                os.chdir(root)
                subprocess.run(["git", "init", "-b", "main"], check=True, capture_output=True)
                release.git("config", "user.name", "Test")
                release.git("config", "user.email", "test@example.com")
                release.git("config", "commit.gpgSign", "false")
                release.git("config", "tag.gpgSign", "false")
                (root / "github-pr-slack").mkdir()
                for name in ["package.json", "github-pr-slack/manifest.json"]:
                    (root / name).write_text(json.dumps({"version": "1.1.0"}))
                release.git("add", ".")
                release.git("commit", "-m", "Initial extension")
                source = release.git("rev-parse", "HEAD")
                release.git("tag", "v1.1.0")
                release.git("checkout", "--detach", source)
                self.assertEqual(release.prepare_release(root, "123", source), "1.1.1")
                self.assertEqual(json.loads((root / "github-pr-slack/manifest.json").read_text())["version"], "1.1.1")
                self.assertEqual(release.git("rev-parse", "HEAD^"), source)
                tagged = release.git("rev-parse", "HEAD")
                release.git("checkout", "--detach", source)
                self.assertEqual(release.prepare_release(root, "123", source), "1.1.1")
                self.assertEqual(release.git("rev-parse", "HEAD"), tagged)
                self.assertEqual(release.git("rev-parse", "main"), source)
                release.git("checkout", "--detach", source)
                self.assertEqual(release.prepare_release(root, "124", source), "1.1.2")
            finally:
                os.chdir(previous)


if __name__ == "__main__":
    unittest.main()
