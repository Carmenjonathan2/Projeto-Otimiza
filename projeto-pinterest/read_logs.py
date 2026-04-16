
import sys
with open('test_logs.txt', 'rb') as f:
    content = f.read()
    try:
        # Try UTF-8 first
        print(content.decode('utf-8'))
    except:
        # Fallback to UTF-16 (common for powershell redirects)
        try:
            print(content.decode('utf-16'))
        except:
            print(content)
