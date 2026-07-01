import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

log_path = r'C:\Users\jonat\.gemini\antigravity\brain\4be72eee-f40d-468b-a85f-b581afc2d161\.system_generated\logs\transcript.jsonl'

model_responses = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'MODEL':
                model_responses.append(data)
        except Exception as e:
            pass

if model_responses:
    last_response = model_responses[-1]
    print(f"=== STEP INDEX: {last_response.get('step_index')} ===")
    print(last_response.get('content'))
else:
    print("No model response found.")
