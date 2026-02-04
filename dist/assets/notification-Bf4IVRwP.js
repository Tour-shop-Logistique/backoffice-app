import{c as e,j as t}from"./index-BzHVKazg.js";import{e as r}from"./router-BcYogCAZ.js";
/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=e("triangle-alert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]),a=({notification:e,onClose:o})=>{const a=document.getElementById("notification-root");return a&&e?r.createPortal(t.jsxs("div",{className:`fixed top-4 right-4 p-4 rounded shadow-lg ${"error"===e.type?"bg-red-500":"bg-green-500"} text-white`,children:[e.message,t.jsx("button",{onClick:o,className:"ml-2 text-sm underline",children:"Fermer"})]}),a):null};export{a as N,o as T};
