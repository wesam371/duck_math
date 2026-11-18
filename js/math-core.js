/* js/math-core.js — نواة الحساب الدقيق: كسور BigInt، جذور رمزية، مضاعفات π
   لا تقريب ولا فيضان: كل قيمة تبقى مضبوطة حتى اللحظة التي نطلب فيها عددًا عشريًا. */
(function(){'use strict';
var DM=window.DM=window.DM||{};
function E(m,code){this.message=m;this.code=code||'math';this.name='DMError'}
E.prototype=Object.create(Error.prototype);DM.E=E;

/* ---------- BigInt helpers ---------- */
function bi(v){
  if(typeof v==='bigint')return v;
  if(typeof v==='number'){if(!isFinite(v))throw new E('عدد غير منتهٍ.');return BigInt(Math.trunc(v))}
  return BigInt(String(v).trim());
}
function babs(a){return a<0n?-a:a}
function bgcd(a,b){a=babs(a);b=babs(b);while(b){var t=a%b;a=b;b=t}return a||1n}
function blcm(a,b){a=babs(a);b=babs(b);if(!a||!b)return 0n;return a/bgcd(a,b)*b}
function isqrt(n){if(n<0n)throw new E('جذر عدد سالب.');if(n<2n)return n;
  var x=n,y=(x+1n)/2n;while(y<x){x=y;y=(x+n/x)/2n}return x}
function perfectSq(n){if(n<0n)return null;var r=isqrt(n);return r*r===n?r:null}
/* استخراج أكبر مربع كامل: k = out² · in */
function extract(k){
  if(k<=0n)return{out:1n,in:k};
  var s=perfectSq(k);if(s!==null)return{out:s,in:1n};
  var out=1n,r=k,p;
  for(p=2n;p*p<=r&&p<20000n;p++){while(r%(p*p)===0n){out*=p;r/=p*p}}
  var s2=perfectSq(r);if(s2!==null){out*=s2;r=1n}
  return{out:out,in:r};
}
DM.bi=bi;DM.bgcd=bgcd;DM.blcm=blcm;DM.isqrt=isqrt;DM.perfectSq=perfectSq;DM.extract=extract;

/* ---------- Q: كسر نسبي مضبوط ---------- */
function Q(n,d){
  n=bi(n);d=(d===undefined)?1n:bi(d);
  if(d===0n)throw new E('القسمة على صفر غير معرّفة.','div0');
  if(d<0n){n=-n;d=-d}
  var g=bgcd(n,d);this.n=n/g;this.d=d/g;
}
Q.prototype.add=function(o){return new Q(this.n*o.d+o.n*this.d,this.d*o.d)};
Q.prototype.sub=function(o){return new Q(this.n*o.d-o.n*this.d,this.d*o.d)};
Q.prototype.mul=function(o){return new Q(this.n*o.n,this.d*o.d)};
Q.prototype.div=function(o){if(o.n===0n)throw new E('القسمة على صفر غير معرّفة.','div0');return new Q(this.n*o.d,this.d*o.n)};
Q.prototype.neg=function(){return new Q(-this.n,this.d)};
Q.prototype.abs=function(){return new Q(babs(this.n),this.d)};
Q.prototype.inv=function(){if(this.n===0n)throw new E('مقلوب الصفر غير معرّف.','div0');return new Q(this.d,this.n)};
Q.prototype.pow=function(k){k=Number(k);if(!Number.isInteger(k))throw new E('الأس يجب أن يكون صحيحًا here.');
  if(k<0)return this.inv().pow(-k);var r=new Q(1n),i;for(i=0;i<k;i++){r=r.mul(this);if(babs(r.n)>10n**40n||r.d>10n**40n)throw new E('النتيجة ضخمة جدًا.','huge')}return r};
Q.prototype.cmp=function(o){var l=this.n*o.d,r=o.n*this.d;return l<r?-1:l>r?1:0};
Q.prototype.eq=function(o){return this.n===o.n&&this.d===o.d};
Q.prototype.zero=function(){return this.n===0n};
Q.prototype.one=function(){return this.n===1n&&this.d===1n};
Q.prototype.int=function(){return this.d===1n};
Q.prototype.sign=function(){return this.n<0n?-1:this.n>0n?1:0};
Q.prototype.val=function(){return Number(this.n)/Number(this.d)};
Q.prototype.txt=function(){return this.d===1n?this.n.toString():this.n.toString()+'/'+this.d.toString()};
Q.prototype.latex=function(){return this.txt()};
/* تحويل نصّ/عدد إلى كسر مضبوط (بلا float) */
Q.parse=function(s){
  if(s instanceof Q)return s;
  if(typeof s==='bigint')return new Q(s);
  if(typeof s==='number'){
    if(!isFinite(s))throw new E('عدد غير صالح.');
    if(Number.isInteger(s))return new Q(BigInt(s));
    return Q.parse(String(s));
  }
  var t=String(s).trim().replace(/\s+/g,'');
  var rep=t.match(/^(-?)(\d*)\.(\d*)\((\d+)\)$/);
  if(rep){ /* 0.(3) → 1/3 */
    var sg=rep[1]==='-'?-1n:1n,ip=rep[2]||'0',np=rep[3]||'',rp=rep[4];
    var whole=BigInt(ip+np+rp)-BigInt(ip+np||'0');
    var den=BigInt('9'.repeat(rp.length)+'0'.repeat(np.length));
    return new Q(sg*whole,den);
  }
  var fr=t.match(/^(-?\d+)\/(-?\d+)$/);
  if(fr)return new Q(BigInt(fr[1]),BigInt(fr[2]));
  var dec=t.match(/^(-?)(\d*)(?:\.(\d*))?$/);
  if(dec&&(dec[2]||dec[3])){
    var sg2=dec[1]==='-'?-1n:1n,a=dec[2]||'0',b=dec[3]||'';
    return new Q(sg2*BigInt(a+b),10n**BigInt(b.length));
  }
  if(/^-?\d+$/.test(t))return new Q(BigInt(t));
  throw new E('تعذّر قراءة العدد «'+s+'».','parse');
};
DM.Q=Q;
var q0=new Q(0n),q1=new Q(1n),q2=new Q(2n),qm1=new Q(-1n);
DM.q0=q0;DM.q1=q1;DM.q2=q2;DM.qm1=qm1;
DM.q=function(n,d){return new Q(n,d===undefined?1n:d)};

/* ---------- R: مجموع جذري  Σ cᵢ√kᵢ  (k مربع‑حر، k=1 يعني نسبي) ---------- */
function rnorm(ts){
  var map={},i,t,key,out=[];
  for(i=0;i<ts.length;i++){t=ts[i];if(t.c.zero())continue;
    var ex=extract(t.k<0n?-t.k:t.k);
    var c=t.k<0n?t.c.mul(new Q(ex.out)):t.c.mul(new Q(ex.out));
    key=ex.in.toString();
    map[key]=map[key]?map[key].add(c):c;
    if(!map.__k)map.__k={};map.__k[key]=ex.in;
  }
  var keys=Object.keys(map).filter(function(k){return k!=='__k'});
  keys.sort(function(a,b){var A=BigInt(a),B=BigInt(b);return A<B?-1:A>B?1:0});
  for(i=0;i<keys.length;i++){var c2=map[keys[i]];if(!c2.zero())out.push({c:c2,k:map.__k[keys[i]]})}
  return out;
}
function R(ts){this.t=rnorm(ts||[])}
R.of=function(c,k){return new R([{c:c,k:k===undefined?1n:k}])};
R.q=function(c){return R.of(c,1n)};
R.prototype.add=function(o){return new R(this.t.concat(o.t))};
R.prototype.sub=function(o){return new R(this.t.concat(o.t.map(function(x){return{c:x.c.neg(),k:x.k}})))};
R.prototype.neg=function(){return new R(this.t.map(function(x){return{c:x.c.neg(),k:x.k}}))};
R.prototype.scale=function(c){return new R(this.t.map(function(x){return{c:x.c.mul(c),k:x.k}}))};
R.prototype.mul=function(o){var out=[],i,j;
  for(i=0;i<this.t.length;i++)for(j=0;j<o.t.length;j++)
    out.push({c:this.t[i].c.mul(o.t[j].c),k:this.t[i].k*o.t[j].k});
  return new R(out)};
R.prototype.zero=function(){return this.t.length===0};
R.prototype.rational=function(){return this.t.every(function(x){return x.k===1n})};
R.prototype.single=function(){return this.t.length===1};
R.prototype.asQ=function(){if(this.zero())return q0;if(this.t.length===1&&this.t[0].k===1n)return this.t[0].c;return null};
R.prototype.val=function(){var s=0;this.t.forEach(function(x){s+=x.c.val()*Math.sqrt(Number(x.k))});return s};
R.prototype.eq=function(o){if(this.t.length!==o.t.length)return false;
  for(var i=0;i<this.t.length;i++)if(this.t[i].k!==o.t[i].k||!this.t[i].c.eq(o.t[i].c))return false;return true};
R.prototype.sign=function(){var v=this.val();return v<0?-1:v>0?1:0};
/* القسمة على مجموع جذري: ترشيد المقام */
R.div=function(num,den){
  if(den.zero())throw new E('القسمة على صفر.','div0');
  if(den.single()){
    var t=den.t[0]; /* 1/(c√k) = √k/(c·k) */
    var f=new Q(1n,1n).div(t.c.mul(new Q(t.k)));
    return new R(num.t.map(function(x){return{c:x.c.mul(f),k:x.k*t.k}}));
  }
  if(den.t.length===2){
    var conj=new R([den.t[0],{c:den.t[1].c.neg(),k:den.t[1].k}]);
    var d2=den.mul(conj);var dq=d2.asQ();
    if(dq&&!dq.zero())return R.div(num.mul(conj),R.q(dq));
  }
  return null; /* يتطلّب تقريبًا */
};
/* جذر كسر: مضبوط إن أمكن */
R.sqrtQ=function(c){
  if(c.sign()<0)return null;
  if(c.zero())return new R([]);
  var sn=perfectSq(c.n),sd=perfectSq(c.d);
  if(sn!==null&&sd!==null)return R.q(new Q(sn,sd));
  return R.div(new R([{c:q1,k:c.n*c.d}]),R.q(new Q(c.d)));
};
/* جذر مجموع جذري: محاولة فكّ التعشيش a+2√b = √m+√n */
R.sqrt=function(r){
  if(r.zero())return new R([]);
  if(r.single()&&r.t[0].k===1n)return R.sqrtQ(r.t[0].c);
  if(r.t.length===2){
    var a=null,b=null;
    r.t.forEach(function(x){if(x.k===1n)a=x.c;else b=x});
    if(a&&b&&b.c.eq(q2)){
      var B=new Q(b.k),disc=R.sqrtQ(a.mul(a).sub(B.mul(new Q(4n))));
      if(disc&&disc.rational()){
        var dq=disc.asQ();
        var m=a.add(dq).div(q2),n=a.sub(dq).div(q2);
        var rm=R.sqrtQ(m),rn=R.sqrtQ(n);
        if(rm&&rn)return rm.add(rn);
      }
    }
  }
  return null;
};
DM.R=R;

/* ---------- X: قيمة مضبوطة = r + p·π ---------- */
function X(r,p,approx,num){
  this.r=r||new R([]);this.p=p||new R([]);
  this.approx=!!approx;this.num=(num===undefined?null:num);
}
X.q=function(c){return new X(R.q(c))};
X.rad=function(r){return new X(r)};
X.pi=function(){return new X(new R([]),R.q(q1))};
X.n=function(v){return new X(new R([]),new R([]),true,v)};
X.from=function(v){
  if(v instanceof X)return v;
  if(v instanceof Q)return X.q(v);
  if(v instanceof R)return X.rad(v);
  return X.q(Q.parse(v));
};
X.prototype.val=function(){return this.approx?this.num:this.r.val()+this.p.val()*Math.PI};
X.prototype.zero=function(){return this.approx?Math.abs(this.num)<1e-12:(this.r.zero()&&this.p.zero())};
X.prototype.exact=function(){return !this.approx};
X.prototype.asQ=function(){if(this.approx||!this.p.zero())return null;return this.r.asQ()};
X.prototype.eq=function(o){
  if(this.approx||o.approx)return Math.abs(this.val()-o.val())<1e-9;
  return this.r.eq(o.r)&&this.p.eq(o.p);
};
X.prototype.add=function(o){if(this.approx||o.approx)return X.n(this.val()+o.val());
  return new X(this.r.add(o.r),this.p.add(o.p))};
X.prototype.sub=function(o){if(this.approx||o.approx)return X.n(this.val()-o.val());
  return new X(this.r.sub(o.r),this.p.sub(o.p))};
X.prototype.neg=function(){return this.approx?X.n(-this.num):new X(this.r.neg(),this.p.neg())};
X.prototype.abs=function(){return this.val()<0?this.neg():this};
X.prototype.mul=function(o){
  if(this.approx||o.approx)return X.n(this.val()*o.val());
  var pp=this.p.mul(o.p);
  if(!pp.zero())return X.n(this.val()*o.val()); /* π² خارج نطاق الرمزي */
  return new X(this.r.mul(o.r),this.r.mul(o.p).add(this.p.mul(o.r)));
};
X.prototype.div=function(o){
  if(o.zero())throw new E('القسمة على صفر.','div0');
  if(this.approx||o.approx)return X.n(this.val()/o.val());
  if(!o.p.zero())return X.n(this.val()/o.val());
  var rr=R.div(this.r,o.r),pr=R.div(this.p,o.r);
  if(rr===null||pr===null)return X.n(this.val()/o.val());
  return new X(rr,pr);
};
X.prototype.pow=function(k){k=Number(k);
  if(!Number.isInteger(k))return X.n(Math.pow(this.val(),k));
  if(k===0)return X.q(q1);
  if(k<0)return X.q(q1).div(this.pow(-k));
  var r=X.q(q1),i;for(i=0;i<k;i++){r=r.mul(this);if(r.approx)break}return r};
X.prototype.sqrt=function(){
  if(this.approx||!this.p.zero()){var v=this.val();return v<0?null:X.n(Math.sqrt(v))}
  var s=R.sqrt(this.r);return s?X.rad(s):(this.val()<0?null:X.n(Math.sqrt(this.val())));
};
X.prototype.sign=function(){var v=this.val();return v<-1e-12?-1:v>1e-12?1:0};
X.prototype.txt=function(){return this.approx?String(Math.round(this.num*1e6)/1e6):DM.render.text(this)};
DM.X=X;

/* ---------- أدوات عددية ---------- */
DM.num={
  gcd:function(a,b){return Number(bgcd(BigInt(Math.round(Math.abs(a))),BigInt(Math.round(Math.abs(b)))))},
  lcm:function(a,b){return Number(blcm(BigInt(Math.round(Math.abs(a))),BigInt(Math.round(Math.abs(b)))))},
  isPrime:function(n){n=Math.abs(Math.round(n));if(n<2)return false;if(n%2===0)return n===2;
    for(var i=3;i*i<=n;i+=2)if(n%i===0)return false;return true},
  factorize:function(n){n=Math.abs(Math.round(n));var out=[],d=2;
    while(d*d<=n){while(n%d===0){out.push(d);n/=d}d++}if(n>1)out.push(n);return out},
  divisors:function(n){n=Math.abs(Math.round(n));var out=[],i;for(i=1;i*i<=n;i++)if(n%i===0){out.push(i);if(i!==n/i)out.push(n/i)}
    return out.sort(function(a,b){return a-b})},
  fact:function(n){n=Math.round(n);if(n<0)throw new E('مضروب عدد سالب غير معرّف.');
    var r=1n,i;for(i=2n;i<=BigInt(n);i++)r*=i;if(r>10n**60n)throw new E('المضروب ضخم جدًا.');return r},
  round:function(v,d){var p=Math.pow(10,d||0);return Math.round(v*p)/p},
  fmt:function(v,d){var r=DM.num.round(v,d===undefined?4:d);return String(r)}
};
/* مثلثات بالدرجات — قيم خاصة مضبوطة */
var SPECIAL={0:{sin:'0',cos:'1',tan:'0'},30:{sin:'1/2',cos:'√3/2',tan:'√3/3'},
 45:{sin:'√2/2',cos:'√2/2',tan:'1'},60:{sin:'√3/2',cos:'1/2',tan:'√3'},
 90:{sin:'1',cos:'0',tan:null},120:{sin:'√3/2',cos:'-1/2',tan:'-√3'},
 135:{sin:'√2/2',cos:'-√2/2',tan:'-1'},150:{sin:'1/2',cos:'-√3/2',tan:'-√3/3'},
 180:{sin:'0',cos:'-1',tan:'0'},210:{sin:'-1/2',cos:'-√3/2',tan:'√3/3'},
 225:{sin:'-√2/2',cos:'-√2/2',tan:'1'},240:{sin:'-√3/2',cos:'-1/2',tan:'√3'},
 270:{sin:'-1',cos:'0',tan:null},300:{sin:'-√3/2',cos:'1/2',tan:'-√3'},
 315:{sin:'-√2/2',cos:'√2/2',tan:'-1'},330:{sin:'-1/2',cos:'√3/2',tan:'-√3/3'},360:{sin:'0',cos:'1',tan:'0'}};
function parseSurdTxt(s){
  if(s===null)return null;
  var neg=/^-/.test(s);var t=s.replace(/^-/,'');
  var m=t.match(/^√(\d+)(?:\/(\d+))?$/);
  var r;
  if(m)r=R.div(new R([{c:q1,k:BigInt(m[1])}]),R.q(new Q(BigInt(m[2]||'1'))));
  else if(t.indexOf('/')>0){var p=t.split('/');r=R.q(new Q(BigInt(p[0]),BigInt(p[1])))}
  else r=R.q(new Q(BigInt(t)));
  return X.rad(neg?r.neg():r);
}
DM.trig={
  norm:function(d){var x=d%360;if(x<0)x+=360;return x},
  exact:function(fn,deg){var k=DM.trig.norm(deg);
    if(Math.abs(k-Math.round(k))>1e-9)return null;
    var row=SPECIAL[Math.round(k)];if(!row)return null;
    return parseSurdTxt(row[fn]);},
  val:function(fn,deg){var e=DM.trig.exact(fn,deg);if(e)return e;
    var rad=deg*Math.PI/180;
    if(fn==='sin')return X.n(Math.sin(rad));
    if(fn==='cos')return X.n(Math.cos(rad));
    var c=Math.cos(rad);if(Math.abs(c)<1e-12)throw new E('tan غير معرّفة عند '+deg+'°.','domain');
    return X.n(Math.tan(rad));},
  specialAngles:function(){return Object.keys(SPECIAL).map(Number).sort(function(a,b){return a-b})},
  table:SPECIAL
};
})();