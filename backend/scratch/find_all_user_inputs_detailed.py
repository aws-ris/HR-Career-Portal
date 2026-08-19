import json
import os

path = r"C:\Users\Viraal\.gemini\antigravity-ide\brain\b52771bd-afd4-41e0-baec-88c88ae23617\.system_generated\logs\transcript.jsonl"

if not os.path.exists(path):
    print("File not found:", path)
    exit(1)

user_messages = []
with open(path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get("source") == "USER_EXPLICIT" and obj.get("type") == "USER_INPUT":
                user_messages.append(obj)
        except Exception as e:
            pass

print(f"Found {len(user_messages)} user inputs.")
# Print the first 18 user messages
for idx in range(min(18, len(user_messages))):
    msg = user_messages[idx]
    print("="*60)
    print(f"INPUT {idx+1} (Step {msg.get('step_index')}) - {msg.get('created_at')}")
    print(msg.get("content"))
