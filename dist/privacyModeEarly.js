/*!
 * Polyteller 
 * Version: 1.0.1
 * Copyright (C) 2024 Zaid Azmi
 * All rights reserved
 * 
 * This source code is licensed under a proprietary license.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * 
 * Author: Zaid Azmi
 * Website: https://polyteller.com
 * Email : polytellerapp@gmail.com
 * Version: 1.0.2
 */(()=>{const a=document.createElement("style");a.id="polyteller-privacy-early",
a.textContent='\n        /* Initially hide all value elements */\n        .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,\n        [class*="jaFKlk"],\n        [class*="ibdakYG"] {\n            opacity: 0;\n            transition: opacity 0.2s ease-in-out;\n        }\n\n        /* When privacy mode is OFF - remove our overrides completely */\n        body:not(.privacy-enabled) .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,\n        body:not(.privacy-enabled) [class*="jaFKlk"],\n        body:not(.privacy-enabled) [class*="ibdakYG"] {\n            opacity: 1;\n            /* No color override */\n            /* No text-shadow override */\n        }\n\n        /* When privacy mode is ON - mask values */\n        body.privacy-enabled .c-PJLV.c-jaFKlk.c-PJLV-ibdakYG-css,\n        body.privacy-enabled [class*="jaFKlk"],\n        body.privacy-enabled [class*="ibdakYG"] {\n            opacity: 1;\n            color: transparent !important;\n            text-shadow: 0 0 8px rgba(0,0,0,0.5) !important;\n        }\n    ',
document.documentElement&&document.documentElement.appendChild(a);const e=()=>{document.body?(async()=>{try{(await chrome.storage.local.get("privacyModeEnabled")).privacyModeEnabled?document.body?.classList.add("privacy-enabled"):document.body?.classList.remove("privacy-enabled"),document.body?.classList.add("privacy-ready")}catch(a){}})():requestAnimationFrame(e)};e(),chrome.runtime.onMessage.addListener((a=>{
"updatePrivacyMode"===a.action&&(a.enabled?document.body?.classList.add("privacy-enabled"):document.body?.classList.remove("privacy-enabled"))}))})();