/* Blackjacksetzer recent public YouTube streams, direct API v3.
 * Uses channels.list + uploads playlist + videos.list (no expensive search.list).
 * Only actual livestreams are displayed. All remote text is textContent.
 */
(() => {
  'use strict';
  const cfg=window.BLACKJACK_YOUTUBE_CONFIG||{};
  const key=String(cfg.apiKey||'').trim();
  const ready=key.length>15&&!/PASTE|PLACEHOLDER|YOUR_|EXAMPLE/i.test(key);
  const handle=String(cfg.channelHandle||'').trim().replace(/^@/,'');
  const amount=Math.max(1,Math.min(12,Number(cfg.maxStreams)||6));
  const ttl=Math.max(5,Math.min(1440,Number(cfg.cacheMinutes)||60))*60000;
  const cacheKey='blackjackstage-youtube-v2:'+handle;
  const grid=document.getElementById('stream-grid');
  const status=document.getElementById('stream-status');
  const updated=document.getElementById('stream-updated');
  const refresh=document.getElementById('refresh-streams');
  const avatar=document.getElementById('creator-avatar');
  const extras=document.getElementById('extra-links');
  const extraList=document.getElementById('extra-links-list');
  const channelLinks=[document.getElementById('youtube-channel-link'),document.getElementById('backstage-youtube')];
  if(!grid||!status||!updated||!refresh)return;
  const make=(tag,klass,text)=>{const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=text;return el};
  const videoUrl=id=>`https://www.youtube.com/watch?v=${id}`;
  const channelUrl=handle?`https://www.youtube.com/@${encodeURIComponent(handle)}`:'https://www.youtube.com/results?search_query=Blackjacksetzer';
  channelLinks.forEach(link=>{if(link)link.href=channelUrl;});
  function prettyDate(input){const n=Date.parse(input);return Number.isFinite(n)?new Date(n).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'YouTube';}
  function imageIsTrusted(image){try{const url=new URL(image);return url.protocol==='https:'&&(/(^|\.)googleusercontent\.com$/.test(url.hostname)||/(^|\.)ytimg\.com$/.test(url.hostname));}catch{return false;}}
  function setAvatar(src){if(!imageIsTrusted(src)||!avatar)return;avatar.onerror=()=>{avatar.onerror=null;avatar.src='img/fox-portrait.svg';};avatar.src=src;const fav=document.getElementById('site-favicon');if(fav){fav.href=src;fav.type='image/jpeg';}const apple=document.getElementById('apple-icon');if(apple)apple.href=src;}
  function linksFromDescription(desc){const found=[...String(desc||'').matchAll(/https?:\/\/[^\s<>"'\]\[()]+/gi)].map(m=>m[0].replace(/[.,;!?)]+$/,''));const unique=new Set();const result=[];
    for(const raw of found){try{const uri=new URL(raw);if(!['http:','https:'].includes(uri.protocol))continue;if(/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(uri.hostname))continue;if(unique.has(uri.href))continue;unique.add(uri.href);result.push({url:uri.href,host:uri.hostname.replace(/^www\./,'')});}catch{}}
    return result.slice(0,12);
  }
  function renderLinks(items){extraList.replaceChildren();for(const item of items||[]){try{const url=new URL(item.url);if(!['http:','https:'].includes(url.protocol))continue;const link=make('a','',url.hostname.replace(/^www\./,'')+' ↗');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';extraList.appendChild(link);}catch{}}extras.hidden=!extraList.children.length;}
  function empty(message){grid.replaceChildren();const card=make('div','stream-placeholder');card.appendChild(make('span','placeholder-mark','✦'));card.appendChild(make('h3','', 'The theatre is between shows.'));card.appendChild(make('p','', message));const link=make('a','','Visit the YouTube channel ↗');link.href=channelUrl;link.target='_blank';link.rel='noopener noreferrer';card.appendChild(link);grid.appendChild(card);}
  function render(list){grid.replaceChildren();if(!list.length){empty('No recent public livestream archives were found in the uploads checked. The fox may be preparing his next act.');return;}
    for(const video of list.slice(0,amount)){
      if(!/^[A-Za-z0-9_-]{11}$/.test(video.id))continue;
      const item=make('a','stream-card');item.href=videoUrl(video.id);item.target='_blank';item.rel='noopener noreferrer';item.setAttribute('aria-label',`Watch ${video.title} on YouTube`);
      const poster=make('div','stream-poster');const img=make('img');img.src=imageIsTrusted(video.thumbnail)?video.thumbnail:`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;img.alt='';img.loading='lazy';poster.append(img,make('span','stream-play','▶'),make('span','stream-badge'+(video.live?' live':''),video.live?'LIVE NOW':'PAST LIVESTREAM'));
      const body=make('div','stream-copy');body.appendChild(make('h3','',video.title||'Livestream'));const row=make('div','stream-meta');row.append(make('span','',prettyDate(video.date)),make('span','','Watch ↗'));body.appendChild(row);item.append(poster,body);grid.appendChild(item);
    }
  }
  async function request(path,params){const qs=new URLSearchParams({...params,key});const response=await fetch('https://www.googleapis.com/youtube/v3/'+path+'?'+qs.toString(),{headers:{Accept:'application/json'}});let data;try{data=await response.json()}catch{throw new Error(`YouTube returned HTTP ${response.status}`)}if(!response.ok||data.error)throw new Error(data?.error?.message||`YouTube API error ${response.status}`);return data;}
  const save=data=>{try{localStorage.setItem(cacheKey,JSON.stringify({time:Date.now(),data}))}catch{}};
  const getCached=(allowStale=false)=>{try{const o=JSON.parse(localStorage.getItem(cacheKey)||'null');return o&&Number.isFinite(o.time)&&(allowStale||Date.now()-o.time<ttl)?o:null}catch{return null}};
  function apply(data,fromCache=false){if(data.avatar)setAvatar(data.avatar);renderLinks(data.links);render(data.streams||[]);status.textContent=data.streams?.length?`${data.streams.length} recent public livestream${data.streams.length===1?'':'s'} found.`:'Connected, but no recent public livestreams were found.';updated.textContent=fromCache?'Showing saved results (up to one hour old).':'Updated '+new Date().toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});}
  async function load(force=false){
    if(!ready||!handle){empty('Set the restricted API key and correct channel handle in js/youtube-config.js to show the latest livestreams here automatically.');status.textContent='Automatic livestreams need your YouTube API key and channel handle.';updated.textContent='';refresh.disabled=true;return;}
    if(!force){const cached=getCached();if(cached){apply(cached.data,true);return;}}
    refresh.disabled=true;status.textContent='The fox is setting up the projector…';updated.textContent='';
    try{
      const channels=await request('channels',{part:'snippet,contentDetails',forHandle:handle});const channel=channels.items?.[0];if(!channel)throw Error('No YouTube channel found for @'+handle+'. Check the handle in youtube-config.js.');
      const thumbs=channel.snippet?.thumbnails||{};const icon=(thumbs.high||thumbs.medium||thumbs.default||{}).url||'';
      const links=linksFromDescription(channel.snippet?.description||'');
      const uploads=channel.contentDetails?.relatedPlaylists?.uploads;
      if(!uploads)throw Error('This channel has no public uploads playlist.');
      const ids=[];let next='';
      for(let i=0;i<3;i++){const page=await request('playlistItems',{part:'contentDetails',playlistId:uploads,maxResults:50,...(next?{pageToken:next}:{})});for(const item of page.items||[]){const id=item.contentDetails?.videoId;if(typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id)&&!ids.includes(id))ids.push(id)}next=page.nextPageToken||'';if(!next)break;}
      const results=[];for(let i=0;i<ids.length;i+=50){const videos=await request('videos',{part:'snippet,liveStreamingDetails',id:ids.slice(i,i+50).join(',')});results.push(...(videos.items||[]));}
      const streams=results.filter(v=>Boolean(v.liveStreamingDetails?.actualStartTime)||v.snippet?.liveBroadcastContent==='live').map(v=>{const thumb=v.snippet?.thumbnails||{};return{id:v.id,title:v.snippet?.title||'Livestream',date:v.liveStreamingDetails?.actualStartTime||v.snippet?.publishedAt||'',thumbnail:(thumb.maxres||thumb.standard||thumb.high||thumb.medium||thumb.default||{}).url||'',live:v.snippet?.liveBroadcastContent==='live'}}).sort((a,b)=>Number(b.live)-Number(a.live)||(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,amount);
      const data={streams,avatar:icon,links};save(data);apply(data,false);
    }catch(err){const stale=getCached(true);if(stale){apply(stale.data,true);status.textContent='Could not refresh YouTube; showing saved streams.';}else{empty('YouTube could not be reached. The channel link is still available.');status.textContent='YouTube feed: '+String(err.message||'Unknown error');}console.warn('Blackjacksetzer YouTube:',err);}
    finally{refresh.disabled=false;}
  }
  refresh.addEventListener('click',()=>load(true));load();
})();
