# GoalPredict — sursa gratuită LPF

## 1. Supabase

În SQL Editor rulează integral:

```text
supabase-hotfix-2026-06-19.sql
```

Acest hotfix repară login-ul, lista utilizatorilor și crearea utilizatorilor.
Poate fi rulat în siguranță și dacă login-ul a fost deja reparat manual.

## 2. Fișiere

Copiază folderele și fișierele din ZIP peste proiect, păstrând structura lor.
Nu înlocui fișierul local `.env`.

## 3. Verificare și deploy

```bash
npm run lint
npm run build
git add .
git commit -m "use free LPF fixtures and polish UX"
git push
```

## Sursa meciurilor

Noile importuri folosesc programul public oficial de pe `lpf.ro`.

- sezonul curent este detectat automat;
- sunt importate echipele, orele, logo-urile și ID-urile meciurilor;
- rezultatele sunt sincronizate din paginile oficiale ale meciurilor;
- când LPF publică sezonul 2026–2027, acesta va apărea automat;
- dacă LPF nu este disponibil, rămâne disponibilă introducerea manuală.

Cheia API-Football nu mai este necesară pentru meciurile noi. Poate fi păstrată
temporar în Vercel doar pentru sincronizarea meciurilor vechi care au fost
importate anterior din API-Football.
