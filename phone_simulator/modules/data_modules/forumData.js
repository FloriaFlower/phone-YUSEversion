
import { PhoneSim_State } from '../state.js';

export function init(deps, uiHandler, dataHandler) {
    // No initialization needed for this utility module
}

export function findForumPostById(postId) {
    for (const boardId in PhoneSim_State.forumData) {
        const board = PhoneSim_State.forumData[boardId];
        const post = board.posts?.find(p => p.postId === postId);
        if (post) {
            return post;
        }
    }
    return null;
}
