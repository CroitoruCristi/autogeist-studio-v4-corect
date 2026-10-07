AUTO GEIST STUDIO V4

CE ESTE
Aplicatie web/PWA + server Node.js + FFmpeg.
Telefonul filmeaza ghidat, serverul transforma cadrele intr-un Reel MP4 1080x1920.

FUNCTIONALITATI
- macheta transparenta diferita pentru 3/4, fata/spate, lateral, janta si interior
- puncte tinta + sageti de deplasare
- countdown si oprire automata
- 15 cadre standard
- upload automat al cadrelor la final
- normalizare 1080x1920 / 30 fps
- concatenare automata
- branding Auto Geist
- model, an, km, pret
- footer: Rulaj certificat / Finantare / Garantie / Revizie la livrare
- export MP4 H.264 cu faststart, pregatit pentru social media

IMPORTANT
Netlify Drop simplu NU este suficient pentru V4 deoarece renderul are nevoie de Node.js + FFmpeg.
Cea mai simpla publicare este pe un host de containere (Railway, Render, Fly.io, VPS etc.) folosind Dockerfile-ul inclus.

PUBLICARE CU DOCKER
1. Incarca acest proiect intr-un repository Git.
2. Creeaza un serviciu Docker pe provider.
3. Providerul va folosi Dockerfile.
4. Expune portul 3000 (de regula providerul il detecteaza automat).
5. Deschide URL-ul HTTPS primit pe iPhone.
6. Safari > Share > Add to Home Screen.

LOCAL
- Instaleaza Node.js si FFmpeg.
- npm install
- npm start
- deschide http://localhost:3000

NOTA
Muzica comerciala nu este inclusa automat pentru a evita probleme de licentiere.
Se poate adauga ulterior o biblioteca proprie/licentiata si tranzitii avansate.
