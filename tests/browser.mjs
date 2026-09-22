import {pathToFileURL} from 'node:url';
export async function getBrowser(){
 let playwright;
 try{playwright=await import('playwright');}
 catch{if(!process.env.PLAYWRIGHT_MODULE)throw Error('Instala dependencias o define PLAYWRIGHT_MODULE con index.mjs de Playwright.');playwright=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);}
 return playwright.chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
}
