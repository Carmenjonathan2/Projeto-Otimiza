import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

log_path = r'C:\Users\jonat\.gemini\antigravity\brain\4be72eee-f40d-468b-a85f-b581afc2d161\.system_generated\logs\transcript.jsonl'

lines = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        lines.append(line)

print(f"Total lines: {len(lines)}")
start_idx = max(0, len(lines) - 40)
end_idx = max(0, len(lines) - 10)

for idx in range(start_idx, end_idx):
    try:
        data = json.loads(lines[idx])
        print(f"Line {idx}: Source: {data.get('source')}, Type: {data.get('type')}, Status: {data.get('status')}")
        content = data.get('content', '')
        print(f"  Content start: {content[:200]}")
    except Exception as e:
        print(f"Error parsing line {idx}: {e}")
