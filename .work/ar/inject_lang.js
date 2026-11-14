// usage: node inject_lang.js dict <code...>   |   node inject_lang.js edit <code...>   (edit processes the given languages together, one pass per file)
const {ROOT,SP,ts,fs,leaves,articleBlocks,weekBlocks,evalTs,flat}=require('./lib.js');
const langs=require('./langs.js');
const mode=process.argv[2];const codes=process.argv.slice(3);
const pick=codes.length?langs.filter(l=>codes.includes(l.code)):langs;
const clean=(code,v)=>{if(typeof v==='string'){let t=v.replace(/[一-鿿]/g,'');if(code==='kab')t=t.replace(/ε/g,'ɛ').replace(/γ/g,'ɣ').replace(/Ε/g,'Ɛ').replace(/Γ/g,'Ɣ');if(code==='ti')t=t.replace(/(?<=[ሀ-፿])[a-z]+|[a-z]+(?=[ሀ-፿])/g,'').replace(/،/g,'፣');return t;}if(Array.isArray(v))return v.map(x=>clean(code,x));if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v))o[k]=clean(code,v[k]);return o;}return v;};
const readJson=(f)=>{try{const code=(f.match(/out_([a-z]+)\//)||[])[1];const j=JSON.parse(fs.readFileSync(f,'utf8'));return code?clean(code,j):j;}catch(e){return null;}};
const lit=s=>"'"+s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,'\\n')+"'";
const report={};

if(mode==='dict'){
  const en=evalTs(ROOT+'/src/i18n/locales/en.ts').en;const fe=flat(en);
  const kept=JSON.parse(fs.readFileSync(SP+'dict2_kept.json','utf8'));
  for(const l of pick){
    const ar={};let files=0;
    for(const f of fs.readdirSync(SP+'jobs2').filter(f=>/^dict_\d+\.json$/.test(f))){const j=readJson(SP+`out_${l.code}/${f}`);if(j){Object.assign(ar,j);files++;}}
    const cats=new Intl.PluralRules(l.code).resolvedOptions().pluralCategories;
    const root={};
    const put=(path,val)=>{const tokens=[...path.matchAll(/([^.\[\]]+)|\[(\d+)\]/g)].map(m=>m[2]!==undefined?Number(m[2]):m[1]);let node=root;tokens.forEach((t,i)=>{if(i===tokens.length-1){node[t]=val;return;}const nextIdx=typeof tokens[i+1]==='number';if(node[t]===undefined)node[t]=nextIdx?[]:{};node=node[t];});};
    let missing=0,translated=0;
    const val=k=>{if(k in ar&&typeof ar[k]==='string'&&ar[k].length){translated++;return ar[k];}if(k in kept)return kept[k];missing++;return fe[k];};
    const out={};
    for(const k of Object.keys(fe)){out[k]=val(k);}
    // plural families: fill the CLDR categories of the language from the other form
    for(const k of Object.keys(fe)){
      const m=k.match(/^(.*)_other$/);if(!m)continue;const base=m[1];
      if(!cats.includes('one'))out[base+'_one']=out[k];
    }
    const extras=[];
    for(const k of Object.keys(fe)){const m=k.match(/^(.*)_other$/);if(!m)continue;for(const c of cats){if(c==='one'||c==='other')continue;extras.push([m[1]+'_'+c,out[k]]);}}
    for(const k of Object.keys(out)){put(k,out[k]);}
    for(const [k,v] of extras)put(k,v);
    const ident=/^[A-Za-z_$][A-Za-z0-9_$]*$/;const q=k=>ident.test(k)?k:JSON.stringify(k);
    const print=(v,ind)=>{if(typeof v==='string')return lit(v);const pad='  '.repeat(ind+1),end='  '.repeat(ind);if(Array.isArray(v))return '[\n'+v.map(x=>pad+print(x,ind+1)).join(',\n')+'\n'+end+']';return '{\n'+Object.keys(v).map(k=>pad+q(k)+': '+print(v[k],ind+1)).join(',\n')+'\n'+end+'}';};
    const header=`// ${l.en} copy (${l.code}). Natural, plain-language ${l.en} for a women's health application — NOT a word-for-word rendering of en.ts. Same key set and the same
// {{placeholders}} as the other dictionaries. Plural forms: ${cats.join(' / ')} (CLDR) — a form the language does not distinguish carries the same wording as _other.
// Western digits 0-9 are used everywhere; «AWA» and «PDF/CSV/JSON/PIN/Face ID» stay Latin; endonyms are identical in every dictionary. Religious-practice wording is
// educational and neutral and invents no ruling.
// NATIVE REVIEW REQUIRED: written by an AI translator, not reviewed by a native ${l.en} speaker, a medical translator or a scholar. ${l.en} has limited translation
// resources: terms without an established word use the common loanword in local spelling; every medical and religious term must be validated before release.
`;
    fs.writeFileSync(ROOT+`/src/i18n/locales/${l.code}.ts`,header+`export const ${l.code} = `+print(root,0)+';\n');
    report[l.code]={dictFiles:files,translated,missingFallbackToEnglish:missing};
  }
  console.log(JSON.stringify(report));
}

if(mode==='edit'){
  const meta=JSON.parse(fs.readFileSync(SP+'edit_meta.json','utf8'));
  const merged={};
  for(const l of pick){merged[l.code]={};for(const f of fs.readdirSync(SP+'jobs').filter(f=>/^edit_\d+\.json$/.test(f))){const j=readJson(SP+`out_${l.code}/${f}`);if(!j)continue;for(const [id,items] of Object.entries(j)){const base=id.replace(/#\d+$/,'');merged[l.code][base]=Object.assign(merged[l.code][base]||{},items);}}}
  const stat={};pick.forEach(l=>stat[l.code]={units:0,leavesTranslated:0,leavesFallback:0});
  const build=(code,srcProp,id,s)=>{
    const src=srcProp.initializer;const ls=leaves(src);const tr=merged[code][id]||{};const m=meta.find(x=>x.id===id);
    const edits=[];
    ls.forEach((l,i)=>{const v=tr[String(i)];if(typeof v==='string'&&v.length){edits.push([l.node.getStart(),l.node.getEnd(),lit(v)]);stat[code].leavesTranslated++;}});
    if(m)stat[code].leavesFallback+=Math.max(0,m.n-edits.length);
    let text=s.slice(src.getStart(),src.getEnd());const base=src.getStart();
    edits.sort((a,b)=>b[0]-a[0]).forEach(([a,b,r])=>{text=text.slice(0,a-base)+r+text.slice(b-base);});
    stat[code].units++;return text;
  };
  const insertAfter=(s,anchor,blocks)=>{const ls=s.lastIndexOf('\n',anchor.getStart())+1;const indent=s.slice(ls,anchor.getStart()).match(/^\s*/)[0];return {pos:anchor.getEnd(),ins:blocks.map(([c,t])=>',\n'+indent+c+': '+t).join('')};};
  const dir=ROOT+'/src/screens/library/';
  for(const f of fs.readdirSync(dir).filter(f=>/ArticleScreen\.tsx$/.test(f))){
    const {s,sf,blocks}=articleBlocks(dir+f);
    const id=f.replace('ArticleScreen.tsx','');const srcKey=blocks.en?'en':'fr';
    const todo=pick.filter(l=>!new RegExp("^\\s*'?"+l.code+"'?: \\{","m").test(s));
    if(!todo.length)continue;
    const blocksOut=todo.map(l=>[l.code,build(l.code,blocks[srcKey],id,s)]);
    let anchor=null;(function w(n){if(ts.isPropertyAssignment(n)&&n.name&&n.name.text==='ar'&&n.parent===blocks.zh.parent)anchor=n;ts.forEachChild(n,w);})(sf);
    if(!anchor)throw new Error('no ar anchor '+f);
    const {pos,ins}=insertAfter(s,anchor,blocksOut);
    const out=s.slice(0,pos)+ins+s.slice(pos);const orig=fs.readFileSync(dir+f,'utf8');
    fs.writeFileSync(dir+f,orig.includes('\r\n')?out.replace(/\n/g,'\r\n'):out);
  }
  const wf=ROOT+'/src/data/pregnancyWeekData.ts';
  {
    const {s,sf,weeks}=weekBlocks(wf);const eds=[];
    weeks.forEach((b,wi)=>{
      let anchor=null;(function w(n){if(ts.isPropertyAssignment(n)&&n.name&&n.name.text==='ar'&&n.parent===b.zh.parent)anchor=n;ts.forEachChild(n,w);})(sf);
      const present=l=>{const t=s.slice(anchor.getEnd(),anchor.getEnd()+4000);return new RegExp("^\\s*'?"+l.code+"'?: \\{").test(t.replace(/^,\s*/,''))};
      const todo=pick.filter(l=>!(b[l.code]));
      if(!todo.length)return;
      eds.push(insertAfter(s,anchor,todo.map(l=>[l.code,build(l.code,b.en,'week'+(wi+1),s)])));
    });
    let out=s;eds.sort((a,b)=>b.pos-a.pos).forEach(e=>{out=out.slice(0,e.pos)+e.ins+out.slice(e.pos);});
    const orig=fs.readFileSync(wf,'utf8');if(eds.length)fs.writeFileSync(wf,orig.includes('\r\n')?out.replace(/\n/g,'\r\n'):out);
  }
  console.log(JSON.stringify(stat));
}
