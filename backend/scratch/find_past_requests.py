import os

path = r"C:\Users\Viraal\.gemini\antigravity-ide\brain\b52771bd-afd4-41e0-baec-88c88ae23617\past_chat_transcript.md"

if not os.path.exists(path):
    print("File not found:", path)
    exit(1)

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

turns = content.split("---")
print(f"Total turns: {len(turns)}")

for i in range(308, len(turns)):
    turn = turns[i]
    if "### **User**" in turn or "<USER_REQUEST>" in turn:
        print(f"\n--- TURN {i} ---")
        lines = turn.strip().split("\n")
        for line in lines[:25]:
            print(line)
        if len(lines) > 25:
            print("...")
