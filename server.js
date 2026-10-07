const express=require("express");
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const {spawn}=require("child_process");
const crypto=require("crypto");

const app=express();
const PORT=process.env.PORT||3000;
const UP=path.join(__dirname,"uploads");
const OUT=path.join(__dirname,"renders");
fs.mkdirSync(UP,{recursive:true});
fs.mkdirSync(OUT,{recursive:true});

const upload=multer({
  dest:UP,
  limits:{fileSize:180*1024*1024,files:20}
});

app.use(express.static(path.join(__dirname,"public")));
app.use("/renders",express.static(OUT));
app.get("/health",(req,res)=>res.status(200).json({
  ok:true,app:"Auto Geist Studio V5 Pro Reel",mode:"512MB"
}));
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

function esc(s=""){
 return String(s).replace(/\\/g,"\\\\").replace(/:/g,"\\:")
 .replace(/'/g,"\\'").replace(/%/g,"\\%").replace(/\n/g," ");
}
function run(args,label="ffmpeg"){
 return new Promise((resolve,reject)=>{
   const p=spawn("ffmpeg",["-hide_banner","-loglevel","error",...args],{
     stdio:["ignore","ignore","pipe"]
   });
   let err="";
   p.stderr.on("data",d=>{err+=d.toString(); if(err.length>12000) err=err.slice(-12000)});
   p.on("error",reject);
   p.on("close",c=>c===0?resolve():reject(new Error(label+" failed: "+err.slice(-5000))));
 });
}
function rm(p){try{fs.rmSync(p,{recursive:true,force:true})}catch{}}

app.post("/api/render",upload.array("clips",20),async(req,res)=>{
 const id=crypto.randomBytes(6).toString("hex");
 let meta={}; try{meta=JSON.parse(req.body.meta||"{}")}catch{}
 if(!req.files?.length)return res.status(400).send("No clips");

 const work=path.join(UP,"job_"+id);
 fs.mkdirSync(work,{recursive:true});
 const normalized=[];

 try{
   // LOW MEMORY: one clip at a time, one FFmpeg thread.
   for(let i=0;i<req.files.length;i++){
     const input=req.files[i].path;
     const out=path.join(work,`clip_${String(i).padStart(2,"0")}.mp4`);
     await run([
       "-y","-threads","1",
       "-i",input,
       "-vf","scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30",
       "-an",
       "-c:v","libx264","-preset","ultrafast","-crf","23",
       "-pix_fmt","yuv420p",
       "-threads","1",
       "-movflags","+faststart",
       out
     ],"normalize "+i);
     normalized.push(out);
     // delete original upload immediately
     rm(input);
   }

   // Branded intro + outro, generated cheaply at 720x1280.
   const intro=path.join(work,"intro.mp4");
   const outro=path.join(work,"outro.mp4");
   const modelIntro=esc(meta.model||"AUTOTURISM");
   const priceIntro=esc(meta.price||"");
   const infoIntro=esc([meta.year,meta.km].filter(Boolean).join("  •  "));
   const cta=esc(meta.contact||"Auto Geist Bucuresti");
   const font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
   const introVF=[
     "drawbox=x=0:y=0:w=iw:h=ih:color=0x08080A:t=fill",
     `drawtext=fontfile=${font}:text='AUTO':x=(w-text_w)/2-75:y=360:fontsize=52:fontcolor=white`,
     `drawtext=fontfile=${font}:text='GEIST':x=(w-text_w)/2+95:y=360:fontsize=52:fontcolor=red`,
     `drawtext=fontfile=${font}:text='${modelIntro}':x=(w-text_w)/2:y=540:fontsize=34:fontcolor=white`,
     `drawtext=fontfile=${font}:text='${infoIntro}':x=(w-text_w)/2:y=600:fontsize=24:fontcolor=white`,
     `drawtext=fontfile=${font}:text='${priceIntro}':x=(w-text_w)/2:y=670:fontsize=38:fontcolor=red`
   ].join(",");
   await run(["-y","-f","lavfi","-i","color=c=black:s=720x1280:r=30:d=1.4","-vf",introVF,"-an","-c:v","libx264","-preset","ultrafast","-crf","23","-pix_fmt","yuv420p","-threads","1",intro],"intro");

   const outroVF=[
     "drawbox=x=0:y=0:w=iw:h=ih:color=0x08080A:t=fill",
     `drawtext=fontfile=${font}:text='AUTO':x=(w-text_w)/2-75:y=280:fontsize=54:fontcolor=white`,
     `drawtext=fontfile=${font}:text='GEIST':x=(w-text_w)/2+100:y=280:fontsize=54:fontcolor=red`,
     `drawtext=fontfile=${font}:text='RULAJ CERTIFICAT':x=(w-text_w)/2:y=480:fontsize=28:fontcolor=white`,
     `drawtext=fontfile=${font}:text='LIVRARE LA DOMICILIU':x=(w-text_w)/2:y=540:fontsize=28:fontcolor=white`,
     `drawtext=fontfile=${font}:text='REVIZIE LA LIVRARE':x=(w-text_w)/2:y=600:fontsize=28:fontcolor=white`,
     `drawtext=fontfile=${font}:text='GARANTIE 12 LUNI / EXTENSIBILA':x=(w-text_w)/2:y=660:fontsize=25:fontcolor=white`,
     `drawtext=fontfile=${font}:text='FINANTARE':x=(w-text_w)/2:y=720:fontsize=28:fontcolor=red`,
     `drawtext=fontfile=${font}:text='${cta}':x=(w-text_w)/2:y=860:fontsize=28:fontcolor=white`
   ].join(",");
   await run(["-y","-f","lavfi","-i","color=c=black:s=720x1280:r=30:d=2.5","-vf",outroVF,"-an","-c:v","libx264","-preset","ultrafast","-crf","23","-pix_fmt","yuv420p","-threads","1",outro],"outro");

   const list=path.join(work,"list.txt");
   const sequence=[intro,...normalized,outro];
   fs.writeFileSync(list,sequence.map(f=>`file '${f.replace(/'/g,"'\\''")}'`).join("\n"));
   const joined=path.join(work,"joined.mp4");

   // concat is stream-copy, almost no encoding RAM.
   await run(["-y","-f","concat","-safe","0","-i",list,"-c","copy",joined],"concat");

   // Remove normalized clips before final encode; joined remains.
   normalized.forEach(rm);
   rm(list);

   const final=path.join(OUT,`autogeist_${id}.mp4`);
   const model=esc(meta.model||"AUTOTURISM");
   const info=esc([meta.year,meta.km].filter(Boolean).join("  •  "));
   const price=esc(meta.price||"");

   // Final output stays 1080x1920, but source processing was 720x1280 to save RAM.
   // One thread + ultrafast keeps memory below typical free-tier limits.
   const vf=[
     "scale=1080:1920:flags=fast_bilinear",
     "drawbox=x=0:y=0:w=iw:h=145:color=black@0.34:t=fill",
     "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='AUTO':x=48:y=48:fontsize=46:fontcolor=white",
     "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='GEIST':x=185:y=48:fontsize=46:fontcolor=red",
     "drawbox=x=0:y=h-320:w=iw:h=320:color=black@0.40:t=fill",
     `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${model}':x=48:y=h-270:fontsize=40:fontcolor=white`,
     `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${info}':x=48:y=h-200:fontsize=28:fontcolor=white`,
     `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${price}':x=48:y=h-145:fontsize=36:fontcolor=red`,
     "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='RULAJ CERTIFICAT  •  LIVRARE  •  REVIZIE  •  GARANTIE  •  FINANTARE':x=48:y=h-72:fontsize=18:fontcolor=white"
   ].join(",");

   await run([
     "-y","-threads","1","-i",joined,
     "-vf",vf,
     "-an",
     "-c:v","libx264","-preset","ultrafast","-crf","22",
     "-pix_fmt","yuv420p","-threads","1",
     "-movflags","+faststart",
     final
   ],"final render");

   rm(work);
   res.json({
     url:`/renders/${path.basename(final)}`,
     filename:`AutoGeist_${(meta.model||"Reel").replace(/[^a-z0-9]+/gi,"_")}.mp4`
   });
 }catch(e){
   console.error("RENDER ERROR:",e.message);
   req.files?.forEach(f=>rm(f.path));
   rm(work);
   res.status(500).send("Render failed: "+e.message);
 }
});

app.get("*",(req,res)=>{
 if(req.path.startsWith("/api/"))return res.status(404).json({error:"API route not found"});
 return res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT,"0.0.0.0",()=>console.log("Auto Geist Studio V5 PRO REEL READY on port "+PORT));
