"use strict";
const express=require('express');
const multer=require('multer');
const fs=require('fs');
const os=require('os');
const path=require('path');
const crypto=require('crypto');
const {spawn,spawnSync}=require('child_process');
const app=express();app.disable('x-powered-by');
const PORT=Number(process.env.PORT)||3000;
const ROOT=path.join(os.tmpdir(),'autogeist-v6');const IN=path.join(ROOT,'in');const OUT=path.join(ROOT,'out');
for(const p of [IN,OUT])fs.mkdirSync(p,{recursive:true});
const ff=spawnSync('ffmpeg',['-version'],{encoding:'utf8',timeout:5000});const FFMPEG=ff.status===0;
const VERSION='6.0.0';
app.use((req,res,next)=>{res.set('Cache-Control','no-store');next()});
app.use(express.static(path.join(__dirname,'public'),{etag:false,maxAge:0}));
app.use('/renders',express.static(OUT,{maxAge:0}));
app.get('/health',(req,res)=>res.status(FFMPEG?200:503).json({ok:FFMPEG,version:VERSION,app:'Auto Geist Studio V6 Stable',ffmpeg:FFMPEG,mode:'low-memory 720p',busy}));
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')));
const upload=multer({dest:IN,limits:{fileSize:110*1024*1024,files:15,fields:2,fieldSize:8192}});
let busy=false;
const clean=p=>{try{fs.rmSync(p,{force:true,recursive:true})}catch{}};
function execFF(args,label){return new Promise((resolve,reject)=>{let stderr='';const p=spawn('ffmpeg',['-nostdin','-hide_banner','-loglevel','error','-threads','1',...args],{stdio:['ignore','ignore','pipe']});const timeout=setTimeout(()=>p.kill('SIGKILL'),180000);p.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-2400)});p.on('error',e=>{clearTimeout(timeout);reject(e)});p.on('close',(code,signal)=>{clearTimeout(timeout);if(code===0)resolve();else reject(Error(label+': '+(signal==='SIGKILL'?'depasit timpul maxim':stderr||'FFmpeg exit '+code)))})})}
function safeText(x,max=55){return String(x||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 .,+\-\/]/g,' ').trim().slice(0,max)}
function draw(x){return safeText(x).replace(/\\/g,'\\\\').replace(/:/g,'\\:').replace(/'/g,"\\'").replace(/,/g,'\\,').replace(/%/g,'\\%')}
const FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
function brandLine(text,y,size,color='white'){return `drawtext=fontfile=${FONT}:text='${draw(text)}':x=(w-text_w)/2:y=${y}:fontsize=${size}:fontcolor=${color}`}
function logo(){return [brandLine('AUTO GEIST',290,53),brandLine('AUTO PUR SPIRIT',365,20,'0xcccccc')]}
async function slate(file,lines,duration){const vf=['format=yuv420p',...logo(),...lines].join(',');await execFF(['-y','-f','lavfi','-i',`color=c=0x0b0b0d:s=720x1280:r=25:d=${duration}`,'-vf',vf,'-an','-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-r','25','-threads','1',file],'intro/outro')}
app.post('/api/render',(req,res,next)=>{if(!FFMPEG)return res.status(503).json({error:'FFmpeg lipseste din containerul Docker'});if(busy)return res.status(429).json({error:'Serverul proceseaza deja un Reel. Reincearca peste cateva minute.'});next()},(req,res,next)=>upload.array('clips',15)(req,res,e=>{if(e)return res.status(400).json({error:'Incarcarea fisierelor a esuat: '+e.message});next()}),async(req,res)=>{
 if(!req.files?.length)return res.status(400).json({error:'Nu au fost trimise cadre video'});
 busy=true;const id=crypto.randomBytes(8).toString('hex');const work=path.join(ROOT,'job-'+id);fs.mkdirSync(work,{recursive:true});let result=null;
 try{let meta={};try{meta=JSON.parse(req.body.meta||'{}')}catch{throw Error('Datele masinii nu sunt valide')}
 const files=[];const intro=path.join(work,'00_intro.mp4');const outro=path.join(work,'99_outro.mp4');
 await slate(intro,[brandLine(meta.model||'AUTOTURISM',510,32),brandLine([meta.year,meta.km].filter(Boolean).join(' / '),575,23),brandLine(meta.price||'',645,32,'0xff353f')],1.4);files.push(intro);
 for(let i=0;i<req.files.length;i++){const input=req.files[i].path;const dest=path.join(work,`clip_${String(i).padStart(2,'0')}.mp4`);
 const vf="scale=720:1280:force_original_aspect_ratio=increase:flags=fast_bilinear,crop=720:1280,fps=25,setsar=1,format=yuv420p,drawbox=x=0:y=0:w=iw:h=66:color=black@0.35:t=fill,drawtext=fontfile="+FONT+":text='AUTO GEIST':x=24:y=18:fontsize=25:fontcolor=white";
 await execFF(['-y','-i',input,'-vf',vf,'-an','-c:v','libx264','-preset','ultrafast','-crf','25','-pix_fmt','yuv420p','-r','25','-threads','1',dest],'Cadru '+(i+1));files.push(dest);clean(input)}
 await slate(outro,[brandLine('RULAJ CERTIFICAT',495,25),brandLine('LIVRARE LA DOMICILIU',550,25),brandLine('REVIZIE LA LIVRARE',605,25),brandLine('GARANTIE 12 LUNI',660,25),brandLine('FINANTARE',715,27,'0xff353f'),brandLine(meta.contact||'AUTO GEIST BUCURESTI',835,23)],2.4);files.push(outro);
 const list=path.join(work,'concat.txt');fs.writeFileSync(list,files.map(f=>`file '${f}'`).join('\n'));
 result=path.join(OUT,`AutoGeist_Reel_${id}.mp4`);
 await execFF(['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',result],'Asamblare Reel');
 if(!fs.existsSync(result)||fs.statSync(result).size<10000)throw Error('Fisierul final este gol');
 res.json({ok:true,url:'/renders/'+path.basename(result),filename:'AutoGeist_Reel.mp4',resolution:'720x1280'});
 }catch(e){console.error('RENDER ERROR',id,e.message);if(result)clean(result);res.status(500).json({error:e.message.slice(0,400),job:id})}
 finally{req.files?.forEach(f=>clean(f.path));clean(work);busy=false}
});
app.use((err,req,res,next)=>{console.error('SERVER ERROR',err.message);res.status(500).json({error:'Eroare server: '+err.message})});
app.listen(PORT,'0.0.0.0',()=>console.log('Auto Geist Studio V6 READY port '+PORT+' ffmpeg='+FFMPEG));
