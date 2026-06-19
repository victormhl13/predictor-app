# GoalPredict — final release

## Instalare

1. Fă backup bazei Supabase.
2. Rulează integral `supabase-release-final.sql` în SQL Editor.
3. Copiază fișierele din ZIP peste proiect. Păstrează `.env`.
4. Rulează:

```bash
npm install
npm run test
npm run lint
npm run build
git add .
git commit -m "complete GoalPredict final release"
git push
```

## Funcționalități

- etapa se închide când toate rezultatele sunt finale;
- ultima sincronizare și erorile LPF sunt vizibile;
- data, ora, logo-urile și rezultatele se sincronizează;
- meciurile reprogramate sunt marcate;
- predicțiile se salvează împreună și afișează progresul;
- podium, puncte pe etapa curentă și evoluția poziției;
- statistici personale;
- regulament și deadline transparent;
- export CSV pentru clasament, rezultate și predicții;
- PWA actualizat și cod API-Football eliminat;
- teste automate pentru parserul LPF;
- paginile sunt încărcate separat pentru performanță.

Sincronizarea automată rulează când un administrator deschide pagina Matchdays și
apoi la fiecare cinci minute cât aceasta rămâne deschisă. Butonul Refresh o
pornește imediat.
