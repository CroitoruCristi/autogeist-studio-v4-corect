AUTO GEIST STUDIO V4.1 - RENDER FIX

Aceasta versiune adauga:
- GET / explicit -> public/index.html
- GET /health -> raspuns JSON pentru Render Health Check
- fallback pentru rutele web
- bind explicit 0.0.0.0
- render.yaml pentru configurare Render
- motorul FFmpeg si toate functiile V4 sunt pastrate

CUM ACTUALIZEZI GITHUB:
1. Deschide repository-ul autogeist-studio-v4-corect.
2. Inlocuieste continutul cu fisierele DIN INTERIORUL acestui folder.
3. In radacina repository-ului trebuie sa fie direct:
   Dockerfile
   server.js
   package.json
   render.yaml
   README.txt
   .dockerignore
   public/
4. Commit changes.
5. Render -> serviciul tau -> Manual Deploy -> Deploy latest commit
   (daca Auto-Deploy nu porneste singur).
6. In Logs cauta:
   Auto Geist Studio V4.1 READY on port ...
7. Testeaza:
   https://NUMELE-TAU.onrender.com/health
   Trebuie sa returneze JSON cu "ok": true.
8. Apoi deschide domeniul normal:
   https://NUMELE-TAU.onrender.com/

IMPORTANT:
Root Directory in Render trebuie lasat GOL daca fisierele de mai sus sunt direct
in radacina repository-ului.

Aplicatia are nevoie de HTTPS pentru camera pe iPhone.
