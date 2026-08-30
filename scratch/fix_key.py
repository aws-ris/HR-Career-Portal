import os

key_path = os.path.expanduser(r"~\.ssh\my_ec2_portable_ssh.pem")
with open(key_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

clean_lines = []
for line in lines:
    stripped = line.strip()
    if stripped:
        clean_lines.append(stripped)

clean_content = "\n".join(clean_lines) + "\n"

with open(key_path, "wb") as f:
    f.write(clean_content.encode("utf-8"))

print(f"Key cleaned successfully! Total lines: {len(clean_lines)}")
