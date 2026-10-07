const express=require("express");
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const {spawn}=require("child_process");
const crypto=require("crypto");
const app=express(); const PORT=process.env.PORT||3000;
const UP=path.join(__dirname,"uploads"), OUT=path.join(__dirname,"renders");
fs.mkdirSync(UP,{recursive:true});fs.mkdirSync(OUT,{recursive:true});
const upload=multer({dest:UP,limits:{fileSize:250*1024*1024,files:20}});
app.use(express.static(path.join(__dirname,"public")));
app.use("/renders",express.static(OUT));
function esc(s=""){return String(s).replace(/\\/g,"\\\\").replace(/:/g,"\\:").replace(/'/g,"\\'").replace(/%/g,"\\%").replace(/\n/g," ")}
function run(args){return new Promise((resolve,reject)=>{const p=spawn("ffmpeg",args);let err="";p.stderr.on("data",d=>err+=d);p.on("close",c=>c===0?resolve():reject(new Error(err.slice(-4000))))})}
app.post("/api/render",upload.array("clips",20),async(req,res)=>{
 const id=crypto.randomBytes(6).toString("hex");let meta={};try{meta=JSON.parse(req.body.meta||"{}")}catch{}
 if(!req.files?.length)return res.status(400).send("No clips");
 const work=path.join(UP,id);fs.mkdirSync(work,{recursive:true}); const normalized=[];
 try{
  for(let i=0;i<req.files.length;i++){
   const out=path.join(work,`n${i}.mp4`); normalized.push(out);
   await run(["-y","-i",req.files[i].path,"-vf","scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30","-an","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",out]);
  }
  const list=path.join(work,"list.txt");fs.writeFileSync(list,normalized.map(f=>`file '${f.replace(/'/g,"'\\''")}'`).join("\n"));
  const joined=path.join(work,"joined.mp4");await run(["-y","-f","concat","-safe","0","-i",list,"-c","copy",joined]);
  const final=path.join(OUT,`autogeist_${id}.mp4`);
  const model=esc(meta.model||"AUTOTURISM"), info=esc([meta.year,meta.km].filter(Boolean).join("  •  ")), price=esc(meta.price||"");
  const vf=`drawbox=x=0:y=0:w=iw:h=150:color=black@0.32:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='AUTO':x=50:y=52:fontsize=48:fontcolor=white,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='GEIST':x=190:y=52:fontsize=48:fontcolor=red,drawbox=x=0:y=h-330:w=iw:h=330:color=black@0.38:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${model}':x=50:y=h-280:fontsize=44:fontcolor=white,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${info}':x=50:y=h-205:fontsize=30:fontcolor=white,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${price}':x=50:y=h-145:fontsize=38:fontcolor=red,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='Rulaj certificat  •  Finantare  •  Garantie  •  Revizie la livrare':x=50:y=h-75:fontsize=22:fontcolor=white`;
  await run(["-y","-i",joined,"-vf",vf,"-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p","-movflags","+faststart","-an",final]);
  [...req.files.map(f=>f.path)].forEach(f=>fs.rmSync(f,{force:true}));fs.rmSync(work,{recursive:true,force:true});
  res.json({url:`/renders/${path.basename(final)}`,filename:`AutoGeist_${(meta.model||"Reel").replace(/[^a-z0-9]+/gi,"_")}.mp4`});
 }catch(e){console.error(e);res.status(500).send("Render failed: "+e.message)}
});
app.listen(PORT,()=>console.log("Auto Geist Studio V4 on port "+PORT));
