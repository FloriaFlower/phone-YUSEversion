
import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
}

export function renderDiscoverView() { /* Placeholder for future discover items */ }

export function renderHomepage(contactId) {
    const view = jQuery_API(parentWin.document.body).find('#homepage-view');
    const wrapper = view.find('.homepage-content-wrapper').empty();
    PhoneSim_State.activeProfileId = contactId;
    const contact = PhoneSim_State.contacts[contactId];

    if (!contact || !contact.profile) {
        wrapper.html('<div class="app-header"><button class="back-to-list-btn"><i class="fas fa-chevron-left"></i></button></div><p style="text-align:center; margin-top: 20px;">无法加载此用户的个人主页。</p>');
        return;
    }

    const name = contact.profile.note || contact.profile.nickname;
    const avatar = contact.profile.avatar || UI.generateDefaultAvatar(name);
    const cover = contact.profile.cover_image ? (contact.profile.cover_image.startsWith('http') ? contact.profile.cover_image : `https://files.catbox.moe/${contact.profile.cover_image}`) : 'https://files.catbox.moe/8mjvdg.jpg';
    const bio = contact.profile.bio || '这个人很懒，什么都没留下。';
    
    const moments = [...(contact.moments || [])];

    const homepageHtml = `
        <div class="app-header">
            <button class="back-to-list-btn"><i class="fas fa-chevron-left"></i></button>
            <h3 class="homepage-header-title" style="padding-left: 30px;">${name}</h3>
            <div class="header-actions" id="generate-profile-update-btn" title="更新主页与动态"><i class="fas fa-plus"></i></div>
        </div>
        <div class="homepage-content">
            <div class="homepage-header" style="background-image: url('${cover}')">
                <img src="${avatar}" class="homepage-avatar">
            </div>
            <div class="homepage-info">
                <h2 class="homepage-name">${name}</h2>
                <p class="homepage-bio">${bio}</p>
            </div>
            <div class="homepage-timeline"></div>
        </div>`;
    wrapper.html(homepageHtml);

    const timeline = wrapper.find('.homepage-timeline');
    if (moments.length === 0) {
        timeline.html('<div class="moments-empty">还没有动态</div>');
        return;
    }

    moments.forEach(moment => {
         const contentHtml = UI.renderRichContent(moment.content, { isMoment: true });
         const imagesHtml = (moment.images || []).map(img => `<img src="${img.startsWith('http') ? img : 'https://files.catbox.moe/'+img}" class="moment-image">`).join('');
         const likes = [...(moment.likes || [])];
         const comments = [...(moment.comments || [])];
         const likesHtml = likes.length > 0 ? `<div class="moment-likes"><i class="fas fa-heart"></i> ${likes.map(id => UI._getContactName(id)).join(', ')}</div>` : '';
         const commentsHtml = comments.map(c => {
             const commenterName = UI._getContactName(c.commenterId);
             const commentContent = UI.renderRichContent(c.text, { isMoment: true });
             return `<div class="moment-comment"><b>${commenterName}:</b> ${commentContent}</div>`;
         }).join('');

        const post = jQuery_API(`
            <div class="moment-post" data-moment-id="${moment.momentId}">
                <div class="moment-body">
                    <div class="moment-content-text">${contentHtml}</div>
                    <div class="moment-images">${imagesHtml}</div>
                    <div class="moment-meta"><span>${new Date(moment.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span></div>
                    ${(likesHtml || commentsHtml) ? `<div class="moment-social-details">${likesHtml}${commentsHtml}</div>` : ''}
                </div>
            </div>
        `);
        timeline.append(post);
    });
}

