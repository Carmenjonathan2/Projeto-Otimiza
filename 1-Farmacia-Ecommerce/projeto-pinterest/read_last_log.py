
import sys
with open('last_test_log.txt', 'rb') as f:
    content = f.read()
    try:
        print(content.decode('utf-16'))
    except:
        try:
            print(content.decode('utf-8'))
        except:
            print(content)
