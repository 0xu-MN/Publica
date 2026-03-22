import requests

with open('test_paper.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8001/api/parse-pdf', files=files)
    print("Status:", response.status_code)
    try:
        print(response.json())
    except Exception as e:
        print(response.text)
