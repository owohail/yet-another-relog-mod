// perfection is bloated.
const Prim = "#9f80ff", Seco = "#bf80ff", Tert = "#df80ff", Gry = "#999999", Wht = "#ffffff", Org = "#ffbf80", Red = "#ff8080"
const hueArray = ['#ffb3b3', '#ffc6b3', '#ffd9b3', '#ffecb3', '#ffffb3', '#ecffb3', '#d9ffb3', '#c6ffb3', '#b3ffb3', '#b3ffc6', '#b3ffd9', '#b3ffec', '#b3ffff', '#b3ecff', '#b3d9ff', '#b3c6ff', '#b3b3ff', '#c6b3ff', '#d9b3ff', '#ecb3ff', '#ffb3ff', '#ffb3ec', '#ffb3d9', '#ffb3c6']
const path = require("path");
const fs = require('fs');
let modsig = Math.floor(Math.random()*2147483647)

module.exports = function YARM(d) {
  d.dispatch.addOpcode('C_NPCGUILD_LIST', 56890)
  d.dispatch.addDefinition('S_UPDATE_NPCGUILD', 69, [ ['gameId', 'uint64'], ['unk1', 'int64'], ['faction', 'uint32'], ['unk2', 'int64'], ['amount', 'uint32'] ])
  let basevalue = modsig-1, cindex = -1, characters = [], logCredits = true;
    

  d.command.add(['relog', 'yarm'], (arg) => {
		if (!d.game.me.alive){ error(0); return; } // dead warning
		else if (d.game.me.inCombat){ error(1); return; } // in combat warning
		else if (arg){
			if (['nx','+','++'].includes(arg)) relog(`+`);
			else if (['pv','-','--'].includes(arg)) relog(`-`);
			else if (arg){ let index = parseInt(arg);
				if (!isNaN(index)){ if (index > characters.length){ error(2,index); } else { cindex = index - 1; relog(); } }
				else { if (charindex(arg)){ relog(); } else { commandPane(); error(3,arg); } }
			}
		}
    else printCharacters();
  })

	d.hook('C_REQUEST_NONDB_ITEM_INFO', '*', (e) => {
		if (e.item <= modsig+99 && e.item >= modsig){
		  basevalue = modsig-1;
		  process.nextTick(() => {
			  if (e.item > 0){ d.command.exec(`relog ${(e.item - basevalue)}`); }
		  });
		  return false;
		}
		else return;
	});

  d.hook('S_GET_USER_LIST', 18, (e) => {
    e.characters.forEach((ch) => {
      let { id, name, position } = ch;
      characters[--position] = { id, name };
    });
  });

	d.hook('C_SELECT_USER', 1, { order: 100, filter: { fake: null } }, (e) => { cindex = characters.findIndex((ch) => ch.id === e.id); });

  // Vanguard Initiative Credit Logging
  d.hook('S_SPAWN_ME', '*', (e) => { if (logCredits){ d.send('C_NPCGUILD_LIST', 1, {name:d.game.me.name}); logCredits = false; } })
  d.hook('S_NPCGUILD_LIST', '*', (e) => { if (!d.game.me.is(e.gameId)) return; e.factions.forEach(object =>{ if (object.faction == 609){ updateCredits(object.credits) } }) })
  d.hook('S_UPDATE_NPCGUILD', 69, (e) => { if (d.game.me.is(e.gameId) && e.faction == 609){ updateCredits(e.amount) } })
  d.hook('S_AVAILABLE_EVENT_MATCHING_LIST', '*', (e) => { updateCredits(e.vanguardCredits) })

	function updateCredits(amount) { store.char[d.game.me.name] = amount; settingsUpdate(); }
  function charindex(name) {
    let res = characters.findIndex((ch) => ch.name.toLowerCase() === name.toLowerCase());
      if (res >= 0) {
        cindex = res;
        return true;
      }
      return false;
  }

  function relog(arg){
    logCredits = true;
	  switch (arg){
		  case '+': if (!characters[++cindex]) cindex = 0; break;
		  case '-': if (!characters[--cindex]) cindex = 0; break;
	  }
    let id = characters[cindex].id;
    let prepareLobbyHook, lobbyHook
    d.send('C_RETURN_TO_LOBBY', 1, {})
    prepareLobbyHook = d.hookOnce('S_PREPARE_RETURN_TO_LOBBY', 1, () => {
      d.send('S_RETURN_TO_LOBBY', 1, {});
      lobbyHook = d.hookOnce('S_RETURN_TO_LOBBY', 1, () => {
        setImmediate(() => { d.send('C_SELECT_USER', 1, { id: id, unk: 0 }); });
      });
    });
    setTimeout(() => { for (const hook of [prepareLobbyHook, lobbyHook]) if (hook) d.unhook(hook) }, 16000)
  }

  function error(reason,info) {
      switch (reason){
        case 0: d.command.message(`<font color="${Red}">You cannot YARM while dead.</font>`); break;
        case 1: d.command.message(`<font color="${Red}">You cannot YARM while in combat.</font>`); break;
        case 2: d.command.message(`<font color="${Red}">Not enough characters to populate your argument ${info}.</font>`); break;
        case 3: d.command.message(`<font color="${Red}">The character you provided (<font color="${Org}">${info}</font>) does not exist.</font>`); break;
        default: d.command.message(`<font color="${Red}">Unknown error.</font>`)
      }
  }

  function printCharacters() {
    basevalue = modsig-1;
    characters.forEach((ch, i) => {
      basevalue = basevalue + 1
      d.command.base.message(false, `<font color="${hueArray[i]}"><ChatLinkAction param=\"1#####${basevalue}@-1@Hail\">[Relog]</ChatLinkAction></font> <font color="${Prim}">${(i + 1)}</font>` + `<font color="${Gry}"> : </font>` + `<font color="${Seco}">${ch.name}</font>` + `${store.char[ch.name] >= 0 ? ` ${store.char[ch.name] > 0 ? `<font color="${Gry}">(${store.char[ch.name]} vg)</font>` : ''}` : '' }`);
    });
  }

  function commandPane () { d.command.message(`<font color="${Gry}">{</font> <font color="${Prim}">Yet Another Relog Mod <font color="${Gry}">==></font> Command Pane</font> <font color="${Gry}">}</font>
<font color="${Prim}">relog</font> <font color="${Seco}">(name)</font> <font color="${Gry}">:</font> <font color="${Wht}">Relogs to the character with your given name.</font>
<font color="${Prim}">relog</font> <font color="${Seco}">[nx <font color="${Gry}">||</font> + <font color="${Gry}">||</font> f] </font><font color="${Gry}">:</font> <font color="${Wht}">Relogs you to the next character in your list.</font>
<font color="${Prim}">relog</font> <font color="${Seco}">[pv <font color="${Gry}">||</font> - <font color="${Gry}">||</font> b] </font><font color="${Gry}">:</font> <font color="${Wht}">Relogs you to the previous character in your list.</font>`)}

  // Settings Generation
  let settingsTimeout, settingsLock = false;
  let defaultSettings = {
      "char": {
      }
  };
  let store = defaultSettings;

  d.game.on('enter_game', () => {
    try { store = require(`./res/${d.serverId}.json`); }
    catch (err) {
      store = defaultSettings;
      settingsUpdate();
    }
  });

  function settingsUpdate() {
    clearTimeout(settingsTimeout);
    settingsTimeout = setTimeout(settingsSave, 1000);
  }

  function settingsSave() {
    if (settingsLock) {
      settingsUpdate();
      return;
    }
    settingsLock = false;
    fs.writeFile(path.join(__dirname, `./res/${d.serverId}.json`), JSON.stringify(store, undefined, '\t'), err => { settingsLock = false; })
  }

  this.destructor = function () { store = defaultSettings; }
}