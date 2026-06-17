import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

log_path = r'C:\Users\jonat\.gemini\antigravity\brain\4be72eee-f40d-468b-a85f-b581afc2d161\.system_generated\logs\transcript.jsonl'

lines = []
with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        lines.append((idx, line))

# We want to see model messages between index 936 and 990
for idx, line in lines[936:990]:
    try:
        data = json.loads(line)
        if data.get('source') == 'MODEL' and data.get('type') == 'PLANNER_RESPONSE':
            print(f"Step {idx}:")
            print(data.get('content')[:1000])
            print("-" * 50)
    except Exception as e:
        print(f"Error parsing line {idx}: {e}")
