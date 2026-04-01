import subprocess, sys

cmds = [
    ['git', 'commit', '-am', 'fix: ignore no-speech error in AgentChat'],
    ['git', 'push', 'origin', 'main'],
    ['git', 'fetch', 'origin', 'deploy/simulated-dashboard'],
    ['git', 'checkout', '-B', 'deploy/simulated-dashboard', 'origin/deploy/simulated-dashboard'],
    ['git', 'merge', 'main', '--no-edit'],
    ['git', 'push', 'origin', 'deploy/simulated-dashboard'],
    ['git', 'checkout', 'main']
]

for cmd in cmds:
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"Command failed with {res.returncode}")
        if cmd[1] == 'merge':
            subprocess.run(['git', 'merge', '--abort'])
            subprocess.run(['git', 'checkout', 'main'])
        sys.exit(res.returncode)
