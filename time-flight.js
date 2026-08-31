(() => {
  'use strict';

const VERSION = '5.146.1';
  const STORAGE_KEY = 'lifePulseTimeFlightProgress';
  const AUDIO_PREFS_KEY = 'lifePulseAudioPreferences';
  const ASSET_ROOT = 'assets/time-flight/';
  const EVENTS = [
    { date:'1900-04-14', title:'A New Century Opens in Paris', category:'World & Culture', importance:8, quick:false, summary:'The Paris Exposition opened a vast showcase of electricity, moving pictures, engineering, art, and ideas that helped define the emerging modern age.', image:'1900-paris-exposition.jpg', focal:'50% 48%', alt:'The grounds of the 1900 Paris Exposition crowded with visitors.', credit:'Archival photograph / Wikimedia Commons', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Paris_-_exposition_universelle_1900.jpg' },
    { date:'1903-12-17', title:'Powered Flight Takes Off', category:'Technology', importance:10, quick:true, summary:'The Wright brothers achieved the first controlled, sustained flight of a powered, heavier-than-air aircraft near Kitty Hawk, North Carolina.', image:'1903-first-flight.jpg', focal:'50% 48%', alt:'The Wright Flyer lifting off at Kitty Hawk during the first powered flight.', credit:'John T. Daniels / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Wright_First_Flight_1903Dec17_(full_restore_115).jpg' },
    { date:'1905-06-30', title:'Einstein Reframes Space and Time', category:'Science', importance:10, quick:true, fit:'contain', summary:'Albert Einstein submitted his special-relativity paper, changing humanity\'s understanding of space, time, motion, and energy.', image:'1905-einstein.jpg', focal:'50% 42%', alt:'Portrait of Albert Einstein in 1905.', credit:'Lucien Chavan / Bern Historical Museum', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Albert_Einstein_in_1905_(cropped).jpg' },
    { date:'1908-10-01', title:'The Model T Puts America on Wheels', category:'Technology', importance:9, quick:false, summary:'Ford introduced the Model T, helping make automobile ownership practical for millions and reshaping cities, work, and travel.', image:'1908-model-t.jpg', focal:'50% 50%', alt:'A 1908 Ford Model T automobile.', credit:'Wikimedia Commons contributor', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:1908_Ford_Model_T.jpg' },
    { date:'1912-04-15', title:'Titanic Sinks in the North Atlantic', category:'Remembrance', importance:9, quick:false, sensitive:true, summary:'RMS Titanic sank after striking an iceberg on its maiden voyage, killing more than 1,500 people and transforming maritime-safety rules.', image:'1912-titanic.jpg', focal:'50% 48%', alt:'RMS Titanic at sea during trials in April 1912.', credit:'Archival photograph via RMS Titanic history archive', license:'Rights status not independently verified', source:'https://rms-titanic.fr/otb/essais/_t_essais.html' },
    { date:'1914-07-28', title:'World War I Begins', category:'World History', importance:10, quick:true, sensitive:true, summary:'Austria-Hungary declared war on Serbia, activating alliances that drew much of the world into a devastating four-year conflict.', image:'1914-world-war-i.jpg', focal:'50% 48%', alt:'Soldiers in a trench during World War I.', credit:'Imperial War Museum / Gyldendal via Lex', license:'Rights status not independently verified', source:'https://lex.dk/skyttegrav' },
    { date:'1918-03-11', title:'The 1918 Influenza Pandemic Spreads', category:'Global Health', importance:10, quick:true, sensitive:true, summary:'An influenza pandemic swept the globe in successive waves, killing tens of millions and revealing how closely connected public health had become.', image:'1918-influenza.jpg', focal:'50% 48%', alt:'Medical staff caring for patients in a 1918 influenza ward.', credit:'Rochester General Hospital archival photograph', license:'Rights status not independently verified', source:'https://www.historyassociates.com/looking-back-at-1918-the-human-experience-of-a-pandemic/' },
    { date:'1920-08-18', title:'Women Win the Constitutional Right to Vote', category:'Civil Rights', importance:10, quick:true, summary:'Ratification of the 19th Amendment prohibited denying U.S. citizens the vote on the basis of sex, after generations of organizing.', image:'1920-womens-suffrage.jpg', focal:'50% 44%', alt:'Women suffragists marching down Fifth Avenue in New York City.', credit:'New York Times Photo Archive / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Suffragists_Parade_Down_Fifth_Avenue,_1917.JPG' },
    { date:'1922-11-04', title:'Tutankhamun\'s Tomb Is Discovered', category:'Discovery', importance:8, quick:false, summary:'Howard Carter\'s team found the entrance to Tutankhamun\'s tomb, opening one of archaeology\'s most famous discoveries.', image:'1922-tutankhamun.jpg', focal:'50% 46%', alt:'Howard Carter and Lord Carnarvon at the entrance to Tutankhamun\'s tomb in Egypt.', credit:'Archival photograph via El Cultural', license:'Rights status not independently verified', source:'https://www.elespanol.com/el-cultural/historia/arqueologia/20221103/howard-carter-hallo-tutankamon-expulsado-revoluciono-arqueologia/713928906_0.html' },
    { date:'1925-07-10', title:'The Scopes Trial Debates Science and Faith', category:'U.S. History', importance:7, quick:false, summary:'A Tennessee courtroom became a national stage for arguments over evolution, education, religion, and modernity.', image:'1925-scopes-trial.jpg', focal:'50% 45%', alt:'Teacher John Scopes standing in the crowded courtroom during the 1925 Scopes Trial.', credit:'Famous Trials archival collection', license:'Rights status not independently verified', source:'https://famous-trials.com/scopesmonkey/2133-biographies' },
    { date:'1927-05-21', title:'Lindbergh Crosses the Atlantic Alone', category:'Aviation', importance:8, quick:false, summary:'Charles Lindbergh landed in Paris after the first solo nonstop flight across the Atlantic, demonstrating aviation\'s rapidly expanding reach.', image:'1927-lindbergh.jpg', focal:'50% 48%', alt:'Charles Lindbergh with the Spirit of St. Louis aircraft.', credit:'National Photo Company / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Lindbergh_Spirit_of_St.Louis,_6-12-27_LCCN2016843107.jpg' },
    { date:'1929-10-29', title:'Wall Street Crashes', category:'Economy', importance:10, quick:true, sensitive:true, summary:'A historic stock-market collapse deepened a worldwide economic crisis that became the Great Depression.', image:'1929-wall-street-crash.jpg', focal:'50% 48%', alt:'Crowds gathered outside the New York Stock Exchange during the 1929 crash.', credit:'Archival photograph via CNBC', license:'Rights status not independently verified', source:'https://www.cnbc.com/2021/01/27/roaring-20s-after-the-pandemic-big-banks-warn-be-careful-what-you-wish-for.html' },
    { date:'1933-03-04', title:'The New Deal Era Begins', category:'U.S. History', importance:9, quick:false, summary:'Franklin D. Roosevelt took office amid the Great Depression and launched an unprecedented program of relief, recovery, and reform.', image:'1933-fdr-inauguration.jpg', focal:'50% 46%', alt:'Franklin D. Roosevelt taking the presidential oath of office in 1933.', credit:'Architect of the Capitol archival photograph', license:'Public domain', source:'https://constitutingamerica.org/march-4-1933-president-franklin-d-roosevelt-is-inaugurated-begins-his-hundred-days-of-government-expansion-guest-essayist-andrew-langer/' },
     { date:'1936-08-09', title:'Jesse Owens Wins Four Olympic Golds', category:'Sports & Society', importance:9, quick:true, fit:'contain', summary:'Jesse Owens completed a four-gold performance at the Berlin Olympics, delivering an enduring rebuke to Nazi racial ideology.', image:'1936-jesse-owens.jpg', focal:'50% 42%', mobileFocal:'50% 42%', alt:'Jesse Owens competing at the 1936 Olympic Games in Berlin.', credit:'Unknown archival photographer via MeisterDrucke', license:'Rights status not independently verified', source:'https://www.meisterdrucke.com/kunstdrucke/Unbekannt/712756/Jesse-Owens-am-Ende-des-100m-Laufs-bei-den-Olympischen-Spielen-in-Berlin%2C-1936.html' },
    { date:'1937-05-06', title:'The Hindenburg Disaster Ends an Era', category:'Remembrance', importance:8, quick:false, sensitive:true, summary:'The airship Hindenburg caught fire while landing in New Jersey, killing 36 people and bringing the passenger-zeppelin era to a sudden end.', image:'1937-hindenburg.jpg', focal:'50% 48%', alt:'The Hindenburg airship burning while landing at Lakehurst, New Jersey.', credit:'Zeppelin Museum Friedrichshafen archive', license:'Rights status not independently verified', source:'https://www.zeppelin-museum.de/en/digital-offers/legends-myths-speculations' },
    { date:'1939-09-01', title:'World War II Begins in Europe', category:'World History', importance:10, quick:true, sensitive:true, summary:'Germany invaded Poland, beginning a global war that would transform borders, technology, government, and human life.', image:'1939-world-war-ii.jpg', focal:'50% 44%', alt:'German military forces advancing in Poland in 1939.', credit:'Deseret News archival photograph', license:'Rights status not independently verified', source:'https://www.deseret.com/utah/2024/09/01/deseret-news-archives-germany-invades-poland-then-destroyed-the-nation/' },
    { date:'1940-07-10', title:'The Battle of Britain Begins', category:'World History', importance:10, quick:true, sensitive:true, summary:'Britain and its allies fought a decisive air campaign against Nazi Germany, preventing an invasion and changing the course of World War II.', image:'1940-battle-of-britain.jpg', focal:'50% 50%', alt:'A formation of Royal Air Force fighter aircraft flying during World War II.', credit:'User-provided archival image', license:'Rights status not independently verified', source:'https://www.iwm.org.uk/history/8-things-you-need-to-know-about-the-battle-of-britain' },
    { date:'1941-12-07', title:'Pearl Harbor Brings America Into the War', category:'World History', importance:10, quick:true, sensitive:true, summary:'Japan attacked Pearl Harbor in Hawaii, leading the United States to enter World War II the following day.', image:'1941-pearl-harbor.jpg', focal:'50% 58%', alt:'The USS Shaw exploding during the Japanese attack on Pearl Harbor.', credit:'U.S. Navy / National Archives', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:USS_SHAW_exploding_Pearl_Harbor_Nara_80-G-16871_2.jpg' },
    { date:'1944-06-06', title:'Allied Forces Land in Normandy', category:'World History', importance:10, quick:true, sensitive:true, fit:'contain', summary:'More than 150,000 Allied troops crossed into Normandy on D-Day, opening the western campaign to liberate Europe from Nazi occupation.', image:'1944-d-day.jpg', focal:'50% 50%', alt:'Allied troops leaving a landing craft and moving through the surf during the Normandy landings.', credit:'Robert F. Sargent / U.S. Coast Guard / National Archives', license:'Public domain', source:'https://www.loc.gov/item/2021669739/' },
    { date:'1945-08-06', title:'Atomic Bombs Devastate Hiroshima and Nagasaki', category:'World History', importance:10, quick:true, sensitive:true, summary:'The United States dropped atomic bombs on Hiroshima on August 6 and Nagasaki on August 9. The attacks killed tens of thousands immediately, many more later, and accelerated the surrender of Japan.', image:'1945-atomic-bombings.jpg', focal:'65% 48%', mobileFocal:'64% 46%', alt:'The mushroom cloud rising above Hiroshima after the atomic bombing on August 6, 1945.', credit:'U.S. Army Air Forces / National Archives', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Atomic_cloud_over_Hiroshima.jpg' },
    { date:'1945-08-14', title:'The World Celebrates the End of World War II', category:'World History', importance:10, quick:true, sensitive:true, fit:'contain', summary:'Japan announced its surrender, setting off celebrations around the world; the formal surrender followed on September 2.', image:'1945-vj-day.jpg', focal:'50% 50%', alt:'A jubilant crowd celebrating the announced end of World War II in Washington, D.C.', credit:'U.S. Office of War Information / Library of Congress', license:'No known restrictions', source:'https://www.loc.gov/pictures/item/2017871095/' },
    { date:'1946-02-15', title:'Electronic Computing Enters a New Era', category:'Technology', importance:9, quick:false, fit:'contain', summary:'ENIAC was formally dedicated, demonstrating the speed and potential of a large-scale, general-purpose electronic computer.', image:'1946-eniac.jpg', focal:'50% 50%', alt:'The room-sized ENIAC computer with operators at its control panels.', credit:'U.S. Army photographer', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Classic_shot_of_the_ENIAC_(full_resolution).jpg' },
    { date:'1947-12-23', title:'The Transistor Changes Everything', category:'Technology', importance:10, summary:'Bell Labs demonstrated the transistor, the tiny electronic switch that became the foundation of modern computing.', image:'1947-transistor.jpg', focal:'50% 48%', alt:'The first point-contact transistor built at Bell Labs.', credit:'Unitronic', license:'CC BY-SA 3.0', source:'https://commons.wikimedia.org/wiki/File:1st-Transistor.jpg' },
    { date:'1951-06-14', title:'Computers Enter the Workplace', category:'Technology', importance:8, summary:'UNIVAC I was dedicated for the U.S. Census Bureau, bringing large-scale electronic computing into civilian government work.', image:'1951-univac.jpg', focal:'50% 50%', alt:'The UNIVAC I commercial computer at its 1951 Census Bureau dedication.', credit:'U.S. Census Bureau', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Univac_I_Census_dedication.jpg' },
    { date:'1953-04-25', title:'DNA Reveals Its Structure', category:'Science', importance:9, summary:'The double-helix structure of DNA was published, transforming how humanity understands heredity and life.', image:'1953-dna.jpg', focal:'50% 50%', alt:'A scientific visualization of the DNA double helix.', credit:'National Human Genome Research Institute / NIH', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:DNA_Double_Helix_(20468181866).jpg' },
    { date:'1954-05-17', title:'School Segregation Is Ruled Unconstitutional', category:'Civil Rights', importance:10, quick:false, summary:'In Brown v. Board of Education, the U.S. Supreme Court unanimously rejected racial segregation in public schools.', image:'1954-brown.jpg', focal:'50% 48%', alt:'A mother and child reading a newspaper announcing the Brown v. Board school-segregation ruling outside the U.S. Supreme Court.', credit:'User-provided archival image', license:'Rights status not independently verified', source:'https://www.archives.gov/milestone-documents/brown-v-board-of-education' },
    { date:'1955-04-12', title:'The Polio Vaccine Proves Itself', category:'Global Health', importance:9, summary:'Results from an enormous field trial showed the Salk polio vaccine was safe and effective, changing childhood health worldwide.', image:'1955-polio.jpg', focal:'54% 42%', alt:'Dr. Jonas Salk holding laboratory test tubes during his work on the polio vaccine.', credit:'User-provided archival image', license:'Rights status not independently verified', source:'https://www.cdc.gov/polio/about/index.html' },
    { date:'1957-10-04', title:'The Space Age Begins', category:'Space', importance:10, fit:'contain', summary:'Sputnik 1 became the first artificial satellite, turning the sky above Earth into a new frontier.', image:'1957-sputnik.jpg', focal:'50% 42%', alt:'Sputnik 1 displayed at the National Museum of the United States Air Force.', credit:'U.S. Air Force / National Museum of the U.S. Air Force', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Sputnik_1.jpg' },
    { date:'1961-04-12', title:'A Human Orbits Earth', category:'Space', importance:10, summary:'Yuri Gagarin completed the first human journey into outer space and returned safely to Earth.', image:'1961-gagarin.jpg', focal:'50% 28%', alt:'Portrait of cosmonaut Yuri Gagarin.', credit:'Wikimedia Commons contributor', license:'See source page', source:'https://commons.wikimedia.org/wiki/File:Yuri_Gagarin_(1961).jpg' },
    { date:'1962-10-22', title:'The World Confronts Nuclear Crisis', category:'World History', importance:10, quick:false, summary:'The Cuban Missile Crisis brought the United States and Soviet Union dangerously close to nuclear conflict before diplomacy prevailed.', image:'1962-cuban.jpg', focal:'50% 44%', alt:'President Kennedy meeting with advisers during the Cuban Missile Crisis.', credit:'Cecil Stoughton / John F. Kennedy Presidential Library', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:EXCOMM_meeting,_Cuban_Missile_Crisis,_29_October_1962.jpg' },
    { date:'1963-08-28', title:'The March on Washington', category:'Civil Rights', importance:10, summary:'Hundreds of thousands gathered in Washington, D.C., demanding jobs, freedom, and equal civil rights.', image:'1963-march.jpg', focal:'50% 50%', alt:'A large crowd gathered during the March on Washington.', credit:'Warren K. Leffler / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:View_of_the_huge_crowd_March_on_Washington.jpg' },
    { date:'1963-11-22', title:'President Kennedy Is Assassinated', category:'Remembrance', importance:10, quick:true, sensitive:true, summary:'John F. Kennedy was assassinated in Dallas, a national trauma that became one of the defining moments of the 20th century.', image:'1963-jfk.jpg', focal:'50% 40%', alt:'President Kennedy and First Lady Jacqueline Kennedy in the Dallas motorcade shortly before the assassination.', credit:'Victor Hugo King / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:John_F._Kennedy_motorcade,_Dallas.jpg' },
    { date:'1964-07-02', title:'The Civil Rights Act Becomes Law', category:'Civil Rights', importance:10, quick:false, summary:'The Civil Rights Act outlawed discrimination in public places and employment, reshaping American law and public life.', image:'1964-civil-rights.jpg', focal:'50% 44%', alt:'President Lyndon Johnson signing the Civil Rights Act as Martin Luther King Jr. and others look on.', credit:'White House / Lyndon B. Johnson Presidential Library', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Lyndon_Johnson_signing_Civil_Rights_Act,_July_2,_1964.jpg' },
    { date:'1965-08-06', title:'Voting Rights Become Law', category:'Civil Rights', importance:10, summary:'The Voting Rights Act was signed, outlawing major barriers used to deny Black Americans access to the ballot.', image:'1965-voting-rights.jpg', focal:'50% 48%', alt:'President Lyndon Johnson signing the Voting Rights Act with civil-rights leaders present.', credit:'Lyndon B. Johnson Presidential Library', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:LyndonJohnson_signs_Voting_Rights_Act_of_1965.jpg' },
    { date:'1968-04-04', title:'Martin Luther King Jr. Is Assassinated', category:'Remembrance', importance:10, quick:false, sensitive:true, fit:'contain', summary:'The assassination of Martin Luther King Jr. brought worldwide grief while strengthening the resolve to continue his work for justice.', image:'1968-mlk.jpg', focal:'50% 30%', alt:'Portrait of civil-rights leader Martin Luther King Jr.', credit:'New York World-Telegram and the Sun / Library of Congress', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Martin_Luther_King_Jr_NYWTS_4.jpg' },
    { date:'1968-06-06', title:'Robert F. Kennedy Is Assassinated', category:'Remembrance', importance:9, quick:true, sensitive:true, fit:'contain', summary:'Robert F. Kennedy was shot after winning the California Democratic presidential primary and died the following day, deepening a year of national grief and upheaval.', image:'1968-rfk.jpg', focal:'50% 46%', alt:'Robert F. Kennedy speaking to reporters during his 1968 presidential campaign in Los Angeles.', credit:'Evan Freed', license:'Public domain in the United States', source:'https://commons.wikimedia.org/wiki/File:Robert_Kennedy_in_Los_Angeles.jpg' },
    { date:'1968-12-24', title:'Earthrise Changes Our View', category:'Space & Earth', importance:9, fit:'contain', summary:'Apollo 8 photographed Earth rising above the Moon, revealing a fragile world without visible borders.', image:'1968-earthrise.jpg', focal:'50% 48%', alt:'Earth rising above the lunar horizon as photographed by Apollo 8.', credit:'NASA / William Anders', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise.jpg' },
    { date:'1969-06-28', title:'The Stonewall Uprising', category:'Civil Rights', importance:9, quick:false, summary:'Resistance following a police raid at New York\'s Stonewall Inn became a landmark in the modern movement for LGBTQ+ rights.', image:'1969-stonewall.jpg', focal:'50% 46%', alt:'The Stonewall Inn in New York City, the site of the 1969 uprising.', credit:'Rhododendrites', license:'CC BY-SA 4.0', source:'https://commons.wikimedia.org/wiki/File:Stonewall_Inn_5_pride_weekend_2016.jpg' },
    { date:'1969-07-20', title:'Humans Walk on the Moon', category:'Space', importance:10, fit:'contain', summary:'Apollo 11 placed the first people on another world as hundreds of millions watched from Earth.', image:'1969-apollo11.jpg', focal:'50% 42%', alt:'Astronaut Buzz Aldrin standing on the lunar surface during Apollo 11.', credit:'Neil Armstrong / NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Aldrin_Apollo_11.jpg' },
    { date:'1972-12-07', title:'The Whole Earth Comes Into View', category:'Space & Earth', importance:8, fit:'contain', summary:'Apollo 17 captured the Blue Marble, one of the first clear photographs of a fully illuminated Earth.', image:'1972-blue-marble.jpg', focal:'50% 50%', alt:'The fully illuminated Earth photographed by the Apollo 17 crew.', credit:'NASA / Apollo 17 crew', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg' },
    { date:'1973-01-27', title:'The Paris Peace Accords Are Signed', category:'World History', importance:9, quick:false, summary:'The United States, North Vietnam, South Vietnam, and the Viet Cong signed an agreement intended to end direct U.S. military involvement in Vietnam.', image:'1973-vietnam-peace.jpg', focal:'50% 45%', alt:'U.S. Secretary of State William Rogers signing the Paris Peace Accords.', credit:'U.S. National Archives', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Vietnam_peace_agreement_signing.jpg' },
    { date:'1975-07-17', title:'A Handshake in Orbit', category:'Space & Diplomacy', importance:8, summary:'American and Soviet crews docked in orbit during Apollo-Soyuz, turning a Cold War rivalry into cooperation in space.', image:'1975-apollo-soyuz.jpg', focal:'50% 45%', alt:'Astronaut Thomas Stafford and cosmonaut Alexei Leonov shaking hands in orbit.', credit:'NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:ASTP_handshake_-_cropped.jpg' },
    { date:'1977-09-05', title:'Voyager Leaves for the Outer Planets', category:'Space', importance:8, fit:'contain', summary:'Voyager 1 launched carrying instruments and a golden record intended to represent life on Earth.', image:'1977-voyager.jpg', focal:'50% 55%', alt:'Voyager 1 launching aboard a Titan-Centaur rocket.', credit:'NASA on The Commons', license:'No known copyright restrictions', source:'https://commons.wikimedia.org/wiki/File:Voyager_1_Launch.jpg' },
    { date:'1979-11-04', title:'The Iran Hostage Crisis Begins', category:'World History', importance:9, quick:false, sensitive:true, summary:'Militant students seized the U.S. Embassy in Tehran and held 52 Americans for 444 days, transforming relations between Iran and the United States.', image:'1979-iran-hostage.jpg', focal:'50% 46%', alt:'Students climbing the gates of the U.S. Embassy in Tehran during the hostage crisis.', credit:'Wikimedia Commons contributor', license:'CC BY-SA 4.0 / PD-Iran noted at source', source:'https://commons.wikimedia.org/wiki/File:Iran_hostage_crisis_-_Iraninan_students_comes_up_U.S._embassy_in_Tehran.jpg' },
    { date:'1980-05-08', title:'Smallpox Is Eradicated', category:'Global Health', importance:10, quick:true, fit:'contain', summary:'The World Health Assembly declared smallpox eradicated, the first and still only human infectious disease eliminated worldwide.', image:'1980-smallpox.jpg', focal:'50% 50%', alt:'A chart showing the collapse of smallpox and other vaccine-preventable diseases after vaccination.', credit:'Our World in Data / Wikimedia Commons', license:'CC BY 4.0', source:'https://commons.wikimedia.org/wiki/File:Reduction_of_cases_and_deaths_of_vaccine-preventable_diseases_in_the_United_States_after_introducing_the_vaccine.png' },
    { date:'1981-03-30', title:'President Reagan Survives an Assassination Attempt', category:'U.S. History', importance:8, sensitive:true, summary:'Ronald Reagan was shot outside the Washington Hilton and survived after emergency surgery. Three other people were wounded, including press secretary James Brady.', image:'1981-reagan-attempt.jpg', focal:'48% 48%', alt:'President Ronald Reagan waving outside the Washington Hilton immediately before the assassination attempt.', credit:'Michael Evans / White House Photographic Office / National Archives', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Photograph_of_President_Reagan_waving_to_crowds_immediately_before_being_shot_in_an_assassination_attempt,_Washington..._-_NARA_-_198513.jpg' },
    { date:'1981-04-12', title:'The Space Shuttle Era Begins', category:'Space & Technology', importance:8, fit:'contain', summary:'Columbia launched on STS-1, introducing the first reusable orbital spacecraft system.', image:'1981-shuttle.jpg', focal:'50% 58%', alt:'Space Shuttle Columbia lifting off at the start of STS-1.', credit:'NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Sts1-liftoff-columbia.triddle.jpg' },
    { date:'1984-01-24', title:'Personal Computing Finds a New Face', category:'Technology', importance:8, summary:'The Macintosh brought a graphical interface and mouse-driven computing to a much wider public.', image:'1984-macintosh.jpg', focal:'50% 48%', alt:'An original Macintosh 128K computer photographed in 1984.', credit:'Bernard Gotfryd / Library of Congress', license:'No known copyright restrictions', source:'https://commons.wikimedia.org/wiki/File:Macintosh_128k_computer,_January_1984,_by_Bernard_Gotfryd_-_(cropped_to_remove_individual).jpg' },
    { date:'1986-01-28', title:'The Challenger Disaster', category:'Remembrance', importance:9, sensitive:true, summary:'Space Shuttle Challenger and its seven crew members were lost shortly after launch, reshaping the U.S. space program.', image:'1986-challenger.jpg', focal:'50% 42%', alt:'Vapor trails following the Space Shuttle Challenger disaster.', credit:'NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Challenger_explosion.jpg' },
     { date:'1986-04-26', title:'The Chernobyl Nuclear Disaster', category:'Global Disaster', importance:10, quick:false, sensitive:true, fit:'contain', summary:'A reactor exploded at the Chernobyl nuclear power plant, spreading radioactive contamination and permanently changing nuclear-safety policy.', image:'1986-chernobyl-user.jpg', focal:'50% 50%', mobileFocal:'50% 50%', alt:'Aerial view of the destroyed Chernobyl reactor complex after the 1986 nuclear disaster.', credit:'User-provided archival image', license:'Rights status not independently verified', source:'https://www.iaea.org/newscenter/focus/chernobyl' },
     { date:'1988-12-21', title:'Pan Am Flight 103 Is Bombed Over Lockerbie', category:'Remembrance', importance:10, quick:true, sensitive:true, fit:'contain', summary:'A bomb destroyed Pan Am Flight 103 over Lockerbie, Scotland, killing all 259 people aboard and 11 people on the ground. The memorial image honors the 270 lives lost.', image:'1988-pan-am-103.jpg', focal:'50% 50%', mobileFocal:'50% 50%', alt:'Pan Am Flight 103 Memorial at Arlington National Cemetery.', credit:'Rachel Larue / Arlington National Cemetery via Wikimedia Commons', license:'U.S. Army public domain', source:'https://commons.wikimedia.org/wiki/File:Pan_Am_Flight_103_Memorial_(18840431195).jpg' },
    { date:'1989-11-09', title:'The Berlin Wall Opens', category:'World History', importance:10, summary:'Crowds crossed a border that had divided Berlin for decades, accelerating the end of the Cold War in Europe.', image:'1989-berlin-wall.jpg', focal:'50% 42%', alt:'People standing atop the Berlin Wall near the Brandenburg Gate.', credit:'Sue Ream', license:'CC BY 3.0', source:'https://commons.wikimedia.org/wiki/File:BerlinWall-BrandenburgGate.jpg' },
    { date:'1991-08-06', title:'The World Wide Web Goes Public', category:'Technology', importance:10, summary:'The first public website introduced a system that would eventually connect information and billions of people.', image:'1991-web.jpg', focal:'50% 52%', alt:'The NeXT computer used by Tim Berners-Lee as the first web server at CERN.', credit:'Coolcaesar', license:'CC BY-SA 3.0', source:'https://commons.wikimedia.org/wiki/File:First_Web_Server.jpg' },
    { date:'1991-12-26', title:'The Soviet Union Dissolves', category:'World History', importance:10, quick:false, summary:'The Soviet Union formally ceased to exist, ending a superpower rivalry that had shaped global politics for nearly half a century.', image:'1991-soviet-flag.jpg', focal:'50% 46%', alt:'A Soviet flag photographed in 1991, the final year of the Soviet Union.', credit:'fdecomite', license:'CC BY 2.0', source:'https://commons.wikimedia.org/wiki/File:Soviet_flag_(4388335024).jpg' },
    { date:'1994-04-07', title:'Genocide Begins in Rwanda', category:'Remembrance', importance:10, quick:false, sensitive:true, summary:'Over roughly one hundred days, extremist forces murdered hundreds of thousands of Tutsi and moderate Hutu people while the world failed to stop the violence.', image:'1994-rwanda.jpg', focal:'50% 48%', alt:'The Nyamata Genocide Memorial in Rwanda.', credit:'IGANZE', license:'CC0 1.0', source:'https://commons.wikimedia.org/wiki/File:Genocide_memorial_of_Nyamata.jpg' },
    { date:'1994-05-10', title:'Mandela Leads a New South Africa', category:'World History', importance:10, fit:'contain', summary:'Nelson Mandela became South Africa\'s first Black president after the country\'s first fully democratic election.', image:'1994-mandela.jpg', focal:'50% 34%', alt:'Nelson Mandela in 1994, the year he became South Africa\'s first Black president.', credit:'John Mathew Smith / Kingkongphoto', license:'CC BY-SA 2.0', source:'https://commons.wikimedia.org/wiki/File:Nelson_Mandela_1994.jpg' },
    { date:'1996-01-15', title:'Hubble Looks Into Deep Time', category:'Science', importance:8, summary:'The Hubble Deep Field revealed thousands of distant galaxies in a seemingly empty patch of sky.', image:'1996-hubble.jpg', focal:'50% 50%', alt:'The Hubble Deep Field mosaic containing many distant galaxies.', credit:'R. Williams, HDF Team and NASA', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Hubble_deep_field.jpg' },
    { date:'1997-02-22', title:'Dolly Introduces the Cloning Era', category:'Science', importance:9, quick:false, fit:'contain', summary:'Scientists announced Dolly, the first mammal cloned from an adult cell, opening new possibilities and ethical debates in biology.', image:'1997-dolly.jpg', focal:'50% 46%', alt:'Dolly the sheep preserved at the National Museum of Scotland.', credit:'Sgerbic', license:'CC BY-SA 4.0', source:'https://commons.wikimedia.org/wiki/File:Dolly_the_Sheep_National_Museum_of_Scotland.jpg' },
    { date:'1998-12-06', title:'The International Space Station Takes Shape', category:'Space & Cooperation', importance:8, summary:'The first two station modules were joined in orbit, beginning construction of a permanent international laboratory in space.', image:'1998-iss.jpg', focal:'50% 48%', alt:'The Zarya module during the first International Space Station assembly mission.', credit:'NASA on The Commons', license:'No known copyright restrictions', source:'https://commons.wikimedia.org/wiki/File:Zarya_Module_-_International_Space_Station.jpg' },
    { date:'2001-09-11', title:'September 11, 2001', category:'Remembrance', importance:10, sensitive:true, summary:'Coordinated terrorist attacks killed nearly 3,000 people and changed security, foreign policy, and daily life around the world.', image:'2001-september11.jpg', focal:'67% 47%', mobileFocal:'66% 45%', alt:'United Airlines Flight 175 approaching the World Trade Center as smoke pours from the North Tower on September 11, 2001.', credit:'Robert Clark / INSTITUTE', license:'Copyright Robert Clark - limited private review', source:'https://time.com/3449480/911-the-photographs-that-moved-them-most/' },
    { date:'2003-02-01', title:'Space Shuttle Columbia Is Lost', category:'Remembrance', importance:10, sensitive:true, summary:'Space Shuttle Columbia broke apart during re-entry at the end of mission STS-107, killing all seven crew members and reshaping NASA\'s approach to shuttle safety.', image:'2003-columbia.jpg', focal:'50% 52%', mobileFocal:'50% 48%', alt:'Bright trails and fragments from Space Shuttle Columbia during its final re-entry on February 1, 2003.', credit:'User-provided image', license:'Rights status not independently verified - limited private review', source:'https://www.nasa.gov/mission/sts-107/' },
    { date:'2003-04-14', title:'The Human Genome Project Is Completed', category:'Science & Health', importance:10, quick:true, fit:'contain', summary:'An international research effort completed an essentially comprehensive sequence of the human genome, transforming medicine and biological research.', image:'2003-human-genome.jpg', focal:'50% 50%', alt:'The Human Genome Project logo representing the international mapping effort.', credit:'U.S. Department of Energy Human Genome Program', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Logo_HGP.jpg' },
    { date:'2004-12-26', title:'The Indian Ocean Tsunami', category:'Global Disaster', importance:9, sensitive:true, summary:'A powerful undersea earthquake generated a tsunami across the Indian Ocean, prompting an unprecedented global relief effort.', image:'2004-tsunami.jpg', focal:'50% 54%', alt:'A mosque standing amid tsunami damage in Banda Aceh.', credit:'U.S. Geological Survey', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:Aceh_2004_tsunami_standing_mosque_USGS_(cropped).jpg' },
    { date:'2007-06-29', title:'The Smartphone Era Arrives', category:'Technology', importance:9, quick:false, summary:'The first iPhone went on sale, helping turn the mobile phone into a pocket computer, camera, navigator, and gateway to the internet.', image:'2007-iphone.jpg', focal:'50% 48%', alt:'A first-generation iPhone.', credit:'Carl Berkeley', license:'CC BY-SA 2.0', source:'https://commons.wikimedia.org/wiki/File:IPhone_First_Generation.jpg' },
    { date:'2008-09-10', title:'The Large Hadron Collider Starts', category:'Science', importance:8, summary:'The world’s largest particle accelerator began operations, opening a new window into the structure of matter.', image:'2008-lhc.jpg', focal:'50% 52%', alt:'The Large Hadron Collider tunnel at CERN.', credit:'Chris Mitchell', license:'CC BY-SA 4.0', source:'https://commons.wikimedia.org/wiki/File:CERN_Large_Hadron_Collider.jpg' },
    { date:'2011-03-11', title:'Earthquake and Tsunami Strike Japan', category:'Global Disaster', importance:10, quick:false, sensitive:true, summary:'A magnitude 9.0 earthquake and immense tsunami devastated northeastern Japan and triggered the Fukushima nuclear disaster.', image:'2011-tohoku.jpg', focal:'50% 48%', alt:'A rescue helicopter flying over tsunami damage near Sendai, Japan.', credit:'U.S. Navy', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:SH-60B_helicopter_flies_over_Sendai.jpg' },
    { date:'2012-07-04', title:'Evidence of the Higgs Boson', category:'Science', importance:9, fit:'contain', summary:'Scientists announced a particle consistent with the Higgs boson, completing a crucial piece of the Standard Model.', image:'2012-higgs.jpg', focal:'50% 50%', alt:'A three-dimensional display of a 2012 CMS particle-collision event with characteristics expected from Higgs boson decay.', credit:'Thomas McCauley, Lucas Taylor / CMS Collaboration', license:'CC BY-SA 3.0', source:'https://commons.wikimedia.org/wiki/File:3D_view_of_an_event_recorded_with_the_CMS_detector_in_2012_at_a_proton-proton_centre_of_mass_energy_of_8_TeV.png' },
    { date:'2015-07-14', title:'Pluto Revealed', category:'Space', importance:8, summary:'New Horizons completed humanity’s first close encounter with Pluto after a journey of nearly a decade.', image:'2015-pluto.jpg', focal:'50% 50%', alt:'Pluto photographed by the New Horizons spacecraft.', credit:'NASA / Johns Hopkins APL / Southwest Research Institute', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:NH-Pluto-bw-NewHorizons-20150713a.jpg' },
    { date:'2015-12-12', title:'Nations Adopt the Paris Climate Agreement', category:'Earth & Climate', importance:9, quick:false, summary:'Representatives of nearly every nation adopted a shared framework for limiting climate change and strengthening resilience.', image:'2015-paris-agreement.jpg', focal:'50% 42%', alt:'The COP21 conference president bringing down the gavel after adoption of the Paris Agreement.', credit:'U.S. Department of State', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:French_Foreign_Minister_Fabius_Bangs_Down_the_Gavel_After_Representatives_of_196_Countries_Approved_a_Sweeping_Environmental_Agreement_at_COP21_in_Paris_(23408651520).jpg' },
    { date:'2019-04-10', title:'The First Image of a Black Hole', category:'Science', importance:9, summary:'A planet-wide telescope network revealed the shadow of a supermassive black hole, making the previously invisible visible.', image:'2019-black-hole.jpg', focal:'50% 50%', alt:'The first direct visual evidence of a black hole’s shadow in Messier 87.', credit:'Event Horizon Telescope Collaboration', license:'CC BY 4.0', source:'https://commons.wikimedia.org/wiki/File:Black_hole_-_Messier_87.jpg' },
    { date:'2020-03-11', title:'A Pandemic Reshapes Daily Life', category:'Global Health', importance:10, sensitive:true, summary:'COVID-19 was characterized as a pandemic, transforming public health, work, travel, education, and human connection.', image:'2020-covid.jpg', focal:'50% 50%', alt:'A scientific illustration of the SARS-CoV-2 virus.', credit:'Alissa Eckert and Dan Higgins / CDC', license:'Public domain', source:'https://commons.wikimedia.org/wiki/File:SARS-CoV-2_without_background.png' },
     { date:'2022-02-24', title:'Russia Launches Its Full-Scale Invasion of Ukraine', category:'World History', importance:10, quick:true, sensitive:true, fit:'contain', summary:'Russia launched a full-scale invasion of Ukraine, producing mass displacement, destruction, and a major shift in global security.', image:'2022-russia-ukraine-user.jpg', focal:'50% 50%', mobileFocal:'50% 50%', alt:'A column of military vehicles moving along a road during the Russia-Ukraine war.', credit:'User-provided image', license:'Rights status not independently verified', source:'https://www.un.org/en/chronicle/article/war-ukraine' },
    { date:'2022-07-11', title:'Webb Opens a New View of the Universe', category:'Space & Science', importance:9, summary:'The first full-color image from the James Webb Space Telescope revealed thousands of galaxies in extraordinary infrared detail.', image:'2022-webb.jpg', focal:'50% 50%', alt:'Webb\'s First Deep Field showing the galaxy cluster SMACS 0723.', credit:'NASA, ESA, CSA and STScI', license:'Public domain with source credit', source:'https://commons.wikimedia.org/wiki/File:Webb%27s_First_Deep_Field.jpg' },
    { date:'2024-04-08', title:'Totality Crosses North America', category:'Shared Sky', importance:7, summary:'A total solar eclipse swept across Mexico, the United States, and Canada, drawing millions outside to share the sky.', image:'2024-eclipse.jpg', focal:'50% 50%', alt:'The detailed solar corona visible during the total solar eclipse of April 8, 2024.', credit:'Brucewaters', license:'CC BY 4.0', source:'https://commons.wikimedia.org/wiki/File:2024_Total_Solar_Eclipse_Corona.jpg' },
    { date:'2024-07-13', title:'Donald Trump Survives an Assassination Attempt', category:'U.S. History', importance:8, sensitive:true, summary:'A gunman opened fire during a campaign rally in Butler, Pennsylvania. Donald Trump was wounded, one attendee was killed, and two other spectators were seriously wounded.', image:'2024-trump-attempt.jpg', focal:'52% 42%', mobileFocal:'51% 39%', alt:'Donald Trump raising his fist while surrounded by Secret Service agents after the assassination attempt, with an American flag behind him.', credit:'Evan Vucci / Associated Press', license:'Copyright AP - limited private review', source:'https://www.ap.org/news-highlights/spotlights/2024/in-a-world-of-moving-pictures-photographs-capture-indelible-moments-in-trump-assassination-attempt/' },
    { date:'2026-08-30', title:'Roman Launches to Map the Dark Universe', category:'Space & Science', importance:9, quick:true, summary:'NASA\'s Nancy Grace Roman Space Telescope launched aboard a SpaceX Falcon Heavy from Kennedy Space Center, beginning its journey toward Sun-Earth L2 to survey dark energy, dark matter, exoplanets, and vast regions of the infrared sky.', image:'2026-roman-launch.jpg', focal:'50% 50%', mobileFocal:'50% 50%', alt:'A SpaceX Falcon Heavy carrying NASA\'s Nancy Grace Roman Space Telescope launches from Kennedy Space Center on August 30, 2026.', credit:'NASA / John Kraus', license:'NASA image — follow NASA media usage guidelines', source:'https://www.nasa.gov/news-release/nasas-dark-universe-seeking-nancy-grace-roman-space-telescope-launches/' }
  ];

  const state = { events:[], mode:'quick', index:0, startIndex:0, timer:null, warpTimer:null, paused:false, duration:4700, gesture:null, scrubbing:false, lastFocus:null, imageFailures:new Set(), health:{state:'fallback', detail:'Time Flight has not been checked yet.', checkedAt:null}, nearbyMode:false };
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  const $ = id => document.getElementById(id);
  const ui = {
    overlay:$('time-flight-overlay'), visual:$('time-flight-visual'), launch:$('time-flight-launch-btn'), launchMeta:$('time-flight-launch-meta'), close:$('time-flight-close'),
    briefing:$('time-flight-briefing'), briefingTitle:$('time-flight-briefing-title'), briefingCopy:$('time-flight-briefing-copy'),
    quick:$('time-flight-quick'), full:$('time-flight-full'), history:$('time-flight-history'), resume:$('time-flight-resume'), quickMeta:$('time-flight-quick-meta'), fullMeta:$('time-flight-full-meta'), historyMeta:$('time-flight-history-meta'), resumeMeta:$('time-flight-resume-meta'),
    finale:$('time-flight-finale'), finaleTitle:$('time-flight-finale-title'), finaleCopy:$('time-flight-finale-copy'), replay:$('time-flight-replay'), onThisDate:$('time-flight-on-this-date'), finish:$('time-flight-finish'), credits:$('time-flight-credits-list'),
    image:$('time-flight-image'), fallbackYear:$('time-flight-fallback-year'), fallbackCopy:$('time-flight-fallback-copy'), loader:$('time-flight-loader'), copy:$('time-flight-scene-copy'), year:$('time-flight-year'), category:$('time-flight-category'), title:$('time-flight-title'), summary:$('time-flight-summary'), age:$('time-flight-age'), source:$('time-flight-source'),
    progress:$('time-flight-progress'), previous:$('time-flight-previous'), pause:$('time-flight-pause'), next:$('time-flight-next'), counter:$('time-flight-counter'), timeline:$('time-flight-timeline'), scrubber:$('time-flight-year-scrubber'), scrubberYear:$('time-flight-scrubber-year'), scrubberStart:$('time-flight-scrubber-start'), scrubberEnd:$('time-flight-scrubber-end'), decadeLabels:$('time-flight-decade-labels')
  };

  function birthMoment() {
    const value = window.getLifePulseBirthMoment?.();
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date('1947-01-01T12:00:00');
  }
  function lifetimeEvents() {
    const birth = birthMoment();
    const now = new Date();
    return EVENTS.filter(event => { const moment = new Date(`${event.date}T12:00:00`); return moment >= birth && moment <= now; });
  }
  function historicalEvents() {
    const now = new Date();
    return EVENTS.filter(event => { const moment = new Date(`${event.date}T12:00:00`); return moment.getFullYear() >= 1900 && moment <= now; });
  }
  function quickEvents(events) {
    if (events.length <= 11) return events.slice();
    const selected = events.filter(event => event.quick === true || (event.quick !== false && event.importance >= 9));
    if (!selected.includes(events[0])) selected.unshift(events[0]);
    if (!selected.includes(events.at(-1))) selected.push(events.at(-1));
    return selected;
  }
  function dayDistance(dateText, reference = new Date()) {
    const [,month,day] = dateText.split('-').map(Number);
    const candidate = new Date(reference.getFullYear(), month - 1, day);
    const yearMs = 365.2425 * 86400000;
    const raw = Math.abs(candidate - new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()));
    return Math.min(raw, yearMs - raw) / 86400000;
  }
  function anniversaryEvents() {
    const exact = lifetimeEvents().filter(event => dayDistance(event.date) < 0.5);
    return exact.length ? exact : lifetimeEvents().filter(event => dayDistance(event.date) <= 14).sort((a,b) => dayDistance(a.date) - dayDistance(b.date));
  }
  function ageAt(dateText) {
    const birth = birthMoment();
    const moment = new Date(`${dateText}T12:00:00`);
    let years = moment.getFullYear() - birth.getFullYear();
    const birthday = new Date(moment.getFullYear(), birth.getMonth(), birth.getDate(), birth.getHours(), birth.getMinutes());
    if (moment < birthday) years -= 1;
    if (years < 0) {
      const yearsBefore = Math.floor((birth - moment) / (365.2425 * 86400000));
      if (yearsBefore < 1) return 'This happened before you were born.';
      return `${yearsBefore.toLocaleString()} year${yearsBefore === 1 ? '' : 's'} before you were born.`;
    }
    if (years === 0) return 'This happened during your first year of life.';
    return `You were ${years.toLocaleString()} year${years === 1 ? '' : 's'} old.`;
  }
  function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } }
  function saveProgress(completed = false) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version:VERSION, mode:state.mode, index:state.index, completed, updatedAt:new Date().toISOString() })); } catch {} }
  function clearTimer() { if (state.timer) clearTimeout(state.timer); state.timer = null; }
  function schedule() { clearTimer(); if (!reducedMotion && !state.paused && state.events.length) state.timer = setTimeout(nextScene, state.duration); }
  function nearestEventIndexForYear(year) {
    if (!state.events.length) return 0;
    return state.events.reduce((best,indexedEvent,index) => Math.abs(Number(indexedEvent.date.slice(0,4)) - year) < Math.abs(Number(state.events[best].date.slice(0,4)) - year) ? index : best, 0);
  }
  function firstEventIndexAtOrAfterBirth(events) {
    if (!events.length) return 0;
    const birth = birthMoment();
    const index = events.findIndex(event => new Date(`${event.date}T12:00:00`) >= birth);
    return index < 0 ? events.length - 1 : index;
  }
  function buildTimeline() {
    if (!state.events.length || !ui.scrubber) return;
    const firstYear = 1900;
    const lastYear = new Date().getFullYear();
    ui.scrubber.min = String(firstYear); ui.scrubber.max = String(lastYear); ui.scrubber.step = '1';
    if (ui.scrubberStart) ui.scrubberStart.textContent = String(firstYear);
    if (ui.scrubberEnd) ui.scrubberEnd.textContent = String(lastYear);
    if (ui.decadeLabels) {
      const firstDecade = Math.ceil(firstYear / 10) * 10;
      const labels = [];
      for (let year = firstDecade; year <= lastYear; year += 10) {
        const position = lastYear === firstYear ? 0 : ((year - firstYear) / (lastYear - firstYear)) * 100;
        const showLabel = year === firstDecade || year === Math.floor(lastYear / 10) * 10 || year % 20 === 0;
        labels.push(`<span class="time-flight-decade-tick${showLabel ? ' is-labeled' : ''}" style="left:${position.toFixed(2)}%"><span>${showLabel ? year : ''}</span></span>`);
      }
      ui.decadeLabels.innerHTML = labels.join('');
    }
  }
  function syncTimeline(event) {
    if (!event || !ui.scrubber) return;
    const year = Number(event.date.slice(0,4));
    const minimum = Number(ui.scrubber.min || year), maximum = Number(ui.scrubber.max || year);
    const displayedYear = state.scrubbing ? Number(ui.scrubber.value || year) : year;
    if (!state.scrubbing) ui.scrubber.value = String(year);
    ui.scrubber.setAttribute('aria-valuetext', `${year}: ${event.title}`);
    ui.scrubber.style.setProperty('--timeline-progress', `${maximum === minimum ? 0 : ((displayedYear - minimum) / (maximum - minimum)) * 100}%`);
    if (ui.scrubberYear) ui.scrubberYear.textContent = String(displayedYear);
  }
  function imageUrl(event) { return `${ASSET_ROOT}${event.image}`; }
  function preloadEvent(event) { if (!event?.image) return; const image = new Image(); image.decoding = 'async'; image.src = imageUrl(event); }
  function preloadNext() { preloadEvent(state.events[state.index + 1]); }
  function applySceneFraming(event) {
    if (!event || !ui.image || !ui.visual) return;
    const compact = window.matchMedia?.('(max-width: 1024px)')?.matches || false;
    const frameWidth = ui.visual.clientWidth || window.innerWidth;
    const frameHeight = ui.visual.clientHeight || window.innerHeight;
    const viewportRatio = Math.max(1, frameWidth) / Math.max(1, frameHeight);
    const imageRatio = ui.image.naturalWidth && ui.image.naturalHeight
      ? ui.image.naturalWidth / ui.image.naturalHeight
      : viewportRatio;
    const focus = compact && event.mobileFocal ? event.mobileFocal : (event.focal || '50% 50%');
    const aspectMismatch = imageRatio < viewportRatio * (compact ? 0.78 : 0.72)
      || imageRatio > viewportRatio * (compact ? 1.18 : 1.42);
    const adaptive = aspectMismatch;
    const contain = event.fit === 'contain' && !adaptive;
    const preserve = adaptive || contain;
    const sceneUrl = imageUrl(event).replace(/"/g, '%22');
    ui.image.style.objectPosition = focus;
    ui.image.classList.toggle('fit-adaptive', adaptive);
    ui.image.classList.toggle('fit-contain', contain);
    ui.visual.classList.toggle('preserve-scene', preserve);
    ui.visual.style.setProperty('--time-flight-scene-image', `url("${sceneUrl}")`);
    ui.visual.style.setProperty('--time-flight-scene-focus', focus);
  }
  function buildCredits(events) {
    if (!ui.credits) return;
    const unique = events.filter((event,index,list) => list.findIndex(item => item.image === event.image) === index);
    ui.credits.innerHTML = unique.map(event => `<p><strong>${event.date.slice(0,4)} &bull; ${event.title}</strong><br>${event.credit} &bull; ${event.license} &bull; resized/cropped for display &bull; <a href="${event.source}" target="_blank" rel="noopener noreferrer">Source</a></p>`).join('');
  }
  function setLoading(active, failed = false) {
    ui.visual?.classList.toggle('is-loading', active);
    ui.visual?.classList.toggle('image-unavailable', failed);
    if (ui.loader) ui.loader.textContent = failed ? 'Archival image unavailable — timeline continues' : 'Loading archival image';
  }
  function pulseChronostream() {
    if (reducedMotion || !ui.visual) return;
    clearTimeout(state.warpTimer);
    ui.visual.classList.remove('is-warping');
    void ui.visual.offsetWidth;
    ui.visual.classList.add('is-warping');
    state.warpTimer = setTimeout(() => ui.visual?.classList.remove('is-warping'), 800);
  }

  const flightAudio = (() => {
    let context = null, master = null, ambience = [];
    function preferences() { try { return JSON.parse(localStorage.getItem(AUDIO_PREFS_KEY) || '{}') || {}; } catch { return {}; } }
    function allowed(kind) { const p = preferences(); return !p.muteAll && (kind === 'music' ? p.music !== false : p.soundEffects !== false); }
    async function ready() { if (!window.AudioContext && !window.webkitAudioContext) return false; if (!context) { context = new (window.AudioContext || window.webkitAudioContext)(); master = context.createGain(); master.gain.value = 0.11; master.connect(context.destination); } if (context.state === 'suspended') await context.resume(); return true; }
    async function transition(direction = 1) {
      if (!allowed('effects') || !await ready()) return;
      const now = context.currentTime, duration = 0.58;
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
      source.buffer = buffer; filter.type = 'bandpass'; filter.Q.value = 0.72;
      filter.frequency.setValueAtTime(direction > 0 ? 260 : 720, now);
      filter.frequency.exponentialRampToValueAtTime(direction > 0 ? 760 : 250, now + duration * 0.72);
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.016, now + 0.13); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter); filter.connect(gain); gain.connect(master); source.start(now); source.stop(now + duration);
    }
    async function startAmbience() {
      stopAmbience(); if (!allowed('music') || !await ready()) return;
      [55,82.5].forEach((frequency,index) => { const oscillator=context.createOscillator(), gain=context.createGain(); oscillator.type=index?'sine':'triangle'; oscillator.frequency.value=frequency; gain.gain.value=index?0.012:0.018; oscillator.connect(gain); gain.connect(master); oscillator.start(); ambience.push(oscillator); });
    }
    function stopAmbience() { ambience.forEach(node => { try { node.stop(); } catch {} }); ambience=[]; }
    return { transition, startAmbience, stopAmbience };
  })();

  function showScene(index, immediate = false) {
    if (!state.events.length) return showFinale();
    const bounded = Math.max(0, Math.min(index, state.events.length - 1));
    const event = state.events[bounded];
    state.index = bounded; clearTimer(); saveProgress(false);
    ui.finale?.classList.remove('is-visible'); ui.briefing?.classList.remove('is-visible'); ui.copy?.classList.add('is-changing');
    ui.image?.classList.remove('is-active','pan-left','pan-right','fit-contain','fit-adaptive');
    ui.visual?.classList.remove('preserve-scene');
    setLoading(true,false);
    if (ui.fallbackYear) ui.fallbackYear.textContent = event.date.slice(0,4);
    if (ui.fallbackCopy) ui.fallbackCopy.textContent = event.category;
    if (ui.image) {
      ui.image.onload = () => { applySceneFraming(event); setLoading(false,false); ui.visual?.classList.add('has-image'); requestAnimationFrame(() => ui.image?.classList.add('is-active')); };
      ui.image.onerror = () => { state.imageFailures.add(event.image); setLoading(false,true); ui.visual?.classList.remove('has-image'); ui.image?.classList.remove('is-active'); };
      ui.image.alt = event.alt || ''; ui.image.style.objectPosition = event.focal || '50% 50%'; ui.image.classList.add(bounded % 2 ? 'pan-right' : 'pan-left'); ui.image.src = imageUrl(event);
    }
    setTimeout(() => {
      if (ui.year) ui.year.textContent = event.date.slice(0,4);
      if (ui.category) ui.category.textContent = `${event.category}${event.sensitive ? ' - Reflective Moment' : ''}`;
      if (ui.title) ui.title.textContent = event.title;
      if (ui.summary) ui.summary.textContent = event.summary;
      if (ui.age) ui.age.textContent = ageAt(event.date);
      if (ui.source) { ui.source.href = event.source; ui.source.textContent = `${event.credit} - ${event.license} - display crop`; }
      if (ui.counter) ui.counter.textContent = `${bounded + 1} / ${state.events.length}`;
      if (ui.progress) ui.progress.style.width = `${((bounded + 1) / state.events.length) * 100}%`;
      syncTimeline(event);
      ui.copy?.classList.remove('is-changing');
    }, immediate || reducedMotion ? 0 : 240);
    if (!immediate) { pulseChronostream(); flightAudio.transition(1); } preloadNext(); schedule();
  }
  function nextScene() { state.index >= state.events.length - 1 ? showFinale() : showScene(state.index + 1); }
  let framingTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(framingTimer);
    framingTimer = setTimeout(() => applySceneFraming(state.events[state.index]), 120);
  }, { passive:true });
  function previousScene() { flightAudio.transition(-1); showScene(Math.max(0, state.index - 1), true); }
  function setPauseButton(paused, disabled = false) {
    if (!ui.pause) return;
    ui.pause.innerHTML = `<span class="time-flight-pause-icon" aria-hidden="true">${paused ? '&#9654;' : '&#10074;&#10074;'}</span>`;
    ui.pause.setAttribute('aria-label', paused ? 'Resume Time Flight' : 'Pause Time Flight');
    ui.pause.title = paused ? 'Resume Time Flight' : 'Pause Time Flight';
    ui.pause.disabled = disabled;
  }
  function showFinale() {
    clearTimer(); state.paused = false; saveProgress(true); flightAudio.stopAmbience();
    setPauseButton(false, reducedMotion);
    ui.image?.classList.remove('is-active'); setLoading(false,false); ui.finale?.classList.add('is-visible');
    const years = Math.max(0, new Date().getFullYear() - birthMoment().getFullYear());
    if (ui.finaleTitle) ui.finaleTitle.textContent = state.mode === 'history' ? 'From 1900 to right now.' : `${years.toLocaleString()} years in motion.`;
    const crossedCount = state.mode === 'history' ? state.events.length : Math.max(0,state.events.length - state.startIndex);
    if (ui.finaleCopy) ui.finaleCopy.textContent = `${state.mode === 'history' ? 'This historical flight' : 'Your flight'} crossed ${crossedCount.toLocaleString()} defining moment${crossedCount === 1 ? '' : 's'}. The complete 1900-to-present timeline remains available whenever you travel backward.`;
    ui.replay?.focus();
  }
  function start(mode, startIndex = null, suppliedEvents = null) {
    const history = historicalEvents();
    const route = suppliedEvents || (mode === 'quick' ? quickEvents(history) : history);
    const requestedIndex = Number.isInteger(startIndex) ? startIndex : null;
    const launchIndex = requestedIndex !== null ? requestedIndex : (mode === 'history' || suppliedEvents ? 0 : firstEventIndexAtOrAfterBirth(route));
    state.mode = mode; state.nearbyMode = Boolean(suppliedEvents); state.events = route; state.duration = mode === 'quick' ? 4700 : 5700; state.index = launchIndex; state.startIndex = launchIndex; state.paused = reducedMotion; state.gesture = null; state.scrubbing = false;
    setPauseButton(state.paused, reducedMotion);
    buildCredits(state.events); buildTimeline(); flightAudio.startAmbience(); document.dispatchEvent(new CustomEvent('lifepulse:timeflight-open'));
    if (!state.events.length) { ui.briefing?.classList.remove('is-visible'); ui.finale?.classList.add('is-visible'); if (ui.finaleTitle) ui.finaleTitle.textContent = 'No anniversary is in range today.'; if (ui.finaleCopy) ui.finaleCopy.textContent = 'On This Date checks the exact date first, then looks within two weeks. Your complete flight is always available.'; return; }
    showScene(Math.min(launchIndex,state.events.length-1), true);
  }
  function open() {
    const all = lifetimeEvents(), history = historicalEvents(), quick = quickEvents(history), saved = loadProgress();
    const quickStart = firstEventIndexAtOrAfterBirth(quick), fullStart = firstEventIndexAtOrAfterBirth(history);
    [quick[quickStart], quick[quickStart + 1], history[fullStart], history[0]].filter(Boolean).forEach(preloadEvent);
    state.lastFocus = document.activeElement; clearTimer(); state.events=[]; state.paused=false;
    ui.overlay?.classList.add('is-open'); ui.overlay?.setAttribute('aria-hidden','false'); ui.briefing?.classList.add('is-visible'); ui.finale?.classList.remove('is-visible'); ui.image?.classList.remove('is-active');
    document.body.classList.add('time-flight-open');
    if (ui.briefingTitle) ui.briefingTitle.textContent = `Your flight launches at ${birthMoment().getFullYear()}.`;
    if (ui.briefingCopy) ui.briefingCopy.textContent = 'Quick and Full flights begin at your birth-year position and move toward today. The timeline always spans 1900 to the present, so you can drag backward whenever you want to explore earlier history.';
    if (ui.quickMeta) ui.quickMeta.textContent = `${quick.length} route highlights - launches at your birth year`;
    if (ui.fullMeta) ui.fullMeta.textContent = `${history.length} complete moments - launches at your birth year`;
    if (ui.historyMeta) ui.historyMeta.textContent = `${history.length} moments from 1900 - about ${Math.max(1,Math.round(history.length*5.7/60))} min`;
    const resumable = saved && saved.version === VERSION && !saved.completed && Number.isInteger(saved.index) && saved.index > 0;
    ui.resume?.classList.toggle('hidden',!resumable);
    if (ui.resumeMeta && resumable) ui.resumeMeta.textContent = `Continue ${saved.mode === 'history' ? '1900 History' : saved.mode === 'full' ? 'Full' : 'Quick'} Flight at moment ${saved.index + 1}`;
    setTimeout(() => (resumable ? ui.resume : ui.quick)?.focus(),50);
  }
  function close() { clearTimer(); flightAudio.stopAmbience(); document.dispatchEvent(new CustomEvent('lifepulse:timeflight-close')); ui.overlay?.classList.remove('is-open'); ui.overlay?.setAttribute('aria-hidden','true'); ui.image?.classList.remove('is-active'); document.body.classList.remove('time-flight-open'); (state.lastFocus || ui.launch)?.focus?.(); }
  function togglePause() { if (reducedMotion) return; state.paused=!state.paused; setPauseButton(state.paused); state.paused?clearTimer():schedule(); }
  function updateMeta() { const events=lifetimeEvents(); if(ui.launchMeta) ui.launchMeta.textContent=events.length?`${events.length} lifetime moments - or explore all history from 1900`:'Historical catalog: 1900 to today'; }

  async function runDiagnostics() {
    const eventDates=EVENTS.map(event=>new Date(`${event.date}T12:00:00`));
    const ordered=eventDates.every((date,index)=>index===0||date>eventDates[index-1]);
    const gaps=eventDates.slice(1).map((date,index)=>(date-eventDates[index])/(365.2425*86400000));
    const cadence=Math.max(...gaps)<=4.25;
    const uniqueAssets=[...new Set(EVENTS.map(event=>event.image))];
    const results=await Promise.all(uniqueAssets.map(image=>new Promise(resolve=>{
      const probe=new Image(); let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timeout);resolve(value);};
      const timeout=setTimeout(()=>finish(false),8000);
      probe.onload=()=>finish(true); probe.onerror=()=>finish(false);
      probe.src=`${ASSET_ROOT}${image}?diagnostic=${Date.now()}`;
    })));
    const available=results.filter(Boolean).length;
    const domReady=Boolean(ui.overlay&&ui.launch&&ui.image&&ui.finale&&ui.onThisDate);
    const passed=ordered&&cadence&&domReady&&available===uniqueAssets.length;
    state.health={state:passed?'live':'error',detail:`${EVENTS.length} events from 1900, ${available}/${uniqueAssets.length} local images, ${ordered?'ordered':'date-order error'}, ${cadence?'continuous cadence':'timeline gap detected'}, ${domReady?'controls ready':'missing control'}.`,checkedAt:new Date().toISOString(),eventCount:EVENTS.length,assetCount:uniqueAssets.length,availableAssets:available,notificationHooks:true,reducedMotion};
    return {...state.health};
  }
  function notificationCandidates(days=14) { const now=new Date(); return lifetimeEvents().map(event=>({...event,daysAway:dayDistance(event.date,now)})).filter(event=>event.daysAway<=days).sort((a,b)=>a.daysAway-b.daysAway).map(({image,...event})=>event); }
  function getHealthSnapshot() { return {...state.health}; }

  if (!ui.overlay || !ui.launch) return;
  ui.launch.addEventListener('click',()=>{updateMeta();open();}); ui.close?.addEventListener('click',close); ui.finish?.addEventListener('click',close);
  ui.quick?.addEventListener('click',()=>start('quick')); ui.full?.addEventListener('click',()=>start('full')); ui.history?.addEventListener('click',()=>start('history'));
  ui.resume?.addEventListener('click',()=>{const saved=loadProgress();const mode=saved?.mode==='history'?'history':saved?.mode==='full'?'full':'quick';start(mode,Math.max(0,saved?.index||0));});
  ui.replay?.addEventListener('click',()=>start(state.mode)); ui.onThisDate?.addEventListener('click',()=>start('anniversary',0,anniversaryEvents()));
  ui.previous?.addEventListener('click',previousScene); ui.next?.addEventListener('click',nextScene); ui.pause?.addEventListener('click',togglePause);
  ui.scrubber?.addEventListener('pointerdown',()=>{state.scrubbing=true;clearTimer();});
  ui.scrubber?.addEventListener('input',event=>{const year=Number(event.currentTarget.value);if(ui.scrubberYear)ui.scrubberYear.textContent=String(year);showScene(nearestEventIndexForYear(year),true);});
  const finishScrubbing=()=>{state.scrubbing=false;syncTimeline(state.events[state.index]);schedule();};
  ui.scrubber?.addEventListener('change',finishScrubbing);
  ui.scrubber?.addEventListener('pointerup',finishScrubbing);
  ui.scrubber?.addEventListener('pointercancel',finishScrubbing);
  ui.overlay.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='touch'||event.button!==0||event.target.closest('button,a,input,summary,.time-flight-navigation')||ui.briefing?.classList.contains('is-visible')||ui.finale?.classList.contains('is-visible'))return;
    state.gesture={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};
    try{ui.overlay.setPointerCapture(event.pointerId);}catch{}
  });
  ui.overlay.addEventListener('pointermove',event=>{
    if(!state.gesture||state.gesture.id!==event.pointerId)return;
    const deltaX=event.clientX-state.gesture.x,deltaY=event.clientY-state.gesture.y;
    if(Math.abs(deltaX)>18&&Math.abs(deltaX)>Math.abs(deltaY)*1.15)event.preventDefault();
  });
  ui.overlay.addEventListener('pointerup',event=>{
    if(!state.gesture||state.gesture.id!==event.pointerId)return;
    const {x,y,time}=state.gesture;state.gesture=null;
    const deltaX=event.clientX-x,deltaY=event.clientY-y,elapsed=performance.now()-time;
    if(Math.abs(deltaX)>=52&&Math.abs(deltaX)>Math.abs(deltaY)*1.2&&elapsed<=900)deltaX<0?nextScene():previousScene();
  });
  ui.overlay.addEventListener('pointercancel',()=>{state.gesture=null;});
  document.addEventListener('keydown',event=>{
    if(!ui.overlay.classList.contains('is-open'))return;
    if(event.key==='Escape')close();else if(event.key==='ArrowRight')nextScene();else if(event.key==='ArrowLeft')previousScene();else if(event.key===' '){event.preventDefault();togglePause();}
    else if(event.key==='Tab'){const focusable=[...ui.overlay.querySelectorAll('button:not([disabled]):not(.hidden),a[href],summary')].filter(element=>element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  });
  document.addEventListener('visibilitychange',()=>{if(!ui.overlay.classList.contains('is-open'))return;if(document.hidden)clearTimer();else if(!state.paused&&!ui.briefing?.classList.contains('is-visible')&&!ui.finale?.classList.contains('is-visible'))schedule();});

  window.LifePulseTimeFlight={version:VERSION,eventCount:EVENTS.length,runDiagnostics,getHealthSnapshot,getNotificationCandidates:notificationCandidates,open};
  document.dispatchEvent(new CustomEvent('lifepulse:timeflight-ready',{detail:{version:VERSION,eventCount:EVENTS.length,notificationCandidates:notificationCandidates()}}));
  updateMeta();
})();
