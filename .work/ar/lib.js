// Shared helpers for the Arabic pipeline (extract / check / inject).
const fs=require('fs'),vm=require('vm'),path=require('path');
const ROOT='D:/HAWA/mobile';
const SP='D:/HAWA/.work/ar/';
const ts=require(ROOT+'/node_modules/typescript');

const propName=p=>p.name&&(ts.isIdentifier(p.name)||ts.isStringLiteral(p.name))?p.name.text:null;
const isStr=n=>ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n);

/** ordered translatable string nodes inside an expression (value positions only) with a readable path */
function leaves(node){
  const out=[];
  (function walk(n,p){
    if(isStr(n)){out.push({node:n,path:p,text:n.text});return;}
    if(ts.isObjectLiteralExpression(n)){for(const pr of n.properties){if(ts.isPropertyAssignment(pr)){const k=propName(pr)??'?';walk(pr.initializer,p?p+'.'+k:k);}else if(ts.isShorthandPropertyAssignment(pr)){}}return;}
    if(ts.isArrayLiteralExpression(n)){n.elements.forEach((e,i)=>walk(e,p+'['+i+']'));return;}
    if(ts.isAsExpression(n)||ts.isParenthesizedExpression(n)||ts.isSatisfiesExpression&&ts.isSatisfiesExpression(n)){walk(n.expression,p);return;}
    if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.PlusToken){walk(n.left,p);walk(n.right,p);return;}
    // calls (require, template fns), identifiers, numbers: not translatable
  })(node,'');
  return out;
}
function parse(file){const s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');return {s,sf:ts.createSourceFile(file,s,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS)};}

/** the language block (`en`, `zh`, `fr` ...) of an article CONTENT object or a pregnancy-week entry */
function articleBlocks(file){
  const {s,sf}=parse(file);const res={};
  (function walk(n){
    if(ts.isPropertyAssignment(n)&&['en','zh','fr','ar','kab','om','ti','rw','rn','ig','yo','zu','xh','sn','ln','ff'].includes(propName(n))&&ts.isObjectLiteralExpression(n.initializer)){
      let c=n.parent.parent;while(c&&(ts.isAsExpression(c)||ts.isParenthesizedExpression(c)))c=c.parent;
      if(c&&ts.isCallExpression(c)&&c.expression.getText()==='withBrazilianPortuguese')res[propName(n)]=n;
    }
    ts.forEachChild(n,walk);
  })(sf);
  return {s,sf,blocks:res};
}
function weekBlocks(file){
  const {s,sf}=parse(file);const weeks=[];
  (function walk(n){
    if(ts.isPropertyAssignment(n)&&propName(n)==='content'&&ts.isObjectLiteralExpression(n.initializer)&&n.initializer.properties.length>20){
      const b={};for(const pr of n.initializer.properties){if(ts.isPropertyAssignment(pr)&&['en','zh','ar','kab','om','ti','rw','rn','ig','yo','zu','xh','sn','ln','ff'].includes(propName(pr)))b[propName(pr)]=pr;}
      weeks.push(b);
    }
    ts.forEachChild(n,walk);
  })(sf);
  return {s,sf,weeks};
}
function evalTs(file){const src=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:'commonjs',target:'es2019'}}).outputText;const m={exports:{}};vm.runInNewContext(src,{module:m,exports:m.exports});return m.exports;}
function flat(o,p='',acc={}){if(typeof o==='string'){acc[p]=o;}else if(Array.isArray(o)){o.forEach((x,i)=>flat(x,p+'['+i+']',acc));}else if(o&&typeof o==='object'){for(const k of Object.keys(o))flat(o[k],p?p+'.'+k:k,acc);}return acc;}
const ph=s=>(String(s).match(/\{\{[^}]+\}\}|<\/?[a-zA-Z][^>]*>|%[sd]/g)||[]).sort().join('|');
module.exports={ROOT,SP,ts,fs,leaves,parse,articleBlocks,weekBlocks,evalTs,flat,ph,propName,isStr};
