
import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
}

export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export function compressImage(base64Str, maxWidth = 800, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            let width = img.width, height = img.height;
            if (width > height) { if (width > maxWidth) { height = Math.round(height * (maxWidth / width)); width = maxWidth; } } 
            else { if (height > maxHeight) { width = Math.round(width * (maxHeight / height)); height = maxHeight; } }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (error) => reject("无法加载图片进行压缩。");
    });
}

export function updateTime() {
    jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID} .status-time`).text(PhoneSim_State.worldTime);
}

export function updateScaleAndPosition(shouldSave = false) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    if (!p.length) return;

    const baseWidth = 376; 
    const baseHeight = 616;
    const padding = 20;

    const winWidth = parentWin.innerWidth;
    const winHeight = parentWin.innerHeight;

    const scale = Math.min(1, (winWidth - padding) / baseWidth, (winHeight - padding) / baseHeight);

    p.css({
        'transform': `scale(${scale})`,
        'transform-origin': 'top left'
    });

    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    
    let currentPos = PhoneSim_State.panelPos;

    if (!currentPos) { // First load or reset
        const left = (winWidth - scaledWidth) / 2;
        const top = (winHeight - scaledHeight) / 2;
        currentPos = { top: `${top}px`, left: `${left}px` };
    }

    let top = parseFloat(currentPos.top);
    let left = parseFloat(currentPos.left);

    left = Math.max(padding / 2, Math.min(left, winWidth - scaledWidth - (padding / 2)));
    top = Math.max(padding / 2, Math.min(top, winHeight - scaledHeight - (padding / 2)));
    
    const newPos = { top: `${top}px`, left: `${left}px` };

    p.css(newPos);
    PhoneSim_State.panelPos = newPos;
    if (shouldSave) {
        PhoneSim_State.saveUiState();
    }
}

export function populateApps() { 
    const gridApps = [
        { v: 'BrowserApp', n: '浏览器', i: 'fa-globe', prefix: 'fas' },
        { v: 'ForumApp', n: '论坛', i: 'fa-comments', prefix: 'fas' },
    ];

    const dockApps = [
        { v: 'PhoneApp', n: '电话', i: 'fa-phone-alt', prefix: 'fas' }, 
        { v: 'ChatApp', n: '微信', i: 'fa-weixin', prefix: 'fab' }, 
        { v: 'EmailApp', n: '邮箱', i: 'fa-envelope', prefix: 'fas' },
        { v: 'SettingsApp', n: '设置', i: 'fa-cog', prefix: 'fas' }
    ]; 
    
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`); 
    const grid = p.find('.app-grid').empty();
    const dock = p.find('.dock-bar').empty();

    const createAppHtml = (app) => {
        return `<div class="app-block" data-view="${app.v}" data-appid="${app.v}">
                    <div class="icon-container">
                        <i class="${app.prefix} ${app.i}"></i>
                        <div class="unread-badge" style="display:none;"></div>
                    </div>
                    <span>${app.n}</span>
                </div>`;
    };

    gridApps.forEach(app => grid.append(createAppHtml(app)));
    dockApps.forEach(app => dock.append(createAppHtml(app)));
}

export function applyCustomizations() {
    const { customization } = PhoneSim_State;
    const pHead = jQuery_API(parentWin.document.head);
    pHead.find('[id^=phone-sim-wallpaper-style]').remove();
    if (customization.homescreenWallpaper) pHead.append(`<style id="phone-sim-wallpaper-style-home">#${PhoneSim_Config.PANEL_ID} #homescreen-view { background-image: url(${customization.homescreenWallpaper}) !important; }</style>`);
    if (customization.chatListWallpaper) pHead.append(`<style id="phone-sim-wallpaper-style-list">#${PhoneSim_Config.PANEL_ID} .chat-list-subview { background-image: url(${customization.chatListWallpaper}) !important; }</style>`);
    if (customization.chatViewWallpaper) pHead.append(`<style id="phone-sim-wallpaper-style-chat">#${PhoneSim_Config.PANEL_ID} .chat-view-subview { background-image: url(${customization.chatViewWallpaper}) !important; }</style>`);
    
    const muteSwitch = jQuery_API(parentWin.document.body).find('#mute-switch');
    if(customization.isMuted) muteSwitch.addClass('active'); else muteSwitch.removeClass('active');
}

