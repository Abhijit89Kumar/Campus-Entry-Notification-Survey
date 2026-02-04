"""
Backend API Test Suite
"""
import requests
import json

BASE = 'http://localhost:8000/api'

def test_endpoint(name, url, expected_keys=None):
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if expected_keys:
                missing = [k for k in expected_keys if k not in data]
                if missing:
                    print(f'[WARN] {name}: Missing keys: {missing}')
                    return data
                else:
                    print(f'[PASS] {name}: All {len(expected_keys)} expected keys present')
            else:
                print(f'[PASS] {name}: Status 200')
            return data
        else:
            print(f'[FAIL] {name}: Status {r.status_code}')
            return None
    except Exception as e:
        print(f'[FAIL] {name}: {e}')
        return None

def main():
    print('=' * 50)
    print('BACKEND API TESTS')
    print('=' * 50)
    
    issues = []
    
    # Test 1: Overview
    print('\n[1] Testing Overview endpoint...')
    overview = test_endpoint('Overview', f'{BASE}/analytics/overview', 
        ['total_responses', 'valid_responses', 'q1_support_count', 'q1_support_percent', 'q2_support_count', 'q2_support_percent'])
    if overview:
        print(f'    - Total responses: {overview.get("total_responses")}')
        print(f'    - Valid responses: {overview.get("valid_responses")}')
        print(f'    - Q1 Support: {overview.get("q1_support_percent")}%')
        print(f'    - Q2 Support: {overview.get("q2_support_percent")}%')
        
        # Validate values
        if overview.get("q1_support_percent") is None:
            issues.append("Overview: q1_support_percent is None")
        if overview.get("q2_support_percent") is None:
            issues.append("Overview: q2_support_percent is None")
    else:
        issues.append("Overview endpoint failed")

    # Test 2: Demographics by course
    print('\n[2] Testing Demographics (course) endpoint...')
    demo_course = test_endpoint('Demographics (course)', f'{BASE}/analytics/demographics?group_by=course')
    if demo_course and isinstance(demo_course, list):
        print(f'    - Categories: {len(demo_course)}')
        for d in demo_course[:3]:
            print(f'      * {d.get("category")}: {d.get("total")} responses')
        if len(demo_course) == 0:
            issues.append("Demographics (course): Empty list")
    else:
        issues.append("Demographics (course) endpoint failed")

    # Test 3: Demographics by year
    print('\n[3] Testing Demographics (year) endpoint...')
    demo_year = test_endpoint('Demographics (year)', f'{BASE}/analytics/demographics?group_by=year')
    if demo_year and isinstance(demo_year, list):
        print(f'    - Categories: {len(demo_year)}')
        for d in demo_year[:3]:
            print(f'      * {d.get("category")}: {d.get("total")} responses')
        if len(demo_year) == 0:
            issues.append("Demographics (year): Empty list")
    else:
        issues.append("Demographics (year) endpoint failed")

    # Test 4: Concerns
    print('\n[4] Testing Concerns endpoint...')
    concerns = test_endpoint('Concerns', f'{BASE}/analytics/concerns')
    if concerns and isinstance(concerns, list):
        print(f'    - Concern types: {len(concerns)}')
        for c in concerns[:3]:
            print(f'      * {c.get("concern_name")}: {c.get("count")} ({c.get("percentage")}%)')
        if len(concerns) == 0:
            issues.append("Concerns: Empty list")
    else:
        issues.append("Concerns endpoint failed")

    # Test 5: Quality
    print('\n[5] Testing Quality endpoint...')
    quality = test_endpoint('Quality', f'{BASE}/analytics/quality',
        ['excellent', 'good', 'acceptable', 'poor', 'flagged_breakdown'])
    if quality:
        print(f'    - Excellent: {quality.get("excellent")}')
        print(f'    - Good: {quality.get("good")}')
        print(f'    - Acceptable: {quality.get("acceptable")}')
        print(f'    - Poor: {quality.get("poor")}')
        print(f'    - Flagged breakdown: {quality.get("flagged_breakdown")}')
    else:
        issues.append("Quality endpoint failed")

    # Test 6: Arguments Q1
    print('\n[6] Testing Arguments (Q1) endpoint...')
    args_q1 = test_endpoint('Arguments Q1', f'{BASE}/analytics/arguments?question=q1')
    if args_q1:
        for_args = args_q1.get("for", [])
        against_args = args_q1.get("against", [])
        print(f'    - Arguments FOR: {len(for_args)}')
        print(f'    - Arguments AGAINST: {len(against_args)}')
        if against_args:
            print(f'      Top against: {against_args[0].get("claim")}')
    else:
        issues.append("Arguments Q1 endpoint failed")

    # Test 7: Arguments Q2
    print('\n[7] Testing Arguments (Q2) endpoint...')
    args_q2 = test_endpoint('Arguments Q2', f'{BASE}/analytics/arguments?question=q2')
    if args_q2:
        for_args = args_q2.get("for", [])
        against_args = args_q2.get("against", [])
        print(f'    - Arguments FOR: {len(for_args)}')
        print(f'    - Arguments AGAINST: {len(against_args)}')
    else:
        issues.append("Arguments Q2 endpoint failed")

    # Test 8: Cross-tabulation
    print('\n[8] Testing Cross-tabulation endpoint...')
    cross = test_endpoint('Cross-tabulation', f'{BASE}/analytics/cross-tabulation',
        ['yes_yes', 'yes_no', 'no_yes', 'no_no', 'correlation_coefficient', 'p_value'])
    if cross:
        print(f'    - Yes-Yes: {cross.get("yes_yes")} ({cross.get("yes_yes_percent")}%)')
        print(f'    - Yes-No: {cross.get("yes_no")} ({cross.get("yes_no_percent")}%)')
        print(f'    - No-Yes: {cross.get("no_yes")} ({cross.get("no_yes_percent")}%)')
        print(f'    - No-No: {cross.get("no_no")} ({cross.get("no_no_percent")}%)')
        print(f'    - Correlation: {cross.get("correlation_coefficient")}')
        print(f'    - P-value: {cross.get("p_value")}')
    else:
        issues.append("Cross-tabulation endpoint failed")

    # Test 9: Raw responses
    print('\n[9] Testing Raw Responses endpoint...')
    responses = test_endpoint('Raw Responses', f'{BASE}/data/responses')
    if responses:
        if isinstance(responses, list):
            print(f'    - Total responses: {len(responses)}')
            if len(responses) > 0:
                print(f'    - Sample keys: {list(responses[0].keys())[:5]}...')
        elif isinstance(responses, dict):
            print(f'    - Response type: dict with keys {list(responses.keys())}')
    else:
        issues.append("Raw Responses endpoint failed")

    # Test 10: Cache status
    print('\n[10] Testing Cache Status endpoint...')
    cache = test_endpoint('Cache Status', f'{BASE}/analytics/cache-status')
    if cache:
        print(f'    - Exists: {cache.get("exists")}')
        print(f'    - Computed at: {cache.get("computed_at")}')
        print(f'    - Total responses: {cache.get("total_responses")}')

    # Summary
    print('\n' + '=' * 50)
    print('SUMMARY')
    print('=' * 50)
    
    if issues:
        print(f'\n[!] Found {len(issues)} issues:')
        for issue in issues:
            print(f'    - {issue}')
    else:
        print('\n[OK] All backend API tests passed!')
    
    return issues

if __name__ == '__main__':
    main()
