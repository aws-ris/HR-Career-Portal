import subprocess
import os

key_path = os.path.expanduser(r"~\.ssh\my_ec2_portable_ssh.pem")
cmd = [
    "ssh",
    "-i", key_path,
    "-o", "StrictHostKeyChecking=no",
    "ubuntu@13.205.216.81",
    "cd /var/www/HR_RIS/backend && source venv/bin/activate && python3 scripts/load_test_1000.py"
]

res = subprocess.run(cmd, capture_output=True, text=False)
stdout_clean = res.stdout.decode('utf-8', errors='ignore').encode('ascii', errors='ignore').decode('ascii')
stderr_clean = res.stderr.decode('utf-8', errors='ignore').encode('ascii', errors='ignore').decode('ascii')

print("STDOUT:\n", stdout_clean)
print("STDERR:\n", stderr_clean)
print("RETURNCODE:", res.returncode)