export function renderMomentsView() {
    const timeline = jQuery_API(parentWin.document.body).find(`#moments-view .moments-timeline`).empty();
    let allMoments = [...(PhoneSim_State.moments || [])];
    
    const stagedNewMoments = (PhoneSim_State.stagedPlayerActions || []).filter(a => a.type === 'new_moment');
    stagedNewMoments.forEach(action => {
        allMoments.unshift({ ...action.data, momentId: action.momentId, isStaged: true, posterId: PhoneSim_Config.PLAYER_ID, likes:[], comments: [], timestamp: new Date().toISOString() });
    });

    allMoments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allMoments.length === 0) {
        timeline.html('<div class="moments-empty">还没有动态</div>');
        return;
    }

    allMoments.forEach(moment => {
        const posterName = UI._getContactName(moment.posterId);
        const poster = PhoneSim_State.contacts[moment.posterId];
        const posterAvatar = (moment.posterId === PhoneSim_Config.PLAYER_ID) ? (PhoneSim_State.customization.playerAvatar || UI.generateDefaultAvatar(posterName)) : (poster?.profile.avatar || UI.generateDefaultAvatar(posterName));
        
        let likes = [...(moment.likes || [])];
        let comments = JSON.parse(JSON.stringify(moment.comments || []));

        (PhoneSim_State.stagedPlayerActions || []).forEach(action => {
            if (action.momentId === moment.momentId) {
                if (action.type === 'like' && !likes.includes(PhoneSim_Config.PLAYER_ID)) likes.push(PhoneSim_Config.PLAYER_ID);
                if (action.type === 'comment') comments.push({ uid: action.commentId, commenterId: PhoneSim_Config.PLAYER_ID, text: action.content, isStaged: true });
                if (action.type === 'edit_comment') {
                    const c = comments.find(c => c.uid === action.commentId);
                    if(c) { c.text = action.content; c.isStaged = true; c.recalled = false; }
                }
                if (action.type === 'recall_comment') {
                    const c = comments.find(c => c.uid === action.commentId);
                    if(c) { c.text = '你撤回了一条评论'; c.isStaged = true; c.recalled = true; }
                }
                if (action.type === 'delete_comment') {
                   comments = comments.filter(c => c.uid !== action.commentId);
                }
            }
        });

        const contentHtml = UI.renderRichContent(moment.content, { isMoment: true });
        const imagesHtml = (moment.images || []).map(img => `<img src="${img.startsWith('http') ? img : 'https://files.catbox.moe/'+img}" class="moment-image">`).join('');
        const likesHtml = likes.length > 0 ? `<div class="moment-likes"><i class="fas fa-heart"></i> ${likes.map(id => UI._getContactName(id)).join(', ')}</div>` : '';
        
        const commentsHtml = comments.map(c => {
            const commenterName = UI._getContactName(c.commenterId);
            const isPlayerComment = c.commenterId === PhoneSim_Config.PLAYER_ID;
            let content;
            if (c.recalled) {
                content = jQuery_API('<div>').text(c.text).html();
            } else {
                content = UI.renderRichContent(c.text, { isMoment: true });
            }
            return `<div class="moment-comment ${c.isStaged ? 'staged' : ''} ${isPlayerComment ? 'player-comment' : ''}" data-comment-id="${c.uid}"><b>${commenterName}:</b> ${content}</div>`;
        }).join('');

        const momentActionsHtml = `<div class="moment-actions-trigger" data-moment-id="${moment.momentId}" data-poster-id="${moment.posterId}"><i class="fas fa-ellipsis-h"></i></div>`;

        const post = jQuery_API(`
            <div class="moment-post ${moment.isStaged ? 'staged' : ''}" data-moment-id="${moment.momentId}">
                <img src="${posterAvatar}" class="moment-avatar clickable-avatar" data-contact-id="${moment.posterId}">
                <div class="moment-body">
                    <div class="moment-header">
                        <div class="moment-poster-name clickable-avatar" data-contact-id="${moment.posterId}">${posterName}</div>
                        ${momentActionsHtml}
                    </div>
                    <div class="moment-content-text">${contentHtml}</div>
                    <div class="moment-images">${imagesHtml}</div>
                    <div class="moment-meta"><span>${new Date(moment.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</span></div>
                    <div class="moment-actions">
                        <button class="action-btn like-btn ${likes.includes(PhoneSim_Config.PLAYER_ID) ? 'liked' : ''}"><i class="fas fa-heart"></i></button>
                        <button class="action-btn comment-btn"><i class="fas fa-comment"></i></button>
                    </div>
                    ${(likesHtml || commentsHtml) ? `<div class="moment-social-details">${likesHtml}${commentsHtml}</div>` : ''}
                </div>
            </div>
        `);
        timeline.append(post);
    });
}
