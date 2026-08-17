(() => {
  'use strict';

  const EVENTS = [
    { date:'1957-10-04', title:'The Space Age Begins', category:'Space', importance:9, summary:'Sputnik 1 became the first artificial satellite, turning the sky above Earth into a new frontier.', image:'assets/time-flight/1957-sputnik.jpg', focal:'50% 42%', alt:'Sputnik 1 satellite displayed at the National Museum of the United States Air Force.', credit:'U.S. Air Force / National Museum of the U.S. Air Force', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Sputnik_1.jpg' },
    { date:'1961-04-12', title:'A Human Orbits Earth', category:'Space', importance:10, summary:'Yuri Gagarin completed the first human journey into outer space and returned safely to Earth.', image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Yuri_Gagarin_%281961%29.jpg?width=1600', focal:'50% 28%', alt:'Portrait of cosmonaut Yuri Gagarin.', credit:'Wikimedia Commons contributor', license:'See source page', source:'https://commons.wikimedia.org/wiki/File:Yuri_Gagarin_(1961).jpg' },
    { date:'1963-08-28', title:'The March on Washington', category:'Civil Rights', importance:10, summary:'Hundreds of thousands gathered in Washington, D.C., demanding jobs, freedom, and equal civil rights.', image:'assets/time-flight/1963-march.jpg', focal:'50% 50%', alt:'Large crowd gathered between the Lincoln Memorial and Washington Monument during the March on Washington.', credit:'Warren K. Leffler / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:View_of_the_huge_crowd_March_on_Washington.jpg' },
    { date:'1968-12-24', title:'Earthrise Changes Our View', category:'Space & Earth', importance:9, summary:'Apollo 8 photographed Earth rising above the Moon, revealing a fragile world without visible borders.', image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/NASA-Apollo8-Dec24-Earthrise.jpg?width=1600', focal:'50% 48%', alt:'Earth rising above the lunar horizon as photographed by Apollo 8.', credit:'NASA / William Anders', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise.jpg' },
    { date:'1969-07-20', title:'Humans Walk on the Moon', category:'Space', importance:10, summary:'Apollo 11 placed the first people on another world as hundreds of millions watched from Earth.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Aldrin_Apollo_11.jpg/1280px-Aldrin_Apollo_11.jpg', focal:'50% 42%', alt:'Astronaut Buzz Aldrin standing on the lunar surface during Apollo 11.', credit:'Neil Armstrong / NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Aldrin_Apollo_11.jpg' },
    { date:'1972-12-07', title:'The Whole Earth Comes Into View', category:'Space & Earth', importance:8, summary:'Apollo 17 captured the Blue Marble, one of the first clear photographs of a fully illuminated Earth.', image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/The_Earth_seen_from_Apollo_17.jpg?width=1600', focal:'50% 50%', alt:'The fully illuminated Earth photographed by the Apollo 17 crew.', credit:'NASA / Apollo 17 crew', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg' },
    { date:'1977-09-05', title:'Voyager Leaves for the Outer Planets', category:'Space', importance:8, summary:'Voyager 1 launched carrying instruments—and a golden record intended to represent life on Earth.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Voyager_1_Launch.jpg/960px-Voyager_1_Launch.jpg', focal:'50% 55%', alt:'Voyager 1 launching aboard a Titan-Centaur rocket.', credit:'NASA on The Commons', license:'No known copyright restrictions', source:'https://commons.wikimedia.org/wiki/File:Voyager_1_Launch.jpg' },
    { date:'1981-04-12', title:'The Space Shuttle Era Begins', category:'Space & Technology', importance:8, summary:'Columbia launched on STS-1, introducing the first reusable orbital spacecraft system.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Sts1-liftoff-columbia.triddle.jpg/960px-Sts1-liftoff-columbia.triddle.jpg', focal:'50% 58%', alt:'Space Shuttle Columbia lifting off at the start of STS-1.', credit:'NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Sts1-liftoff-columbia.triddle.jpg' },
    { date:'1986-01-28', title:'The Challenger Disaster', category:'Remembrance', importance:9, sensitive:true, summary:'Space Shuttle Challenger and its seven crew members were lost shortly after launch, reshaping the U.S. space program.', image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Challenger_explosion.jpg?width=1600', focal:'50% 42%', alt:'Vapor trails following the Space Shuttle Challenger disaster.', credit:'NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Challenger_explosion.jpg' },
    { date:'1989-11-09', title:'The Berlin Wall Opens', category:'World History', importance:10, summary:'Crowds crossed a border that had divided Berlin for decades, accelerating the end of the Cold War in Europe.', image:'https://upload.wikimedia.org/wikipedia/commons/2/25/BerlinWall-BrandenburgGate.jpg', focal:'50% 42%', alt:'People standing atop the Berlin Wall near the Brandenburg Gate in November 1989.', credit:'Sue Ream', license:'CC BY 3.0', source:'https://commons.wikimedia.org/wiki/File:BerlinWall-BrandenburgGate.jpg' },
    { date:'1991-08-06', title:'The World Wide Web Goes Public', category:'Technology', importance:10, summary:'The first public website introduced a system that would connect information—and eventually billions of people.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/First_Web_Server.jpg/1280px-First_Web_Server.jpg', focal:'50% 52%', alt:'The NeXT computer used by Tim Berners-Lee as the first web server at CERN.', credit:'Coolcaesar', license:'CC BY-SA 3.0', source:'https://commons.wikimedia.org/wiki/File:First_Web_Server.jpg' },
    { date:'1996-01-15', title:'Hubble Looks Into Deep Time', category:'Science', importance:8, summary:'The Hubble Deep Field revealed thousands of distant galaxies in a seemingly empty patch of sky.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hubble_deep_field.jpg/1280px-Hubble_deep_field.jpg', focal:'50% 50%', alt:'Hubble Deep Field mosaic containing many distant galaxies.', credit:'R. Williams, HDF Team and NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Hubble_deep_field.jpg' },
    { date:'2001-09-11', title:'September 11, 2001', category:'Remembrance', importance:10, sensitive:true, summary:'Coordinated terrorist attacks killed nearly 3,000 people and changed security, foreign policy, and daily life around the world.', image:'https://commons.wikimedia.org/wiki/Special:Redirect/file/New_York_City_-_September_11%2C_2001.jpg?width=1600', focal:'50% 48%', alt:'A smoke plume over New York City photographed from the International Space Station on September 11, 2001.', credit:'NASA on The Commons', license:'No known copyright restrictions', source:'https://commons.wikimedia.org/wiki/File:New_York_City_-_September_11,_2001.jpg' },
    { date:'2004-12-26', title:'The Indian Ocean Tsunami', category:'Global Disaster', importance:9, sensitive:true, summary:'A powerful undersea earthquake generated a tsunami across the Indian Ocean, prompting an unprecedented global relief effort.', image:'https://upload.wikimedia.org/wikipedia/commons/e/e9/Aceh_2004_tsunami_standing_mosque_USGS_%28cropped%29.jpg', focal:'50% 54%', alt:'A mosque standing amid tsunami damage in Banda Aceh.', credit:'U.S. Geological Survey', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Aceh_2004_tsunami_standing_mosque_USGS_(cropped).jpg' },
    { date:'2008-09-10', title:'The Large Hadron Collider Starts', category:'Science', importance:8, summary:'The world’s largest particle accelerator began operations, opening a new window into the structure of matter.', image:'https://upload.wikimedia.org/wikipedia/commons/1/1d/CERN_Large_Hadron_Collider.jpg', focal:'50% 52%', alt:'The Large Hadron Collider tunnel at CERN.', credit:'Chris Mitchell', license:'CC BY-SA 4.0', source:'https://commons.wikimedia.org/wiki/File:CERN_Large_Hadron_Collider.jpg' },
    { date:'2012-07-04', title:'Evidence of the Higgs Boson', category:'Science', importance:9, summary:'Scientists at CERN announced a particle consistent with the long-predicted Higgs boson, completing a crucial piece of the Standard Model.', image:'https://upload.wikimedia.org/wikipedia/commons/1/1d/CERN_Large_Hadron_Collider.jpg', focal:'38% 58%', alt:'The Large Hadron Collider tunnel at CERN.', credit:'Chris Mitchell', license:'CC BY-SA 4.0', source:'https://commons.wikimedia.org/wiki/File:CERN_Large_Hadron_Collider.jpg' },
    { date:'2015-07-14', title:'Pluto Revealed', category:'Space', importance:8, summary:'New Horizons completed humanity’s first close encounter with Pluto after a journey of nearly a decade.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/NH-Pluto-bw-NewHorizons-20150713a.jpg/1280px-NH-Pluto-bw-NewHorizons-20150713a.jpg', focal:'50% 50%', alt:'Pluto photographed by the New Horizons spacecraft before closest approach.', credit:'NASA / Johns Hopkins APL / Southwest Research Institute', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:NH-Pluto-bw-NewHorizons-20150713a.jpg' },
    { date:'2020-03-11', title:'A Pandemic Reshapes Daily Life', category:'Global Health', importance:10, sensitive:true, summary:'COVID-19 was characterized as a pandemic, transforming public health, work, travel, education, and human connection.', image:'https://upload.wikimedia.org/wikipedia/commons/8/82/SARS-CoV-2_without_background.png', focal:'50% 50%', alt:'CDC illustration of the SARS-CoV-2 virus.', credit:'Alissa Eckert and Dan Higgins / CDC', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:SARS-CoV-2_without_background.png' },
    { date:'2022-07-11', title:'Webb Opens a New View of the Universe', category:'Space & Science', importance:9, summary:'The first full-color image from the James Webb Space Telescope revealed thousands of galaxies in extraordinary infrared detail.', image:'assets/time-flight/2022-webb.jpg', focal:'50% 50%', alt:'Webb’s First Deep Field showing the galaxy cluster SMACS 0723.', credit:'NASA, ESA, CSA and STScI', license:'Public domain with source credit', source:'https://commons.wikimedia.org/wiki/File:Webb%27s_First_Deep_Field.jpg' },
    { date:'2024-04-08', title:'Totality Crosses North America', category:'Shared Sky', importance:7, summary:'A total solar eclipse swept across Mexico, the United States, and Canada, drawing millions outside to share the sky.', image:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/2024_Total_Solar_Eclipse.jpg/1280px-2024_Total_Solar_Eclipse.jpg', focal:'50% 50%', alt:'The solar corona visible during the total solar eclipse of April 8, 2024.', credit:'Illascaphaquamvidisti', license:'CC BY 4.0', source:'https://commons.wikimedia.org/wiki/File:2024_Total_Solar_Eclipse.jpg' }
  ];

  const state = { events:[], mode:'quick', index:0, timer:null, paused:false, duration:4700, touchX:null };
  const $ = id => document.getElementById(id);
  const ui = {
    overlay:$('time-flight-overlay'), launch:$('time-flight-launch-btn'), launchMeta:$('time-flight-launch-meta'), close:$('time-flight-close'),
    briefing:$('time-flight-briefing'), briefingTitle:$('time-flight-briefing-title'), briefingCopy:$('time-flight-briefing-copy'),
    quick:$('time-flight-quick'), full:$('time-flight-full'), quickMeta:$('time-flight-quick-meta'), fullMeta:$('time-flight-full-meta'),
    finale:$('time-flight-finale'), finaleTitle:$('time-flight-finale-title'), finaleCopy:$('time-flight-finale-copy'), replay:$('time-flight-replay'), finish:$('time-flight-finish'), credits:$('time-flight-credits-list'),
    image:$('time-flight-image'), fallbackYear:$('time-flight-fallback-year'), copy:$('time-flight-scene-copy'), year:$('time-flight-year'), category:$('time-flight-category'), title:$('time-flight-title'), summary:$('time-flight-summary'), age:$('time-flight-age'), source:$('time-flight-source'),
    progress:$('time-flight-progress'), previous:$('time-flight-previous'), pause:$('time-flight-pause'), next:$('time-flight-next'), counter:$('time-flight-counter')
  };

  function birthMoment() {
    const value = window.getLifePulseBirthMoment?.();
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date('1957-01-01T12:00:00');
  }
  function lifetimeEvents() {
    const birth = birthMoment();
    const now = new Date();
    return EVENTS.filter(event => { const moment = new Date(`${event.date}T12:00:00`); return moment >= birth && moment <= now; });
  }
  function quickEvents(events) {
    if (events.length <= 10) return events.slice();
    const selected = events.filter(event => event.importance >= 9);
    if (!selected.includes(events[0])) selected.unshift(events[0]);
    if (!selected.includes(events.at(-1))) selected.push(events.at(-1));
    return selected;
  }
  function ageAt(dateText) {
    const birth = birthMoment();
    const moment = new Date(`${dateText}T12:00:00`);
    let years = moment.getFullYear() - birth.getFullYear();
    const birthday = new Date(moment.getFullYear(), birth.getMonth(), birth.getDate(), birth.getHours(), birth.getMinutes());
    if (moment < birthday) years -= 1;
    if (years < 0) return '';
    if (years === 0) return 'This happened during your first year of life.';
    return `You were ${years.toLocaleString()} year${years === 1 ? '' : 's'} old.`;
  }
  function clearTimer() { if (state.timer) clearTimeout(state.timer); state.timer = null; }
  function schedule() { clearTimer(); if (!state.paused && state.events.length) state.timer = setTimeout(nextScene, state.duration); }
  function preloadNext() { const next = state.events[state.index + 1]; if (!next?.image) return; const img = new Image(); img.decoding = 'async'; img.src = next.image; }
  function buildCredits(events) {
    if (!ui.credits) return;
    ui.credits.innerHTML = events.map(event => `<p><strong>${event.date.slice(0,4)} &bull; ${event.title}</strong><br>${event.credit} &bull; ${event.license} &bull; <a href="${event.source}" target="_blank" rel="noopener noreferrer">Source</a></p>`).join('');
  }
  function showScene(index, immediate = false) {
    if (!state.events.length) return showFinale();
    const bounded = Math.max(0, Math.min(index, state.events.length - 1));
    const event = state.events[bounded];
    state.index = bounded;
    clearTimer();
    ui.finale?.classList.remove('is-visible');
    ui.briefing?.classList.remove('is-visible');
    ui.copy?.classList.add('is-changing');
    ui.image?.classList.remove('is-active','pan-left','pan-right');
    if (ui.fallbackYear) ui.fallbackYear.textContent = event.date.slice(0,4);
    if (ui.image) {
      ui.image.onload = () => requestAnimationFrame(() => ui.image?.classList.add('is-active'));
      ui.image.onerror = () => ui.image?.classList.remove('is-active');
      ui.image.alt = event.alt || '';
      ui.image.style.objectPosition = event.focal || '50% 50%';
      ui.image.classList.add(bounded % 2 ? 'pan-right' : 'pan-left');
      ui.image.src = event.image;
    }
    setTimeout(() => {
      if (ui.year) ui.year.textContent = event.date.slice(0,4);
      if (ui.category) ui.category.textContent = `${event.category}${event.sensitive ? ' - Reflective Moment' : ''}`;
      if (ui.title) ui.title.textContent = event.title;
      if (ui.summary) ui.summary.textContent = event.summary;
      if (ui.age) ui.age.textContent = ageAt(event.date);
      if (ui.source) { ui.source.href = event.source; ui.source.textContent = `${event.credit} - ${event.license}`; }
      if (ui.counter) ui.counter.textContent = `${bounded + 1} / ${state.events.length}`;
      if (ui.progress) ui.progress.style.width = `${((bounded + 1) / state.events.length) * 100}%`;
      ui.copy?.classList.remove('is-changing');
    }, immediate ? 0 : 260);
    preloadNext();
    schedule();
  }
  function nextScene() { state.index >= state.events.length - 1 ? showFinale() : showScene(state.index + 1); }
  function previousScene() { showScene(Math.max(0, state.index - 1)); }
  function showFinale() {
    clearTimer(); state.paused = false;
    if (ui.pause) ui.pause.textContent = 'Pause';
    ui.image?.classList.remove('is-active'); ui.finale?.classList.add('is-visible');
    const years = Math.max(0, new Date().getFullYear() - birthMoment().getFullYear());
    if (ui.finaleTitle) ui.finaleTitle.textContent = `${years.toLocaleString()} years in motion.`;
    if (ui.finaleCopy) ui.finaleCopy.textContent = `Your flight crossed ${state.events.length.toLocaleString()} defining moment${state.events.length === 1 ? '' : 's'}. History is still being written.`;
  }
  function start(mode) {
    const all = lifetimeEvents();
    state.mode = mode; state.events = mode === 'quick' ? quickEvents(all) : all; state.duration = mode === 'quick' ? 4700 : 5700; state.index = 0; state.paused = false;
    if (ui.pause) ui.pause.textContent = 'Pause';
    buildCredits(state.events);
    if (!state.events.length) {
      ui.briefing?.classList.remove('is-visible'); ui.finale?.classList.add('is-visible');
      if (ui.finaleTitle) ui.finaleTitle.textContent = 'Your flight is just beginning.';
      if (ui.finaleCopy) ui.finaleCopy.textContent = 'The prototype catalog currently ends in 2024. New defining moments will be added as history unfolds.';
      return;
    }
    showScene(0, true);
  }
  function open() {
    const all = lifetimeEvents(); const quick = quickEvents(all);
    clearTimer(); state.events = []; state.paused = false;
    ui.overlay?.classList.add('is-open'); ui.overlay?.setAttribute('aria-hidden','false'); ui.briefing?.classList.add('is-visible'); ui.finale?.classList.remove('is-visible'); ui.image?.classList.remove('is-active');
    document.body.classList.add('time-flight-open');
    if (ui.briefingTitle) ui.briefingTitle.textContent = all.length ? `Your flight begins in ${all[0].date.slice(0,4)}.` : 'Your story is ahead of this prototype.';
    if (ui.briefingCopy) ui.briefingCopy.textContent = all.length ? `Choose a highlight reel or the complete ${all.length}-moment journey. The sequence includes both inspiring and difficult world events.` : 'The first curated catalog currently covers events through 2024. Future milestones will be added as the prototype grows.';
    if (ui.quickMeta) ui.quickMeta.textContent = `${quick.length} essential moment${quick.length === 1 ? '' : 's'} - about ${Math.max(1,Math.round(quick.length*4.7/60))} min`;
    if (ui.fullMeta) ui.fullMeta.textContent = `${all.length} moment${all.length === 1 ? '' : 's'} - about ${Math.max(1,Math.round(all.length*5.7/60))} min`;
    setTimeout(() => ui.quick?.focus(),50);
  }
  function close() { clearTimer(); ui.overlay?.classList.remove('is-open'); ui.overlay?.setAttribute('aria-hidden','true'); ui.image?.classList.remove('is-active'); document.body.classList.remove('time-flight-open'); ui.launch?.focus(); }
  function togglePause() { state.paused = !state.paused; if (ui.pause) ui.pause.textContent = state.paused ? 'Resume' : 'Pause'; state.paused ? clearTimer() : schedule(); }
  function updateMeta() { const events = lifetimeEvents(); if (ui.launchMeta) ui.launchMeta.textContent = events.length ? `${events.length} lifetime moment${events.length === 1 ? '' : 's'} - Quick and Full flights` : 'Prototype catalog: 1957-2024 - More moments coming'; }

  if (!ui.overlay || !ui.launch) return;
  ui.launch.addEventListener('click', () => { updateMeta(); open(); });
  ui.close?.addEventListener('click', close); ui.finish?.addEventListener('click', close);
  ui.quick?.addEventListener('click', () => start('quick')); ui.full?.addEventListener('click', () => start('full')); ui.replay?.addEventListener('click', () => start(state.mode));
  ui.previous?.addEventListener('click', previousScene); ui.next?.addEventListener('click', nextScene); ui.pause?.addEventListener('click', togglePause);
  ui.overlay.addEventListener('pointerdown', event => { state.touchX = event.pointerType === 'touch' ? event.clientX : null; });
  ui.overlay.addEventListener('pointerup', event => {
    if (state.touchX == null || ui.briefing?.classList.contains('is-visible') || ui.finale?.classList.contains('is-visible')) return;
    const delta = event.clientX - state.touchX; state.touchX = null;
    if (Math.abs(delta) >= 70) delta < 0 ? nextScene() : previousScene();
  });
  document.addEventListener('keydown', event => {
    if (!ui.overlay?.classList.contains('is-open')) return;
    if (event.key === 'Escape') close(); else if (event.key === 'ArrowRight') nextScene(); else if (event.key === 'ArrowLeft') previousScene(); else if (event.key === ' ') { event.preventDefault(); togglePause(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!ui.overlay?.classList.contains('is-open')) return;
    if (document.hidden) clearTimer(); else if (!state.paused && !ui.briefing?.classList.contains('is-visible') && !ui.finale?.classList.contains('is-visible')) schedule();
  });
  updateMeta();
})();
