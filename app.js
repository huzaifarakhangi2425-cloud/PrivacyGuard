'use strict';

const storageKey = 'privacyguard-plan-v1';
const questions = [
  {title:'Do you use a different password for every important account?',description:'Think about your email, banking, and social accounts. A password manager can help you create and remember unique passwords.',task:'Give every account its own password',action:'Start with your email. Use a reputable password manager to create a unique password for each important account.'},
  {title:'Have you added a second step to your sign-ins?',description:'Two-factor authentication adds another check when you sign in. A passkey or an authenticator app can be a useful place to start.',task:'Add a second layer to your sign-ins',action:'Open the security settings for your email and important accounts. Enable a passkey or two-factor authentication where available, and keep recovery codes somewhere safe.'},
  {title:'Have you reviewed what your apps can access?',description:'Check which apps can use your location, microphone, camera, and contacts. Keep access only where it makes sense for you.',task:'Review your app permissions',action:'Open your device’s privacy settings. Review location, microphone, camera, and contacts access. Remove permissions an app does not need.'},
  {title:'Have you checked your browser’s privacy settings?',description:'Many browsers offer tracking protection and controls for third-party cookies. Review the options in the browser you use most.',task:'Set your browser’s privacy preferences',action:'Open your browser’s privacy settings. Review tracking protection and third-party cookie controls. Some settings may affect how certain websites work.'},
  {title:'Do your devices and apps stay up to date?',description:'Updates often fix security issues. Check that your operating system, browser, and important apps can receive updates.',task:'Keep your software up to date',action:'Check for available system, browser, and app updates. Turn on automatic updates where practical, and replace software that no longer receives security updates.'}
];
const guides = {
  browsing:{category:'01 / BROWSING',icon:'globe',title:'Leave a smaller footprint.',description:'Give websites a little less to follow.',items:['Review your browser’s tracking protection.','Clear cookies you no longer need.','Remove extensions you don’t use.'],note:'A private window limits local browsing history. It doesn’t make you anonymous online.'},
  accounts:{category:'02 / ACCOUNTS',icon:'key',title:'Give your sign-ins a second lock.',description:'A few thoughtful choices for your important accounts.',items:['Use a unique password for every account.','Enable passkeys or two-factor authentication.','Review recovery options and signed-in devices.'],note:'Store recovery codes somewhere safe so you can regain access if you lose your device.'},
  permissions:{category:'03 / PERMISSIONS',icon:'sliders',title:'Share on your own terms.',description:'Make app access a choice, not an afterthought.',items:['Review location, camera, and microphone access.','Choose “while using” access when appropriate.','Remove apps and permissions you no longer need.'],note:'Permissions differ across devices. Look for Privacy or Permissions in your device settings.'}
};
let answers = [], draftAnswers = [], completed = [], step = 0, savedPlan = null, storageAvailable = true;
try {
  const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (parsed && Array.isArray(parsed.answers) && parsed.answers.length === questions.length && parsed.answers.every(a => ['yes','no','unsure'].includes(a))) {
    savedPlan = parsed;
    answers = [...parsed.answers];
    completed = Array.isArray(parsed.completed) ? parsed.completed.filter(i=>Number.isInteger(i)&&i>=0&&i<questions.length&&answers[i]!=='yes') : [];
  }
} catch { storageAvailable = false; }

const checkDialog = document.getElementById('check-dialog');
const infoDialog = document.getElementById('info-dialog');
const checkContent = document.getElementById('check-content');
const svg = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
let lastDialogTrigger = null;

