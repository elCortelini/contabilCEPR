import subprocess
import os

dist_dir = os.path.abspath("dist")
print(f"Deploying {dist_dir} to gh-pages branch...")

cmds = [
    ["git", "init"],
    ["git", "checkout", "-B", "gh-pages"],
    ["git", "add", "-A"],
    ["git", "commit", "-m", "deploy: publicar versao atualizada no github pages"],
    ["git", "remote", "add", "origin", "https://github.com/elCortelini/contabilCEPR.git"],
    ["git", "push", "-f", "origin", "gh-pages"]
]

for cmd in cmds:
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=dist_dir, capture_output=True, text=True)
    if res.returncode != 0:
        # If remote origin already exists, set url
        if "remote add" in " ".join(cmd) and "already exists" in res.stderr:
            subprocess.run(["git", "remote", "set-url", "origin", "https://github.com/elCortelini/contabilCEPR.git"], cwd=dist_dir)
            continue
        print(f"Stdout: {res.stdout}")
        print(f"Stderr: {res.stderr}")
        if "push" in cmd:
            raise Exception(f"Failed at: {' '.join(cmd)}")

print("SUCCESS: gh-pages deployed!")
