import re

content = open(r'd:\Mentor X\mentorx-fe\src\pages\mentor\MentorPublicProfilePage.tsx', encoding='utf-8').read()
m = re.search(r'function IdentityCard.*?^}$', content, re.DOTALL | re.MULTILINE)
if m:
    with open('identity_card.txt', 'w', encoding='utf-8') as f:
        f.write(m.group(0))
    print("Extracted IdentityCard")
else:
    print("Could not find IdentityCard")