function openDialog(dialog, trigger) {
  lastDialogTrigger = trigger || document.activeElement;
  document.body.classList.add('dialog-open');
  dialog.showModal();
  const heading = dialog.querySelector('h2');
  if (heading) { heading.tabIndex = -1; heading.focus(); }
}
function closeDialog(dialog) { dialog.close(); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');lastDialogTrigger?.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
});
const startLabels = new Map([...document.querySelectorAll('[data-start]')].map(button=>[button,button.textContent.trim()]));
document.querySelectorAll('[data-start]').forEach(button=>button.addEventListener('click',()=>{
  closeMenu();
  if(savedPlan) renderResults(); else {step=0;draftAnswers=[];renderQuestion();}
  openDialog(checkDialog,button);
}));
function renderQuestion(focus=false) {
  const q=questions[step];
  checkContent.innerHTML=`<div class="check-body"><div class="check-step"><span>YOUR PRIVACY CHECK</span><span>${String(step+1).padStart(2,'0')} / 05</span></div><div class="check-progress"><span style="width:${(step+1)*20}%"></span></div><h2 id="check-title" tabindex="-1">${q.title}</h2><p class="question-description">${q.description}</p><div class="answer-options">${[['yes','Yes, I do'],['no','Not yet'],['unsure','I’m not sure']].map(([value,label])=>`<button class="answer-option" data-answer="${value}" aria-pressed="${draftAnswers[step]===value}">${label}${svg(draftAnswers[step]===value?'check':'arrow')}</button>`).join('')}</div><div class="check-navigation"><button class="back-button" ${step===0?'disabled':''}>← Back</button><span class="check-footnote">A habit check, not a device scan.<br>Your answers stay in this browser.</span></div></div>`;
  checkContent.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    draftAnswers[step]=button.dataset.answer;
    if(step<questions.length-1){step++;renderQuestion(true);}else{answers=[...draftAnswers];completed=[];savePlan();renderResults(true);}
  }));
  checkContent.querySelector('.back-button').addEventListener('click',()=>{if(step>0){step--;renderQuestion(true);}});
  if(focus)document.getElementById('check-title').focus();
}
function savePlan(){
  savedPlan={answers:[...answers],completed:[...completed]};
  try{localStorage.setItem(storageKey,JSON.stringify(savedPlan));storageAvailable=true;}catch{storageAvailable=false;}
  document.querySelectorAll('[data-start]').forEach(button=>{
    if(button.classList.contains('header-cta'))button.innerHTML=`My plan ${svg('arrow')}`;
    else button.innerHTML=`View my privacy plan ${svg('arrow')}`;
  });
  renderDashboard();
}
function renderResults(focus=false){
  const yesCount=answers.filter(a=>a==='yes').length;
  const pending=questions.map((q,i)=>({...q,index:i})).filter(q=>answers[q.index]!=='yes');
  checkContent.innerHTML=`<div class="check-body"><span class="eyebrow">YOUR PERSONAL STARTING POINT</span><div class="result-heading"><div class="result-score">${yesCount}<small>/5</small></div><div><h2 id="check-title" tabindex="-1">${yesCount===5?'Keep those good habits.':'A good place to begin.'}</h2><p>Privacy habits you reported having in place.</p></div></div><p class="result-explainer">This reflects your answers, not a security rating. ${pending.length?'Start with one of the steps below. Check it off when you’ve made the change.':'Revisit your settings now and then, especially after changing devices or installing new apps.'}</p><div class="plan-heading">YOUR NEXT MOVES <span id="plan-progress">${completed.length} of ${pending.length} completed</span></div><div class="plan-list">${pending.length?pending.map(q=>`<label class="plan-item ${completed.includes(q.index)?'is-done':''}"><input type="checkbox" data-task="${q.index}" ${completed.includes(q.index)?'checked':''}><span><strong>${q.task}</strong><small>${q.action}</small></span></label>`).join(''):'<div class="all-set">All five habits are in place based on your answers. Keep reviewing permissions, sign-ins, and updates as your digital life changes.</div>'}</div><div class="result-actions"><button class="button button-dark" id="download-plan">Download my plan ${svg('arrow')}</button><button class="button button-outline" id="retake-check">Retake check</button></div><p class="result-explainer" id="storage-note">${storageAvailable?'Saved in this browser. Clear it any time in the footer.':'Browser storage is unavailable. Your plan is available until you leave this page. Download a copy to keep it.'}</p></div>`;
  checkContent.querySelectorAll('[data-task]').forEach(input=>input.addEventListener('change',()=>{
    const index=Number(input.dataset.task);
    if(input.checked&&!completed.includes(index))completed.push(index);else completed=completed.filter(i=>i!==index);
    input.closest('label').classList.toggle('is-done',input.checked);
    document.getElementById('plan-progress').textContent=`${completed.length} of ${pending.length} completed`;
    savePlan();
    document.getElementById('storage-note').textContent=storageAvailable?'Saved in this browser. Clear it any time in the footer.':'Browser storage is unavailable. Download a copy to keep your plan.';
  }));
  document.getElementById('retake-check').addEventListener('click',()=>{step=0;draftAnswers=[...answers];renderQuestion(true);});
  document.getElementById('download-plan').addEventListener('click',downloadPlan);
  if(focus)document.getElementById('check-title').focus();
}
function downloadPlan(){
  const lines=['PRIVACYGUARD — YOUR PERSONAL PRIVACY PLAN','',`${answers.filter(a=>a==='yes').length} of 5 privacy habits reported in place.`,`This is a self-assessment, not a device scan or security rating.`,''];
  questions.forEach((q,i)=>{lines.push(`${answers[i]==='yes'?'[IN PLACE]':completed.includes(i)?'[DONE]':'[NEXT STEP]'} ${q.task}`,q.action,'');});
  lines.push('Revisit your settings regularly. Your plan is based only on your answers.');
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='PrivacyGuard-My-Privacy-Plan.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);showToast('Your privacy plan is ready to keep.');
}
document.getElementById('privacy-info').addEventListener('click',event=>openDialog(infoDialog,event.currentTarget));
document.getElementById('mobile-privacy-info')?.addEventListener('click',()=>{closeMenu();openDialog(infoDialog,menuButton);});
document.querySelector('.close-info').addEventListener('click',()=>closeDialog(infoDialog));
document.getElementById('clear-data').addEventListener('click',()=>{
  try{localStorage.removeItem(storageKey);}catch{}
  answers=[];draftAnswers=[];completed=[];savedPlan=null;step=0;
  document.querySelectorAll('[data-start]').forEach(button=>{
    const label=startLabels.get(button);
    button.innerHTML=`${label} ${svg('arrow')}`;
  });
  renderDashboard();
  showToast('Your saved PrivacyGuard answers and plan have been cleared.');
});
let toastTimer;
function showToast(message){const toast=document.querySelector('.toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),4000);}
function selectTab(button,focus=false){
  const guide=guides[button.dataset.tab];
  document.querySelectorAll('[data-tab]').forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  document.getElementById('toolkit-panel').setAttribute('aria-labelledby',button.id);
  document.getElementById('guide-category').textContent=guide.category;
  document.getElementById('guide-icon').innerHTML=`<use href="#i-${guide.icon}"/>`;
  document.getElementById('guide-title').textContent=guide.title;
  document.getElementById('guide-description').textContent=guide.description;
  document.getElementById('guide-list').innerHTML=guide.items.map(item=>`<li>${svg('check')} ${item}</li>`).join('');
  document.getElementById('guide-note').textContent=guide.note;
  if(focus)button.focus();
}
const tabs=[...document.querySelectorAll('[data-tab]')];
tabs.forEach((button,index)=>{
  button.addEventListener('click',()=>selectTab(button));
  button.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();selectTab(tabs[next],true);}
  });
});
const menuButton=document.querySelector('.menu-toggle');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');document.getElementById('mobile-nav').hidden=true;}
menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!expanded));menuButton.setAttribute('aria-label',expanded?'Open navigation':'Close navigation');document.getElementById('mobile-nav').hidden=expanded;});
document.querySelectorAll('.mobile-nav a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
function renderDashboard(){
  if(!document.getElementById('dashboard-tasks'))return;
  const hasPlan=!!savedPlan;
  const inPlace=hasPlan?answers.filter(a=>a==='yes').length:0;
  const addressed=inPlace+completed.length;
  const pending=hasPlan?5-addressed:5;
  document.getElementById('metric-habits').innerHTML=`${hasPlan?inPlace:'—'} <span>/ 5</span>`;
  document.getElementById('metric-done').innerHTML=`${completed.length} <span>${completed.length===1?'step':'steps'}</span>`;
  document.getElementById('metric-pending').innerHTML=`${hasPlan?pending:'—'} <span>to explore</span>`;
  document.getElementById('habits-note').textContent=hasPlan?'Based on your check-in answers.':'Your check is the starting point.';
  document.getElementById('pending-note').textContent=hasPlan?(pending?'One small change at a time.':'Keep revisiting your good habits.'):'A plan built around your answers.';
  document.getElementById('action-subtitle').textContent=hasPlan?'Your habits, and the steps you choose to take.':'Take the privacy check to personalize your plan.';
  document.getElementById('plan-count').textContent=hasPlan?`${addressed} / 5 addressed`:'5 habits';
  document.getElementById('snapshot-number').innerHTML=`${hasPlan?addressed:'—'}<small>/5</small>`;
  document.getElementById('snapshot-label').textContent=hasPlan?'habits addressed':'ready when you are';
  document.getElementById('snapshot-ring').style.background=`conic-gradient(#a4cc80 ${hasPlan?addressed*72:0}deg,#eaf0e3 0deg)`;
  document.querySelector('#snapshot-note p').textContent=hasPlan?'Based on your answers and completed steps. This is a habit overview, not a security rating.':'Start your check to see your habits here. This is a self-assessment, not a device scan.';
  document.getElementById('dashboard-storage').textContent=storageAvailable?'Your plan stays in this browser.':'Storage unavailable. Download your plan to keep it.';
  const icons=['key','lock','sliders','globe','shield'];
  const titles=['Use unique passwords','Add a second sign-in step','Review app permissions','Check browser privacy','Keep software up to date'];
  const descriptions=['A different password for each important account.','Give your important accounts another layer.','Choose what your apps can access.','Set tracking and cookie preferences.','Keep security fixes within reach.'];
  document.getElementById('dashboard-tasks').innerHTML=questions.map((q,i)=>{
    const inPlace=hasPlan&&answers[i]==='yes';
    const done=completed.includes(i);
    const status=!hasPlan?'Not checked':inPlace?'In place':done?'Done':answers[i]==='unsure'?'To review':'Next step';
    return `<label class="dashboard-task ${done?'is-done':''}"><input type="checkbox" data-dashboard-task="${i}" aria-label="${titles[i]}" ${inPlace||done?'checked':''} ${!hasPlan||inPlace?'disabled':''}><span class="dashboard-task-icon">${svg(icons[i])}</span><span class="dashboard-task-copy"><strong>${titles[i]}</strong><small>${descriptions[i]}</small></span><span class="task-status ${inPlace||done?'in-place':hasPlan?'next-step':''}">${status}</span></label>`;
  }).join('');
  document.querySelectorAll('[data-dashboard-task]').forEach(input=>input.addEventListener('change',()=>{
    const i=Number(input.dataset.dashboardTask);
    if(input.checked&&!completed.includes(i))completed.push(i);else completed=completed.filter(item=>item!==i);
    savePlan();
    document.querySelector(`[data-dashboard-task="${i}"]`)?.focus();
    showToast(input.checked?'One small step. A little more control.':'Step added back to your plan.');
  }));
  const download=document.getElementById('dashboard-download');
  download.disabled=!hasPlan;download.onclick=downloadPlan;
}
document.querySelectorAll('.side-nav a').forEach(link=>link.addEventListener('click',()=>{
  document.querySelectorAll('.side-nav a').forEach(a=>a.classList.toggle('active',a===link));
  document.querySelector('.breadcrumb strong').textContent=link.textContent.trim();
}));
if(savedPlan)savePlan();else renderDashboard();
