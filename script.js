:root{--midnight:#0B1B4D;--indigo:#1E2F6B;--sky:#3A4F9A;--twilight:#5B6EC1;--moon:#7EA0E6;--lily:#2E5D3A;--mint:#AEE3A9;--lotus:#D96BB3;--blush:#F3A6D9;--petal:#FFE1F1;--gold:#F8D47A;--peach:#F2B36F;--lav:#D9C7F1;--dream:#8A6FA8}
*{box-sizing:border-box;margin:0}
body{font-family:Arial,Helvetica,sans-serif;font-weight:500;background:radial-gradient(circle at 80% 8%,#2a3f8c 0,var(--midnight) 55%) fixed;color:var(--petal);min-height:100vh;padding:20px 12px 40px;display:flex;justify-content:center}
.px{font-family:'Pixelify Sans','VT323',monospace;font-weight:700}
.win{width:100%;max-width:760px;background:var(--indigo);border:3px solid var(--twilight);border-radius:14px;box-shadow:6px 6px 0 #070f33;overflow:hidden;height:fit-content}
.bar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--midnight)}
.dots{display:flex;gap:6px}.dots i{width:11px;height:11px;border-radius:50%;background:var(--blush)}.dots i:nth-child(2){background:var(--gold)}.dots i:nth-child(3){background:var(--mint)}
.url{flex:1;background:var(--indigo);border-radius:20px;padding:5px 14px;font-size:13px;color:var(--lav);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tabs{display:flex;gap:4px;padding:8px 10px 0;background:var(--midnight);overflow-x:auto}
.tab{font-family:'Pixelify Sans',monospace;font-weight:700;font-size:16px;border:0;cursor:pointer;padding:8px 14px;border-radius:10px 10px 0 0;background:var(--sky);color:var(--lav);white-space:nowrap}
.tab[aria-selected=true]{background:var(--indigo);color:var(--petal)}
.tab:focus-visible,button:focus-visible,textarea:focus-visible,input:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
main{padding:22px 20px 26px;min-height:440px}
section[hidden]{display:none}
h2{font-size:26px;margin-bottom:4px}
.sub{color:var(--lav);font-size:14px;margin-bottom:16px}
.card{background:var(--midnight);border-radius:14px;padding:16px;margin-top:14px}
.btn{font-family:'Pixelify Sans',monospace;font-weight:700;font-size:18px;background:var(--blush);color:var(--midnight);border:0;border-radius:999px;padding:10px 22px;cursor:pointer;transition:transform .15s,background .15s}
.btn:hover{background:var(--twilight);color:var(--petal);transform:translateY(-2px)}
.btn.ghost{background:transparent;color:var(--lav);border:2px solid var(--dream)}
textarea,input[type=text]{width:100%;font:500 15px Arial,sans-serif;background:var(--indigo);color:var(--petal);border:2px solid var(--twilight);border-radius:10px;padding:10px;resize:vertical}
::placeholder{color:#8e9bd1}
.modes{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.mode{font-family:'Pixelify Sans',monospace;font-weight:700;font-size:15px;background:var(--midnight);color:var(--lav);border:2px solid var(--sky);border-radius:999px;padding:6px 16px;cursor:pointer}
.mode[aria-pressed=true]{background:var(--lotus);color:#fff;border-color:var(--lotus)}
.clock{font-family:'VT323',monospace;font-size:clamp(84px,24vw,140px);line-height:1;text-align:center;color:var(--gold);text-shadow:0 0 18px #f8d47a55;margin:14px 0 4px}
.ctrl{display:flex;gap:10px;justify-content:center;margin:10px 0}
.note{border-left:4px solid var(--gold);background:var(--midnight);padding:10px 14px;border-radius:0 10px 10px 0;margin-bottom:12px;font-size:14px}
.note b{font-family:'Pixelify Sans',monospace;color:var(--gold)}
#tea{text-align:center}#tea svg{width:150px;height:auto}
.steam{animation:steam 3s ease-in-out infinite;transform-origin:center bottom}
@keyframes steam{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
#glass{position:relative;width:190px;height:230px;margin:6px auto;border:4px solid var(--lav);border-top-width:10px;border-radius:18px 18px 40px 40px;background:#7ea0e61a;overflow:hidden}
.star{position:absolute;width:18px;height:18px;color:var(--gold);font-size:18px;line-height:18px;text-align:center;text-shadow:0 0 8px var(--gold);animation:tw 3s ease-in-out infinite}
@keyframes tw{50%{opacity:.55;transform:scale(.85)}}
.big{font-family:'VT323',monospace;font-size:34px;text-align:center;color:var(--gold)}
.row{display:flex;gap:8px;margin-top:10px}.row input{flex:1}
.entry{background:var(--midnight);border-radius:10px;padding:10px 12px;margin-top:10px;font-size:14px;white-space:pre-wrap}.entry small{display:block;color:var(--blush);margin-bottom:4px;font-family:'Pixelify Sans',monospace;font-size:14px}
.shelf{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;padding-bottom:10px;border-bottom:8px solid var(--dream)}
.book{position:relative;width:96px;min-height:120px;border-radius:6px 6px 2px 2px;padding:10px 8px;background:var(--lotus);color:#fff;font-size:13px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.book:nth-child(3n+2){background:var(--twilight)}.book:nth-child(3n){background:var(--lily)}
.book .dust{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 30% 30%,#d8d2c4 0 3px,transparent 4px),radial-gradient(circle at 70% 60%,#d8d2c4 0 4px,transparent 5px),radial-gradient(circle at 40% 80%,#d8d2c4 0 3px,transparent 4px),linear-gradient(#cfc8b8cc,#cfc8b8cc);transition:opacity .6s}
.book button{position:relative;font:700 11px 'Pixelify Sans',monospace;border:0;border-radius:8px;background:var(--petal);color:var(--midnight);padding:4px;cursor:pointer}
.x{position:absolute;top:2px;right:4px;z-index:2;background:none!important;color:#fff!important;font-size:14px!important}
dialog{margin:auto;background:var(--indigo);color:var(--petal);border:3px solid var(--blush);border-radius:16px;padding:22px;width:min(92vw,420px)}
dialog::backdrop{background:#050c2acc}
footer{text-align:center;color:var(--lav);font-size:13px;margin-top:18px}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
