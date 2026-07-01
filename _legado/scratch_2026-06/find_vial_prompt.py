import json

log_path = r"C:\Users\jonat\.gemini\antigravity\brain\31c3a2fe-45ea-471b-bd34-d2cc41278a7c\.system_generated\logs\transcript.jsonl"

print("Searching transcript.jsonl for vaccine_vial_icon prompts...")
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Check if this step is a MODEL response containing generate_image tool calls
            if data.get("source") == "MODEL" and "tool_calls" in data:
                for tc in data["tool_calls"]:
                    if tc.get("name") == "generate_image" and "vaccine" in tc.get("args", {}).get("ImageName", ""):
                        print("Found tool call:")
                        print(json.dumps(tc, indent=4))
        except Exception as e:
            pass
