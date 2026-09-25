/* Standard HTTPS universal link; OS routing decides native app versus web.
 * Confirmed in chatgpt.com/.well-known/apple-app-site-association, 2026-09-25.
 * No context, thread IDs or credentials are sent in the URL.
 */
const ExternalCoach = (() => {
 const url='https://chatgpt.com/#native';
 function launch(){
  try{window.open(url,'_blank','noopener,noreferrer');return true}
  catch{return false}
 }
 // true means attempted, not that another app opened. With noopener even a
 // successful window.open may return null; an explicit link remains necessary.
 return {url,launch};
})();
