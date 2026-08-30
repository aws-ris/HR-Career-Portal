import subprocess
import os

key_path = os.path.expanduser(r"~\.ssh\my_ec2_portable_ssh.pem")
cmd = [
    "ssh",
    "-i", key_path,
    "-o", "StrictHostKeyChecking=no",
    "ubuntu@13.205.216.81",
    "sudo -u postgres psql -c 'ALTER SYSTEM SET max_connections = 300;' && sudo systemctl restart postgresql"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("RETURNCODE:", res.returncode)
