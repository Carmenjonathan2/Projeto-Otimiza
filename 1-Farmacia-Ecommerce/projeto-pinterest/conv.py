
with open('last_test_log.txt', 'rb') as f:
    content = f.read()
    text = content.decode('utf-16')
    print(text.encode('utf-8').decode('utf-8'))
