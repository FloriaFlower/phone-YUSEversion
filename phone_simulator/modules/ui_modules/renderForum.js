import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    DataHandler = dataHandler;
}

function _getSnippetFromRichContent(content) {
    let text = '';
    if (typeof content === 'string') {
        text = content;
    } else if (Array.isArray(content)) {
        text = content.map(part => {
            if (part.type === 'text') return part.value;
            if (part.type === 'image' || part.type === 'pseudo_image') return '[图片]';
            return '';
        }).join(' ');
    } else if (typeof content === 'object' && content !== null) {
        if (content.type === 'image' || content.type === 'pseudo_image') return '[图片]';
    }
    const cleanedText = text.replace(/\\n/g, ' ');
    return cleanedText.substring(0, 50) + (cleanedText.length > 50 ? '...' : '');
}


export function renderForumBoardList() {
    const content = jQuery_API(parentWin.document.body).find(`#phone-sim-panel-v10-0 .forum-board-list-content`).empty();
    const forumData = PhoneSim_State.forumData;
    
    if (Object.keys(forumData).length === 0) {
        content.html('<div class="email-empty-state">还没有任何论坛板块</div>');
        return;
    }

    const boardIcons = {
        "campus_life": "fa-comments",
        "academic_exchange": "fa-flask",
        "default": "fa-list-alt"
    };

    for (const boardId in forumData) {
        const board = forumData[boardId];
        const icon = boardIcons[boardId] || boardIcons["default"];
        const itemHtml = `
            <div class="forum-board-item" data-board-id="${boardId}">
                <i class="fas ${icon} forum-board-icon"></i>
                <span class="forum-board-name">${board.boardName}</span>
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        content.append(itemHtml);
    }
}

export function renderForumPostList(boardId) {
    const p = jQuery_API(parentWin.document.body).find(`#phone-sim-panel-v10-0`);
    const board = PhoneSim_State.forumData[boardId];

    if (!board) return;

    p.find('.post-list-header').text(board.boardName);
    const content = p.find('.forum-post-list-content').empty();
    
    let posts = [...(board.posts || [])];

    const stagedNewPosts = PhoneSim_State.stagedPlayerActions.filter(a => a.type === 'new_forum_post' && a.boardId === boardId);
    stagedNewPosts.forEach(action => {
        posts.unshift({
            postId: action.postId,
            authorId: PhoneSim_Config.PLAYER_ID,
            authorName: '我',
            title: action.title,
            content: action.content,
            timestamp: new Date().toISOString(),
            replies: [],
            isStaged: true
        });
    });

    posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (posts.length === 0) {
        content.html('<div class="email-empty-state">这个板块还没有帖子</div>');
        return;
    }
    
    posts.forEach(post => {
        const author = PhoneSim_State.contacts[post.authorId] || { profile: { nickname: post.authorName } };
        const avatar = author?.profile?.avatar || UI.generateDefaultAvatar(post.authorName);
        const snippet = _getSnippetFromRichContent(post.content);
        const replyCount = post.replies?.length || 0;

        const itemHtml = `
            <div class="forum-post-item ${post.isStaged ? 'staged' : ''}" data-post-id="${post.postId}">
                <h4 class="post-item-title">${jQuery_API('<div>').text(post.title).html()}</h4>
                <p class="post-item-snippet">${jQuery_API('<div>').text(snippet).html()}</p>
                <div class="post-item-meta">
                    <div class="post-item-author">
                        <img src="${avatar}" class="post-item-author-avatar"/>
                        <span>${jQuery_API('<div>').text(post.authorName).html()}</span>
                    </div>
                    <div class="post-item-replies">
                        <i class="fas fa-comment-dots"></i> ${replyCount}
                    </div>
                </div>
            </div>
        `;
        content.append(itemHtml);
    });
}

export function renderForumPostDetail(postId) {
    const content = jQuery_API(parentWin.document.body).find(`#phone-sim-panel-v10-0 .forum-post-detail-content`).empty();
    const post = DataHandler.findForumPostById(postId);

    if (!post) {
        content.html('<div class="email-empty-state">帖子不存在或已被删除</div>');
        return;
    }

    const author = PhoneSim_State.contacts[post.authorId] || { profile: { nickname: post.authorName } };
    const avatar = author?.profile?.avatar || UI.generateDefaultAvatar(post.authorName);
    const formattedContent = UI.renderRichContent(post.content, { isMoment: true });
    
    const mainPostHtml = `
        <div class="post-main-content">
            <h3 class="post-detail-title">${jQuery_API('<div>').text(post.title).html()}</h3>
            <div class="post-detail-author-info">
                <img src="${avatar}" class="post-detail-author-avatar"/>
                <div>
                    <div class="post-detail-author-name">${jQuery_API('<div>').text(post.authorName).html()}</div>
                    <div class="post-detail-timestamp">${new Date(post.timestamp).toLocaleString()}</div>
                </div>
            </div>
            <div class="post-detail-body">${formattedContent}</div>
        </div>
    `;

    let replies = [...(post.replies || [])];
    const stagedNewReplies = PhoneSim_State.stagedPlayerActions.filter(a => a.type === 'new_forum_reply' && a.postId === postId);
    stagedNewReplies.forEach(action => {
        replies.push({
            replyId: action.replyId,
            authorId: PhoneSim_Config.PLAYER_ID,
            authorName: '我',
            content: action.content,
            timestamp: new Date().toISOString(),
            isStaged: true
        });
    });

    const repliesHtml = replies.map(reply => {
        const replier = PhoneSim_State.contacts[reply.authorId] || { profile: { nickname: reply.authorName } };
        const replierAvatar = replier?.profile?.avatar || UI.generateDefaultAvatar(reply.authorName);
        const replyContentHtml = UI.renderRichContent(reply.content, { isMoment: true });
        return `
            <div class="post-reply-item ${reply.isStaged ? 'staged' : ''}" data-reply-id="${reply.replyId}">
                <img src="${replierAvatar}" class="reply-author-avatar"/>
                <div class="reply-body">
                    <div class="reply-header">
                        <span class="reply-author-name">${jQuery_API('<div>').text(reply.authorName).html()}</span>
                        <span class="reply-timestamp">${new Date(reply.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="reply-content">${replyContentHtml}</div>
                </div>
            </div>
        `;
    }).join('');

    const repliesSection = `
        <div class="post-replies-section">
            <h4>${replies.length}条回复</h4>
            ${repliesHtml}
        </div>
    `;

    content.html(mainPostHtml + (replies.length > 0 ? repliesSection : ''));
}