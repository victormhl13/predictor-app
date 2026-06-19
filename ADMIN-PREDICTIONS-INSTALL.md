# GoalPredict — admin și predicții

1. În Supabase SQL Editor rulează integral:

```text
supabase-admin-predictions-upgrade.sql
```

2. Copiază fișierele din ZIP peste proiect, păstrând structura folderelor.

3. Rulează:

```bash
npm run test
npm run lint
npm run build
git add .
git commit -m "add admin tools and social predictions"
git push
```

## Funcționalități

- administratorul poate reseta PIN-ul unui utilizator;
- resetarea PIN-ului închide sesiunile existente ale utilizatorului;
- administratorul poate șterge o etapă împreună cu meciurile și predicțiile ei;
- după kickoff sunt vizibile predicțiile tuturor pentru acel meci;
- pronosticurile celorlalți nu sunt expuse înainte de kickoff;
- navigarea, Back și închiderea tabului cer confirmare dacă scorurile au fost
  modificate și nu au fost salvate;
- scoruri rapide: 1–0, 1–1, 2–1 și 2–0.
