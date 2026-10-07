AUTO GEIST STUDIO V4.2 - LOW MEMORY / RENDER 512 MB

Problema rezolvata:
Render Free a oprit V4.1 pentru ca procesarea FFmpeg a depasit 512 MB RAM.

Modificarile V4.2:
- fiecare clip este procesat separat
- FFmpeg foloseste un singur thread
- etapa intermediara este 720x1280
- fisierele uploadate sunt sterse imediat dupa conversie
- concatenarea se face fara re-encodare
- exportul final este 1080x1920 H.264
- preset ultrafast pentru memorie/CPU reduse
- log FFmpeg limitat ca sa nu consume memorie inutil
- NODE_OPTIONS limiteaza heap-ul Node
- /health raporteaza V4.2 Low Memory

UPDATE:
1. Inlocuieste server.js si package.json in GitHub.
2. Inlocuieste public/index.html.
3. Inlocuieste render.yaml.
4. Commit changes.
5. Render -> Manual Deploy -> Deploy latest commit.
6. In Logs trebuie sa vezi:
   Auto Geist Studio V4.2 LOW MEMORY READY on port 10000
7. Verifica /health.
8. Pentru primul test filmeaza 3 cadre si genereaza Reel.
9. Daca merge, testeaza toate cele 15 cadre.

NOTA:
Daca 1080x1920 final tot depaseste memoria providerului, urmatorul mod de siguranta
este export nativ 720x1280. Pentru social media ramane vertical 9:16 si reduce
semnificativ consumul de RAM.