export function getDividerText(currentDate) {
    const now = new Date(PhoneSim_State.worldDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));
    const timeStr = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    if (diffDays === 0) {
        return timeStr;
    }
    if (diffDays === 1) {
        return `昨天 ${timeStr}`;
    }
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    if (msgDay >= weekStart && msgDay < today) {
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return `${weekdays[currentDate.getDay()]} ${timeStr}`;
    }
    if (currentDate.getFullYear() === now.getFullYear()) {
        return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${timeStr}`;
    }
    return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${timeStr}`;
}

export function generateDefaultAvatar(name) {
    const colors = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"];
    const firstChar = name ? name.charAt(0).toUpperCase() : '?';
    const charCode = firstChar.charCodeAt(0);
    const color = colors[charCode % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"></rect><text x="50" y="50" font-family="-apple-system, sans-serif" font-size="50" fill="white" text-anchor="middle" dy=".3em">${firstChar}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function _getContactName(contactId) {
    if (contactId === PhoneSim_Config.PLAYER_ID) {
        return '我';
    }
    const contact = PhoneSim_State.contacts[contactId];
    if (contact && contact.profile) {
        return contact.profile.note || contact.profile.nickname || contactId;
    }
    return contactId;
}


export function updateGlobalUnreadCounts() {
    const P = `#${PhoneSim_Config.PANEL_ID}`;
    if (!PhoneSim_State.contacts) return;
    const totalUnreadChats = Object.values(PhoneSim_State.contacts).reduce((sum, contact) => sum + (contact.unread || 0), 0);
    const totalUnreadEmails = PhoneSim_State.emails.filter(e => !e.read).length;
    const totalNotifications = totalUnreadChats + totalUnreadEmails;

    const toggleBtn = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.TOGGLE_BUTTON_ID}`);
    let badge = toggleBtn.find('.unread-badge');
    if (totalNotifications > 0) badge.text(totalNotifications > 99 ? '99+' : totalNotifications).show(); else badge.hide();

    const chatAppBadge = jQuery_API(`${P} .app-block[data-appid="ChatApp"] .unread-badge`);
    if(totalUnreadChats > 0) chatAppBadge.text(totalUnreadChats > 99 ? '99+' : totalUnreadChats).show(); else chatAppBadge.hide();
    
    const emailAppBadge = jQuery_API(`${P} .app-block[data-appid="EmailApp"] .unread-badge`);
    if(totalUnreadEmails > 0) emailAppBadge.text(totalUnreadEmails > 99 ? '99+' : totalUnreadEmails).show(); else emailAppBadge.hide();
}

export function resetUIPosition() {
    PhoneSim_State.panelPos = null;
    updateScaleAndPosition(true);
}

export function makeDraggable(panel) {
    const body = jQuery_API(parentWin.document.body);
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { left: 0, top: 0 };

    function handleDragStart(e) {
        isDragging = false;
        const isTouchEvent = e.type.startsWith('touch');
        if (isTouchEvent && e.originalEvent.touches.length > 1) return;
        const point = isTouchEvent ? e.originalEvent.touches[0] : e;
        
        dragStartPos = { x: point.clientX, y: point.clientY };
        panelStartPos = { left: panel.position().left, top: panel.position().top };

        body.on('mousemove.phonesim_drag touchmove.phonesim_drag', handleDragMove);
        body.on('mouseup.phonesim_drag touchend.phonesim_drag', handleDragEnd);
    }

    function handleDragMove(e) {
        const isTouchEvent = e.type.startsWith('touch');
        const point = isTouchEvent ? e.originalEvent.touches[0] : e;
        
        const deltaX = point.clientX - dragStartPos.x;
        const deltaY = point.clientY - dragStartPos.y;

        if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            isDragging = true;
        }
        
        if (isDragging) {
            e.preventDefault();
            panel.css({ left: panelStartPos.left + deltaX + 'px', top: panelStartPos.top + deltaY + 'px' });
        }
    }

    function handleDragEnd() {
        body.off('.phonesim_drag');
        if (isDragging) {
            const finalPos = { top: panel.css('top'), left: panel.css('left') };
            panel.css(finalPos);
            PhoneSim_State.panelPos = finalPos;
            PhoneSim_State.saveUiState();
        } 
        isDragging = false;
    }

    panel.on('mousedown.phonesim_drag_init touchstart.phonesim_drag_init', '.status-bar', handleDragStart);
}
