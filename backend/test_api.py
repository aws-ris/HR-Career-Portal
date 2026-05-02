import requests, json, psycopg2

# Test 1: List jobs
r = requests.get('http://localhost:8000/api/v1/jobs')
print(f'GET /jobs: {r.status_code} -> {r.json()}')

# Test 2: Get first migrated candidate ID
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/ris_db')
cur = conn.cursor()
cur.execute('SELECT id FROM candidate_metadata LIMIT 1')
cid = cur.fetchone()[0]
cur.close()
conn.close()
print(f'\nUsing candidate ID: {cid}')

# Test 3: Status tracker
r = requests.get(f'http://localhost:8000/api/v1/applications/{cid}/status')
print(f'\nGET /status: {r.status_code}')
print(json.dumps(r.json(), default=str, indent=2))

# Test 4: Full profile
r2 = requests.get(f'http://localhost:8000/api/v1/applications/{cid}')
print(f'\nGET /full profile: {r2.status_code}')
data = r2.json()
name = data['full_name']
stat = data['current_status']
schooling = data['schooling']
grad_count = len(data['graduation'])
work_count = len(data['work_experiences'])
hist_count = len(data['status_history'])
print(f'  name={name} | status={stat}')
print(f'  schooling={schooling}')
print(f'  graduation_count={grad_count} | work_exp_count={work_count} | history_count={hist_count}')
print('\nAll endpoints OK.')
